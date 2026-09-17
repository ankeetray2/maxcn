import { CommoditySpec, CommodityType, HistoryRecord, OptionChainStrike } from '../types';
import { calculateGreeks } from '../utils/greeks';

const RAW_COMMODITY_SPECS: Record<CommodityType, CommoditySpec> = {
  GOLD: {
    id: 'GOLD',
    name: 'Gold (MCX)',
    symbol: 'GOLD',
    unit: '10 Grams',
    lotSize: 100, // 100 units of 10g = 1kg
    miniLotSize: 10, // 100g mini
    lotPresets: [
      { name: 'MCX Gold (1 kg)', size: 100, unit: '10g (1 kg)', description: 'Standard benchmark contract' },
      { name: 'MCX Gold Mini (100 g)', size: 10, unit: '10g (100 g)', description: 'Active retail mini contract' },
      { name: 'MCX Gold Guinea (8 g)', size: 1, unit: '8g', description: 'Guinea contract' }
    ],
    tickSize: 1.0,
    defaultSpot: 78500,
    strikeStep: 500,
    defaultIV: 15.4,
    default52wHighIV: 24.8,
    default52wLowIV: 11.2,
    category: 'Precious Metals',
    change24h: 0.85,
    high24h: 78950,
    low24h: 78100,
    volume: '22,450 Lots'
  },
  SILVER: {
    id: 'SILVER',
    name: 'Silver (MCX)',
    symbol: 'SILVER',
    unit: '1 Kilogram',
    lotSize: 30, // 30kg standard
    miniLotSize: 5, // 5kg mini
    lotPresets: [
      { name: 'MCX Silver (30 kg)', size: 30, unit: '1 kg (30 kg)', description: 'Standard high-volume contract' },
      { name: 'MCX Silver Mini (5 kg)', size: 5, unit: '1 kg (5 kg)', description: 'Retail mini contract' },
      { name: 'MCX Silver Micro (1 kg)', size: 1, unit: '1 kg', description: 'Entry-level micro contract' }
    ],
    tickSize: 1.0,
    defaultSpot: 93200,
    strikeStep: 1000,
    defaultIV: 23.8,
    default52wHighIV: 36.5,
    default52wLowIV: 17.5,
    category: 'Precious Metals',
    change24h: -0.65,
    high24h: 94100,
    low24h: 92600,
    volume: '28,120 Lots'
  },
  CRUDEOIL: {
    id: 'CRUDEOIL',
    name: 'Crude Oil (WTI / MCX)',
    symbol: 'CRUDEOIL',
    unit: '1 Barrel',
    lotSize: 100, // 100 barrels
    miniLotSize: 10,
    lotPresets: [
      { name: 'MCX Crude Oil (100 bbl)', size: 100, unit: 'Barrels', description: 'Flagship energy derivative' },
      { name: 'MCX Crude Oil Mini (10 bbl)', size: 10, unit: 'Barrels', description: 'Retail energy mini' }
    ],
    tickSize: 1.0,
    defaultSpot: 6240,
    strikeStep: 50,
    defaultIV: 32.5,
    default52wHighIV: 52.0,
    default52wLowIV: 21.0,
    category: 'Energy',
    change24h: 1.84,
    high24h: 6310,
    low24h: 6150,
    volume: '154,800 Lots'
  },
  NATURALGAS: {
    id: 'NATURALGAS',
    name: 'Natural Gas (MCX)',
    symbol: 'NATGAS',
    unit: '1 mmBtu',
    lotSize: 1250, // 1250 mmBtu
    miniLotSize: 250,
    lotPresets: [
      { name: 'MCX Natural Gas (1250 mmBtu)', size: 1250, unit: 'mmBtu', description: 'Standard high-volatility gas future' },
      { name: 'MCX Natural Gas Mini (250 mmBtu)', size: 250, unit: 'mmBtu', description: 'Mini gas contract' }
    ],
    tickSize: 0.1,
    defaultSpot: 252.4,
    strikeStep: 5,
    defaultIV: 44.6,
    default52wHighIV: 78.0,
    default52wLowIV: 28.5,
    category: 'Energy',
    change24h: -2.30,
    high24h: 261.2,
    low24h: 249.0,
    volume: '98,340 Lots'
  },
  COPPER: {
    id: 'COPPER',
    name: 'Copper (MCX)',
    symbol: 'COPPER',
    unit: '1 Kilogram',
    lotSize: 2500, // 2500 kg
    miniLotSize: 1000,
    lotPresets: [
      { name: 'MCX Copper Standard (2500 kg)', size: 2500, unit: 'kg (2.5 MT)', description: 'Physical delivery base metal contract' },
      { name: 'MCX Copper Mini (1000 kg)', size: 1000, unit: 'kg (1 MT)', description: 'Mini base metal contract' }
    ],
    tickSize: 0.05,
    defaultSpot: 865.5,
    strikeStep: 10,
    defaultIV: 19.8,
    default52wHighIV: 31.0,
    default52wLowIV: 14.0,
    category: 'Base Metals',
    change24h: 1.12,
    high24h: 871.0,
    low24h: 859.0,
    volume: '34,900 Lots'
  },
  ZINC: {
    id: 'ZINC',
    name: 'Zinc (MCX)',
    symbol: 'ZINC',
    unit: '1 Kilogram',
    lotSize: 5000, // 5000 kg
    miniLotSize: 1000,
    lotPresets: [
      { name: 'MCX Zinc Standard (5000 kg)', size: 5000, unit: 'kg (5 MT)', description: 'Standard primary zinc' },
      { name: 'MCX Zinc Mini (1000 kg)', size: 1000, unit: 'kg (1 MT)', description: 'Retail zinc mini' }
    ],
    tickSize: 0.05,
    defaultSpot: 284.6,
    strikeStep: 2.5,
    defaultIV: 22.4,
    default52wHighIV: 34.0,
    default52wLowIV: 16.5,
    category: 'Base Metals',
    change24h: 0.45,
    high24h: 287.0,
    low24h: 282.5,
    volume: '21,100 Lots'
  },
  ALUMINIUM: {
    id: 'ALUMINIUM',
    name: 'Aluminium (MCX)',
    symbol: 'ALUM',
    unit: '1 Kilogram',
    lotSize: 5000, // 5000 kg
    miniLotSize: 1000,
    lotPresets: [
      { name: 'MCX Aluminium (5000 kg)', size: 5000, unit: 'kg (5 MT)', description: 'Standard primary ingot contract' },
      { name: 'MCX Aluminium Mini (1000 kg)', size: 1000, unit: 'kg (1 MT)', description: 'Mini ingot contract' }
    ],
    tickSize: 0.05,
    defaultSpot: 236.8,
    strikeStep: 2.5,
    defaultIV: 18.2,
    default52wHighIV: 29.5,
    default52wLowIV: 13.5,
    category: 'Base Metals',
    change24h: 0.72,
    high24h: 239.5,
    low24h: 234.0,
    volume: '16,700 Lots'
  },
  LEAD: {
    id: 'LEAD',
    name: 'Lead (MCX)',
    symbol: 'LEAD',
    unit: '1 Kilogram',
    lotSize: 5000, // 5000 kg
    miniLotSize: 1000,
    lotPresets: [
      { name: 'MCX Lead Standard (5000 kg)', size: 5000, unit: 'kg (5 MT)', description: 'Primary lead ingot' },
      { name: 'MCX Lead Mini (1000 kg)', size: 1000, unit: 'kg (1 MT)', description: 'Mini lead ingot' }
    ],
    tickSize: 0.05,
    defaultSpot: 186.2,
    strikeStep: 1.0,
    defaultIV: 16.8,
    default52wHighIV: 26.0,
    default52wLowIV: 12.0,
    category: 'Base Metals',
    change24h: -0.32,
    high24h: 188.0,
    low24h: 184.8,
    volume: '11,400 Lots'
  },
  NICKEL: {
    id: 'NICKEL',
    name: 'Nickel (MCX)',
    symbol: 'NICKEL',
    unit: '1 Kilogram',
    lotSize: 1500, // 1500 kg
    miniLotSize: 250,
    lotPresets: [
      { name: 'MCX Nickel Standard (1500 kg)', size: 1500, unit: 'kg (1.5 MT)', description: 'Standard high-value nickel briquettes' },
      { name: 'MCX Nickel Mini (250 kg)', size: 250, unit: 'kg', description: 'Mini nickel contract' }
    ],
    tickSize: 0.1,
    defaultSpot: 1428.0,
    strikeStep: 20,
    defaultIV: 28.6,
    default52wHighIV: 48.0,
    default52wLowIV: 20.5,
    category: 'Base Metals',
    change24h: 1.45,
    high24h: 1445.0,
    low24h: 1410.0,
    volume: '8,250 Lots'
  }
};

/**
 * Normalizes any commodity input string into a valid CommodityType
 */
export function normalizeCommodityType(input?: string | null): CommodityType {
  if (!input) return 'GOLD';
  const clean = String(input).toUpperCase().replace(/[\s_\-]+/g, '');
  if (clean === 'GOLD' || clean.includes('GOLD')) return 'GOLD';
  if (clean === 'SILVER' || clean.includes('SILVER')) return 'SILVER';
  if (clean.includes('CRUDE') || clean.includes('OIL')) return 'CRUDEOIL';
  if (clean.includes('NAT') || clean.includes('GAS')) return 'NATURALGAS';
  if (clean.includes('COPPER')) return 'COPPER';
  if (clean.includes('ZINC')) return 'ZINC';
  if (clean.includes('ALUM')) return 'ALUMINIUM';
  if (clean.includes('LEAD')) return 'LEAD';
  if (clean.includes('NICKEL')) return 'NICKEL';
  return 'GOLD';
}

/**
 * Returns the CommoditySpec for any commodity, always guaranteed not to be undefined
 */
export function getCommoditySpec(commodity?: string | null): CommoditySpec {
  const normalized = normalizeCommodityType(commodity);
  return RAW_COMMODITY_SPECS[normalized] || RAW_COMMODITY_SPECS.GOLD;
}

/**
 * Proxy around RAW_COMMODITY_SPECS to ensure accessing any property never yields undefined
 */
export const COMMODITY_SPECS: Record<CommodityType, CommoditySpec> = new Proxy(RAW_COMMODITY_SPECS, {
  get(target, prop) {
    if (typeof prop === 'string') {
      if (prop in target) {
        return (target as any)[prop];
      }
      const normalized = normalizeCommodityType(prop);
      if (normalized in target) {
        return (target as any)[normalized];
      }
      return target.GOLD;
    }
    return (target as any)[prop] || target.GOLD;
  }
});

/**
 * Generate simulated option chain strikes around the spot price
 */
export function generateOptionChain(
  commodityType: CommodityType,
  customSpot?: number,
  customIV?: number
): OptionChainStrike[] {
  const spec = COMMODITY_SPECS[commodityType] || COMMODITY_SPECS.GOLD;
  const spot = customSpot && customSpot > 0 ? customSpot : spec.defaultSpot;
  const step = spec.strikeStep;
  const strikes: OptionChainStrike[] = [];

  const range = 5; // 5 OTM and 5 ITM strikes
  for (let i = -range; i <= range; i++) {
    const strike = Math.round((spot + i * step) / step) * step;
    const days = 28;
    const vol = customIV && customIV > 0 ? customIV : spec.defaultIV;
    const rate = 6.5;

    const callGreek = calculateGreeks(spot, strike, days, vol, rate, 'CALL', 'BLACK_SCHOLES', 1, spec.lotSize);
    const putGreek = calculateGreeks(spot, strike, days, vol, rate, 'PUT', 'BLACK_SCHOLES', 1, spec.lotSize);

    const moneyness = Math.abs(strike - spot) / spot;
    const oiBase = Math.round(Math.max(50, 1200 - moneyness * 5000));

    strikes.push({
      strike,
      call: {
        ltp: callGreek.price,
        iv: vol + (strike < spot ? 1.2 : -0.8),
        oi: oiBase + Math.floor(Math.random() * 200),
        volume: Math.floor(oiBase * 0.4),
        delta: callGreek.delta,
        gamma: callGreek.gamma,
        theta: callGreek.theta,
        vega: callGreek.vega,
        rho: callGreek.rho
      },
      put: {
        ltp: putGreek.price,
        iv: vol + (strike > spot ? 1.4 : -0.6),
        oi: Math.floor(oiBase * 0.9) + Math.floor(Math.random() * 180),
        volume: Math.floor(oiBase * 0.35),
        delta: putGreek.delta,
        gamma: putGreek.gamma,
        theta: putGreek.theta,
        vega: putGreek.vega,
        rho: putGreek.rho
      }
    });
  }

  return strikes;
}

export function generateHistoricalTrend(commodityType: CommodityType) {
  const spec = getCommoditySpec(commodityType);
  const baseIV = spec.defaultIV;
  const dates = [
    '30d ago', '25d ago', '20d ago', '15d ago', '10d ago', '7d ago', '5d ago', '3d ago', '1d ago', 'Today'
  ];

  return dates.map((date, idx) => {
    const daysToExpiry = Math.max(1, 35 - idx * 3.5);
    const simulatedSpot = spec.defaultSpot * (1 + (Math.sin(idx * 0.6) * 0.02));
    const greeksCall = calculateGreeks(simulatedSpot, spec.defaultSpot, daysToExpiry, baseIV, 6.5, 'CALL', 'BLACK_SCHOLES', 1, spec.lotSize);
    const greeksPut = calculateGreeks(simulatedSpot, spec.defaultSpot, daysToExpiry, baseIV, 6.5, 'PUT', 'BLACK_SCHOLES', 1, spec.lotSize);

    return {
      date,
      daysToExpiry: Math.round(daysToExpiry),
      callDelta: Number(greeksCall.delta.toFixed(4)),
      putDelta: Number(greeksPut.delta.toFixed(4)),
      gamma: Number((greeksCall.gamma * 1000).toFixed(4)),
      theta: Number(greeksCall.theta.toFixed(4)),
      vega: Number(greeksCall.vega.toFixed(4)),
      iv: Number((baseIV + Math.sin(idx * 0.8) * 2.5).toFixed(2)),
      historicalVol: Number((baseIV - 1.2 + Math.cos(idx * 0.5) * 1.8).toFixed(2)),
      spot: simulatedSpot
    };
  });
}
