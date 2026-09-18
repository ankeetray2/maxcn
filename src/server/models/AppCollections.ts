export interface UserDocument {
  id: string;
  _id?: string;
  username: string;
  name?: string;
  email: string;
  avatar?: string;
  role: 'trader' | 'analyst' | 'admin';
  authProvider?: 'google' | 'email';
  passwordHash?: string;
  createdAt: Date;
}

export interface UploadDocument {
  id: string;
  _id?: string;
  filename: string;
  originalName: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  sizeBytes: number;
  platform?: string; // Groww, Zerodha, Upstox, Angel One, MCX Terminal, TradingView, Generic
  commodity: string;
  expiry: string;
  spotPrice: number;
  status: 'pending' | 'processed' | 'failed';
  extractedStrikesCount: number;
  imageBase64Preview?: string;
  ocrMistakesCorrected?: string[];
  createdAt: Date;
}

export interface OptionChainRow {
  strike: number;
  call: {
    delta: number;
    theta: number;
    gamma: number;
    vega: number;
    rho: number;
    iv: number;
    oi: number;
    ltp: number;
    premium?: number;
  };
  put: {
    delta: number;
    theta: number;
    gamma: number;
    vega: number;
    rho: number;
    iv: number;
    oi: number;
    ltp: number;
    premium?: number;
  };
}

export interface OptionChainDocument {
  id: string;
  _id?: string;
  uploadId: string;
  commodity: string;
  expiry: string;
  spotPrice: number;
  futurePrice?: number;
  optionChain: OptionChainRow[];
  createdAt: Date;
}

export interface GreeksHistoryDocument {
  id: string;
  _id?: string;
  uploadId?: string;
  commodity: string;
  expiry: string;
  spotPrice: number;
  strike: number;
  call: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    iv: number;
    ltp: number;
    oi: number;
  };
  put: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    iv: number;
    ltp: number;
    oi: number;
  };
  createdAt: Date;
}

export interface ScenarioResultRow {
  scenarioLabel: string; // e.g. "+100", "+500", "+1000", "-100", "-500", "-1000"
  shift: number;
  simulatedSpot: number;
  atmStrike: number;
  call: {
    premium: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    pnl: number;
  };
  put: {
    premium: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    pnl: number;
  };
}

export interface AIInsightsData {
  highestGammaStrike: { strike: number; gamma: number; optionType: 'CALL' | 'PUT' };
  highestVegaStrike: { strike: number; vega: number; optionType: 'CALL' | 'PUT' };
  maxPain: number;
  atmStrike: number;
  itmStrikes: { call: number[]; put: number[] };
  otmStrikes: { call: number[]; put: number[] };
  supportZone: { strike: number; oi: number; description: string };
  resistanceZone: { strike: number; oi: number; description: string };
  pcr: number;
  totalCallOI: number;
  totalPutOI: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface AnalyticsChartsData {
  deltaCurve: Array<{ strike: number; callDelta: number; putDelta: number }>;
  gammaCurve: Array<{ strike: number; gamma: number }>;
  thetaCurve: Array<{ strike: number; callTheta: number; putTheta: number }>;
  vegaCurve: Array<{ strike: number; vega: number }>;
  ivSmile: Array<{ strike: number; callIV: number; putIV: number }>;
  oiDistribution: Array<{ strike: number; callOI: number; putOI: number }>;
  pcrChart: Array<{ strike: number; pcr: number }>;
}

export interface AnalyticsDocument {
  id: string;
  _id?: string;
  uploadId?: string;
  commodity: string;
  expiry: string;
  spotPrice: number;
  insights: AIInsightsData;
  scenarios: ScenarioResultRow[];
  chartData: AnalyticsChartsData;
  createdAt: Date;
}

export interface PriceHistoryDocument {
  id: string;
  _id?: string;
  commodity: string;
  currentPrice: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  source: 'manual' | 'screenshot' | 'option-chain' | 'csv' | 'excel';
  rawMetadata?: any;
  createdAt: Date;
}

export interface ScenarioAnalysisDocument {
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
  createdAt: Date;
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

export interface GreekCalculationDocument {
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
  createdAt: Date | string;
}
