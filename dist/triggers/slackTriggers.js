/**
 * Slack Trigger - Webhook-based Workflow Triggering (Render-ready)
 *
 * This module provides Slack event handling for Mastra workflows.
 * When Slack events occur (like new messages), this trigger starts your workflow.
 */
import { format } from "node:util";
import { ErrorCode, WebClient, } from "@slack/web-api";
// -------------------- Render-friendly Slack Client --------------------
export async function getClient() {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token)
        throw new Error("SLACK_BOT_TOKEN not set in environment");
    const slack = new WebClient(token);
    const auth = await slack.auth.test();
    return { slack, auth, user: auth.user_id };
}
// -------------------- Duplicate Event Handling --------------------
const recentEvents = new Set();
function checkDuplicateEvent(eventId) {
    if (recentEvents.has(eventId))
        return true;
    recentEvents.add(eventId);
    if (recentEvents.size > 200) {
        recentEvents.delete([...recentEvents][0]);
    }
    return false;
}
// -------------------- Slack Reactions --------------------
function isWebAPICallError(err) {
    return typeof err === "object" && err !== null && "code" in err && "data" in err;
}
function createReactToMessage({ slack, logger }) {
    const addReaction = async (channel, timestamp, emoji) => {
        logger.info(`[Slack] Adding reaction ${emoji} to message`, { channel, timestamp });
        try {
            await slack.reactions.add({ channel, timestamp, name: emoji });
        }
        catch (error) {
            logger.error(`[Slack] Error adding reaction`, { emoji, timestamp, channel, error: format(error) });
        }
    };
    const removeAllReactions = async (channel, timestamp) => {
        const emojis = ["hourglass", "hourglass_flowing_sand", "white_check_mark", "x", "alarm_clock"];
        for (const emoji of emojis) {
            try {
                await slack.reactions.remove({ channel, timestamp, name: emoji });
            }
            catch (error) {
                if (isWebAPICallError(error) && (error.code !== ErrorCode.PlatformError || error.data?.error !== "no_reaction")) {
                    logger.error("[Slack] Error removing reaction", { emoji, timestamp, channel, error: format(error) });
                }
            }
        }
    };
    return async function reactToMessage(channel, timestamp, result) {
        await removeAllReactions(channel, timestamp);
        if (result?.status === "success")
            await addReaction(channel, timestamp, "white_check_mark");
        else if (result?.status === "failed")
            await addReaction(channel, timestamp, "x");
        else if (result !== null)
            await addReaction(channel, timestamp, "alarm_clock");
    };
}
// -------------------- Slack Trigger Registration --------------------
export function registerSlackTrigger({ triggerType, handler }) {
    // DISABLED: registerApiRoute not available
    console.warn("Slack trigger registration skipped - API not compatible with Mastra v0.20+");
    return [];
    /* Original implementation:
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
            try { ({ slack, auth, user } = await getClient()); steps.auth = { status: "success", name: steps.auth.name, extra: { auth } }; await updateSteps("progress"); }
            catch (error) { steps.auth = { status: "failed", name: steps.auth.name, error: "authentication failed", extra: { error: format(error) } }; await updateSteps("error"); return; }
  
            // Open a DM with the bot
            let channel: ConversationsOpenResponse["channel"];
            if (user) {
              try {
                const conv = await slack.conversations.open({ users: user });
                channel = conv.channel;
                steps.conversation = { status: "success", name: steps.conversation.name, extra: { channel } }; await updateSteps("progress");
              } catch (error) {
                steps.conversation = { status: "failed", name: steps.conversation.name, error: "opening a conversation failed", extra: { error: format(error) } }; await updateSteps("error"); return;
              }
            } else {
              try {
                const convs = await slack.users.conversations({ user: auth.user_id });
                channel = convs.channels![0]!;
                steps.conversation = { status: "success", name: steps.conversation.name, extra: { channel } }; await updateSteps("progress");
              } catch (error) {
                steps.conversation = { status: "failed", name: steps.conversation.name, error: "opening a conversation failed", extra: { error: format(error) } }; await updateSteps("error"); return;
              }
            }
  
            // Send test message
            let message: ChatPostMessageResponse;
            try { message = await slack.chat.postMessage({ channel: channel.id, text: `<@${auth.user_id}> test:ping` }); steps.postMessage = { status: "success", name: steps.postMessage.name, extra: { message } }; await updateSteps("progress"); }
            catch (error) { steps.postMessage = { status: "failed", name: steps.postMessage.name, error: "posting message failed", extra: { error: format(error) } }; await updateSteps("error"); return; }
  
            // Wait for bot reply
            const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
            let lastReplies: ConversationsRepliesResponse | undefined;
            for (let i = 0; i < 30; i++) {
              await sleep(1000);
              try {
                const replies = await slack.conversations.replies({ ts: message.ts, channel: channel.id });
                lastReplies = replies;
                if (replies?.messages?.some((m) => m.text === "pong")) {
                  steps.readReplies = { status: "success", name: steps.readReplies.name, extra: { replies } }; await updateSteps("result"); return;
                }
                steps.readReplies = { ...steps.readReplies, extra: { replies } }; await updateSteps("progress");
              } catch (error) {
                steps.readReplies = { status: "failed", name: steps.readReplies.name, error: "replies not found", extra: { error: format(error) } }; await updateSteps("error"); return;
              }
            }
  
            steps.readReplies = { status: "failed", name: steps.readReplies.name, error: "replies timed out", extra: { lastReplies } }; await updateSteps("error");
          });
        },
      },
    ];
    */
}
