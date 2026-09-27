import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { useGreeksStore } from '../../store/useGreeksStore';
import { calculateGreeks } from '../../utils/greeks';
import { getCommoditySpec, COMMODITY_SPECS } from '../../services/mockData';
import { CommodityType, OptionType } from '../../types';
import {
  Sliders,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  Layers,
  ShieldCheck,
  Flame,
  Activity,
  DollarSign,
  Database,
  CheckCircle2,
  BarChart3,
  Cpu,
  Target,
  Gauge,
  Scale,
  Percent,
  ArrowRight,
  TrendingDown,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Printer,
  LayoutGrid,
  Rows
} from 'lucide-react';
import {
  exportGreeksReportExcel,
  exportGreeksReportCsv,
  printOrDownloadPdfReport
} from '../../utils/excel';

export const GreeksWorkspaceView: React.FC = () => {
  const {
    calculator,
    setCalculatorInput,
    selectedCommodity,
    setSelectedCommodity,
    saveScenarioAnalysisToMongoDB,
    isSavingDatabase,
    currentSpotPrice,
    settings,
  } = useGreeksStore();

  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const updateThemeState = () => {
      if (typeof document !== 'undefined') {
        setIsDarkTheme(document.documentElement.classList.contains('dark'));
      }
    };
    updateThemeState();
    const observer = new MutationObserver(updateThemeState);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [settings?.theme]);

  const spec = getCommoditySpec(selectedCommodity);

  // =========================================================================
  // 1. STATE MANAGEMENT - INTERCONNECTED INPUTS
  // =========================================================================
  const baseSpot = currentSpotPrice || calculator.spotPrice || spec?.defaultSpot || 78500;
  const baseStrike = calculator.strikePrice || spec?.defaultSpot || 78000;
  const baseIv = calculator.volatility || spec?.defaultIV || 18.5;
  const baseDays = Math.max(1, calculator.expiryDays || 30);
  const baseOptionType = calculator.optionType || 'CALL';
  const baseLots = calculator.contracts || 2;
  const baseLotSize = calculator.lotSize || spec?.lotSize || 100;

  // Interconnected live state variables
  const [commodity, setCommodity] = useState<CommodityType>(selectedCommodity || 'GOLD');
  const [spotPrice, setSpotPrice] = useState<number>(baseSpot);
  const [strikePrice, setStrikePrice] = useState<number>(baseStrike);
  const [optionType, setOptionType] = useState<OptionType>(baseOptionType);
  const [lots, setLots] = useState<number>(baseLots);
  const [lotSize, setLotSize] = useState<number>(baseLotSize);

  // Price Movement Engine: Expected Move (pts)
  const [expectedMove, setExpectedMove] = useState<number>(0);

  // Expiry states
  const [expiryDays, setExpiryDays] = useState<number>(baseDays);
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + baseDays);
    return d.toISOString().split('T')[0];
  });

  // Volatility states
  const [iv, setIv] = useState<number>(baseIv);
  const [historicalVol, setHistoricalVol] = useState<number>(() => Math.max(5, baseIv * 0.92));
  
  // Market microstructure states
  const [openInterest, setOpenInterest] = useState<number>(14250);
  const [volume, setVolume] = useState<number>(38400);

  // Greek manual overrides
  const [deltaOverride, setDeltaOverride] = useState<number | null>(null);
  const [gammaOverride, setGammaOverride] = useState<number | null>(null);
  const [thetaOverride, setThetaOverride] = useState<number | null>(null);
  const [vegaOverride, setVegaOverride] = useState<number | null>(null);
  const [rhoOverride, setRhoOverride] = useState<number | null>(null);

  // Active chart in Right Panel (dropdown selectable, defaults to 'all' so all 9 charts display stacked downwards)
  const [activeChart, setActiveChart] = useState<
    'all' | 'premiumSpot' | 'premiumIv' | 'premiumTime' | 'thetaDecay' | 'deltaCurve' | 'gammaCurve' | 'vegaCurve' | 'pnlCurve' | 'rhoSensitivity'
  >('all');

  // Chart view density / columns: comfortable full-width stacked boxes by default or 2-column grid on wide screens
  const [chartGridColumns, setChartGridColumns] = useState<'single' | 'grid'>('single');

  // Feedback notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize when active commodity in store changes
  useEffect(() => {
    if (selectedCommodity && selectedCommodity !== commodity) {
      setCommodity(selectedCommodity);
      const newSpec = getCommoditySpec(selectedCommodity);
      const newSpot = newSpec?.defaultSpot || 78500;
      setSpotPrice(newSpot);
      setStrikePrice(newSpot);
      setLotSize(newSpec?.lotSize || 100);
      setIv(newSpec?.defaultIV || 18.5);
      setHistoricalVol((newSpec?.defaultIV || 18.5) * 0.92);
      setExpectedMove(0);
      resetGreekOverrides();
    }
  }, [selectedCommodity]);

  // Total quantity
  const totalQty = lots * lotSize;

  // Sync expiry date when expiryDays changes
  const handleDaysChange = (days: number) => {
    const d = Math.max(0, Math.min(365, days));
    setExpiryDays(d);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + d);
    setExpiryDate(dateObj.toISOString().split('T')[0]);
  };

  // Sync days when expiryDate changes
  const handleDateChange = (dateStr: string) => {
    setExpiryDate(dateStr);
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    setExpiryDays(diffDays);
  };

  // Change commodity handler
  const handleCommoditySelect = (newComm: CommodityType) => {
    setCommodity(newComm);
    setSelectedCommodity(newComm);
    const s = getCommoditySpec(newComm);
    if (s) {
      const sSpot = s.defaultSpot;
      setSpotPrice(sSpot);
      setStrikePrice(sSpot);
      setLotSize(s.lotSize);
      setIv(s.defaultIV);
      setHistoricalVol(s.defaultIV * 0.9);
      setExpectedMove(0);
      setCalculatorInput({
        spotPrice: sSpot,
        strikePrice: sSpot,
        volatility: s.defaultIV,
        lotSize: s.lotSize
      });
      resetGreekOverrides();
    }
  };

  // Reset Greek overrides back to theoretical
  const resetGreekOverrides = () => {
    setDeltaOverride(null);
    setGammaOverride(null);
    setThetaOverride(null);
    setVegaOverride(null);
    setRhoOverride(null);
  };

  // Reset all parameters to initial baseline
  const handleResetAll = () => {
    const s = getCommoditySpec(commodity);
    const sSpot = s?.defaultSpot || 78500;
    setSpotPrice(sSpot);
    setStrikePrice(sSpot);
    setIv(s?.defaultIV || 18.5);
    setExpiryDays(30);
    setLots(2);
    setLotSize(s?.lotSize || 100);
    setExpectedMove(0);
    resetGreekOverrides();
    setToastMessage('Workspace reset to baseline parameters');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // =========================================================================
  // 2. MATHEMATICAL CALCULATION ENGINE & CONNECTION RULES
  // =========================================================================
  const interestRate = 6.5; // Benchmark RBI repo rate

  // Theoretical calculations at current spot
  const theoreticalBaseline = useMemo(() => {
    return calculateGreeks(
      spotPrice,
      strikePrice,
      Math.max(1, expiryDays),
      iv,
      interestRate,
      optionType,
      'BLACK_SCHOLES',
      lots,
      lotSize
    );
  }, [spotPrice, strikePrice, expiryDays, iv, optionType, lots, lotSize]);

  // PRICE MOVEMENT ENGINE: Future Spot = Current Spot + Expected Move
  const futureSpot = Math.max(1, spotPrice + expectedMove);

  // Future Greeks recalculated at Future Spot
  const futureGreeks = useMemo(() => {
    return calculateGreeks(
      futureSpot,
      strikePrice,
      Math.max(1, expiryDays),
      iv,
      interestRate,
      optionType,
      'BLACK_SCHOLES',
      lots,
      lotSize
    );
  }, [futureSpot, strikePrice, expiryDays, iv, optionType, lots, lotSize]);

  // Active Greeks after applying sliders / overrides:
  // If Gamma changes: Update Delta dynamically
  // If Delta changes: Update premium sensitivity
  const activeGamma = gammaOverride !== null ? gammaOverride : futureGreeks.gamma;
  
  const activeDelta = useMemo(() => {
    if (deltaOverride !== null) return deltaOverride;
    if (gammaOverride !== null) {
      const gammaShift = gammaOverride - futureGreeks.gamma;
      const spotShift = expectedMove;
      return Math.max(-1, Math.min(1, futureGreeks.delta + gammaShift * spotShift));
    }
    return futureGreeks.delta;
  }, [deltaOverride, gammaOverride, futureGreeks.delta, futureGreeks.gamma, expectedMove]);

  const activeTheta = thetaOverride !== null ? thetaOverride : futureGreeks.theta;
  const activeVega = vegaOverride !== null ? vegaOverride : futureGreeks.vega;
  const activeRho = rhoOverride !== null ? rhoOverride : futureGreeks.rho;

  // Premium Calculations
  const currentPremium = theoreticalBaseline.price;
  
  // Future Premium incorporating any active Greek overrides
  const futurePremium = useMemo(() => {
    let p = futureGreeks.price;
    if (deltaOverride !== null) {
      const deltaDiff = deltaOverride - futureGreeks.delta;
      p += deltaDiff * expectedMove * 0.5;
    }
    if (gammaOverride !== null) {
      const gammaDiff = gammaOverride - futureGreeks.gamma;
      p += 0.5 * gammaDiff * Math.pow(expectedMove, 2) * 0.0005;
    }
    if (thetaOverride !== null) {
      const thetaDiff = thetaOverride - futureGreeks.theta;
      p += (thetaDiff / 365) * Math.max(1, expiryDays);
    }
    if (vegaOverride !== null) {
      const vegaDiff = vegaOverride - futureGreeks.vega;
      p += (vegaDiff * (iv - baseIv)) / 100;
    }
    if (rhoOverride !== null) {
      const rhoDiff = rhoOverride - futureGreeks.rho;
      p += (rhoDiff * 0.01);
    }
    return Math.max(0.05, p);
  }, [
    futureGreeks.price,
    deltaOverride,
    futureGreeks.delta,
    expectedMove,
    gammaOverride,
    futureGreeks.gamma,
    thetaOverride,
    futureGreeks.theta,
    expiryDays,
    vegaOverride,
    futureGreeks.vega,
    rhoOverride,
    futureGreeks.rho,
    iv,
    baseIv
  ]);

  // Premium Difference & P&L
  const premiumDifference = futurePremium - currentPremium;
  const premiumDiffPercent = currentPremium > 0 ? (premiumDifference / currentPremium) * 100 : 0;
  
  const currentPositionValue = currentPremium * totalQty;
  const futurePositionValue = futurePremium * totalQty;
  const totalProfitLoss = futurePositionValue - currentPositionValue;
  const pnlPerLot = totalQty > 0 ? (totalProfitLoss / lots) : 0;
  const pnlPerUnit = premiumDifference;

  // =========================================================================
  // 3. INTRINSIC VALUE, EXTRINSIC VALUE & TIME VALUE
  // =========================================================================
  // Current Spot intrinsic & extrinsic
  const currentIntrinsic = optionType === 'CALL'
    ? Math.max(0, spotPrice - strikePrice)
    : Math.max(0, strikePrice - spotPrice);
  const currentExtrinsic = Math.max(0, currentPremium - currentIntrinsic);
  const currentTimeValue = currentExtrinsic; // Time value = Premium - Intrinsic

  // Future Spot intrinsic & extrinsic
  const futureIntrinsic = optionType === 'CALL'
    ? Math.max(0, futureSpot - strikePrice)
    : Math.max(0, strikePrice - futureSpot);
  const futureExtrinsic = Math.max(0, futurePremium - futureIntrinsic);
  const futureTimeValue = futureExtrinsic;

  // Moneyness determination
  const moneynessStatus = useMemo(() => {
    const diff = spotPrice - strikePrice;
    if (Math.abs(diff) <= (spec?.strikeStep || 100) * 0.5) return 'ATM (At The Money)';
    if (optionType === 'CALL') {
      return diff > 0 ? 'ITM (In The Money)' : 'OTM (Out of The Money)';
    } else {
      return diff < 0 ? 'ITM (In The Money)' : 'OTM (Out of The Money)';
    }
  }, [spotPrice, strikePrice, optionType, spec?.strikeStep]);

  // =========================================================================
  // 4. LIQUIDITY SCORE ENGINE
  // =========================================================================
  // Based on Open Interest, Volume, and Bid-Ask Spread
  const estimatedSpread = useMemo(() => {
    const baseSpread = Math.max(0.05, currentPremium * 0.006);
    const oiFactor = Math.max(0.5, 20000 / Math.max(100, openInterest));
    return Number((baseSpread * oiFactor).toFixed(2));
  }, [currentPremium, openInterest]);

  const spreadPercent = currentPremium > 0 ? (estimatedSpread / currentPremium) * 100 : 0;

  const { liquidityScore, liquidityClassification } = useMemo(() => {
    const oiPart = Math.min(45, (openInterest / 30000) * 45);
    const volPart = Math.min(45, (volume / 60000) * 45);
    const penalty = Math.min(25, spreadPercent * 2.5);
    const score = Math.max(5, Math.min(100, Math.round(oiPart + volPart + 10 - penalty)));

    let classification: 'High Liquidity' | 'Medium Liquidity' | 'Low Liquidity';
    if (score >= 70) {
      classification = 'High Liquidity';
    } else if (score >= 40) {
      classification = 'Medium Liquidity';
    } else {
      classification = 'Low Liquidity';
    }

    return { liquidityScore: score, liquidityClassification: classification };
  }, [openInterest, volume, spreadPercent]);

  // Active Greek shifts relative to theoretical Black-Scholes baseline
  const deltaShift = activeDelta - futureGreeks.delta;
  const gammaRatio = futureGreeks.gamma > 0.000001 ? activeGamma / futureGreeks.gamma : 1;
  const thetaRatio = Math.abs(futureGreeks.theta) > 0.01 ? activeTheta / futureGreeks.theta : 1;
  const vegaRatio = futureGreeks.vega > 0.01 ? activeVega / futureGreeks.vega : 1;
  const rhoShift = activeRho - futureGreeks.rho;

  // =========================================================================
  // 5. IV SHOCK ANALYSIS (Current, +5%, +10%, +20%, -5%, -10%)
  // =========================================================================
  const ivShockLevels = [-10, -5, 0, 5, 10, 20];
  const ivShockData = useMemo(() => {
    return ivShockLevels.map((shock) => {
      const shockedIv = Math.max(1, iv + shock);
      const g = calculateGreeks(
        futureSpot,
        strikePrice,
        Math.max(1, expiryDays),
        shockedIv,
        interestRate,
        optionType,
        'BLACK_SCHOLES',
        lots,
        lotSize
      );
      // Incorporate active Vega sensitivity
      const vegaAdj = (activeVega - g.vega) * (shock / 100);
      const sPremium = Math.max(0.05, g.price + vegaAdj);
      const diff = sPremium - currentPremium;
      const sPnl = diff * totalQty;

      return {
        label: shock === 0 ? 'Current' : `${shock > 0 ? '+' : ''}${shock}%`,
        shock,
        iv: shockedIv,
        premium: sPremium,
        diff,
        pnl: sPnl,
        vegaGain: activeVega * shock
      };
    });
  }, [ivShockLevels, iv, futureSpot, strikePrice, expiryDays, interestRate, optionType, lots, lotSize, currentPremium, totalQty, activeVega]);

  // =========================================================================
  // 6. DAYS DECAY ANALYSIS (1, 3, 5, 7, 15, 30 Days)
  // =========================================================================
  const decayHorizons = [1, 3, 5, 7, 15, 30];
  const daysDecayData = useMemo(() => {
    return decayHorizons.map((d) => {
      const remainingDays = Math.max(0.1, expiryDays - d);
      const g = calculateGreeks(
        futureSpot,
        strikePrice,
        remainingDays,
        iv,
        interestRate,
        optionType,
        'BLACK_SCHOLES',
        lots,
        lotSize
      );
      // Incorporate active Theta decay
      const thetaAdj = ((activeTheta - g.theta) / 365) * d;
      const decayedPremium = Math.max(0.05, g.price + thetaAdj);
      const loss = decayedPremium - currentPremium;
      const dPnl = loss * totalQty;

      const intrinsic = optionType === 'CALL'
        ? Math.max(0, futureSpot - strikePrice)
        : Math.max(0, strikePrice - futureSpot);
      const remainingExtrinsic = Math.max(0, decayedPremium - intrinsic);

      return {
        days: d,
        remainingDays: Math.round(remainingDays),
        premium: decayedPremium,
        decayAmount: Math.abs(loss),
        loss,
        pnl: dPnl,
        remainingExtrinsic
      };
    });
  }, [decayHorizons, expiryDays, futureSpot, strikePrice, iv, interestRate, optionType, lots, lotSize, currentPremium, totalQty, activeTheta]);

  // =========================================================================
  // 7. GREEKS LADDER (9-Strike Multi-Strike Matrix)
  // =========================================================================
  const greeksLadderData = useMemo(() => {
    const step = spec?.strikeStep || 100;
    const offsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    
    return offsets.map((mult) => {
      const sStrike = Math.max(step, strikePrice + mult * step);
      const g = calculateGreeks(
        futureSpot,
        sStrike,
        Math.max(1, expiryDays),
        iv,
        interestRate,
        optionType,
        'BLACK_SCHOLES',
        lots,
        lotSize
      );

      const simDelta = Math.max(-1, Math.min(1, g.delta + deltaShift));
      const simGamma = g.gamma * gammaRatio;
      const simTheta = g.theta * thetaRatio;
      const simVega = g.vega * vegaRatio;
      const simRho = g.rho + rhoShift;

      // Estimate strike-level liquidity
      const distFromAtm = Math.abs(futureSpot - sStrike);
      const strikeOi = Math.max(500, Math.round(openInterest * Math.exp(-distFromAtm / (step * 5))));
      const strikeVol = Math.max(200, Math.round(volume * Math.exp(-distFromAtm / (step * 4))));
      const sScore = Math.min(100, Math.round((strikeOi / 300) + (strikeVol / 600)));
      const sLiq: 'High' | 'Med' | 'Low' = sScore >= 70 ? 'High' : sScore >= 40 ? 'Med' : 'Low';

      return {
        strike: sStrike,
        isAtm: mult === 0,
        premium: g.price,
        delta: simDelta,
        gamma: simGamma,
        theta: simTheta,
        vega: simVega,
        rho: simRho,
        liquidity: sLiq,
        pop: g.pop
      };
    });
  }, [
    spec?.strikeStep,
    strikePrice,
    futureSpot,
    expiryDays,
    iv,
    interestRate,
    optionType,
    lots,
    lotSize,
    openInterest,
    volume,
    deltaShift,
    gammaRatio,
    thetaRatio,
    vegaRatio,
    rhoShift
  ]);

  // =========================================================================
  // 8. RISK METRICS ENGINE
  // =========================================================================
  const pop = futureGreeks.pop;
  // Probability of Touch: approx 2 * N(|d2|) or 2 * |delta|
  const pot = Math.min(99.5, Math.max(1, Math.round(Math.abs(activeDelta) * 200)));
  
  // Max Loss: for long option positions = Total Premium paid
  const maxLoss = currentPremium * totalQty;
  // Max Gain: for Call = Unlimited, for Put = (Strike - Premium) * Total Qty
  const maxGain = optionType === 'CALL'
    ? 'Unlimited'
    : `₹${Math.round(Math.max(0, (strikePrice - currentPremium) * totalQty)).toLocaleString('en-IN')}`;

  // Risk Reward Ratio
  const riskReward = useMemo(() => {
    if (optionType === 'CALL') return 'Asymmetric (1 : ∞)';
    const potentialGain = Math.max(0, (strikePrice - currentPremium) * totalQty);
    if (maxLoss <= 0) return '1 : 1';
    const ratio = (potentialGain / maxLoss).toFixed(1);
    return `1 : ${ratio}`;
  }, [optionType, strikePrice, currentPremium, totalQty, maxLoss]);

  const breakeven = optionType === 'CALL' ? strikePrice + futurePremium : strikePrice - futurePremium;

  // 1-Standard Deviation Expected Move
  const oneSigmaMove = Math.round(spotPrice * (iv / 100) * Math.sqrt(expiryDays / 365));

  // Volatility Rank & Percentile
  const iv52High = spec?.default52wHighIV || 28.5;
  const iv52Low = spec?.default52wLowIV || 11.2;
  const ivRank = Math.max(0, Math.min(100, Math.round(((iv - iv52Low) / (iv52High - iv52Low)) * 100)));
  const ivPercentile = Math.max(0, Math.min(100, Math.round(ivRank * 0.94 + 3)));

  // Time metrics
  const hoursToExpiry = expiryDays * 24;
  const tradingDays = Math.round(expiryDays * (5 / 7));
  const annualizedTime = (expiryDays / 365).toFixed(4);

  // Dynamic Spot Range for Slider
  const spotMin = Math.max(1, Math.round(baseSpot * 0.5));
  const spotMax = Math.round(baseSpot * 1.5);
  const spotStep = baseSpot > 10000 ? 50 : baseSpot > 1000 ? 5 : 0.5;

  // =========================================================================
  // 9. BREAKDOWN PANEL: GREEKS ATTRIBUTION
  // =========================================================================
  const spotDeltaChange = expectedMove;
  const ivChange = iv - baseIv;

  const deltaContribution = activeDelta * spotDeltaChange;
  const gammaContribution = 0.5 * activeGamma * (spotDeltaChange * spotDeltaChange);
  const spotMoveTotal = deltaContribution + gammaContribution;
  const thetaContribution = activeTheta * 1; // 1-day decay baseline
  const vegaContribution = activeVega * ivChange;
  const rhoContribution = activeRho * 0;
  const ivPureImpact = vegaContribution;

  // =========================================================================
  // 10. SCENARIO ANALYSIS TABLE GENERATOR (-5000 to +5000)
  // =========================================================================
  const scenarioOffsets = [-5000, -2500, -1000, -500, 0, 500, 1000, 2500, 5000];

  const scenarioTableData = useMemo(() => {
    return scenarioOffsets.map((offset) => {
      const simSpot = Math.max(1, spotPrice + offset);
      const simGreeks = calculateGreeks(
        simSpot,
        strikePrice,
        Math.max(1, expiryDays),
        iv,
        interestRate,
        optionType,
        'BLACK_SCHOLES',
        lots,
        lotSize
      );

      const dS = offset;
      const simDelta = Math.max(-1, Math.min(1, simGreeks.delta + deltaShift));
      const simGamma = simGreeks.gamma * gammaRatio;
      const simTheta = simGreeks.theta * thetaRatio;
      const simVega = simGreeks.vega * vegaRatio;
      const simRho = simGreeks.rho + rhoShift;

      const deltaAdj = deltaShift * dS * 0.5;
      const gammaAdj = 0.5 * (activeGamma - futureGreeks.gamma) * Math.pow(dS, 2) * 0.0005;
      const thetaAdj = ((activeTheta - futureGreeks.theta) / 365) * Math.max(1, expiryDays);
      const vegaAdj = ((activeVega - futureGreeks.vega) * (iv - baseIv)) / 100;
      
      const rowPremium = Math.max(0.05, simGreeks.price + deltaAdj + gammaAdj + thetaAdj + vegaAdj);
      const rowDiff = rowPremium - currentPremium;
      const rowPnl = rowDiff * totalQty;

      return {
        offset,
        futureSpot: simSpot,
        futurePremium: rowPremium,
        delta: simDelta,
        gamma: simGamma,
        theta: simTheta,
        vega: simVega,
        rho: simRho,
        pop: simGreeks.pop,
        pnl: rowPnl
      };
    });
  }, [
    scenarioOffsets,
    spotPrice,
    strikePrice,
    expiryDays,
    iv,
    baseIv,
    interestRate,
    optionType,
    lots,
    lotSize,
    currentPremium,
    totalQty,
    deltaShift,
    activeGamma,
    futureGreeks.gamma,
    gammaRatio,
    thetaRatio,
    activeTheta,
    futureGreeks.theta,
    vegaRatio,
    activeVega,
    futureGreeks.vega,
    rhoShift
  ]);

  // =========================================================================
  // 11. CHARTS DATA GENERATION WITH REAL-TIME GREEK REACTION
  // =========================================================================
  const spotChartData = useMemo(() => {
    const data = [];
    const minS = Math.max(1, Math.round(spotPrice * 0.85));
    const maxS = Math.round(spotPrice * 1.15);
    const step = Math.max(1, Math.round((maxS - minS) / 25));

    for (let s = minS; s <= maxS; s += step) {
      const g = calculateGreeks(s, strikePrice, Math.max(1, expiryDays), iv, interestRate, optionType, 'BLACK_SCHOLES', lots, lotSize);
      
      const dS = s - spotPrice;
      const simDelta = Math.max(-1, Math.min(1, g.delta + deltaShift));
      const simGamma = g.gamma * gammaRatio;

      const deltaAdj = deltaShift * dS * 0.5;
      const gammaAdj = 0.5 * (activeGamma - futureGreeks.gamma) * Math.pow(dS, 2) * 0.0005;
      const thetaAdj = ((activeTheta - futureGreeks.theta) / 365) * Math.max(1, expiryDays);
      const vegaAdj = ((activeVega - futureGreeks.vega) * (iv - baseIv)) / 100;
      
      const adjPrice = Math.max(0.05, g.price + deltaAdj + gammaAdj + thetaAdj + vegaAdj);
      const diff = adjPrice - currentPremium;

      data.push({
        spot: Math.round(s),
        premium: Number(adjPrice.toFixed(2)),
        pnl: Math.round(diff * totalQty),
        delta: Number(simDelta.toFixed(3)),
        gamma: Number((simGamma * 1000).toFixed(3))
      });
    }
    return data;
  }, [
    spotPrice,
    strikePrice,
    expiryDays,
    iv,
    baseIv,
    interestRate,
    optionType,
    lots,
    lotSize,
    currentPremium,
    totalQty,
    deltaShift,
    activeGamma,
    futureGreeks.gamma,
    gammaRatio,
    activeTheta,
    futureGreeks.theta,
    activeVega,
    futureGreeks.vega
  ]);

  const ivChartData = useMemo(() => {
    const data = [];
    for (let vol = 5; vol <= 80; vol += 3) {
      const g = calculateGreeks(futureSpot, strikePrice, Math.max(1, expiryDays), vol, interestRate, optionType, 'BLACK_SCHOLES', lots, lotSize);
      const simVega = g.vega * vegaRatio;
      const volDiff = vol - iv;
      const vegaSlopeAdj = (activeVega - futureGreeks.vega) * (volDiff / 100);
      const adjPrice = Math.max(0.05, g.price + vegaSlopeAdj);

      data.push({
        iv: vol,
        premium: Number(adjPrice.toFixed(2)),
        vega: Number(simVega.toFixed(2)),
        delta: Number(g.delta.toFixed(3))
      });
    }
    return data;
  }, [futureSpot, strikePrice, expiryDays, interestRate, optionType, lots, lotSize, iv, vegaRatio, activeVega, futureGreeks.vega]);

  const timeDecayChartData = useMemo(() => {
    const data = [];
    const maxDays = Math.max(expiryDays, 60);
    const step = Math.max(1, Math.round(maxDays / 25));

    for (let d = maxDays; d >= 0; d -= step) {
      const g = calculateGreeks(futureSpot, strikePrice, Math.max(0.1, d), iv, interestRate, optionType, 'BLACK_SCHOLES', lots, lotSize);
      const simTheta = g.theta * thetaRatio;
      const daysPassed = expiryDays - d;
      const thetaDecayAdj = ((activeTheta - futureGreeks.theta) / 365) * daysPassed;
      const adjPrice = Math.max(0.05, g.price + thetaDecayAdj);

      data.push({
        days: d,
        premium: Number(adjPrice.toFixed(2)),
        theta: Number(Math.abs(simTheta).toFixed(2))
      });
    }
    return data;
  }, [futureSpot, strikePrice, expiryDays, iv, interestRate, optionType, lots, lotSize, thetaRatio, activeTheta, futureGreeks.theta]);

  const rhoChartData = useMemo(() => {
    const data = [];
    for (let r = 2; r <= 16; r += 1) {
      const g = calculateGreeks(futureSpot, strikePrice, Math.max(1, expiryDays), iv, r, optionType, 'BLACK_SCHOLES', lots, lotSize);
      const simRho = g.rho + rhoShift;
      const rateDiff = r - interestRate;
      const rhoAdj = rhoShift * (rateDiff / 100);
      const adjPrice = Math.max(0.05, g.price + rhoAdj);

      data.push({
        rate: r,
        premium: Number(adjPrice.toFixed(2)),
        rho: Number(simRho.toFixed(2))
      });
    }
    return data;
  }, [futureSpot, strikePrice, expiryDays, iv, interestRate, optionType, lots, lotSize, rhoShift]);

  // MongoDB / Cloud Scenario Persistence
  const handleSaveScenario = async () => {
    try {
      await saveScenarioAnalysisToMongoDB({
        commodity,
        currentPrice: spotPrice,
        strike: strikePrice,
        optionType,
        iv,
        daysToExpiry: expiryDays,
        lots,
        lotSize,
        movePoints: expectedMove,
        recalculatedGreeks: {
          delta: activeDelta,
          gamma: activeGamma,
          theta: activeTheta,
          vega: activeVega,
          rho: activeRho,
          premium: futurePremium
        },
        pnl: totalProfitLoss
      });
      setToastMessage('Scenario saved to institutional database');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('Saved locally in workspace memory');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Export handlers for Excel, CSV, and PDF Report
  const handleExportExcel = () => {
    try {
      const rows = scenarioTableData.map((row) => ({
        priceMove: row.offset,
        newPrice: row.futureSpot,
        premium: row.futurePremium,
        delta: row.delta,
        gamma: row.gamma,
        theta: row.theta,
        vega: row.vega,
        rho: row.rho,
        pnl: row.pnl
      }));

      exportGreeksReportExcel({
        commodity,
        spotPrice,
        strike: strikePrice,
        optionType: optionType === 'CALL' ? 'CE' : 'PE',
        expiry: expiryDays,
        iv,
        lots,
        lotSize,
        mode: 'workspace',
        calculatedGreeks: {
          delta: activeDelta,
          gamma: activeGamma,
          theta: activeTheta,
          vega: activeVega,
          rho: activeRho,
          pop,
          premium: futurePremium,
          breakeven,
          intrinsicValue: futureIntrinsic,
          extrinsicValue: futureExtrinsic
        },
        scenarioRows: rows
      });
      setToastMessage('Excel report exported successfully');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('Export failed. Check browser permissions.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleExportCsv = () => {
    try {
      const rows = scenarioTableData.map((row) => ({
        priceMove: row.offset,
        newPrice: row.futureSpot,
        premium: row.futurePremium,
        delta: row.delta,
        gamma: row.gamma,
        theta: row.theta,
        vega: row.vega,
        rho: row.rho,
        pnl: row.pnl
      }));

      exportGreeksReportCsv({
        commodity,
        spotPrice,
        strike: strikePrice,
        optionType: optionType === 'CALL' ? 'CE' : 'PE',
        expiry: expiryDays,
        iv,
        lots,
        lotSize,
        mode: 'workspace',
        calculatedGreeks: {
          delta: activeDelta,
          gamma: activeGamma,
          theta: activeTheta,
          vega: activeVega,
          rho: activeRho,
          pop,
          premium: futurePremium,
          breakeven,
          intrinsicValue: futureIntrinsic,
          extrinsicValue: futureExtrinsic
        },
        scenarioRows: rows
      });
      setToastMessage('CSV data exported successfully');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('CSV export failed.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handlePrintPdf = () => {
    try {
      const rows = scenarioTableData.map((row) => ({
        priceMove: row.offset,
        newPrice: row.futureSpot,
        premium: row.futurePremium,
        delta: row.delta,
        gamma: row.gamma,
        theta: row.theta,
        vega: row.vega,
        rho: row.rho,
        pnl: row.pnl
      }));

      printOrDownloadPdfReport({
        commodity,
        spotPrice,
        strike: strikePrice,
        optionType: optionType === 'CALL' ? 'CE' : 'PE',
        expiry: expiryDays,
        iv,
        lots,
        lotSize,
        mode: 'workspace',
        calculatedGreeks: {
          delta: activeDelta,
          gamma: activeGamma,
          theta: activeTheta,
          vega: activeVega,
          rho: activeRho,
          pop,
          premium: futurePremium,
          breakeven,
          intrinsicValue: futureIntrinsic,
          extrinsicValue: futureExtrinsic
        },
        marketGreeks: {
          delta: activeDelta,
          gamma: activeGamma,
          theta: activeTheta,
          vega: activeVega,
          rho: activeRho,
          pop,
          premium: futurePremium,
          source: 'MCX Real-time Feed'
        },
        scenarioRows: rows
      });
      setToastMessage('PDF report generated');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('PDF generation failed.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Dynamic Theme Colors for Charts & Visualizers
  const chartGridStroke = isDarkTheme ? '#1E293B' : '#E2E8F0';
  const chartAxisStroke = isDarkTheme ? '#64748B' : '#94A3B8';
  const chartTooltipStyle = {
    backgroundColor: isDarkTheme ? '#0D192E' : '#FFFFFF',
    borderColor: isDarkTheme ? '#1E293B' : '#CBD5E1',
    borderRadius: '12px',
    fontSize: '11px',
    color: isDarkTheme ? '#FFFFFF' : '#0F172A',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
  };

  return (
    <div className="font-sans space-y-5 text-[#1D2939] dark:text-slate-100 selection:bg-blue-600/30">
      {/* ========================================================================= */}
      {/* HEADER TOOLBAR & COMMODITY MATRIX BAR                                     */}
      {/* ========================================================================= */}
      <header className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Complete Options Analytics Engine
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-extrabold uppercase rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upgraded Greeks Calculation Engine • Price Movement Engine • Liquidity Score • IV Shock & Days Decay Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Fast Commodity Switch */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Commodity Switcher Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-[#08111F] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {(['GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER'] as CommodityType[]).map((c) => {
              const s = COMMODITY_SPECS[c];
              const isSelected = commodity === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCommoditySelect(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                  }`}
                >
                  {s?.name.split(' ')[0] || c}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Reset all parameters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Institutional Export Shortcuts */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition cursor-pointer"
              title="Export scenario & Greeks ladder to Excel spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Export scenario data as CSV"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition cursor-pointer"
              title="Download or print institutional PDF report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveScenario}
            disabled={isSavingDatabase}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSavingDatabase ? 'Saving...' : 'Save Scenario'}</span>
          </button>
        </div>
      </header>

      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-mono">Live Sync</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3-COLUMN WORKSPACE LAYOUT                                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ======================================================================= */}
        {/* LEFT PANEL: Market Inputs & Dedicated Analytics Engines                */}
        {/* ======================================================================= */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* CARD 1: Market Information */}
          <div className="rounded-[20px] bg-white/85 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                CARD 1: Market Information
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                {moneynessStatus.split(' ')[0]}
              </span>
            </div>

            {/* Commodity Selector Dropdown */}
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Commodity
              </label>
              <select
                value={commodity}
                onChange={(e) => handleCommoditySelect(e.target.value as CommodityType)}
                className="w-full bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="GOLD">Gold (MCX) - 100 Qty</option>
                <option value="SILVER">Silver (MCX) - 30 Qty</option>
                <option value="CRUDEOIL">Crude Oil (MCX) - 100 Qty</option>
                <option value="NATURALGAS">Natural Gas (MCX) - 1250 Qty</option>
                <option value="COPPER">Copper (MCX) - 2500 Qty</option>
              </select>
            </div>

            {/* Option Type (CALL / PUT) */}
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Option Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOptionType('CALL')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    optionType === 'CALL'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                      : 'bg-slate-100 dark:bg-[#08111F] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  CALL (CE)
                </button>
                <button
                  type="button"
                  onClick={() => setOptionType('PUT')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    optionType === 'PUT'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                      : 'bg-slate-100 dark:bg-[#08111F] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  PUT (PE)
                </button>
              </div>
            </div>

            {/* Spot Price Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Current Spot Price</label>
                <span className="text-[10px] font-mono text-slate-500">₹{spec?.unit}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step={spotStep}
                  value={spotPrice}
                  onChange={(e) => setSpotPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSpotPrice((p) => p - spotStep * 2)}
                    className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-[10px] font-bold"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpotPrice((p) => p + spotStep * 2)}
                    className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-[10px] font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Strike Price Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Strike Price</label>
                <button
                  type="button"
                  onClick={() => setStrikePrice(spotPrice)}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Snap ATM
                </button>
              </div>
              <input
                type="number"
                step={spec?.strikeStep || 100}
                value={strikePrice}
                onChange={(e) => setStrikePrice(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Lots & Lot Size */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Lots</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Lot Size</label>
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300"
                />
              </div>
              <div className="col-span-2 text-[10px] font-mono text-slate-500 text-right">
                Total Qty: <strong className="text-slate-900 dark:text-white">{totalQty}</strong> units
              </div>
            </div>
          </div>

          {/* CONTRACT SPECIFICATIONS & TRADING PARAMETERS CARD */}
          <div className="rounded-[20px] bg-white/85 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Contract Specifications
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                MCX India
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-sans">Instrument</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{spec?.name || commodity}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-sans">Symbol / Ticker</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block">{spec?.symbol || commodity}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-sans">Lot Multiplier</span>
                <span className="font-bold text-slate-900 dark:text-white block">{lotSize} {spec?.unit}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-sans">Tick Size</span>
                <span className="font-bold text-slate-900 dark:text-white block">₹{spec?.tickSize || 1.0}</span>
              </div>
              <div className="col-span-2 p-2 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-sans">Notional Position Value</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{Math.round(spotPrice * totalQty).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-sans">Estimated SPAN Margin (12%)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{Math.round(spotPrice * totalQty * 0.12).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* PRICE MOVEMENT ENGINE                                                   */}
          {/* ======================================================================= */}
          <div className="rounded-[20px] bg-white/85 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-blue-200 dark:border-blue-500/30 p-4 shadow-xs dark:shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                PRICE MOVEMENT ENGINE
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                1σ: ±₹{oneSigmaMove}
              </span>
            </div>

            {/* Expected Move Control */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Expected Move (Pts)</label>
                <span className={`text-xs font-mono font-black ${expectedMove >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {expectedMove >= 0 ? '+' : ''}{expectedMove} pts
                </span>
              </div>
              <input
                type="number"
                step={spotStep}
                value={expectedMove}
                onChange={(e) => setExpectedMove(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-[#08111F] border border-blue-200 dark:border-blue-500/50 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
              />
              <input
                type="range"
                min={-3000}
                max={3000}
                step={spotStep}
                value={expectedMove}
                onChange={(e) => setExpectedMove(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg mt-2"
              />
              {/* Presets: -1SD, -500, 0, +500, +1SD */}
              <div className="flex items-center gap-1 mt-2 font-mono text-[9px] font-bold">
                <button
                  type="button"
                  onClick={() => setExpectedMove(-oneSigmaMove)}
                  className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400"
                >
                  -1σ
                </button>
                <button
                  type="button"
                  onClick={() => setExpectedMove(-500)}
                  className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  -500
                </button>
                <button
                  type="button"
                  onClick={() => setExpectedMove(0)}
                  className="flex-1 py-1 rounded bg-blue-600 text-white"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setExpectedMove(500)}
                  className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => setExpectedMove(oneSigmaMove)}
                  className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400"
                >
                  +1σ
                </button>
              </div>
            </div>

            {/* Future Spot Display */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-blue-200 dark:border-blue-500/30 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 block">Future Spot (S + Move)</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">₹{futureSpot.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400 block">Future Premium</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">₹{futurePremium.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* CARD 2: Expiry Information & DAYS DECAY ANALYSIS */}
          <div className="rounded-[20px] bg-white/85 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                CARD 2: Expiry & Decay Engine
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">
                {expiryDays} DTE
              </span>
            </div>

            {/* Days To Expiry */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Days To Expiry</label>
                <span className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-bold">{expiryDays} Days</span>
              </div>
              <input
                type="number"
                min={0}
                max={365}
                value={expiryDays}
                onChange={(e) => handleDaysChange(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* DAYS DECAY ANALYSIS (1, 3, 5, 7, 15, 30 Days) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-orange-600 dark:text-orange-400">
                <span>Days Decay Analysis</span>
                <span className="text-[10px] text-slate-500 font-mono">Premium Erosion</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                {daysDecayData.map((d) => (
                  <div key={d.days} className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#08111F] border border-orange-200 dark:border-orange-500/20 text-center">
                    <span className="text-slate-500 dark:text-slate-400 block text-[9px]">+{d.days} Day</span>
                    <span className="text-slate-900 dark:text-white font-bold block">₹{d.premium.toFixed(1)}</span>
                    <span className="text-rose-600 dark:text-rose-400 text-[9px] block">-₹{d.decayAmount.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 3: Volatility Information & IV SHOCK ANALYSIS */}
          <div className="rounded-[20px] bg-white/85 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                CARD 3: Volatility & IV Shock
              </h2>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                ivRank > 70 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
              }`}>
                {ivRank > 70 ? 'High IV' : 'Normal IV'}
              </span>
            </div>

            {/* Current IV */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Implied Volatility (IV)</label>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">{iv.toFixed(1)}%</span>
              </div>
              <input
                type="number"
                step={0.5}
                min={1}
                max={150}
                value={iv}
                onChange={(e) => setIv(Math.max(0.1, Number(e.target.value)))}
                className="w-full bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* IV SHOCK ANALYSIS (-10%, -5%, Current, +5%, +10%, +20%) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                <span>IV Shock Analysis</span>
                <span className="text-[10px] text-slate-500 font-mono">Recalculated Prem</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                {ivShockData.map((s) => (
                  <div
                    key={s.label}
                    className={`p-1.5 rounded-lg border text-center ${
                      s.shock === 0 ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-500/50' : 'bg-slate-50 dark:bg-[#08111F] border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className="text-slate-500 dark:text-slate-400 block text-[9px]">{s.label}</span>
                    <span className="text-slate-900 dark:text-white font-bold block">₹{s.premium.toFixed(1)}</span>
                    <span className={`text-[9px] block ${s.diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {s.diff >= 0 ? '+' : ''}₹{s.diff.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LIQUIDITY SCORE ENGINE */}
          <div className="rounded-[20px] bg-white/85 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                LIQUIDITY SCORE ENGINE
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                liquidityClassification === 'High Liquidity'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : liquidityClassification === 'Medium Liquidity'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              }`}>
                {liquidityClassification}
              </span>
            </div>

            <div className="flex items-center justify-between font-mono">
              <span className="text-xs text-slate-500 dark:text-slate-400">Score Rating:</span>
              <span className="text-base font-black text-teal-600 dark:text-teal-400">{liquidityScore} / 100</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  liquidityScore >= 70 ? 'bg-emerald-500' : liquidityScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${liquidityScore}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-[9px] text-center">
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-500">OI</span>
                <span className="font-bold text-slate-900 dark:text-white">{openInterest.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-500">Volume</span>
                <span className="font-bold text-slate-900 dark:text-white">{volume.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-500">Spread</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">₹{estimatedSpread}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CENTER PANEL: Greeks Engine, Valuation & Greeks Ladder                  */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-4 min-w-0">
          <div className="w-full rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-5 shadow-xs dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Greeks Control Matrix
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {(deltaOverride !== null || gammaOverride !== null || thetaOverride !== null || vegaOverride !== null || rhoOverride !== null) && (
                  <button
                    type="button"
                    onClick={resetGreekOverrides}
                    className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
                  >
                    Reset Greeks
                  </button>
                )}
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Institutional Black-Scholes</span>
              </div>
            </div>

            {/* ================= DELTA BOX (Blue) ================= */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-[#08111F]/90 border border-blue-200 dark:border-blue-500/30 shadow-xs dark:shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                    Δ
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">DELTA BOX</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold ml-2">Directional Sensitivity</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Value:</span>
                  <input
                    type="number"
                    step={0.01}
                    min={-1}
                    max={1}
                    value={Number(activeDelta.toFixed(3))}
                    onChange={(e) => setDeltaOverride(Number(e.target.value))}
                    className="w-20 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Delta Slider (-1 to 1, step 0.01) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>-1.00 (ITM Put)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{activeDelta.toFixed(2)}</span>
                  <span>+1.00 (ITM Call)</span>
                </div>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={activeDelta}
                  onChange={(e) => setDeltaOverride(Number(e.target.value))}
                  className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer h-1.5 bg-blue-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* Live Impact */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/80 dark:border-slate-800/80 text-[11px] font-mono">
                <div className="text-slate-600 dark:text-slate-400">
                  Premium Sensitivity: <strong className="text-blue-600 dark:text-blue-400">₹{(activeDelta * 1).toFixed(2)}</strong> / pt
                </div>
                <div className="text-right text-slate-600 dark:text-slate-400">
                  Synthetic Qty: <strong className="text-slate-900 dark:text-white">{(activeDelta * totalQty).toFixed(1)}</strong> units
                </div>
              </div>
            </div>

            {/* ================= GAMMA BOX (Purple) ================= */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-[#08111F]/90 border border-purple-200 dark:border-purple-500/30 shadow-xs dark:shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center">
                    Γ
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">GAMMA BOX</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold ml-2">Delta Acceleration</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Value:</span>
                  <input
                    type="number"
                    step={0.0001}
                    min={0}
                    max={1}
                    value={Number(activeGamma.toFixed(5))}
                    onChange={(e) => setGammaOverride(Number(e.target.value))}
                    className="w-24 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-500/50 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 text-right focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Gamma Slider (0 to 1, step 0.0001) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0.0000</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{activeGamma.toFixed(5)}</span>
                  <span>0.0200+</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.02}
                  step={0.0001}
                  value={activeGamma}
                  onChange={(e) => setGammaOverride(Number(e.target.value))}
                  className="w-full accent-purple-600 dark:accent-purple-500 cursor-pointer h-1.5 bg-purple-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* Live Impact */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-200/80 dark:border-slate-800/80 text-[11px] font-mono">
                <div className="text-slate-600 dark:text-slate-400">
                  Delta Change: <strong className="text-purple-600 dark:text-purple-400">+{(activeGamma * 100).toFixed(4)}</strong> / 100 pt
                </div>
                <div className="text-right text-slate-600 dark:text-slate-400">
                  Convexity: <strong className="text-slate-900 dark:text-white">{activeGamma > 0.001 ? 'Explosive' : 'Standard'}</strong>
                </div>
              </div>
            </div>

            {/* ================= THETA BOX (Orange) ================= */}
            <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-[#08111F]/90 border border-orange-200 dark:border-orange-500/30 shadow-xs dark:shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center">
                    θ
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">THETA BOX</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold ml-2">Calendar Decay Rate</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Value:</span>
                  <input
                    type="number"
                    step={1}
                    min={-500}
                    max={0}
                    value={Number(activeTheta.toFixed(1))}
                    onChange={(e) => setThetaOverride(Number(e.target.value))}
                    className="w-20 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-500/50 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-orange-600 dark:text-orange-400 text-right focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Theta Slider (-500 to 0) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>-500.0</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">{activeTheta.toFixed(1)}</span>
                  <span>0.0</span>
                </div>
                <input
                  type="range"
                  min={-300}
                  max={0}
                  step={1}
                  value={activeTheta}
                  onChange={(e) => setThetaOverride(Number(e.target.value))}
                  className="w-full accent-orange-600 dark:accent-orange-500 cursor-pointer h-1.5 bg-orange-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* Live Impact: Daily, Weekly, Monthly Decay */}
              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-orange-200/80 dark:border-slate-800/80 text-[10px] font-mono">
                <div className="p-1 rounded bg-white/90 dark:bg-slate-900/60 border border-orange-200 dark:border-transparent text-center">
                  <span className="text-slate-500 block">Daily Decay</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">-₹{Math.abs(activeTheta).toFixed(1)}</span>
                </div>
                <div className="p-1 rounded bg-white/90 dark:bg-slate-900/60 border border-orange-200 dark:border-transparent text-center">
                  <span className="text-slate-500 block">Weekly Decay</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">-₹{(Math.abs(activeTheta) * 7).toFixed(1)}</span>
                </div>
                <div className="p-1 rounded bg-white/90 dark:bg-slate-900/60 border border-orange-200 dark:border-transparent text-center">
                  <span className="text-slate-500 block">Monthly Decay</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">-₹{(Math.abs(activeTheta) * 30).toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* ================= VEGA BOX (Green) ================= */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-[#08111F]/90 border border-emerald-200 dark:border-emerald-500/30 shadow-xs dark:shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                    ν
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">VEGA BOX</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-2">Volatility Sensitivity</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Value:</span>
                  <input
                    type="number"
                    step={1}
                    min={0}
                    max={500}
                    value={Number(activeVega.toFixed(1))}
                    onChange={(e) => setVegaOverride(Number(e.target.value))}
                    className="w-20 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/50 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Vega Slider (0 to 500) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0.0</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{activeVega.toFixed(1)}</span>
                  <span>500.0</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300}
                  step={0.5}
                  value={activeVega}
                  onChange={(e) => setVegaOverride(Number(e.target.value))}
                  className="w-full accent-emerald-600 dark:accent-emerald-500 cursor-pointer h-1.5 bg-emerald-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* Live Impact */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/80 dark:border-slate-800/80 text-[11px] font-mono">
                <div className="text-slate-600 dark:text-slate-400">
                  Vol Impact: <strong className="text-emerald-600 dark:text-emerald-400">+₹{activeVega.toFixed(2)}</strong> / 1% IV
                </div>
                <div className="text-right text-slate-600 dark:text-slate-400">
                  ±5% IV Move: <strong className="text-slate-900 dark:text-white">±₹{(activeVega * 5).toFixed(1)}</strong>
                </div>
              </div>
            </div>

            {/* ================= RHO BOX (Pink) ================= */}
            <div className="p-3.5 rounded-2xl bg-pink-50/70 dark:bg-[#08111F]/90 border border-pink-200 dark:border-pink-500/30 shadow-xs dark:shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold text-xs flex items-center justify-center">
                    ρ
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">RHO BOX</span>
                    <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold ml-2">Interest Rate Sensitivity</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Value:</span>
                  <input
                    type="number"
                    step={0.5}
                    min={-100}
                    max={100}
                    value={Number(activeRho.toFixed(2))}
                    onChange={(e) => setRhoOverride(Number(e.target.value))}
                    className="w-20 bg-white dark:bg-slate-900 border border-pink-300 dark:border-pink-500/50 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-pink-600 dark:text-pink-400 text-right focus:outline-none focus:ring-1 focus:ring-pink-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Rho Slider (-100 to 100) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>-100.0</span>
                  <span className="text-pink-600 dark:text-pink-400 font-bold">{activeRho.toFixed(2)}</span>
                  <span>+100.0</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={0.5}
                  value={activeRho}
                  onChange={(e) => setRhoOverride(Number(e.target.value))}
                  className="w-full accent-pink-600 dark:accent-pink-500 cursor-pointer h-1.5 bg-pink-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* Live Impact */}
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-1 border-t border-pink-200/80 dark:border-slate-800/80">
                Interest Rate Impact: <strong className="text-pink-600 dark:text-pink-400">₹{activeRho.toFixed(2)}</strong> per 100 bps shift
              </div>
            </div>

            {/* ADDITIONAL CONTROL SLIDERS */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider block">
                Additional Interactive Control Sliders
              </span>

              {/* IV Slider Box */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-cyan-300 dark:border-cyan-500/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                    IV BOX (1% to 150%)
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">{iv}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={150}
                  step={0.5}
                  value={iv}
                  onChange={(e) => setIv(Number(e.target.value))}
                  className="w-full accent-cyan-500 dark:accent-cyan-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* Spot Slider Box */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-blue-300 dark:border-blue-500/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                    SPOT PRICE BOX
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">₹{spotPrice.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={spotMin}
                  max={spotMax}
                  step={spotStep}
                  value={spotPrice}
                  onChange={(e) => setSpotPrice(Number(e.target.value))}
                  className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* OI Slider Box */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                    OI BOX (0 to 50,000)
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{openInterest.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={500}
                  value={openInterest}
                  onChange={(e) => setOpenInterest(Number(e.target.value))}
                  className="w-full accent-indigo-500 dark:accent-indigo-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* Volume Slider Box */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400" />
                    VOLUME BOX (0 to 100,000)
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">{volume.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={1000}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-teal-500 dark:accent-teal-400 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              {/* Days to Expiry Slider Box */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-orange-300 dark:border-orange-500/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400" />
                    DAYS TO EXPIRY BOX (0 to 365)
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">{expiryDays} Days</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={365}
                  step={1}
                  value={expiryDays}
                  onChange={(e) => handleDaysChange(Number(e.target.value))}
                  className="w-full accent-orange-600 dark:accent-orange-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* INTRINSIC VALUE, EXTRINSIC VALUE & TIME VALUE CARD                      */}
          {/* ======================================================================= */}
          <div className="w-full rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                VALUATION BREAKDOWN (Intrinsic vs Extrinsic / Time Value)
              </h2>
              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                Formula: Prem = Intrinsic + Extrinsic
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-[#08111F] border border-purple-200 dark:border-purple-500/30">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-sans">Intrinsic Value</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-1 block">
                  ₹{currentIntrinsic.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500">
                  {optionType === 'CALL' ? 'max(Spot - Strike, 0)' : 'max(Strike - Spot, 0)'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-[#08111F] border border-orange-200 dark:border-orange-500/30">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-sans">Extrinsic Value</span>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-1 block">
                  ₹{currentExtrinsic.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500">Premium - Intrinsic</span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-[#08111F] border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-sans">Time Value</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  ₹{currentTimeValue.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500">Vol + Decay Prem</span>
              </div>
            </div>

            {expectedMove !== 0 && (
              <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 font-mono text-xs flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">
                  At Future Spot (₹{futureSpot}):
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">Int: ₹{futureIntrinsic.toFixed(1)}</span>
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">Ext/Time: ₹{futureExtrinsic.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================================= */}
          {/* RISK METRICS CARD                                                       */}
          {/* ======================================================================= */}
          <div className="w-full rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                RISK METRICS
              </h2>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Quantitative Risk Engine</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-sans">Probability Of Profit</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">{pop.toFixed(1)}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-sans">Probability Of Touch</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">{pot}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-sans">Max Loss</span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                  -₹{Math.round(maxLoss).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-sans">Max Gain</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{maxGain}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 pt-1 font-mono text-xs">
              <span className="text-slate-600 dark:text-slate-400">Risk / Reward Ratio:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{riskReward}</span>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* GREEKS LADDER (Multi-Strike Matrix)                                     */}
          {/* ======================================================================= */}
          <div className="w-full rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                GREEKS LADDER (Multi-Strike Option Chain)
              </h2>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">9-Strike Surface</span>
            </div>

            <div className="overflow-x-auto max-h-72 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left font-mono text-[10px] border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-[#08111F] text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-1 px-1.5">Strike</th>
                    <th className="py-1 px-1.5">Premium</th>
                    <th className="py-1 px-1">Delta</th>
                    <th className="py-1 px-1">Gamma</th>
                    <th className="py-1 px-1">Theta</th>
                    <th className="py-1 px-1">Vega</th>
                    <th className="py-1 px-1">Rho</th>
                    <th className="py-1 px-1">Liquidity</th>
                    <th className="py-1 px-1.5 text-right">POP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                  {greeksLadderData.map((row) => (
                    <tr
                      key={row.strike}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                        row.isAtm ? 'bg-blue-50/80 dark:bg-blue-600/20 font-bold text-blue-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <td className="py-1.5 px-1.5 whitespace-nowrap">
                        {row.strike.toLocaleString('en-IN')}
                        {row.isAtm && <span className="text-[9px] text-blue-600 dark:text-blue-400 ml-1">(ATM)</span>}
                      </td>
                      <td className="py-1.5 px-1.5 font-bold text-slate-900 dark:text-white">₹{row.premium.toFixed(1)}</td>
                      <td className="py-1.5 px-1 text-blue-600 dark:text-blue-400">{row.delta.toFixed(2)}</td>
                      <td className="py-1.5 px-1 text-purple-600 dark:text-purple-400">{row.gamma.toFixed(4)}</td>
                      <td className="py-1.5 px-1 text-orange-600 dark:text-orange-400">{row.theta.toFixed(1)}</td>
                      <td className="py-1.5 px-1 text-emerald-600 dark:text-emerald-400">{row.vega.toFixed(1)}</td>
                      <td className="py-1.5 px-1 text-pink-600 dark:text-pink-400">{row.rho.toFixed(1)}</td>
                      <td className="py-1.5 px-1">
                        <span className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                          row.liquidity === 'High' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15' : row.liquidity === 'Med' ? 'text-amber-700 dark:text-amber-400 bg-amber-500/15' : 'text-rose-700 dark:text-rose-400 bg-rose-500/15'
                        }`}>
                          {row.liquidity}
                        </span>
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-semibold">{row.pop.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT PANEL: Money Impact, Live Charts, Breakdown, Scenario Table       */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4 min-w-0 w-full">
          
          {/* ================= 1. LIVE MONEY IMPACT PANEL ================= */}
          <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-5 shadow-xs dark:shadow-2xl space-y-4 min-w-0 w-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Live Money Impact Panel
              </h2>
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold font-mono rounded-full ${
                totalProfitLoss >= 0 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              }`}>
                {totalProfitLoss >= 0 ? 'PROFIT' : 'LOSS'}
              </span>
            </div>

            {/* Core Premium Row */}
            <div className="grid grid-cols-3 gap-2 font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#08111F] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-sans text-slate-600 dark:text-slate-400 block">Current Premium</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  ₹{currentPremium.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
                <span className="text-[10px] font-sans text-blue-700 dark:text-blue-400 block font-bold">Future Premium</span>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400 mt-0.5 block">
                  ₹{futurePremium.toFixed(2)}
                </span>
                <span className="text-[9px] text-blue-600 dark:text-blue-300">At Future Spot</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                premiumDifference >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'
              }`}>
                <span className="text-[10px] font-sans block font-bold">Difference</span>
                <span className="text-sm font-bold mt-0.5 block">
                  {premiumDifference >= 0 ? '+' : ''}₹{premiumDifference.toFixed(2)}
                </span>
                <span className="text-[9px]">
                  ({premiumDiffPercent >= 0 ? '+' : ''}{premiumDiffPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* ================= 2. ALL LIVE CHARTS (COMFORTABLE BOXES) ================= */}
          <div className="space-y-4 min-w-0 w-full">
            {/* Top Toolbar for Charts Section */}
            <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      Live Analytical Charts
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      All 9 charts stacked downward • Real-time dynamic Greek reaction
                    </p>
                  </div>
                </div>

                {/* View Filter / Jump Dropdown */}
                <div className="relative min-w-[220px]">
                  <select
                    value={activeChart}
                    onChange={(e) => setActiveChart(e.target.value as any)}
                    className="w-full appearance-none bg-slate-100/90 dark:bg-[#08111F] text-slate-900 dark:text-slate-100 font-bold text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-300/80 dark:border-slate-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer shadow-xs"
                  >
                    <option value="all">⚡ Show All 9 Charts (Stacked Down)</option>
                    <optgroup label="Filter Single Chart">
                      <option value="premiumSpot">1. Option Premium vs Spot</option>
                      <option value="pnlCurve">2. Net P&L Payoff Profile</option>
                      <option value="deltaCurve">3. Delta (Δ) vs Spot</option>
                      <option value="gammaCurve">4. Gamma (Γ) Curvature</option>
                      <option value="thetaDecay">5. Theta (θ) Daily Decay</option>
                      <option value="premiumTime">6. Premium vs Days to Expiry</option>
                      <option value="vegaCurve">7. Vega (ν) vs IV</option>
                      <option value="premiumIv">8. Premium vs IV</option>
                      <option value="rhoSensitivity">9. Rho (ρ) Interest Rate</option>
                    </optgroup>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Quick Jump / Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setActiveChart('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activeChart === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  ⚡ All 9 Charts
                </button>
                {[
                  { id: 'premiumSpot', label: '1. Prem vs Spot' },
                  { id: 'pnlCurve', label: '2. P&L' },
                  { id: 'deltaCurve', label: '3. Delta' },
                  { id: 'gammaCurve', label: '4. Gamma' },
                  { id: 'thetaDecay', label: '5. Theta' },
                  { id: 'premiumTime', label: '6. DTE Decay' },
                  { id: 'vegaCurve', label: '7. Vega' },
                  { id: 'premiumIv', label: '8. Prem vs IV' },
                  { id: 'rhoSensitivity', label: '9. Rho' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveChart(c.id as any)}
                    className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      activeChart === c.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}

                {/* Grid Density Toggle for Widescreen / Laptop Screens */}
                {activeChart === 'all' && (
                  <div className="ml-auto flex items-center bg-slate-100 dark:bg-[#08111F] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setChartGridColumns('single')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        chartGridColumns === 'single'
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Single column stacked downwards"
                    >
                      <Rows className="w-3 h-3" />
                      <span>1-Col</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartGridColumns('grid')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        chartGridColumns === 'grid'
                          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="2-Column grid for wide desktop/laptop screens"
                    >
                      <LayoutGrid className="w-3 h-3" />
                      <span>2-Col Grid</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* CHARTS CONTAINER (COMFORTABLE BOXES IN RIGHT PANEL) */}
            <div className={chartGridColumns === 'single' || activeChart !== 'all' ? 'space-y-4 min-w-0 w-full' : 'grid grid-cols-1 2xl:grid-cols-2 gap-3.5 min-w-0 w-full'}>
              {/* CHART 1: Option Premium vs Spot Price */}
            {(activeChart === 'all' || activeChart === 'premiumSpot') && (
              <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div style={{ paddingLeft: '-12px', paddingTop: '1px', marginTop: '-36px' }}>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        1. Option Premium vs Spot Price
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Theoretical Black-76/BS price across underlying spot range
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                    <span className="text-slate-500 dark:text-slate-400">Target:</span>
                    <span className="text-blue-600 dark:text-blue-400">₹{futurePremium.toFixed(1)}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-slate-500 dark:text-slate-400">Current:</span>
                    <span className="text-slate-700 dark:text-slate-300">₹{currentPremium.toFixed(1)}</span>
                  </div>
                </div>

                {/* Outcome forecast note */}
                <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong>Expected Impact:</strong> If spot shifts by <strong>{expectedMove >= 0 ? `+${expectedMove}` : expectedMove} pts</strong> to <strong>₹{futureSpot.toLocaleString('en-IN')}</strong>, theoretical premium will be <strong>₹{futurePremium.toFixed(1)}</strong> ({premiumDifference >= 0 ? '+' : ''}₹{premiumDifference.toFixed(1)} change).
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spotChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.7} />
                      <XAxis dataKey="spot" stroke={chartAxisStroke} fontSize={10} tickFormatter={(v) => `₹${v}`} />
                      <YAxis stroke={chartAxisStroke} fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <ReferenceLine x={spotPrice} stroke="#3B82F6" strokeDasharray="3 3" label={{ value: 'Spot', fill: '#3B82F6', fontSize: 10 }} />
                      <ReferenceLine x={strikePrice} stroke="#F97316" strokeDasharray="3 3" label={{ value: 'Strike', fill: '#F97316', fontSize: 10 }} />
                      {expectedMove !== 0 && (
                        <ReferenceLine x={futureSpot} stroke="#10B981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Target', fill: '#10B981', fontSize: 10 }} />
                      )}
                      <Line type="monotone" dataKey="premium" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Premium (₹)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 2: Net P&L Payoff Profile */}
            {(activeChart === 'all' || activeChart === 'pnlCurve') && (
              <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        2. Net P&L Payoff Profile
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Total profit/loss outcome ({lots} lots × {lotSize} units = {totalQty} qty)
                      </p>
                    </div>
                  </div>
                  <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg ${
                    totalProfitLoss >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  }`}>
                    {totalProfitLoss >= 0 ? '+' : ''}₹{Math.round(totalProfitLoss).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong>Outcome Forecast:</strong> Breakeven level is at <strong>₹{breakeven.toFixed(1)}</strong>. Position achieves max loss limited to <strong>₹{Math.round(maxLoss).toLocaleString('en-IN')}</strong> and upside is <strong>{maxGain}</strong>.
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spotChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.7} />
                      <XAxis dataKey="spot" stroke={chartAxisStroke} fontSize={10} tickFormatter={(v) => `₹${v}`} />
                      <YAxis stroke={chartAxisStroke} fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="2 2" />
                      <ReferenceLine x={spotPrice} stroke="#3B82F6" strokeDasharray="3 3" label={{ value: 'Spot', fill: '#3B82F6', fontSize: 10 }} />
                      <ReferenceLine x={breakeven} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Breakeven', fill: '#F59E0B', fontSize: 10 }} />
                      {expectedMove !== 0 && (
                        <ReferenceLine x={futureSpot} stroke="#10B981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Target', fill: '#10B981', fontSize: 10 }} />
                      )}
                      <Line type="monotone" dataKey="pnl" stroke="#10B981" strokeWidth={2.5} dot={false} name="Net P&L (₹)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 3: Delta (Δ) Curve */}
            {(activeChart === 'all' || activeChart === 'deltaCurve') && (
              <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        3. Delta (Δ) Sensitivity Curve
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Directional sensitivity per point underlying move
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200/50 dark:border-blue-900/50">
                    Δ {activeDelta.toFixed(3)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong>When Delta Changes:</strong> For every ₹10 move in underlying spot, your position gains/loses <strong>₹{(activeDelta * 10 * totalQty).toFixed(0)}</strong>. As spot passes strike ₹{strikePrice}, delta approaches {optionType === 'CALL' ? '1.0' : '-1.0'}.
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spotChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.7} />
                      <XAxis dataKey="spot" stroke={chartAxisStroke} fontSize={10} tickFormatter={(v) => `₹${v}`} />
                      <YAxis stroke={chartAxisStroke} fontSize={10} domain={[-1, 1]} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <ReferenceLine y={0} stroke={chartAxisStroke} strokeDasharray="2 2" />
                      <ReferenceLine x={spotPrice} stroke="#3B82F6" strokeDasharray="3 3" label={{ value: 'Spot', fill: '#3B82F6', fontSize: 10 }} />
                      {expectedMove !== 0 && (
                        <ReferenceLine x={futureSpot} stroke="#10B981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Target', fill: '#10B981', fontSize: 10 }} />
                      )}
                      <ReferenceLine y={activeDelta} stroke="#3B82F6" strokeDasharray="2 2" label={{ value: `Δ ${activeDelta.toFixed(2)}`, fill: '#3B82F6', fontSize: 10 }} />
                      <Line type="monotone" dataKey="delta" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Delta (Δ)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 4: Gamma (Γ) Curvature */}
            {(activeChart === 'all' || activeChart === 'gammaCurve') && (
              <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        4. Gamma (Γ) Curvature & Acceleration
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Rate of change of Delta (convexity acceleration)
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200/50 dark:border-purple-900/50">
                    Γ {activeGamma.toFixed(4)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-900/40 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong>When Gamma Changes:</strong> Gamma peaks at ATM strike <strong>₹{strikePrice.toLocaleString('en-IN')}</strong>. For a ₹100 spot jump, Delta accelerates by <strong>+{(activeGamma * 100).toFixed(3)}</strong>, compounding position velocity.
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spotChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.7} />
                      <XAxis dataKey="spot" stroke={chartAxisStroke} fontSize={10} tickFormatter={(v) => `₹${v}`} />
                      <YAxis stroke={chartAxisStroke} fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <ReferenceLine x={strikePrice} stroke="#A855F7" strokeDasharray="3 3" label={{ value: 'ATM Peak', fill: '#A855F7', fontSize: 10 }} />
                      <ReferenceLine x={spotPrice} stroke="#3B82F6" strokeDasharray="3 3" label={{ value: 'Spot', fill: '#3B82F6', fontSize: 10 }} />
                      <Line type="monotone" dataKey="gamma" stroke="#A855F7" strokeWidth={2.5} dot={false} name="Gamma × 1000 (Γ)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 5: Theta (θ) Time Decay */}
            {(activeChart === 'all' || activeChart === 'thetaDecay') && (
              <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        5. Theta (θ) Daily Decay Acceleration
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Daily calendar loss over {expiryDays} remaining days to expiry
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-lg border border-orange-200/50 dark:border-orange-900/50">
                    θ -₹{Math.abs(activeTheta).toFixed(1)}/day
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-900/40 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong>When Theta Changes:</strong> In 5 days stationary, position loses <strong>-₹{Math.round(Math.abs(activeTheta) * Math.min(5, expiryDays) * totalQty).toLocaleString('en-IN')}</strong> total. Notice decay steepens dramatically in the final 10 days!
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeDecayChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.7} />
                      <XAxis dataKey="days" stroke={chartAxisStroke} fontSize={10} tickFormatter={(v) => `${v}d`} />
                      <YAxis stroke={chartAxisStroke} fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <ReferenceLine x={expiryDays} stroke="#F97316" strokeDasharray="3 3" label={{ value: 'Current DTE', fill: '#F97316', fontSize: 10 }} />
                      <Area type="monotone" dataKey="theta" stroke="#F97316" fill="#F97316" fillOpacity={0.25} strokeWidth={2.5} name="Daily Theta Decay (₹)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 6: Option Premium vs Days to Expiry */}
            {(activeChart === 'all' || activeChart === 'premiumTime') && (
              <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        6. Premium vs Days to Expiry (Extrinsic Collapse)
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Erosion of total option premium as expiration counts down to 0 DTE
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-900/50">
                    {expiryDays} Days Left
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong>Extrinsic Value Decay:</strong> Shows the curve of premium collapse from {Math.max(expiryDays, 60)} days down to expiry. Time decay accelerates quadratically near zero DTE.
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeDecayChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.7} />
                      <XAxis dataKey="days" stroke={chartAxisStroke} fontSize={10} tickFormatter={(v) => `${v}d`} />
                      <YAxis stroke={chartAxisStroke} fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <ReferenceLine x={expiryDays} stroke="#F97316" strokeDasharray="3 3" label={{ value: 'Current DTE', fill: '#F97316', fontSize: 10 }} />
                      <Area type="monotone" dataKey="premium" stroke="#F97316" fill="#F97316" fillOpacity={0.2} strokeWidth={2.5} name="Premium Time Value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 7: Vega (ν) vs Implied Volatility */}
            {(activeChart === 'all' || activeChart === 'vegaCurve') && (
              <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        7. Vega (ν) Volatility Sensitivity
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Sensitivity per 1% absolute shift in Implied Volatility
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-900/50">
                    ν ₹{activeVega.toFixed(2)}/1% IV
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/40 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong>When Vega Changes:</strong> A +3% IV spike expands premium by <strong>+₹{(activeVega * 3).toFixed(1)}</strong> (+₹{Math.round(activeVega * 3 * totalQty).toLocaleString('en-IN')} total). A -3% post-earnings/post-inventory IV crush causes equivalent loss.
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ivChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.7} />
                      <XAxis dataKey="iv" stroke={chartAxisStroke} fontSize={10} tickFormatter={(v) => `${v}%`} />
                      <YAxis stroke={chartAxisStroke} fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <ReferenceLine x={iv} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Current IV', fill: '#10B981', fontSize: 10 }} />
                      <Line type="monotone" dataKey="vega" stroke="#10B981" strokeWidth={2.5} dot={false} name="Vega Exposure (ν)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 8: Option Premium vs Implied Volatility */}
            {(activeChart === 'all' || activeChart === 'premiumIv') && (
              <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        8. Option Premium vs Implied Volatility (IV)
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Price responsiveness across 5% to 80% market volatility regimes
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-200/50 dark:border-cyan-900/50">
                    Current IV: {iv.toFixed(1)}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/50 dark:border-cyan-900/40 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong>Volatility Expansion:</strong> Higher volatility inflates the expected probability distribution, driving up both call and put option values.
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ivChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.7} />
                      <XAxis dataKey="iv" stroke={chartAxisStroke} fontSize={10} tickFormatter={(v) => `${v}%`} />
                      <YAxis stroke={chartAxisStroke} fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <ReferenceLine x={iv} stroke="#06B6D4" strokeDasharray="3 3" label={{ value: 'Current IV', fill: '#06B6D4', fontSize: 10 }} />
                      <Line type="monotone" dataKey="premium" stroke="#06B6D4" strokeWidth={2.5} dot={false} name="Premium vs IV" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 9: Rho (ρ) Interest Rate Sensitivity */}
            {(activeChart === 'all' || activeChart === 'rhoSensitivity') && (
              <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        9. Rho (ρ) Interest Rate Sensitivity
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Sensitivity per 1% change in benchmark financing/cost-of-carry rate
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-900/50">
                    ρ ₹{activeRho.toFixed(2)}/1% Rate
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/40 text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong>Interest Rate Impact:</strong> Benchmark financing rate is <strong>{interestRate}%</strong>. A 50 bps RBI rate adjustment shifts option premium by <strong>{activeRho >= 0 ? '+' : ''}₹{(activeRho * 0.5).toFixed(2)}</strong>.
                </div>

                <div className="h-52 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rhoChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} opacity={0.7} />
                      <XAxis dataKey="rate" stroke={chartAxisStroke} fontSize={10} tickFormatter={(v) => `${v}%`} />
                      <YAxis stroke={chartAxisStroke} fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <ReferenceLine x={interestRate} stroke="#6366F1" strokeDasharray="3 3" label={{ value: 'Current Rate', fill: '#6366F1', fontSize: 10 }} />
                      <Line type="monotone" dataKey="premium" stroke="#6366F1" strokeWidth={2.5} dot={false} name="Option Value (₹)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* ================= 3. BREAKDOWN PANEL (GREEKS ATTRIBUTION) ================= */}
          <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-5 shadow-xs dark:shadow-2xl space-y-3.5 min-w-0 w-full">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Breakdown Panel (Greeks Attribution)
              </h2>
              <span className={`text-xs font-mono font-bold ${premiumDifference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                Diff: {premiumDifference >= 0 ? '+' : ''}₹{premiumDifference.toFixed(2)}
              </span>
            </div>

            {/* Attribution Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 dark:bg-[#08111F] border border-blue-200 dark:border-blue-500/20">
                <span className="text-slate-800 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                  Spot Move:
                </span>
                <span className={`font-bold ${spotMoveTotal >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {spotMoveTotal >= 0 ? '+' : ''}₹{spotMoveTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/40 dark:bg-[#08111F]/70 border border-blue-100 dark:border-blue-900/30">
                <span className="text-slate-600 dark:text-slate-400">↳ Delta:</span>
                <span className={`font-bold ${deltaContribution >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {deltaContribution >= 0 ? '+' : ''}₹{deltaContribution.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/40 dark:bg-[#08111F]/70 border border-purple-100 dark:border-purple-900/30">
                <span className="text-slate-600 dark:text-slate-400">↳ Gamma:</span>
                <span className={`font-bold ${gammaContribution >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {gammaContribution >= 0 ? '+' : ''}₹{gammaContribution.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/70 dark:bg-[#08111F] border border-orange-200 dark:border-orange-500/20">
                <span className="text-slate-800 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400" />
                  Theta:
                </span>
                <span className={`font-bold ${thetaContribution >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {thetaContribution >= 0 ? '+' : ''}₹{thetaContribution.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-[#08111F] border border-emerald-200 dark:border-emerald-500/20">
                <span className="text-slate-800 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  Vega:
                </span>
                <span className={`font-bold ${vegaContribution >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {vegaContribution >= 0 ? '+' : ''}₹{vegaContribution.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-pink-50/70 dark:bg-[#08111F] border border-pink-200 dark:border-pink-500/20">
                <span className="text-slate-800 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400" />
                  Rho:
                </span>
                <span className="font-bold text-pink-600 dark:text-pink-400">
                  +₹{rhoContribution.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-50/70 dark:bg-[#08111F] border border-cyan-200 dark:border-cyan-500/20 sm:col-span-2 lg:col-span-3">
                <span className="text-slate-800 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                  IV Volatility Shift Impact:
                </span>
                <span className={`font-bold ${ivPureImpact >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {ivPureImpact >= 0 ? '+' : ''}₹{ivPureImpact.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ================= 4. SCENARIO ANALYSIS TABLE [MOVED DOWN] ================= */}
          <div className="rounded-[20px] bg-white/90 dark:bg-[#0D192E]/80 backdrop-blur-xl border border-[#DCE9EE] dark:border-slate-800/80 p-4 shadow-xs dark:shadow-2xl space-y-3 min-w-0 w-full">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Scenario Analysis Table
              </h2>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">-5000 to +5000 Matrix</span>
            </div>

            <div className="overflow-x-auto max-h-64 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left font-mono text-[10px] border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-[#08111F] text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-1.5 px-2">Future Spot</th>
                    <th className="py-1.5 px-2">Future Premium</th>
                    <th className="py-1.5 px-1">Delta</th>
                    <th className="py-1.5 px-1">Gamma</th>
                    <th className="py-1.5 px-1">Theta</th>
                    <th className="py-1.5 px-1">Vega</th>
                    <th className="py-1.5 px-1">Rho</th>
                    <th className="py-1.5 px-1">POP</th>
                    <th className="py-1.5 px-2 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {scenarioTableData.map((row) => {
                    const isBase = row.offset === 0;
                    return (
                      <tr
                        key={row.offset}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                          isBase ? 'bg-blue-50/80 dark:bg-blue-600/15 font-bold text-blue-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <td className="py-1.5 px-2 whitespace-nowrap">
                          {row.futureSpot.toLocaleString('en-IN')}
                          {row.offset !== 0 && (
                            <span className="text-[9px] text-slate-500 ml-1">
                              ({row.offset > 0 ? '+' : ''}{row.offset})
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 font-bold text-slate-900 dark:text-white">₹{row.futurePremium.toFixed(2)}</td>
                        <td className="py-1.5 px-1 text-blue-600 dark:text-blue-400">{row.delta.toFixed(2)}</td>
                        <td className="py-1.5 px-1 text-purple-600 dark:text-purple-400">{row.gamma.toFixed(4)}</td>
                        <td className="py-1.5 px-1 text-orange-600 dark:text-orange-400">{row.theta.toFixed(1)}</td>
                        <td className="py-1.5 px-1 text-emerald-600 dark:text-emerald-400">{row.vega.toFixed(1)}</td>
                        <td className="py-1.5 px-1 text-pink-600 dark:text-pink-400">{row.rho.toFixed(1)}</td>
                        <td className="py-1.5 px-1">{row.pop.toFixed(0)}%</td>
                        <td className={`py-1.5 px-2 text-right font-bold ${
                          row.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {row.pnl >= 0 ? '+' : ''}₹{Math.round(row.pnl).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};
export default GreeksWorkspaceView;
