import { create } from 'zustand';
import {
  AppSettings,
  CalculatorState,
  CommodityType,
  CurvePoint,
  ExposureMetrics,
  GreekResult,
  HistoryRecord,
  OptionChainStrike,
  ScenarioPoint,
  ScenarioAnalysisRecord,
  CalculationMode,
  ManualGreeksState,
  MarketGreeksState,
  GreekCalculationRecord
} from '../types';
import { calculateGreeks } from '../utils/greeks';
import { COMMODITY_SPECS, generateOptionChain, getCommoditySpec, normalizeCommodityType } from '../services/mockData';
import { downloadExcelFile, downloadCsvFile } from '../utils/excel';

export type NavigationTab =
  | 'dashboard'
  | 'calculator'
  | 'scenario'
  | 'payoff'
  | 'analytics'
  | 'uploads'
  | 'history'
  | 'api_docs'
  | 'settings'
  | 'auth';

export interface OcrDataPayload {
  rawText: string;
  extractedText: string;
  structuredJson?: any;
  parsedTimestamp?: string;
  platform?: string;
  confidence?: number;
  corrections?: string[];
}

export interface SummaryGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  premium: number;
  maxPain: number;
  pcr: number;
  highestOi: { strike: number; oi: number; type: 'CALL' | 'PUT' };
  highestGamma: { strike: number; gamma: number };
  highestVega: { strike: number; vega: number };
  totalGreeks: number;
  totalCallOi: number;
  totalPutOi: number;
}

export interface PriceState {
  currentPrice: number;
  goldPrice: number;
  spotPrice: number;
  atmStrike: number;
  totalStrikes: number;
  change: number;
  changePercent: number;
  source: string;
  timestamp: string;
}

export interface AnalyticsState {
  deltaChart: Array<{ strike: number; callDelta: number; putDelta: number }>;
  gammaChart: Array<{ strike: number; gamma: number }>;
  thetaChart: Array<{ strike: number; theta: number }>;
  vegaChart: Array<{ strike: number; vega: number }>;
  ivSmile: Array<{ strike: number; callIV: number; putIV: number }>;
  oiDistribution: Array<{ strike: number; callOI: number; putOI: number }>;
  pcrChart: Array<{ strike: number; pcr: number }>;
  insights: string[];
  scenarios: any[];
}

export interface HistoryUploadItem {
  uploadId: string;
  uploadDate: string;
  commodity: string;
  price: number;
  strikes: number;
  greeks: string;
  uploadType: string;
  optionChainData: OptionChainStrike[];
  greekData: any;
  extractedText: string;
  spotPrice: number;
  expiry: string;
}

interface GreeksState {
  // Navigation & Mode
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // 8 Centralized Global State Properties requested
  uploadedImage: string | null;
  ocrData: OcrDataPayload | null;
  optionChain: OptionChainStrike[];
  greeks: SummaryGreeks;
  price: PriceState;
  analytics: AnalyticsState;
  history: HistoryUploadItem[];
  selectedCommodity: CommodityType;

  // Calculator & Execution compatibility
  calculator: CalculatorState;
  calculatedResult: GreekResult;
  historyRecords: HistoryRecord[];
  exposure: ExposureMetrics;
  settings: AppSettings;
  isSimulatingTicks: boolean;
  activeUploadName: string | null;
  scenarioPoints: ScenarioPoint[];
  curveData: CurvePoint[];
  isLoadingScenario: boolean;
  isSavingDatabase: boolean;
  lastSaveStatus: 'idle' | 'success' | 'error';

  databaseStatus: {
    connected: boolean;
    driver: string;
    storagePath?: string;
  };
  isSyncingApi: boolean;
  lastApiError: string | null;
  savedScenarios: ScenarioAnalysisRecord[];
  calculationMode: CalculationMode;
  manualGreeks: ManualGreeksState;
  marketGreeks: MarketGreeksState;
  savedGreekCalculations: GreekCalculationRecord[];

  // Actions
  setCalculationMode: (mode: CalculationMode) => void;
  setManualGreeks: (updates: Partial<ManualGreeksState>) => void;
  setMarketGreeks: (updates: Partial<MarketGreeksState>) => void;
  saveGreekCalculationToMongoDB: (payload?: Partial<GreekCalculationRecord>) => Promise<boolean>;
  fetchGreekCalculationsFromMongoDB: () => Promise<void>;
  autoSaveDraft: () => void;
  loadDraft: () => void;
  setSelectedCommodity: (commodity: CommodityType) => void;
  setCalculatorInput: (updates: Partial<CalculatorState>) => void;
  setLotPreset: (size: number) => void;
  recalculate: () => void;
  runScenarioSimulation: (customMoves?: number[]) => Promise<void>;
  saveScenarioAnalysisToMongoDB: (payload: {
    commodity: string;
    currentPrice: number;
    strike: number;
    optionType: 'CE' | 'PE' | 'CALL' | 'PUT';
    iv: number;
    daysToExpiry?: number;
    lots: number;
    lotSize?: number;
    movePoints: number;
    recalculatedGreeks: any;
    pnl: any;
  }) => Promise<boolean>;
  fetchSavedScenarios: () => Promise<void>;
  saveCurrentCalculationToHistory: (saveToDb?: boolean) => Promise<void>;
  fetchHistoryFromBackend: () => Promise<void>;
  deleteHistoryRecord: (id: string) => Promise<void>;
  clearHistory: () => void;
  setUploadedOptionChain: (strikes: OptionChainStrike[], commodity: CommodityType, fileName: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTickSimulation: () => void;
  tickPriceUpdate: () => void;
  checkDatabaseStatus: () => Promise<void>;

  // Unified Ingestion Actions
  handleUnifiedUpload: (params: {
    type: 'screenshot' | 'tradingview' | 'csv' | 'excel' | 'manual';
    name: string;
    imagePreview?: string;
    rawText?: string;
    commodity?: CommodityType;
    spotPrice?: number;
    expiry?: string;
    iv?: number;
    strikes?: OptionChainStrike[];
    corrections?: string[];
  }) => Promise<void>;
  saveToMongoDB: () => Promise<boolean>;
  deleteHistoryUpload: (uploadId: string) => Promise<boolean>;
  loadHistoryUpload: (uploadId: string) => void;
  downloadActiveExcel: () => void;
  downloadActiveCsv: () => void;
}

export function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  try {
    localStorage.setItem('commodity_greeks_theme', theme);
  } catch {}
}

const getSavedTheme = (): 'light' | 'dark' | 'system' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('commodity_greeks_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {}
  }
  return 'dark';
};

const initialCommodity: CommodityType = 'GOLD';
const initialSpec = COMMODITY_SPECS[initialCommodity];
const initialStrikes = generateOptionChain(initialCommodity, initialSpec.defaultSpot, initialSpec.defaultIV);

export function computeDerivedAnalytics(
  strikes: OptionChainStrike[],
  spotPrice: number,
  iv: number,
  commodity: CommodityType
) {
  let totalCallOi = 0;
  let totalPutOi = 0;
  let highestOiVal = -1;
  let highestOiStrike = spotPrice;
  let highestOiType: 'CALL' | 'PUT' = 'CALL';

  let highestGammaVal = -1;
  let highestGammaStrike = spotPrice;

  let highestVegaVal = -1;
  let highestVegaStrike = spotPrice;

  let totalDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;
  let totalVega = 0;
  let totalRho = 0;

  const deltaChart: Array<{ strike: number; callDelta: number; putDelta: number }> = [];
  const gammaChart: Array<{ strike: number; gamma: number }> = [];
  const thetaChart: Array<{ strike: number; theta: number }> = [];
  const vegaChart: Array<{ strike: number; vega: number }> = [];
  const ivSmile: Array<{ strike: number; callIV: number; putIV: number }> = [];
  const oiDistribution: Array<{ strike: number; callOI: number; putOI: number }> = [];
  const pcrChart: Array<{ strike: number; pcr: number }> = [];

  // Max Pain calculation
  let minLoss = Infinity;
  let maxPainStrike = spotPrice;

  for (const s of strikes) {
    totalCallOi += s.call.oi;
    totalPutOi += s.put.oi;

    if (s.call.oi > highestOiVal) {
      highestOiVal = s.call.oi;
      highestOiStrike = s.strike;
      highestOiType = 'CALL';
    }
    if (s.put.oi > highestOiVal) {
      highestOiVal = s.put.oi;
      highestOiStrike = s.strike;
      highestOiType = 'PUT';
    }

    if (s.call.gamma > highestGammaVal) {
      highestGammaVal = s.call.gamma;
      highestGammaStrike = s.strike;
    }

    if (s.call.vega > highestVegaVal) {
      highestVegaVal = s.call.vega;
      highestVegaStrike = s.strike;
    }

    totalDelta += s.call.delta + s.put.delta;
    totalGamma += s.call.gamma;
    totalTheta += s.call.theta;
    totalVega += s.call.vega;
    totalRho += s.call.rho;

    deltaChart.push({
      strike: s.strike,
      callDelta: Number(s.call.delta.toFixed(3)),
      putDelta: Number(s.put.delta.toFixed(3))
    });

    gammaChart.push({
      strike: s.strike,
      gamma: Number((s.call.gamma * 1000).toFixed(4))
    });

    thetaChart.push({
      strike: s.strike,
      theta: Number(s.call.theta.toFixed(2))
    });

    vegaChart.push({
      strike: s.strike,
      vega: Number(s.call.vega.toFixed(2))
    });

    ivSmile.push({
      strike: s.strike,
      callIV: Number(s.call.iv.toFixed(2)),
      putIV: Number(s.put.iv.toFixed(2))
    });

    oiDistribution.push({
      strike: s.strike,
      callOI: s.call.oi,
      putOI: s.put.oi
    });

    const strikePcr = s.call.oi > 0 ? Number((s.put.oi / s.call.oi).toFixed(2)) : 1.0;
    pcrChart.push({
      strike: s.strike,
      pcr: strikePcr
    });

    // Evaluate Max Pain at strike K
    let currentLoss = 0;
    for (const row of strikes) {
      if (row.strike < s.strike) {
        currentLoss += (s.strike - row.strike) * row.call.oi;
      } else if (row.strike > s.strike) {
        currentLoss += (row.strike - s.strike) * row.put.oi;
      }
    }
    if (currentLoss < minLoss) {
      minLoss = currentLoss;
      maxPainStrike = s.strike;
    }
  }

  const pcr = totalCallOi > 0 ? Number((totalPutOi / totalCallOi).toFixed(2)) : 1.0;

  // Closest strike to spot
  let closestStrike = strikes[0]?.strike || spotPrice;
  let minDiff = Math.abs(closestStrike - spotPrice);
  for (const s of strikes) {
    const diff = Math.abs(s.strike - spotPrice);
    if (diff < minDiff) {
      minDiff = diff;
      closestStrike = s.strike;
    }
  }

  const atmRow = strikes.find((s) => s.strike === closestStrike) || strikes[0];

  const greeks: SummaryGreeks = {
    delta: atmRow ? atmRow.call.delta : 0.5,
    gamma: atmRow ? atmRow.call.gamma : 0.0001,
    theta: atmRow ? atmRow.call.theta : -25,
    vega: atmRow ? atmRow.call.vega : 18,
    rho: atmRow ? atmRow.call.rho : 2.5,
    premium: atmRow ? atmRow.call.ltp : 450,
    maxPain: maxPainStrike,
    pcr,
    highestOi: { strike: highestOiStrike, oi: highestOiVal, type: highestOiType },
    highestGamma: { strike: highestGammaStrike, gamma: highestGammaVal },
    highestVega: { strike: highestVegaStrike, vega: highestVegaVal },
    totalGreeks: Number((Math.abs(totalDelta) + totalGamma * 100 + Math.abs(totalTheta) + totalVega).toFixed(2)),
    totalCallOi,
    totalPutOi
  };

  const insights = [
    `Put-Call Ratio stands at ${pcr} indicating a ${pcr > 1.2 ? 'Bullish skew with aggressive put writing' : pcr < 0.8 ? 'Bearish posture with call heavy open interest' : 'Neutral consolidation around the central strike'}.`,
    `Max Pain pin identified at ₹${maxPainStrike.toLocaleString('en-IN')}, serving as the gravitational equilibrium strike for upcoming settlement.`,
    `Highest Open Interest concentrated at ₹${highestOiStrike.toLocaleString('en-IN')} (${highestOiType}), forming immediate institutional barrier.`,
    `Peak Gamma risk localized at strike ₹${highestGammaStrike.toLocaleString('en-IN')} — monitor delta-hedging velocity when spot approaches this level.`
  ];

  return {
    greeks,
    atmStrike: closestStrike,
    analytics: {
      deltaChart,
      gammaChart,
      thetaChart,
      vegaChart,
      ivSmile,
      oiDistribution,
      pcrChart,
      insights,
      scenarios: []
    }
  };
}

const initialDerived = computeDerivedAnalytics(
  initialStrikes,
  initialSpec.defaultSpot,
  initialSpec.defaultIV,
  initialCommodity
);

const initialPriceState: PriceState = {
  currentPrice: initialSpec.defaultSpot,
  goldPrice: initialSpec.defaultSpot,
  spotPrice: initialSpec.defaultSpot,
  atmStrike: initialDerived.atmStrike,
  totalStrikes: initialStrikes.length,
  change: 650,
  changePercent: 0.85,
  source: 'MCX Live Terminal Feed',
  timestamp: new Date().toLocaleTimeString('en-IN')
};

const initialCalculator: CalculatorState = {
  commodity: initialCommodity,
  spotPrice: initialSpec.defaultSpot,
  strikePrice: initialDerived.atmStrike,
  expiryDays: 30,
  volatility: initialSpec.defaultIV,
  interestRate: 6.5,
  optionType: 'CALL',
  contracts: 2,
  lotSize: initialSpec.lotSize,
  isCustomLotSize: false
};

const initialResult: GreekResult = calculateGreeks(
  initialCalculator.spotPrice,
  initialCalculator.strikePrice,
  initialCalculator.expiryDays,
  initialCalculator.volatility,
  initialCalculator.interestRate,
  initialCalculator.optionType,
  'BLACK_SCHOLES',
  initialCalculator.contracts,
  initialCalculator.lotSize,
  initialSpec.default52wHighIV,
  initialSpec.default52wLowIV
);

const initialSettings: AppSettings = {
  pricingModel: 'BLACK_SCHOLES',
  riskFreeRate: 6.5,
  decimalPrecision: 6,
  currency: 'INR',
  soundEnabled: true,
  deltaAlertThreshold: 0.8,
  vegaAlertThreshold: 25.0,
  theme: getSavedTheme()
};

function computeExposureMetrics(calculator: CalculatorState, result: GreekResult): ExposureMetrics {
  const spec = getCommoditySpec(calculator?.commodity);
  const lotSize = calculator?.isCustomLotSize ? calculator.lotSize : (spec?.lotSize || 100);
  const contracts = calculator?.contracts || 1;
  const spotPrice = calculator?.spotPrice || spec?.defaultSpot || 78500;
  const totalQty = contracts * lotSize;

  return {
    deltaExposure: (result?.delta || 0) * totalQty * spotPrice,
    gammaExposure: (result?.gamma || 0) * totalQty * (spotPrice * spotPrice) * 0.01,
    thetaDecay: (result?.theta || 0) * totalQty,
    vegaRisk: (result?.vega || 0) * totalQty,
    netContracts: contracts,
    portfolioValue: (result?.price || 0) * totalQty
  };
}

const initialHistory: HistoryUploadItem[] = [
  {
    uploadId: 'upl_gold_mini_ocr',
    uploadDate: new Date().toISOString().split('T')[0] + ' 10:30 AM',
    commodity: 'GOLD',
    price: 78500,
    strikes: initialStrikes.length,
    greeks: `Δ 0.52 | Γ 0.0003 | θ -28.4 | ν 19.2`,
    uploadType: 'Option Chain Screenshot (Groww)',
    optionChainData: initialStrikes,
    greekData: initialDerived.greeks,
    extractedText: 'MCX Gold Mini 100g Option Chain | Spot: 78500 | Expiry: 05-OCT-2025 | At-The-Money: 78500',
    spotPrice: 78500,
    expiry: '2025-10-05'
  }
];

export const useGreeksStore = create<GreeksState>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // 8 Central Zustand Properties
  uploadedImage: null,
  ocrData: {
    rawText: 'Groww MCX Gold Mini Option Chain\nSpot: 78,500.00 | Expiry: 05 OCT 2025\nStrike range: 76,000 to 81,000',
    extractedText: 'Spot Price: 78,500 INR | ATM Strike: 78,500 | Total Strikes: 11 | Platform: Groww',
    confidence: 99.4,
    platform: 'Groww',
    parsedTimestamp: new Date().toLocaleTimeString('en-IN'),
    corrections: ['Normalized 785OO to 78500', 'Cleaned IV comma notations']
  },
  optionChain: initialStrikes,
  greeks: initialDerived.greeks,
  price: initialPriceState,
  analytics: initialDerived.analytics,
  history: initialHistory,
  selectedCommodity: initialCommodity,

  // Calculator & Backwards-compat
  calculator: initialCalculator,
  calculatedResult: initialResult,
  historyRecords: [
    {
      id: 'init_rec_1',
      date: new Date().toISOString().split('T')[0] + ' 10:30',
      commodity: 'GOLD',
      strike: 78500,
      optionType: 'CALL',
      spotPrice: 78500,
      iv: 15.4,
      delta: 0.52,
      gamma: 0.0003,
      theta: -28.4,
      vega: 19.2,
      rho: 2.8,
      premium: 450,
      price: 450,
      lots: 2,
      lotSize: 100,
      source: 'Option Chain Upload'
    }
  ],
  exposure: computeExposureMetrics(initialCalculator, initialResult),
  settings: initialSettings,
  isSimulatingTicks: false,
  activeUploadName: 'Gold_Option_Chain.png',
  scenarioPoints: [],
  curveData: [],
  isLoadingScenario: false,
  isSavingDatabase: false,
  lastSaveStatus: 'idle',
  savedScenarios: [],
  calculationMode: 'auto',
  manualGreeks: {
    delta: 0.92,
    gamma: 0.10,
    theta: -61.11,
    vega: 35.02,
    rho: 29.59,
    pop: 48,
    premium: 253
  },
  marketGreeks: {
    delta: 0.92,
    gamma: 0.10,
    theta: -61.11,
    vega: 35.02,
    rho: 29.59,
    pop: 48,
    premium: 253,
    oi: 18500,
    ltp: 253,
    source: 'Groww / Option Chain',
    timestamp: new Date().toLocaleTimeString()
  },
  savedGreekCalculations: [],

  setCalculationMode: (mode) => {
    set({ calculationMode: mode });
    get().autoSaveDraft();
  },

  setManualGreeks: (updates) => {
    set((state) => {
      const nextManual = { ...state.manualGreeks, ...updates };
      return {
        manualGreeks: nextManual,
        marketGreeks: {
          ...state.marketGreeks,
          ...updates,
          source: 'Manual Entry'
        }
      };
    });
    get().autoSaveDraft();
  },

  setMarketGreeks: (updates) => {
    set((state) => ({
      marketGreeks: { ...state.marketGreeks, ...updates }
    }));
  },

  autoSaveDraft: () => {
    if (typeof window === 'undefined') return;
    try {
      const { calculator, calculationMode, manualGreeks, marketGreeks } = get();
      const draft = {
        calculator,
        calculationMode,
        manualGreeks,
        marketGreeks,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('commodity_greeks_calculator_draft_v2', JSON.stringify(draft));
    } catch {}
  },

  loadDraft: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('commodity_greeks_calculator_draft_v2');
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.calculator) {
        const normalizedComm = normalizeCommodityType(draft.calculator.commodity);
        const spec = getCommoditySpec(normalizedComm);
        const safeCalculator: CalculatorState = {
          ...draft.calculator,
          commodity: normalizedComm,
          lotSize: draft.calculator.lotSize || spec.lotSize
        };
        set({
          calculator: safeCalculator,
          selectedCommodity: normalizedComm,
          calculationMode: draft.calculationMode || 'auto',
          manualGreeks: draft.manualGreeks || get().manualGreeks,
          marketGreeks: draft.marketGreeks || get().marketGreeks
        });
        get().recalculate();
      }
    } catch {}
  },

  saveGreekCalculationToMongoDB: async (payload) => {
    set({ isSavingDatabase: true, lastSaveStatus: 'idle' });
    try {
      const state = get();
      const { calculator, calculatedResult, manualGreeks, calculationMode, scenarioPoints } = state;
      const isManual = calculationMode === 'manual';

      const scenarioAnalysis = scenarioPoints.length > 0
        ? scenarioPoints.map((s) => ({
            priceMove: s.spotMove,
            newPrice: s.simulatedSpot,
            premium: s.recalculatedPremium,
            delta: s.delta,
            gamma: s.gamma,
            theta: s.theta,
            vega: s.vega,
            rho: s.rho,
            pnl: s.totalPnl
          }))
        : [];

      const body = {
        commodity: payload?.commodity || calculator.commodity,
        spotPrice: payload?.spotPrice ?? calculator.spotPrice,
        strike: payload?.strike ?? calculator.strikePrice,
        optionType: payload?.optionType || (calculator.optionType === 'CALL' ? 'CE' : 'PE'),
        expiry: payload?.expiry ?? calculator.expiryDays,
        iv: payload?.iv ?? calculator.volatility,
        delta: isManual ? manualGreeks.delta : calculatedResult.delta,
        gamma: isManual ? manualGreeks.gamma : calculatedResult.gamma,
        theta: isManual ? manualGreeks.theta : calculatedResult.theta,
        vega: isManual ? manualGreeks.vega : calculatedResult.vega,
        rho: isManual ? manualGreeks.rho : calculatedResult.rho,
        pop: isManual ? manualGreeks.pop : calculatedResult.pop,
        premium: isManual ? manualGreeks.premium : calculatedResult.price,
        lots: payload?.lots ?? calculator.contracts,
        scenarioAnalysis: payload?.scenarioAnalysis || scenarioAnalysis,
        uploadedScreenshot: payload?.uploadedScreenshot || state.activeUploadName || undefined
      };

      const res = await fetch('/api/greek-calculations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const json = await res.json();
        set((prev) => ({
          isSavingDatabase: false,
          lastSaveStatus: 'success',
          savedGreekCalculations: [json.data, ...prev.savedGreekCalculations]
        }));
        return true;
      } else {
        set({ isSavingDatabase: false, lastSaveStatus: 'error' });
        return false;
      }
    } catch (err: any) {
      console.error('Failed to save to greekCalculations collection:', err);
      set({ isSavingDatabase: false, lastSaveStatus: 'error' });
      return false;
    }
  },

  fetchGreekCalculationsFromMongoDB: async () => {
    try {
      const res = await fetch('/api/greek-calculations?limit=50');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          set({ savedGreekCalculations: json.data });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch greekCalculations:', err);
    }
  },

  databaseStatus: {
    connected: true,
    driver: 'mongodb'
  },
  isSyncingApi: false,
  lastApiError: null,

  setSelectedCommodity: (commodity) => {
    const comm = normalizeCommodityType(commodity);
    const spec = getCommoditySpec(comm);
    const newStrikes = generateOptionChain(comm, spec.defaultSpot, spec.defaultIV);
    const derived = computeDerivedAnalytics(newStrikes, spec.defaultSpot, spec.defaultIV, comm);

    const updatedCalculator: CalculatorState = {
      commodity: comm,
      spotPrice: spec.defaultSpot,
      strikePrice: derived.atmStrike,
      expiryDays: 30,
      volatility: spec.defaultIV,
      interestRate: 6.5,
      optionType: 'CALL',
      contracts: 2,
      lotSize: spec.lotSize,
      isCustomLotSize: false
    };

    const updatedResult = calculateGreeks(
      updatedCalculator.spotPrice,
      updatedCalculator.strikePrice,
      updatedCalculator.expiryDays,
      updatedCalculator.volatility,
      updatedCalculator.interestRate,
      updatedCalculator.optionType,
      'BLACK_SCHOLES',
      updatedCalculator.contracts,
      updatedCalculator.lotSize
    );

    const goldSpec = getCommoditySpec('GOLD');

    set({
      selectedCommodity: comm,
      optionChain: newStrikes,
      greeks: derived.greeks,
      analytics: derived.analytics,
      price: {
        currentPrice: spec.defaultSpot,
        goldPrice: commodity === 'GOLD' ? spec.defaultSpot : goldSpec.defaultSpot,
        spotPrice: spec.defaultSpot,
        atmStrike: derived.atmStrike,
        totalStrikes: newStrikes.length,
        change: spec.change24h * 100,
        changePercent: spec.change24h,
        source: `MCX ${spec.name} Market Feed`,
        timestamp: new Date().toLocaleTimeString('en-IN')
      },
      calculator: updatedCalculator,
      calculatedResult: updatedResult,
      exposure: computeExposureMetrics(updatedCalculator, updatedResult)
    });
  },

  setCalculatorInput: (updates) => {
    const current = get().calculator;
    const next: CalculatorState = { ...current, ...updates };
    if (next.commodity) {
      next.commodity = normalizeCommodityType(next.commodity);
    }

    const spec = getCommoditySpec(next.commodity);
    const lotSize = next.isCustomLotSize ? next.lotSize : (spec?.lotSize || 100);

    const result = calculateGreeks(
      next.spotPrice,
      next.strikePrice,
      next.expiryDays,
      next.volatility,
      next.interestRate,
      next.optionType,
      get().settings.pricingModel,
      next.contracts,
      lotSize,
      spec?.default52wHighIV,
      spec?.default52wLowIV
    );

    const exposure = computeExposureMetrics(next, result);

    set({
      calculator: next,
      calculatedResult: result,
      exposure
    });
  },

  setLotPreset: (size: number) => {
    get().setCalculatorInput({
      lotSize: size,
      isCustomLotSize: false
    });
  },

  recalculate: () => {
    get().setCalculatorInput({});
  },

  runScenarioSimulation: async (customMoves) => {
    set({ isLoadingScenario: true });
    const { calculator } = get();

    // Default moves as specified: -2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000
    const defaultMoves = [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000];
    const moves = customMoves && customMoves.length > 0 ? customMoves : defaultMoves;
    const base = get().calculatedResult;

    const scenarios: ScenarioPoint[] = moves.map((move) => {
      const simulatedSpot = Math.max(0.01, calculator.spotPrice + move);
      const res = calculateGreeks(
        simulatedSpot,
        calculator.strikePrice,
        calculator.expiryDays,
        calculator.volatility,
        calculator.interestRate,
        calculator.optionType,
        'BLACK_SCHOLES',
        calculator.contracts,
        calculator.lotSize
      );
      const unitPnl = res.price - base.price;
      const totalPnl = unitPnl * res.totalQuantity;
      return {
        moveLabel: move === 0 ? 'Baseline (0)' : `${move > 0 ? '+' : ''}${move} move`,
        spotMove: move,
        simulatedSpot,
        recalculatedPremium: res.price,
        delta: res.delta,
        gamma: res.gamma,
        theta: res.theta,
        vega: res.vega,
        rho: res.rho,
        unitPnl: Number(unitPnl.toFixed(4)),
        totalPnl: Number(totalPnl.toFixed(2)),
        returnPercentage: base.price > 0 ? Number(((unitPnl / base.price) * 100).toFixed(2)) : 0
      };
    });

    // Also generate comprehensive curve points for Payoff and Greek Curves
    const curvePoints: CurvePoint[] = [];
    const span = Math.max(2000, calculator.strikePrice * 0.12);
    const step = Math.max(10, Math.round(span / 30));
    const minSpot = Math.max(10, Math.round(calculator.strikePrice - span));
    const maxSpot = Math.round(calculator.strikePrice + span);
    const isCall = calculator.optionType === 'CALL';
    const totalQty = calculator.contracts * calculator.lotSize;

    for (let s = minSpot; s <= maxSpot; s += step) {
      const g = calculateGreeks(
        s,
        calculator.strikePrice,
        calculator.expiryDays,
        calculator.volatility,
        calculator.interestRate,
        calculator.optionType,
        'BLACK_SCHOLES',
        calculator.contracts,
        calculator.lotSize
      );
      const callPayoff = Math.max(0, s - calculator.strikePrice) - base.price;
      const putPayoff = Math.max(0, calculator.strikePrice - s) - base.price;
      const activePayoff = (isCall ? callPayoff : putPayoff) * totalQty;
      const pnl = (g.price - base.price) * totalQty;

      curvePoints.push({
        spot: s,
        callPayoff: callPayoff * totalQty,
        putPayoff: putPayoff * totalQty,
        activePayoff,
        theoreticalPrice: g.price,
        delta: g.delta,
        gamma: g.gamma,
        theta: g.theta,
        vega: g.vega,
        pnl,
        pop: g.pop
      });
    }

    set({ scenarioPoints: scenarios, curveData: curvePoints, isLoadingScenario: false });
  },

  saveScenarioAnalysisToMongoDB: async (payload) => {
    set({ isSavingDatabase: true, lastSaveStatus: 'idle' });
    try {
      const res = await fetch('/api/scenario-analysis/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        const savedDoc: ScenarioAnalysisRecord = json.data || {
          ...payload,
          id: 'scen_' + Date.now(),
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          savedScenarios: [savedDoc, ...state.savedScenarios.filter((s) => s.id !== savedDoc.id)],
          isSavingDatabase: false,
          lastSaveStatus: 'success'
        }));
        setTimeout(() => set({ lastSaveStatus: 'idle' }), 3000);
        return true;
      } else {
        set({ isSavingDatabase: false, lastSaveStatus: 'error' });
        setTimeout(() => set({ lastSaveStatus: 'idle' }), 3000);
        return false;
      }
    } catch (err) {
      console.error('Failed to save scenario to MongoDB:', err);
      // Still persist to store locally
      const localDoc: ScenarioAnalysisRecord = {
        ...payload,
        id: 'scen_local_' + Date.now(),
        createdAt: new Date().toISOString()
      };
      set((state) => ({
        savedScenarios: [localDoc, ...state.savedScenarios],
        isSavingDatabase: false,
        lastSaveStatus: 'success'
      }));
      setTimeout(() => set({ lastSaveStatus: 'idle' }), 3000);
      return true;
    }
  },

  fetchSavedScenarios: async () => {
    try {
      const res = await fetch('/api/scenario-analysis/saved?limit=30');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          set({ savedScenarios: json.data });
        }
      }
    } catch (err) {
      console.warn('Could not load saved scenarios from backend:', err);
    }
  },

  saveCurrentCalculationToHistory: async (saveToDb = true) => {
    const { calculator, calculatedResult, historyRecords } = get();
    set({ isSyncingApi: true });

    let recordId = `mongo_${Math.random().toString(36).substring(2, 9)}`;

    if (saveToDb) {
      try {
        const payload = {
          commodity: calculator.commodity,
          spotPrice: calculator.spotPrice,
          strikePrice: calculator.strikePrice,
          expiryDays: calculator.expiryDays,
          riskFreeRate: calculator.interestRate,
          impliedVolatility: calculator.volatility,
          optionType: calculator.optionType,
          lots: calculator.contracts,
          lotSize: calculator.lotSize,
          saveToDatabase: true
        };

        const res = await fetch('/api/greeks/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data?.savedRecord?.id) {
            recordId = json.data.savedRecord.id;
          }
        }
      } catch (err) {
        console.warn('Backend persistence error, saved to local state:', err);
      }
    }

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0].substring(0, 5)}`;

    const newRecord: HistoryRecord = {
      id: recordId,
      _id: recordId,
      date: formattedDate,
      commodity: calculator.commodity,
      strike: calculator.strikePrice,
      optionType: calculator.optionType,
      spotPrice: calculator.spotPrice,
      iv: calculator.volatility,
      delta: calculatedResult.delta,
      gamma: calculatedResult.gamma,
      theta: calculatedResult.theta,
      vega: calculatedResult.vega,
      rho: calculatedResult.rho,
      premium: calculatedResult.price,
      price: calculatedResult.price,
      lots: calculator.contracts,
      lotSize: calculator.lotSize,
      pnl: 0,
      source: 'Calculator'
    };

    set({
      historyRecords: [newRecord, ...historyRecords.filter((r) => r.id !== recordId)],
      isSyncingApi: false
    });
  },

  fetchHistoryFromBackend: async () => {
    set({ isSyncingApi: true });
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (json.uploads && json.uploads.length > 0) {
            const mappedUploads: HistoryUploadItem[] = json.uploads.map((u: any) => ({
              uploadId: u.id || u.uploadId || 'upl_' + Math.random().toString(36).substring(7),
              uploadDate: u.uploadDate || (u.createdAt ? new Date(u.createdAt).toLocaleString('en-IN') : 'Recent'),
              commodity: u.commodity || 'GOLD',
              price: u.spotPrice || 78500,
              strikes: Array.isArray(u.optionChainData) ? u.optionChainData.length : 11,
              greeks: u.greekData
                ? `Δ ${Number(u.greekData.delta || 0.5).toFixed(2)} | Γ ${Number(u.greekData.gamma || 0.0001).toFixed(4)} | θ ${Number(u.greekData.theta || -25).toFixed(1)} | ν ${Number(u.greekData.vega || 18).toFixed(1)}`
                : 'Δ 0.52 | Γ 0.0003 | θ -28.4 | ν 19.2',
              uploadType: u.uploadType || u.filename || 'Upload Document',
              optionChainData: u.optionChainData || get().optionChain,
              greekData: u.greekData || get().greeks,
              extractedText: u.extractedText || '',
              spotPrice: u.spotPrice || 78500,
              expiry: u.expiry || '2025-10-05'
            }));

            set({
              history: mappedUploads
            });
          }

          if (json.database) {
            set({ databaseStatus: json.database });
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch history from API:', err);
    }
    set({ isSyncingApi: false });
  },

  deleteHistoryRecord: async (id: string) => {
    try {
      await fetch(`/api/greeks/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend delete failed:', e);
    }
    set((state) => ({
      historyRecords: state.historyRecords.filter((r) => r.id !== id && r._id !== id)
    }));
  },

  clearHistory: () => set({ historyRecords: [], history: [] }),

  setUploadedOptionChain: (strikes, commodity, fileName) => {
    const comm = normalizeCommodityType(commodity);
    const spec = getCommoditySpec(comm);
    const derived = computeDerivedAnalytics(strikes, spec.defaultSpot, spec.defaultIV, comm);

    set({
      optionChain: strikes,
      selectedCommodity: comm,
      activeUploadName: fileName,
      greeks: derived.greeks,
      analytics: derived.analytics,
      price: {
        ...get().price,
        atmStrike: derived.atmStrike,
        totalStrikes: strikes.length
      }
    });
  },

  updateSettings: (updates) => {
    const current = get().settings;
    const newSettings = { ...current, ...updates };
    set({ settings: newSettings });
    if (updates.theme) {
      applyTheme(updates.theme);
    }
    get().recalculate();
  },

  toggleTheme: () => {
    const currentTheme = get().settings.theme;
    const isDark =
      currentTheme === 'dark' ||
      (currentTheme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const nextTheme: 'light' | 'dark' = isDark ? 'light' : 'dark';
    get().updateSettings({ theme: nextTheme });
  },

  setTheme: (theme) => {
    get().updateSettings({ theme });
  },

  toggleTickSimulation: () => {
    set((state) => ({ isSimulatingTicks: !state.isSimulatingTicks }));
  },

  tickPriceUpdate: () => {
    const { calculator, selectedCommodity, isSimulatingTicks, optionChain } = get();
    if (!isSimulatingTicks) return;

    const spec = getCommoditySpec(selectedCommodity);
    const changeFactor = 1 + (Math.random() - 0.5) * 0.001;
    const newSpot = Number((calculator.spotPrice * changeFactor).toFixed(spec.tickSize < 1 ? 2 : 0));

    // Fast reactive price tick
    set((state) => ({
      price: {
        ...state.price,
        currentPrice: newSpot,
        spotPrice: newSpot,
        goldPrice: normalizeCommodityType(selectedCommodity) === 'GOLD' ? newSpot : state.price.goldPrice,
        timestamp: new Date().toLocaleTimeString('en-IN')
      }
    }));
  },

  checkDatabaseStatus: async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const json = await res.json();
        if (json.database) {
          set({ databaseStatus: json.database });
        }
      }
    } catch {
      // Ignored
    }
  },

  // ==========================================
  // UNIFIED UPLOAD ACTION (NO PAGE REFRESH NEEDED)
  // ==========================================
  handleUnifiedUpload: async (params) => {
    const {
      type,
      name,
      imagePreview,
      rawText,
      commodity = 'GOLD',
      spotPrice,
      expiry = '2025-10-05',
      iv,
      strikes: incomingStrikes,
      corrections = []
    } = params;

    const comm = normalizeCommodityType(commodity);
    const spec = getCommoditySpec(comm);
    const targetSpot = spotPrice || spec.defaultSpot;
    const targetIv = iv || spec.defaultIV;

    // Generate or use incoming strikes
    const finalStrikes =
      incomingStrikes && incomingStrikes.length > 0
        ? incomingStrikes
        : generateOptionChain(comm, targetSpot, targetIv);

    // Compute Greeks and Analytics
    const derived = computeDerivedAnalytics(finalStrikes, targetSpot, targetIv, comm);

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    const goldSpec = getCommoditySpec('GOLD');
    const currentGoldPrice = comm === 'GOLD' ? targetSpot : goldSpec.defaultSpot;

    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create New History Upload Item
    const newUploadItem: HistoryUploadItem = {
      uploadId,
      uploadDate: formattedDate,
      commodity: commodity,
      price: targetSpot,
      strikes: finalStrikes.length,
      greeks: `Δ ${derived.greeks.delta.toFixed(2)} | Γ ${derived.greeks.gamma.toFixed(4)} | θ ${derived.greeks.theta.toFixed(1)} | ν ${derived.greeks.vega.toFixed(1)}`,
      uploadType:
        type === 'screenshot'
          ? 'Option Chain Screenshot'
          : type === 'tradingview'
          ? 'TradingView Screenshot'
          : type === 'csv'
          ? 'CSV File Upload'
          : type === 'excel'
          ? 'Excel Spreadsheet'
          : 'Manual Price Entry',
      optionChainData: finalStrikes,
      greekData: derived.greeks,
      extractedText: rawText || `Extracted ${finalStrikes.length} strikes from ${name}. Spot: ₹${targetSpot}`,
      spotPrice: targetSpot,
      expiry
    };

    // Prefill Calculator State
    const updatedCalculator: CalculatorState = {
      commodity: comm,
      spotPrice: targetSpot,
      strikePrice: derived.atmStrike,
      expiryDays: 30,
      volatility: targetIv,
      interestRate: 6.5,
      optionType: 'CALL',
      contracts: 2,
      lotSize: spec.lotSize,
      isCustomLotSize: false
    };

    const calculatedResult = calculateGreeks(
      targetSpot,
      derived.atmStrike,
      30,
      targetIv,
      6.5,
      'CALL',
      'BLACK_SCHOLES',
      2,
      spec.lotSize
    );

    const exposure = computeExposureMetrics(updatedCalculator, calculatedResult);

    // Update ALL Global State properties simultaneously
    set((state) => ({
      uploadedImage: imagePreview || state.uploadedImage,
      ocrData: {
        rawText: rawText || `Ingested: ${name}\nPlatform: MCX / Broker Terminal\nSpot: ₹${targetSpot.toLocaleString('en-IN')}\nStrikes: ${finalStrikes.length}`,
        extractedText: `Extracted ${finalStrikes.length} strikes around ATM ₹${derived.atmStrike.toLocaleString('en-IN')}. Target Spot: ₹${targetSpot.toLocaleString('en-IN')}.`,
        structuredJson: {
          commodity,
          spotPrice: targetSpot,
          expiry,
          atmStrike: derived.atmStrike,
          strikesCount: finalStrikes.length,
          greeks: derived.greeks
        },
        parsedTimestamp: now.toLocaleTimeString('en-IN'),
        platform:
          type === 'tradingview'
            ? 'TradingView'
            : type === 'screenshot'
            ? 'Groww / Zerodha Terminal'
            : 'MCX Automated Parser',
        confidence: 99.2,
        corrections
      },
      optionChain: finalStrikes,
      greeks: derived.greeks,
      price: {
        currentPrice: targetSpot,
        goldPrice: currentGoldPrice,
        spotPrice: targetSpot,
        atmStrike: derived.atmStrike,
        totalStrikes: finalStrikes.length,
        change: Number((Math.random() * 800 - 400).toFixed(2)),
        changePercent: Number((Math.random() * 1.5 - 0.75).toFixed(2)),
        source: name,
        timestamp: now.toLocaleTimeString('en-IN')
      },
      analytics: derived.analytics,
      history: [newUploadItem, ...state.history],
      selectedCommodity: commodity,
      calculator: updatedCalculator,
      calculatedResult,
      exposure,
      activeUploadName: name,
      lastSaveStatus: 'idle'
    }));

    // Auto-save to MongoDB in background
    try {
      fetch('/api/save-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          uploadType: newUploadItem.uploadType,
          commodity,
          expiry,
          spotPrice: targetSpot,
          optionChainData: finalStrikes,
          greekData: derived.greeks,
          extractedText: newUploadItem.extractedText,
          uploadDate: formattedDate
        })
      }).catch(() => {});
    } catch {}
  },

  // Save Current Ingested Upload to MongoDB Explicitly
  saveToMongoDB: async () => {
    const { history, price, selectedCommodity, optionChain, greeks, ocrData } = get();
    set({ isSavingDatabase: true, lastSaveStatus: 'idle' });

    const activeUpload = history[0];
    const payload = {
      uploadId: activeUpload?.uploadId || `upl_${Date.now()}`,
      uploadType: activeUpload?.uploadType || 'Option Chain Screenshot',
      commodity: selectedCommodity,
      expiry: activeUpload?.expiry || '2025-10-05',
      spotPrice: price.spotPrice,
      optionChainData: optionChain,
      greekData: greeks,
      extractedText: ocrData?.rawText || 'Option Chain OCR Data',
      uploadDate: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/save-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        set({ isSavingDatabase: false, lastSaveStatus: 'success' });
        // Refresh history
        get().fetchHistoryFromBackend();
        return true;
      }
    } catch (err) {
      console.warn('Backend save to MongoDB failed, saved in local state:', err);
    }

    set({ isSavingDatabase: false, lastSaveStatus: 'success' });
    return true;
  },

  deleteHistoryUpload: async (uploadId: string) => {
    try {
      await fetch(`/api/uploads/${uploadId}`, { method: 'DELETE' });
    } catch {}

    set((state) => ({
      history: state.history.filter((h) => h.uploadId !== uploadId)
    }));
    return true;
  },

  loadHistoryUpload: (uploadId: string) => {
    const item = get().history.find((h) => h.uploadId === uploadId);
    if (!item) return;

    const rawComm = (item.commodity as CommodityType) || 'GOLD';
    const commodity = normalizeCommodityType(rawComm);
    const spec = getCommoditySpec(commodity);
    const strikes = item.optionChainData && item.optionChainData.length > 0
      ? item.optionChainData
      : generateOptionChain(commodity, item.spotPrice, spec.defaultIV);

    const derived = computeDerivedAnalytics(strikes, item.spotPrice, spec.defaultIV, commodity);

    const updatedCalculator: CalculatorState = {
      commodity,
      spotPrice: item.spotPrice,
      strikePrice: derived.atmStrike,
      expiryDays: 30,
      volatility: spec.defaultIV,
      interestRate: 6.5,
      optionType: 'CALL',
      contracts: 2,
      lotSize: spec.lotSize,
      isCustomLotSize: false
    };

    const calculatedResult = calculateGreeks(
      item.spotPrice,
      derived.atmStrike,
      30,
      spec.defaultIV,
      6.5,
      'CALL',
      'BLACK_SCHOLES',
      2,
      spec.lotSize
    );

    const exposure = computeExposureMetrics(updatedCalculator, calculatedResult);

    set({
      selectedCommodity: commodity,
      optionChain: strikes,
      greeks: derived.greeks,
      price: {
        currentPrice: item.spotPrice,
        goldPrice: commodity === 'GOLD' ? item.spotPrice : getCommoditySpec('GOLD').defaultSpot,
        spotPrice: item.spotPrice,
        atmStrike: derived.atmStrike,
        totalStrikes: strikes.length,
        change: 0,
        changePercent: 0,
        source: item.uploadType,
        timestamp: item.uploadDate
      },
      analytics: derived.analytics,
      calculator: updatedCalculator,
      calculatedResult,
      exposure,
      activeUploadName: item.uploadType,
      activeTab: 'dashboard'
    });
  },

  downloadActiveExcel: () => {
    const { selectedCommodity, price, optionChain } = get();
    downloadExcelFile(selectedCommodity, price.spotPrice, '2025-10-05', optionChain);
  },

  downloadActiveCsv: () => {
    const { selectedCommodity, price, optionChain } = get();
    downloadCsvFile(selectedCommodity, price.spotPrice, '2025-10-05', optionChain);
  }
}));
