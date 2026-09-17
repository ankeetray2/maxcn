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

export type OptionType = 'CALL' | 'PUT';

export type PricingModel = 'BLACK_76' | 'BLACK_SCHOLES';

export interface LotPreset {
  name: string;
  size: number;
  unit: string;
  description: string;
}

export interface CommoditySpec {
  id: CommodityType;
  name: string;
  symbol: string;
  unit: string;
  lotSize: number; // standard
  miniLotSize?: number;
  lotPresets: LotPreset[];
  tickSize: number;
  defaultSpot: number;
  strikeStep: number;
  defaultIV: number; // percentage, e.g. 18.5
  default52wHighIV?: number;
  default52wLowIV?: number;
  category: 'Precious Metals' | 'Energy' | 'Base Metals';
  change24h: number;
  high24h: number;
  low24h: number;
  volume: string;
}

export interface GreekResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number; // per day
  thetaAnnual?: number;
  vega: number;  // per 1% vol
  rho: number;   // per 1% rate
  pop: number;   // Probability of Profit (%)
  breakeven: number; // Underlying spot price required to breakeven at expiry
  intrinsicValue: number;
  timeValue: number; // extrinsic
  extrinsicValue: number; // alias for timeValue
  d1: number;
  d2: number;
  // Additional Metrics
  probabilityITM: number;
  probabilityOTM: number;
  probabilityTouch: number;
  ivRank: number;
  ivPercentile: number;
  // Lot & Position Calculations
  lots: number;
  lotSize: number;
  totalQuantity: number;
  positionDelta: number;
  positionGamma: number;
  positionTheta: number;
  positionVega: number;
  positionRho: number;
  positionValue: number;
  // Portfolio Exposure equivalents
  totalDeltaExposure: number;
  totalGammaExposure: number;
  totalVegaExposure: number;
  totalThetaExposure: number;
}

export interface CalculatorState {
  commodity: CommodityType;
  spotPrice: number;
  strikePrice: number;
  expiryDays: number;
  volatility: number; // percentage, e.g., 22%
  interestRate: number; // percentage, e.g., 6.5%
  optionType: OptionType;
  contracts: number; // lots
  lotSize: number;
  isCustomLotSize: boolean;
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

export interface CurvePoint {
  spot: number;
  callPayoff: number;
  putPayoff: number;
  activePayoff: number;
  theoreticalPrice: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  pnl: number;
  pop?: number;
}

export interface HistoryRecord {
  id: string;
  _id?: string;
  date: string;
  commodity: CommodityType | string;
  strike: number;
  strikePrice?: number;
  optionType: OptionType;
  spotPrice: number;
  iv: number;
  volatility?: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  premium: number;
  price?: number;
  lots: number;
  lotSize?: number;
  pnl?: number;
  createdAt?: string | Date;
  source?: 'Calculator' | 'Option Chain Upload' | 'Live MCX Feed' | 'REST API';
  notes?: string;
}

export interface OptionChainStrike {
  strike: number;
  call: {
    ltp: number;
    iv: number;
    oi: number;
    volume: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  put: {
    ltp: number;
    iv: number;
    oi: number;
    volume: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
}

export interface ExposureMetrics {
  deltaExposure: number; // net equivalent delta in currency
  gammaExposure: number; // net gamma risk
  thetaDecay: number;    // daily decay in currency
  vegaRisk: number;      // 1% volatility shock impact in currency
  netContracts: number;
  portfolioValue: number;
}

export interface AppSettings {
  pricingModel: PricingModel;
  riskFreeRate: number; // default %
  decimalPrecision: number;
  currency: 'INR' | 'USD';
  soundEnabled: boolean;
  deltaAlertThreshold: number;
  vegaAlertThreshold: number;
  theme: 'light' | 'dark' | 'system';
}

export interface ScenarioAnalysisRecord {
  id?: string;
  _id?: string;
  commodity: string;
  currentPrice: number;
  strike: number;
  optionType: 'CE' | 'PE' | 'CALL' | 'PUT';
  iv: number;
  daysToExpiry?: number;
  lots: number;
  lotSize?: number;
  movePoints: number;
  recalculatedGreeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    premium: number;
    intrinsicValue: number;
    extrinsicValue: number;
  };
  pnl: {
    currentPremium: number;
    futurePremium: number;
    premiumChange: number;
    pnlPerLot: number;
    pnlTotal: number;
    returnPercentage?: number;
  };
  createdAt: string | Date;
}

export type CalculationMode = 'auto' | 'manual' | 'screenshot';

export interface ManualGreeksState {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  pop: number;
  premium: number;
}

export interface MarketGreeksState {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  pop: number;
  premium: number;
  oi?: number;
  ltp?: number;
  source?: string; // e.g. 'Groww' | 'Zerodha' | 'Upstox' | 'TradingView' | 'Angel One' | 'Manual'
  timestamp?: string;
}

export interface GreekCalculationScenarioItem {
  priceMove: number;
  newPrice: number;
  premium: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  pnl: number;
}

export interface GreekCalculationRecord {
  id?: string;
  _id?: string;
  commodity: string;
  spotPrice: number;
  strike: number;
  optionType: 'CE' | 'PE';
  expiry: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  pop: number;
  premium: number;
  lots: number;
  scenarioAnalysis: GreekCalculationScenarioItem[];
  uploadedScreenshot?: string;
  createdAt: string | Date;
}

