import { c as createTool, z } from '../mastra.mjs';
import 'stream/web';
import 'crypto';
import 'node:url';
import 'node:path';
import 'node:module';
import 'events';
import 'node:crypto';
import 'path';
import 'util';
import 'buffer';
import 'string_decoder';
import 'stream';
import 'async_hooks';
import 'node:process';
import 'fs';
import 'os';
import 'tty';

const CLASSIFIED_SITES = [
  { name: "Craigslist", url: "https://craigslist.org", category: "general", postable: true, notes: "Requires manual CAPTCHA" },
  { name: "Facebook Marketplace", url: "https://facebook.com/marketplace", category: "general", postable: false, notes: "Requires FB login" },
  { name: "OfferUp", url: "https://offerup.com", category: "general", postable: true, notes: "App preferred" },
  { name: "Letgo (OfferUp)", url: "https://offerup.com", category: "general", postable: true, notes: "Merged with OfferUp" },
  { name: "Mercari", url: "https://mercari.com", category: "general", postable: true, notes: "10% seller fee" },
  { name: "Poshmark", url: "https://poshmark.com", category: "fashion", postable: true, notes: "Fashion focused" },
  { name: "eBay", url: "https://ebay.com", category: "auction", postable: true, notes: "Listing fees apply" },
  { name: "Etsy", url: "https://etsy.com", category: "handmade", postable: true, notes: "Handmade/vintage focus" },
  { name: "Nextdoor", url: "https://nextdoor.com", category: "local", postable: false, notes: "Neighborhood verification" },
  { name: "VarageSale", url: "https://varagesale.com", category: "local", postable: true, notes: "Community based" },
  { name: "5miles", url: "https://5miles.com", category: "local", postable: true, notes: "Location based" },
  { name: "Decluttr", url: "https://decluttr.com", category: "tech", postable: true, notes: "Tech buyback" },
  { name: "Swappa", url: "https://swappa.com", category: "tech", postable: true, notes: "Tech marketplace" },
  { name: "Bonanza", url: "https://bonanza.com", category: "general", postable: true, notes: "eBay alternative" },
  { name: "Ruby Lane", url: "https://rubylane.com", category: "antiques", postable: true, notes: "Antiques/collectibles" },
  { name: "Chairish", url: "https://chairish.com", category: "furniture", postable: true, notes: "Home decor focus" },
  { name: "Reverb", url: "https://reverb.com", category: "music", postable: true, notes: "Musical instruments" },
  { name: "Grailed", url: "https://grailed.com", category: "fashion", postable: true, notes: "Menswear focus" },
  { name: "Depop", url: "https://depop.com", category: "fashion", postable: true, notes: "Gen Z fashion" },
  { name: "ThreadUp", url: "https://thredup.com", category: "fashion", postable: true, notes: "Consignment" }
];
const AD_TEMPLATES = {
  cashapp: `\u{1F4B0} INSTANT CASH - GET PAID TODAY \u{1F4B0}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
{{TITLE}}

{{DESCRIPTION}}

\u2705 Fast payment via Cash App
\u2705 Same-day pickup available
\u2705 Serious buyers only

\u{1F4F2} Contact now for price
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`,
  service: `\u{1F527} PROFESSIONAL SERVICE \u{1F527}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
{{TITLE}}

{{DESCRIPTION}}

\u{1F4BC} Licensed & Insured
\u2B50 5-Star Reviews
\u{1F4DE} Call/Text for Quote
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`,
  forsale: `\u{1F3F7}\uFE0F FOR SALE \u{1F3F7}\uFE0F
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
{{TITLE}}

{{DESCRIPTION}}

\u{1F4CD} Local pickup available
\u{1F4B5} Cash/Venmo/CashApp accepted
\u{1F4F1} Message for details
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`
};
function generateAd(title, description, template = "forsale") {
  const tmpl = AD_TEMPLATES[template] || AD_TEMPLATES.forsale;
  return tmpl.replace("{{TITLE}}", title).replace("{{DESCRIPTION}}", description);
}
const generateAdTool = createTool({
  id: "generate-ad",
  description: "Generate a professional classified ad from a simple description. Creates formatted posts ready for multiple sites.",
  inputSchema: z.object({
    title: z.string().describe("Short title for the listing"),
    description: z.string().describe("Description of item/service"),
    template: z.enum(["cashapp", "service", "forsale"]).default("forsale").describe("Ad template style"),
    price: z.number().optional().describe("Price in dollars"),
    location: z.string().optional().describe("Location/city")
  }),
  outputSchema: z.object({
    ad: z.string(),
    title: z.string(),
    sites: z.array(z.string()),
    tips: z.array(z.string())
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("\u{1F4DD} [GenerateAd] Creating ad:", context.title);
    let desc = context.description;
    if (context.price) {
      desc += `

\u{1F4B5} Price: $${context.price}`;
    }
    if (context.location) {
      desc += `
\u{1F4CD} Location: ${context.location}`;
    }
    const ad = generateAd(context.title, desc, context.template);
    const recommendedSites = CLASSIFIED_SITES.filter((s) => s.postable).slice(0, 10).map((s) => s.name);
    const tips = [
      "Post during peak hours (7-9 AM, 5-8 PM)",
      "Use high-quality photos (minimum 3)",
      "Respond to inquiries within 1 hour",
      "Renew listings every 2-3 days",
      "Cross-post to multiple platforms"
    ];
    return {
      ad,
      title: context.title,
      sites: recommendedSites,
      tips
    };
  }
});
const listPostSitesTool = createTool({
  id: "list-post-sites",
  description: "List all available classified ad sites with their categories and posting capabilities",
  inputSchema: z.object({
    category: z.string().optional().describe("Filter by category (general, fashion, tech, local, etc)")
  }),
  outputSchema: z.object({
    sites: z.array(z.object({
      name: z.string(),
      url: z.string(),
      category: z.string(),
      postable: z.boolean(),
      notes: z.string()
    })),
    formatted: z.string(),
    totalCount: z.number()
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("\u{1F4CB} [ListPostSites] Listing sites");
    let sites = CLASSIFIED_SITES;
    if (context.category) {
      sites = sites.filter((s) => s.category === context.category.toLowerCase());
    }
    const formatted = `
\u{1F4F1} CLASSIFIED AD SITES (${sites.length} sites)
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
${sites.map((s) => `${s.postable ? "\u2705" : "\u26A0\uFE0F"} ${s.name.padEnd(20)} [${s.category}]
   ${s.notes}`).join("\n\n")}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`.trim();
    return {
      sites,
      formatted,
      totalCount: sites.length
    };
  }
});
const autoPostPlanTool = createTool({
  id: "auto-post-plan",
  description: "Create a posting plan for an ad across multiple sites. Returns step-by-step instructions and automation hints.",
  inputSchema: z.object({
    adContent: z.string().describe("The ad content to post"),
    targetSites: z.array(z.string()).optional().describe("Specific sites to target"),
    maxSites: z.number().default(10).describe("Maximum number of sites to include")
  }),
  outputSchema: z.object({
    plan: z.array(z.object({
      step: z.number(),
      site: z.string(),
      url: z.string(),
      action: z.string(),
      automatable: z.boolean()
    })),
    formatted: z.string(),
    automationScore: z.number()
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("\u{1F680} [AutoPostPlan] Creating posting plan");
    let targetSites = CLASSIFIED_SITES.filter((s) => s.postable);
    if (context.targetSites && context.targetSites.length > 0) {
      targetSites = targetSites.filter(
        (s) => context.targetSites.some((t) => s.name.toLowerCase().includes(t.toLowerCase()))
      );
    }
    targetSites = targetSites.slice(0, context.maxSites);
    const plan = targetSites.map((site, i) => ({
      step: i + 1,
      site: site.name,
      url: site.url,
      action: `Navigate to ${site.url} \u2192 Create listing \u2192 Paste ad \u2192 Upload photos \u2192 Submit`,
      automatable: !site.notes.includes("CAPTCHA") && !site.notes.includes("login") && !site.notes.includes("verification")
    }));
    const automatableCount = plan.filter((p) => p.automatable).length;
    const automationScore = Math.round(automatableCount / plan.length * 100);
    const formatted = `
\u{1F680} AUTO-POST PLAN
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
Targeting ${plan.length} sites | ${automationScore}% automatable

${plan.map((p) => `${p.step}. ${p.automatable ? "\u{1F916}" : "\u{1F464}"} ${p.site}
   ${p.url}
   ${p.action}`).join("\n\n")}

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4A1} Tip: Sites marked \u{1F916} can be automated
   Sites marked \u{1F464} require manual steps
`.trim();
    return {
      plan,
      formatted,
      automationScore
    };
  }
});

export { autoPostPlanTool, generateAdTool, listPostSitesTool };
