import { serve } from "inngest/express";

// basic inngest handler export
export const inngestServe = serve({
  client: {
    name: "ara-guardian",
  },
  functions: [],
});
