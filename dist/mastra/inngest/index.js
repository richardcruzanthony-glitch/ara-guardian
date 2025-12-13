import { serve } from "inngest/express";
import { Inngest } from "inngest";
// basic inngest client and handler export
export const inngest = new Inngest({ id: "ara-guardian" });
export const inngestServe = serve({
    client: inngest,
    functions: [],
});
