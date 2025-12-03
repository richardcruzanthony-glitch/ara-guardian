import { createTool } from "@mastra/core/tools";
import { z } from "zod";
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
    { name: "ThreadUp", url: "https://thredup.com", category: "fashion", postable: true, notes: "Consignment" },
];
const AD_TEMPLATES = {
    cashapp: `💰 INSTANT CASH - GET PAID TODAY 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{TITLE}}

{{DESCRIPTION}}

✅ Fast payment via Cash App
✅ Same-day pickup available
✅ Serious buyers only

📲 Contact now for price
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    service: `🔧 PROFESSIONAL SERVICE 🔧
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{TITLE}}

{{DESCRIPTION}}

💼 Licensed & Insured
⭐ 5-Star Reviews
📞 Call/Text for Quote
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    forsale: `🏷️ FOR SALE 🏷️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{TITLE}}

{{DESCRIPTION}}

📍 Local pickup available
💵 Cash/Venmo/CashApp accepted
📱 Message for details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
};
function generateAd(title, description, template = 'forsale') {
    const tmpl = AD_TEMPLATES[template] || AD_TEMPLATES.forsale;
    return tmpl
        .replace('{{TITLE}}', title)
        .replace('{{DESCRIPTION}}', description);
}
export const generateAdTool = createTool({
    id: "generate-ad",
    description: "Generate a professional classified ad from a simple description. Creates formatted posts ready for multiple sites.",
    inputSchema: z.object({
        title: z.string().describe("Short title for the listing"),
        description: z.string().describe("Description of item/service"),
        template: z.enum(['cashapp', 'service', 'forsale']).default('forsale').describe("Ad template style"),
        price: z.number().optional().describe("Price in dollars"),
        location: z.string().optional().describe("Location/city"),
    }),
    outputSchema: z.object({
        ad: z.string(),
        title: z.string(),
        sites: z.array(z.string()),
        tips: z.array(z.string()),
    }),
    execute: async (context) => {
        const logger = context.mastra?.getLogger();
        logger?.info('📝 [GenerateAd] Creating ad:', context.data.title);
        let desc = context.data.description;
        if (context.data.price) {
            desc += `\n\n💵 Price: $${context.data.price}`;
        }
        if (context.data.location) {
            desc += `\n📍 Location: ${context.data.location}`;
        }
        const ad = generateAd(context.data.title, desc, context.data.template);
        const recommendedSites = CLASSIFIED_SITES
            .filter(s => s.postable)
            .slice(0, 10)
            .map(s => s.name);
        const tips = [
            "Post during peak hours (7-9 AM, 5-8 PM)",
            "Use high-quality photos (minimum 3)",
            "Respond to inquiries within 1 hour",
            "Renew listings every 2-3 days",
            "Cross-post to multiple platforms"
        ];
        return {
            ad,
            title: context.data.title,
            sites: recommendedSites,
            tips
        };
    }
});
export const listPostSitesTool = createTool({
    id: "list-post-sites",
    description: "List all available classified ad sites with their categories and posting capabilities",
    inputSchema: z.object({
        category: z.string().optional().describe("Filter by category (general, fashion, tech, local, etc)"),
    }),
    outputSchema: z.object({
        sites: z.array(z.object({
            name: z.string(),
            url: z.string(),
            category: z.string(),
            postable: z.boolean(),
            notes: z.string(),
        })),
        formatted: z.string(),
        totalCount: z.number(),
    }),
    execute: async (context) => {
        const logger = context.mastra?.getLogger();
        logger?.info('📋 [ListPostSites] Listing sites');
        let sites = CLASSIFIED_SITES;
        if (context.data.category) {
            sites = sites.filter(s => s.category === context.data.category.toLowerCase());
        }
        const formatted = `
📱 CLASSIFIED AD SITES (${sites.length} sites)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sites.map(s => `${s.postable ? '✅' : '⚠️'} ${s.name.padEnd(20)} [${s.category}]\n   ${s.notes}`).join('\n\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
        return {
            sites,
            formatted,
            totalCount: sites.length
        };
    }
});
export const autoPostPlanTool = createTool({
    id: "auto-post-plan",
    description: "Create a posting plan for an ad across multiple sites. Returns step-by-step instructions and automation hints.",
    inputSchema: z.object({
        adContent: z.string().describe("The ad content to post"),
        targetSites: z.array(z.string()).optional().describe("Specific sites to target"),
        maxSites: z.number().default(10).describe("Maximum number of sites to include"),
    }),
    outputSchema: z.object({
        plan: z.array(z.object({
            step: z.number(),
            site: z.string(),
            url: z.string(),
            action: z.string(),
            automatable: z.boolean(),
        })),
        formatted: z.string(),
        automationScore: z.number(),
    }),
    execute: async (context) => {
        const logger = context.mastra?.getLogger();
        logger?.info('🚀 [AutoPostPlan] Creating posting plan');
        let targetSites = CLASSIFIED_SITES.filter(s => s.postable);
        if (context.data.targetSites && context.data.targetSites.length > 0) {
            targetSites = targetSites.filter(s => context.data.targetSites.some(t => s.name.toLowerCase().includes(t.toLowerCase())));
        }
        targetSites = targetSites.slice(0, context.data.maxSites);
        const plan = targetSites.map((site, i) => ({
            step: i + 1,
            site: site.name,
            url: site.url,
            action: `Navigate to ${site.url} → Create listing → Paste ad → Upload photos → Submit`,
            automatable: !site.notes.includes('CAPTCHA') && !site.notes.includes('login') && !site.notes.includes('verification'),
        }));
        const automatableCount = plan.filter(p => p.automatable).length;
        const automationScore = Math.round((automatableCount / plan.length) * 100);
        const formatted = `
🚀 AUTO-POST PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Targeting ${plan.length} sites | ${automationScore}% automatable

${plan.map(p => `${p.step}. ${p.automatable ? '🤖' : '👤'} ${p.site}
   ${p.url}
   ${p.action}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Tip: Sites marked 🤖 can be automated
   Sites marked 👤 require manual steps
`.trim();
        return {
            plan,
            formatted,
            automationScore
        };
    }
});
