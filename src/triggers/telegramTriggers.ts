import type { Mastra } from "@mastra/core";
// DISABLED: registerApiRoute not available in Mastra v0.20+
// import { registerApiRoute } from "@mastra/core";

// Type definitions for Telegram triggers
type TriggerInfoTelegramOnNewMessage = {
  type: string;
  params: {
    userName: string;
    message: string;
  };
  payload: any;
};

export function registerTelegramTrigger({
  triggerType,
  handler,
}: {
  triggerType: string;
  handler: (
    mastra: Mastra,
    triggerInfo: TriggerInfoTelegramOnNewMessage,
  ) => Promise<void>;
}) {
  // DISABLED: registerApiRoute not available
  console.warn("Telegram trigger registration skipped - API not compatible with Mastra v0.20+");
  return [];
  
  /* Original implementation - requires registerApiRoute:
  return [
    registerApiRoute("/webhooks/telegram/action", {
      method: "POST",
      handler: async (c) => {
        const mastra = c.get("mastra");
        const logger = mastra.getLogger();
        try {
          const payload = await c.req.json();

          logger?.info("📝 [Telegram] payload", payload);

          const message = payload.message || payload.edited_message;
          if (!message || !message.text) {
            logger?.info("📝 [Telegram] Ignoring non-text message");
            return c.text("OK", 200);
          }

          await handler(mastra, {
            type: triggerType,
            params: {
              userName: message.from?.username || message.from?.first_name || "unknown",
              message: message.text,
            },
            payload,
          } as TriggerInfoTelegramOnNewMessage);

          return c.text("OK", 200);
        } catch (error) {
          logger?.error("Error handling Telegram webhook:", error);
          return c.text("Internal Server Error", 500);
        }
      },
    }),
  ];
  */
}
