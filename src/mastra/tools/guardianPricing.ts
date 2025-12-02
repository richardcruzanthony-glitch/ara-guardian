export interface MaterialSpec {
  name: string;
  density: number;
  pricePerPound: number;
  machinabilityFactor: number;
}

export interface QuoteResult {
  material: string;
  quantity: number;
  dimensions: { l: number; w: number; h: number };
  weight: number;
  unitPrice: number;
  totalPrice: number;
  breakdown: {
    materialCost: number;
    laborCost: number;
    setupCost: number;
    overhead: number;
    machiningHours: number;
  };
  discount: number;
  formatted: string;
}

export const MATERIALS: Record<string, MaterialSpec> = {
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

export function parseQuoteRequest(request: string): { material: string; quantity: number; dimensions: { l: number; w: number; h: number } } {
  const qtyMatch = request.match(/(\d+)\s*(pieces?|pcs?|parts?|units?|qty|x)/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
  
  let material = '6061';
  for (const key of Object.keys(MATERIALS)) {
    if (request.toLowerCase().includes(key)) {
      material = key;
      break;
    }
  }
  
  if (request.toLowerCase().includes('aluminum') && !request.match(/6061|7075|2024/)) {
    material = '6061';
  }
  if (request.toLowerCase().includes('stainless') && !request.match(/304|316/)) {
    material = '304';
  }
  if (request.toLowerCase().includes('steel') && !request.match(/304|316|4140|1018/)) {
    material = '4140';
  }
  
  const dimMatch = request.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  const dimensions = dimMatch 
    ? { l: parseFloat(dimMatch[1]), w: parseFloat(dimMatch[2]), h: parseFloat(dimMatch[3]) }
    : { l: 4, w: 4, h: 1 };
  
  return { material, quantity, dimensions };
}

export function calculateQuote(materialCode: string, quantity: number, dimensions: { l: number; w: number; h: number }): QuoteResult {
  const spec = MATERIALS[materialCode] || MATERIALS['6061'];
  const { l, w, h } = dimensions;
  
  const volume = l * w * h;
  const weight = volume * spec.density;
  
  const materialCost = weight * spec.pricePerPound * 1.25;
  
  const complexity = volume < 10 ? 1.0 : volume < 50 ? 1.5 : 2.0;
  const baseHours = complexity * spec.machinabilityFactor;
  const hoursPerPart = baseHours * (1 + Math.log10(volume + 1) * 0.3);
  const totalHours = hoursPerPart * quantity + (quantity > 1 ? 0.25 * (quantity - 1) : 0);
  const laborCost = totalHours * LABOR_RATE;
  
  const setupCost = SETUP_BASE * (1 + complexity * 0.25);
  
  const subtotal = (materialCost * quantity) + laborCost + setupCost;
  const overhead = subtotal * OVERHEAD_PERCENT;
  
  const total = subtotal + overhead;
  
  const discount = quantity >= 100 ? 0.15 : quantity >= 50 ? 0.10 : quantity >= 25 ? 0.05 : 0;
  const finalTotal = total * (1 - discount);
  const unitPrice = finalTotal / quantity;
  
  const formatted = `🏭 GUARDIAN SENTINEL QUOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Material: ${spec.name}
Quantity: ${quantity} pieces
Dimensions: ${l}"x${w}"x${h}"
Weight/Part: ${weight.toFixed(2)} lbs

💵 PRICING
Unit Price: $${unitPrice.toFixed(2)}
TOTAL: $${finalTotal.toFixed(2)}

📊 BREAKDOWN
Material: $${(materialCost * quantity).toFixed(2)}
Labor (${totalHours.toFixed(1)}h): $${laborCost.toFixed(2)}
Setup: $${setupCost.toFixed(2)}
Overhead: $${overhead.toFixed(2)}${discount > 0 ? `\n\n✨ Volume discount: ${(discount * 100).toFixed(0)}% off!` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready to ship in 5-7 business days`;

  return {
    material: spec.name,
    quantity,
    dimensions: { l, w, h },
    weight: Math.round(weight * 100) / 100,
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalPrice: Math.round(finalTotal * 100) / 100,
    breakdown: {
      materialCost: Math.round(materialCost * quantity * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      setupCost: Math.round(setupCost * 100) / 100,
      overhead: Math.round(overhead * 100) / 100,
      machiningHours: Math.round(totalHours * 10) / 10
    },
    discount,
    formatted
  };
}

export function generateQuote(request: string): QuoteResult {
  const parsed = parseQuoteRequest(request);
  return calculateQuote(parsed.material, parsed.quantity, parsed.dimensions);
}

export function getMaterialsList(): Array<{ code: string; name: string; pricePerPound: number }> {
  return Object.entries(MATERIALS).map(([code, spec]) => ({
    code,
    name: spec.name,
    pricePerPound: spec.pricePerPound
  }));
}

export function formatMaterialsList(): string {
  return `🔧 Available Materials:

${getMaterialsList().map(m => `${m.code.padEnd(10)} ${m.name.padEnd(25)} $${m.pricePerPound.toFixed(2)}/lb`).join('\n')}

Usage: /quote 25 pieces 7075 4x4x1`;
}
