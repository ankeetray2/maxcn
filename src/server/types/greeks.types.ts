export type OptionType = 'CALL' | 'PUT';

export type CommodityType =
  | 'GOLD'
  | 'SILVER'
  | 'CRUDEOIL'
  | 'NATURALGAS'
  | 'COPPER'
  | 'ZINC'
  | 'ALUMINIUM'
  | 'LEAD'
  | 'NICKEL';

export interface LotPreset {
  name: string;
  size: number;
  unit: string;
  description: string;
}

export interface CommoditySpecDetail {
  id: CommodityType;
  name: string;
  symbol: string;
  unit: string;
  standardLotSize: number;
  miniLotSize?: number;
  lotPresets: LotPreset[];
  tickSize: number;
  defaultSpot: number;
  strikeStep: number;
  defaultIV: number; // percentage e.g. 18.5
  default52wHighIV: number;
  default52wLowIV: number;
  category: 'Precious Metals' | 'Energy' | 'Base Metals';
  change24h: number;
  high24h: number;
  low24h: number;
  volume: string;
}

export interface BlackScholesInputs {
  commodity: CommodityType | string;
  spotPrice: number;       // S
  strikePrice: number;     // K
  timeToExpiryYears: number; // T in years (or calculated from days)
  riskFreeRate: number;    // r (e.g. 0.065 for 6.5%)
  impliedVolatility: number; // σ (e.g. 0.25 for 25%)
  optionType: OptionType;
  lots?: number;
  lotSize?: number;
  saveToDatabase?: boolean;
}

export interface GreeksCalculationResult {
  d1: number;
  d2: number;
  delta: number;
  gamma: number;
  thetaDaily: number;
  thetaAnnual: number;
  vega: number;
  rho: number;
  premium: number;
  intrinsicValue: number;
  extrinsicValue: number;
  probabilityITM: number;
  probabilityOTM: number;
  probabilityTouch: number;
  ivRank: number;
  ivPercentile: number;
  // Lot & Position Metrics
  lots: number;
  lotSize: number;
  totalQuantity: number;
  positionDelta: number;
  positionGamma: number;
  positionTheta: number;
  positionVega: number;
  positionRho: number;
  positionValue: number; // premium * quantity
  // Portfolio Exposure equivalents
  totalDeltaExposure: number; // Position Delta * Spot Price
  totalGammaExposure: number;
  totalVegaExposure: number;
  totalThetaExposure: number;
}

export interface ScenarioPoint {
  moveLabel: string;
  spotMove: number;
  simulatedSpot: number;
  recalculatedPremium: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  unitPnl: number;
  totalPnl: number;
  returnPercentage: number;
}

export interface ScenarioAnalysisResponse {
  baseInput: BlackScholesInputs;
  baseResult: GreeksCalculationResult;
  scenarios: ScenarioPoint[];
  curveData: {
    spot: number;
    callPayoff: number;
    putPayoff: number;
    theoreticalPrice: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    pnl: number;
  }[];
}

export interface MongoGreekRecord {
  _id?: string;
  id?: string;
  commodity: string;
  spotPrice: number;
  strikePrice: number;
  optionType: OptionType;
  volatility: number;
  expiry: string | number; // date string or T in years
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  premium: number;
  lots: number;
  lotSize?: number;
  pnl?: number;
  createdAt: Date | string;
  notes?: string;
}
