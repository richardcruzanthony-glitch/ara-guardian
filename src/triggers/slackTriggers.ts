/**
 * Slack Trigger - Webhook-based Workflow Triggering (Render-ready)
 *
 * This module provides Slack event handling for Mastra workflows.
 * When Slack events occur (like new messages), this trigger starts your workflow.
 */

import { format } from "node:util";
import { Mastra, type WorkflowResult, type Step } from "@mastra/core";
import { IMastraLogger } from "@mastra/core/logger";
import {
  type AuthTestResponse,
  type ChatPostMessageResponse,
  type ConversationsOpenResponse,
  type ConversationsRepliesResponse,
  type UsersConversationsResponse,
  type WebAPICallError,
  ErrorCode,
  WebClient,
} from "@slack/web-api";
import type { Context, Handler, MiddlewareHandler } from "hono";
import { streamSSE } from "hono/streaming";
import type { z } from "zod";
import { registerApiRoute } from "../mastra/inngest";

export type Methods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ALL";

export type ApiRoute =
  | {
      path: string;
      method: Methods;
      handler: Handler;
      middleware?: MiddlewareHandler | MiddlewareHandler[];
    }
  | {
      path: string;
      method: Methods;
      createHandler: ({ mastra }: { mastra: Mastra }) => Promise<Handler>;
      middleware?: MiddlewareHandler | MiddlewareHandler[];
    };

export type TriggerInfoSlackOnNewMessage = {
  type: "slack/message.channels";
  params: {
    channel: string;
    channelDisplayName: string;
  };
  payload: any;
};

type DiagnosisStep =
  | { status: "pending"; name: string; extra?: Record<string, any> }
  | { status: "success"; name: string; extra: Record<string, any> }
  | { status: "failed"; name: string; error: string; extra: Record<string, any> };

// -------------------- Render-friendly Slack Client --------------------
export async function getClient() {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN not set in environment");

  const slack = new WebClient(token);
  const auth = await slack.auth.test();
  return { slack, auth, user: auth.user_id };
}

// -------------------- Duplicate Event Handling --------------------
const recentEvents = new Set<string>();
function checkDuplicateEvent(eventId: string) {
  if (recentEvents.has(eventId)) return true;
  recentEvents.add(eventId);
  if (recentEvents.size > 200) {
    recentEvents.delete([...recentEvents][0]);
  }
  return false;
}

// -------------------- Slack Reactions --------------------
function isWebAPICallError(err: unknown): err is WebAPICallError {
  return typeof err === "object" && err !== null && "code" in err && "data" in err;
}

function createReactToMessage<TState extends z.ZodObject<any>, TInput extends z.ZodType<any>, TOutput extends z.ZodType<any>, TSteps extends Step<string, any, any>[]>(
  { slack, logger }: { slack: WebClient; logger: IMastraLogger }
) {
  const addReaction = async (channel: string, timestamp: string, emoji: string) => {
    logger.info(`[Slack] Adding reaction ${emoji} to message`, { channel, timestamp });
    try { await slack.reactions.add({ channel, timestamp, name: emoji }); }
    catch (error) { logger.error(`[Slack] Error adding reaction`, { emoji, timestamp, channel, error: format(error) }); }
  };

  const removeAllReactions = async (channel: string, timestamp: string) => {
    const emojis = ["hourglass", "hourglass_flowing_sand", "white_check_mark", "x", "alarm_clock"];
    for (const emoji of emojis) {
      try { await slack.reactions.remove({ channel, timestamp, name: emoji }); }
      catch (error) {
        if (isWebAPICallError(error) && (error.code !== ErrorCode.PlatformError || error.data?.error !== "no_reaction")) {
          logger.error("[Slack] Error removing reaction", { emoji, timestamp, channel, error: format(error) });
        }
      }
    }
  };

  return async function reactToMessage(channel: string, timestamp: string, result: WorkflowResult<TState, TInput, TOutput, TSteps> | null) {
    await removeAllReactions(channel, timestamp);
    if (result?.status === "success") await addReaction(channel, timestamp, "white_check_mark");
    else if (result?.status === "failed") await addReaction(channel, timestamp, "x");
    else if (result !== null) await addReaction(channel, timestamp, "alarm_clock");
  };
}

// -------------------- Slack Trigger Registration --------------------
export function registerSlackTrigger<Env extends { Variables: { mastra: Mastra } }, TState extends z.ZodObject<any>, TInput extends z.ZodType<any>, TOutput extends z.ZodType<any>, TSteps extends Step<string, any, any>[]>(
  { triggerType, handler }: { triggerType: string; handler: (mastra: Mastra, triggerInfo: TriggerInfoSlackOnNewMessage) => Promise<WorkflowResult<TState, TInput, TOutput, TSteps> | null> }
): Array<ApiRoute> {
  return [
    registerApiRoute("/webhooks/slack/action", {
      method: "POST",
      handler: async (c) => {
        const mastra = c.get("mastra");
        const logger = mastra.getLogger();

        try {
          const payload = await c.req.json();
          const { slack, auth } = await getClient();
          const reactToMessage = createReactToMessage({ slack, logger });

          if (payload.challenge) return c.text(payload.challenge, 200);
          if (checkDuplicateEvent(payload.event_id)) return c.text("OK", 200);
          if (payload.event?.bot_id || ["message_changed", "message_deleted"].includes(payload.event?.subtype)) {
            return c.text("OK", 200);
          }

          const result = await handler(mastra, {
            type: triggerType,
            params: {
              channel: payload.event.channel,
              channelDisplayName: payload.channel?.name ?? "",
            },
            payload,
          } as TriggerInfoSlackOnNewMessage);

          await reactToMessage(payload.event.channel, payload.event.ts, result);

          return c.text("OK", 200);
        } catch (error) {
          logger?.error("Slack webhook error", { error: format(error) });
          return c.text("Internal Server Error", 500);
        }
      },
    }),

    // -------------------- SSE Test Route --------------------
    {
      path: "/test/slack",
      method: "GET",
      handler: async (c: Context<Env>) => {
        return streamSSE(c, async (stream) => {
          const mastra = c.get("mastra");
          const logger = mastra.getLogger() ?? { info: console.log, error: console.error };

          let steps: Record<string, DiagnosisStep> = {
            auth: { status: "pending", name: "authentication with Slack" },
            conversation: { status: "pending", name: "open a conversation with user" },
            postMessage: { status: "pending", name: "send a message to the user" },
            readReplies: { status: "pending", name: "read replies from bot" },
          };

          const updateSteps = async (event: string) =>
            stream.writeSSE({ data: JSON.stringify(Object.values(steps)), event, id: String(Date.now()) });

          let slack: WebClient, auth: AuthTestResponse, user: string | undefined;
          try { ({ slack, auth, user } = await getClient()); steps.auth.status = "success"; steps.auth.extra = { auth }; await updateSteps("progress"); }
          catch (error) { steps.auth.status = "failed"; steps.auth.error = "authentication failed"; steps.auth.extra = { error: format(error) }; await updateSteps("error"); return; }

          // Open a DM with the bot
          let channel: ConversationsOpenResponse["channel"];
          if (user) {
            try {
              const conv = await slack.conversations.open({ users: user });
              channel = conv.channel;
              steps.conversation.status = "success"; steps.conversation.extra = { channel }; await updateSteps("progress");
            } catch (error) {
              steps.conversation.status = "failed"; steps.conversation.error = "opening a conversation failed"; steps.conversation.extra = { error: format(error) }; await updateSteps("error"); return;
            }
          } else {
            try {
              const convs = await slack.users.conversations({ user: auth.user_id });
              channel = convs.channels![0]!;
              steps.conversation.status = "success"; steps.conversation.extra = { channel }; await updateSteps("progress");
            } catch (error) {
              steps.conversation.status = "failed"; steps.conversation.error = "opening a conversation failed"; steps.conversation.extra = { error: format(error) }; await updateSteps("error"); return;
            }
          }

          // Send test message
          let message: ChatPostMessageResponse;
          try { message = await slack.chat.postMessage({ channel: channel.id, text: `<@${auth.user_id}> test:ping` }); steps.postMessage.status = "success"; steps.postMessage.extra = { message }; await updateSteps("progress"); }
          catch (error) { steps.postMessage.status = "failed"; steps.postMessage.error = "posting message failed"; steps.postMessage.extra = { error: format(error) }; await updateSteps("error"); return; }

          // Wait for bot reply
          const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
          let lastReplies: ConversationsRepliesResponse | undefined;
          for (let i = 0; i < 30; i++) {
            await sleep(1000);
            try {
              const replies = await slack.conversations.replies({ ts: message.ts, channel: channel.id });
              lastReplies = replies;
              if (replies?.messages?.some((m) => m.text === "pong")) {
                steps.readReplies.status = "success"; steps.readReplies.extra = { replies }; await updateSteps("result"); return;
              }
              steps.readReplies.extra = { replies }; await updateSteps("progress");
            } catch (error) {
              steps.readReplies.status = "failed"; steps.readReplies.error = "replies not found"; steps.readReplies.extra = { error: format(error) }; await updateSteps("error"); return;
            }
          }

          steps.readReplies.status = "failed"; steps.readReplies.error = "replies timed out"; steps.readReplies.extra = { lastReplies }; await updateSteps("error");
        });
      },
    },
  ];
}
