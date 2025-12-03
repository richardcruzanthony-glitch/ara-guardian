import { createTool } from "@mastra/core/tools";
import { z } from "zod";
const MATERIALS = {
    '6061': { name: '6061-T6 Aluminum', density: 0.098, pricePerPound: 3.50, machinabilityFactor: 1.0 },
    '7075': { name: '7075-T6 Aluminum', density: 0.101, pricePerPound: 5.25, machinabilityFactor: 1.2 },
    '2024': { name: '2024-T3 Aluminum', density: 0.100, pricePerPound: 4.75, machinabilityFactor: 1.15 },
    '304': { name: '304 Stainless Steel', density: 0.289, pricePerPound: 4.50, machinabilityFactor: 2.0 },
    '316': { name: '316 Stainless Steel', density: 0.290, pricePerPound: 5.50, machinabilityFactor: 2.2 },
    '4140': { name: '4140 Steel', density: 0.284, pricePerPound: 2.75, machinabilityFactor: 1.5 },
    '1018': { name: '1018 Cold Rolled Steel', density: 0.284, pricePerPound: 1.50, machinabilityFactor: 1.0 },
    'brass': { name: 'C360 Brass', density: 0.307, pricePerPound: 6.50, machinabilityFactor: 0.8 },
    'copper': { name: 'C110 Copper', density: 0.323, pricePerPound: 8.00, machinabilityFactor: 0.9 },
    'titanium': { name: 'Ti-6Al-4V Titanium', density: 0.160, pricePerPound: 45.00, machinabilityFactor: 4.0 },
    'delrin': { name: 'Delrin (Acetal)', density: 0.051, pricePerPound: 4.00, machinabilityFactor: 0.6 },
    'hdpe': { name: 'HDPE Plastic', density: 0.035, pricePerPound: 2.50, machinabilityFactor: 0.5 },
};
const LABOR_RATE = 85;
const SETUP_BASE = 150;
const OVERHEAD_PERCENT = 0.15;
function parseMaterial(input) {
    const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, spec] of Object.entries(MATERIALS)) {
        if (normalized.includes(key) || normalized.includes(spec.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            return spec;
        }
    }
    if (normalized.includes('aluminum') || normalized.includes('aluminium'))
        return MATERIALS['6061'];
    if (normalized.includes('stainless') || normalized.includes('ss'))
        return MATERIALS['304'];
    if (normalized.includes('steel'))
        return MATERIALS['4140'];
    if (normalized.includes('plastic'))
        return MATERIALS['delrin'];
    return null;
}
function estimateComplexity(dimensions) {
    const { length = 4, width = 4, height = 1 } = dimensions;
    const volume = length * width * height;
    if (volume < 2)
        return 0.5;
    if (volume < 10)
        return 1.0;
    if (volume < 50)
        return 1.5;
    if (volume < 200)
        return 2.0;
    return 2.5;
}
function calculateQuote(material, quantity, dimensions) {
    const { length = 4, width = 4, height = 1 } = dimensions;
    const volume = length * width * height;
    const weight = volume * material.density;
    const materialCost = weight * material.pricePerPound * 1.25;
    const complexity = estimateComplexity(dimensions);
    const baseHours = complexity * material.machinabilityFactor;
    const hoursPerPart = baseHours * (1 + Math.log10(volume + 1) * 0.3);
    const totalHours = hoursPerPart * quantity + (quantity > 1 ? 0.25 * (quantity - 1) : 0);
    const laborCost = totalHours * LABOR_RATE;
    const setupCost = SETUP_BASE * (1 + complexity * 0.25);
    const subtotal = (materialCost * quantity) + laborCost + setupCost;
    const overhead = subtotal * OVERHEAD_PERCENT;
    const totalPrice = subtotal + overhead;
    const unitPrice = totalPrice / quantity;
    const volumeDiscount = quantity >= 100 ? 0.15 : quantity >= 50 ? 0.10 : quantity >= 25 ? 0.05 : 0;
    const finalTotal = totalPrice * (1 - volumeDiscount);
    const finalUnit = finalTotal / quantity;
    return {
        material: material.name,
        quantity,
        unitPrice: Math.round(finalUnit * 100) / 100,
        totalPrice: Math.round(finalTotal * 100) / 100,
        estimatedWeight: Math.round(weight * 100) / 100,
        machiningHours: Math.round(totalHours * 10) / 10,
        breakdown: {
            materialCost: Math.round(materialCost * quantity * 100) / 100,
            laborCost: Math.round(laborCost * 100) / 100,
            setupCost: Math.round(setupCost * 100) / 100,
            overhead: Math.round(overhead * 100) / 100
        }
    };
}
function parseQuoteRequest(input) {
    const quantityMatch = input.match(/(\d+)\s*(pieces?|pcs?|parts?|units?|qty|x)/i);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    const materialPatterns = Object.keys(MATERIALS).concat(['aluminum', 'stainless', 'steel', 'titanium', 'brass', 'copper', 'plastic']);
    let material = '6061';
    for (const m of materialPatterns) {
        if (input.toLowerCase().includes(m)) {
            material = m;
            break;
        }
    }
    const dimensionPatterns = [
        /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*"\s*[x×]\s*(\d+(?:\.\d+)?)\s*"\s*[x×]\s*(\d+(?:\.\d+)?)\s*"/i,
        /(\d+(?:\.\d+)?)\s*inch/i,
    ];
    let dimensions = {};
    for (const pattern of dimensionPatterns) {
        const match = input.match(pattern);
        if (match) {
            dimensions = {
                length: parseFloat(match[1]) || 4,
                width: parseFloat(match[2]) || 4,
                height: parseFloat(match[3]) || 1
            };
            break;
        }
    }
    return { material, quantity, dimensions };
}
export const guardianQuoteTool = createTool({
    id: "guardian-quote",
    description: "Generate CNC machining quotes for Guardian Sentinel. Parse voice/text requests like 'quote 25 pieces 7075' and return detailed pricing with material costs, labor, and volume discounts.",
    inputSchema: z.object({
        request: z.string().describe("Quote request text, e.g. 'quote 25 pieces 7075 aluminum 4x4x1'"),
        materialOverride: z.string().optional().describe("Force specific material code"),
        quantityOverride: z.number().optional().describe("Force specific quantity"),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        quote: z.any().optional(),
        formatted: z.string(),
        error: z.string().optional(),
    }),
    execute: async (context) => {
        const logger = context.mastra?.getLogger();
        logger?.info('💰 [GuardianQuote] Processing quote request:', context.data.request);
        try {
            const parsed = parseQuoteRequest(context.data.request);
            if (context.data.materialOverride)
                parsed.material = context.data.materialOverride;
            if (context.data.quantityOverride)
                parsed.quantity = context.data.quantityOverride;
            const material = parseMaterial(parsed.material);
            if (!material) {
                return {
                    success: false,
                    formatted: `Unknown material: ${parsed.material}. Supported: ${Object.values(MATERIALS).map(m => m.name).join(', ')}`,
                    error: 'Unknown material'
                };
            }
            const quote = calculateQuote(material, parsed.quantity, parsed.dimensions);
            const formatted = `
🏭 GUARDIAN SENTINEL QUOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Material: ${quote.material}
Quantity: ${quote.quantity} pieces
Weight/Part: ${quote.estimatedWeight} lbs

💵 PRICING
Unit Price: $${quote.unitPrice.toFixed(2)}
TOTAL: $${quote.totalPrice.toFixed(2)}

📊 BREAKDOWN
Material: $${quote.breakdown.materialCost.toFixed(2)}
Labor (${quote.machiningHours}h): $${quote.breakdown.laborCost.toFixed(2)}
Setup: $${quote.breakdown.setupCost.toFixed(2)}
Overhead: $${quote.breakdown.overhead.toFixed(2)}
${parsed.quantity >= 25 ? `\n✨ Volume discount applied!` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready to ship in 5-7 business days
`.trim();
            logger?.info('💰 [GuardianQuote] Quote generated:', quote.totalPrice);
            return {
                success: true,
                quote,
                formatted
            };
        }
        catch (e) {
            logger?.error('💰 [GuardianQuote] Error:', e);
            return {
                success: false,
                formatted: `Quote error: ${e}`,
                error: String(e)
            };
        }
    }
});
export const listMaterialsTool = createTool({
    id: "list-materials",
    description: "List all available materials for CNC machining quotes with pricing info",
    inputSchema: z.object({}),
    outputSchema: z.object({
        materials: z.array(z.object({
            code: z.string(),
            name: z.string(),
            pricePerPound: z.number(),
            density: z.number(),
        })),
        formatted: z.string(),
    }),
    execute: async (context) => {
        const logger = context.mastra?.getLogger();
        logger?.info('📋 [ListMaterials] Listing available materials');
        const materials = Object.entries(MATERIALS).map(([code, spec]) => ({
            code,
            name: spec.name,
            pricePerPound: spec.pricePerPound,
            density: spec.density
        }));
        const formatted = `
🔧 AVAILABLE MATERIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${materials.map(m => `${m.code.padEnd(10)} ${m.name.padEnd(25)} $${m.pricePerPound.toFixed(2)}/lb`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
        return { materials, formatted };
    }
});
