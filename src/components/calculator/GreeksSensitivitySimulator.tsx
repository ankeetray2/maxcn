import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { calculateGreeks, formatGreek, spotForTargetDelta } from '../../utils/greeks';
import { getCommoditySpec } from '../../services/mockData';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Database,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  ArrowRight,
  Clock,
  Zap,
  ShieldCheck,
  Scale,
  Sparkles,
  BarChart2,
  Flame,
  Gauge
} from 'lucide-react';

export const GreeksSensitivitySimulator: React.FC = () => {
  const {
    calculator,
    selectedCommodity,
    settings,
    saveScenarioAnalysisToMongoDB,
    isSavingDatabase,
    currentSpotPrice,
    spotPriceSource
  } = useGreeksStore();

  const spec = getCommoditySpec(selectedCommodity);

  // Baseline values from active state
  const baseSpot = currentSpotPrice || calculator.spotPrice || 153330;
  const baseStrike = calculator.strikePrice || 153000;
  const baseIv = calculator.volatility || 24.5;
  const baseDays = Math.max(1, calculator.expiryDays || 30);
  const baseRate = calculator.interestRate || 6.5;
  const baseOptionType = calculator.optionType || 'CALL';
  const lots = calculator.contracts || 2;
  const lotSize = calculator.lotSize || spec?.lotSize || 100;
  const totalQty = lots * lotSize;

  // Fresh calculation for current baseline state
  const baselineGreeks = useMemo(() => {
    return calculateGreeks(
      baseSpot,
      baseStrike,
      baseDays,
      baseIv,
      baseRate,
      baseOptionType,
      settings.pricingModel || 'BLACK_SCHOLES',
      lots,
      lotSize
    );
  }, [baseSpot, baseStrike, baseDays, baseIv, baseRate, baseOptionType, settings.pricingModel, lots, lotSize]);

  // ==========================================
  // 8 INTERACTIVE SLIDER STATES
  // ==========================================
  // Slider 1: Spot Price (Slider Range: 100000 to 200000, Step: 1)
  const [modifiedSpot, setModifiedSpot] = useState<number>(baseSpot);

  // Slider 2: Delta (Range: -1 to +1, Step: 0.01)
  const [sliderDelta, setSliderDelta] = useState<number>(Number(baselineGreeks.delta.toFixed(2)));

  // Slider 3: Gamma (Range: 0 to 1, Step: 0.0001)
  const [sliderGamma, setSliderGamma] = useState<number>(Number(baselineGreeks.gamma.toFixed(4)));

  // Slider 4: Theta (Range: -500 to 0, Step: 1)
  const [sliderTheta, setSliderTheta] = useState<number>(Math.round(baselineGreeks.theta));

  // Slider 5: Vega (Range: 0 to 500, Step: 0.1)
  const [sliderVega, setSliderVega] = useState<number>(Number(baselineGreeks.vega.toFixed(1)));

  // Slider 6: IV (Range: 1 to 150, Step: 0.1)
  const [sliderIv, setSliderIv] = useState<number>(Number(baseIv.toFixed(1)));

  // Slider 7: Rho (Range: -100 to 100, Step: 0.1)
  const [sliderRho, setSliderRho] = useState<number>(Number(baselineGreeks.rho.toFixed(1)));

  // Slider 8: Time Decay (Days To Expiry, Range: 0 to 90, Step: 1)
  const [sliderDays, setSliderDays] = useState<number>(Math.min(90, Math.max(0, baseDays)));

  // Active chart tab
  const [activeChart, setActiveChart] = useState<
    'spot' | 'iv' | 'theta' | 'vega' | 'time' | 'pnlSpot' | 'pnlIv'
  >('spot');

  // Toast notification for saving
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sync sliders when baseline inputs change from calculator
  useEffect(() => {
    setModifiedSpot(baseSpot);
    setSliderDelta(Number(baselineGreeks.delta.toFixed(2)));
    setSliderGamma(Number(baselineGreeks.gamma.toFixed(4)));
    setSliderTheta(Math.round(baselineGreeks.theta));
    setSliderVega(Number(baselineGreeks.vega.toFixed(1)));
    setSliderIv(Number(baseIv.toFixed(1)));
    setSliderRho(Number(baselineGreeks.rho.toFixed(1)));
    setSliderDays(Math.min(90, Math.max(0, baseDays)));
  }, [baseSpot, baseIv, baseDays, baselineGreeks.delta, baselineGreeks.gamma, baselineGreeks.theta, baselineGreeks.vega, baselineGreeks.rho]);

  // Delta Slider -> Spot shift conversion via Black-Scholes inversion if delta changed directly
  const deltaShift = sliderDelta - baselineGreeks.delta;
  const deltaEquivalentSpotShift = useMemo(() => {
    if (Math.abs(deltaShift) < 0.005) return 0;
    const isCall = baseOptionType === 'CALL';
    const clampedTargetDelta = isCall
      ? Math.max(0.01, Math.min(0.99, sliderDelta))
      : Math.max(-0.99, Math.min(-0.01, sliderDelta));

    try {
      const targetSpot = spotForTargetDelta(
        clampedTargetDelta,
        baseStrike,
        Math.max(0.1, sliderDays),
        sliderIv,
        baseRate,
        baseOptionType
      );
      return targetSpot - baseSpot;
    } catch {
      return 0;
    }
  }, [deltaShift, sliderDelta, baseOptionType, baseStrike, sliderDays, sliderIv, baseRate, baseSpot]);

  // Effective Spot combining explicit modifiedSpot and any delta-driven inversion
  const effectiveSpot = Math.max(1000, modifiedSpot + (deltaEquivalentSpotShift !== 0 ? deltaEquivalentSpotShift * 0.1 : 0));
  const spotDifference = effectiveSpot - baseSpot;

  // Real-time Black-Scholes recalculation based on modified market conditions
  const recalculatedGreeksRaw = useMemo(() => {
    return calculateGreeks(
      effectiveSpot,
      baseStrike,
      Math.max(0.01, sliderDays),
      Math.max(0.5, sliderIv),
      baseRate,
      baseOptionType,
      settings.pricingModel || 'BLACK_SCHOLES',
      lots,
      lotSize
    );
  }, [effectiveSpot, baseStrike, sliderDays, sliderIv, baseRate, baseOptionType, settings.pricingModel, lots, lotSize]);

  // Effective Greeks combining recalculated model outputs with direct manual slider overrides
  const liveGreeks = useMemo(() => {
    const gammaShift = sliderGamma - baselineGreeks.gamma;
    const thetaShift = sliderTheta - baselineGreeks.theta;
    const vegaShift = sliderVega - baselineGreeks.vega;
    const rhoShift = sliderRho - baselineGreeks.rho;

    // Direct secondary contributions from Greek sliders (Taylor expansion adjustments)
    const gammaDirectImpact = 0.5 * gammaShift * Math.pow(spotDifference, 2);
    const thetaDirectImpact = thetaShift * (sliderDays / 365);
    const vegaDirectImpact = vegaShift * ((sliderIv - baseIv) / 100);
    const rhoDirectImpact = rhoShift * 0.01;

    const adjustedPrice = Math.max(
      0.01,
      recalculatedGreeksRaw.price + gammaDirectImpact + thetaDirectImpact + vegaDirectImpact + rhoDirectImpact
    );

    const adjustedIntrinsic = baseOptionType === 'CALL'
      ? Math.max(0, effectiveSpot - baseStrike)
      : Math.max(0, baseStrike - effectiveSpot);
    const adjustedExtrinsic = Math.max(0, adjustedPrice - adjustedIntrinsic);
    const adjustedBreakeven = baseOptionType === 'CALL'
      ? baseStrike + adjustedPrice
      : baseStrike - adjustedPrice;

    return {
      ...recalculatedGreeksRaw,
      price: Number(adjustedPrice.toFixed(2)),
      delta: Number((sliderDelta !== Number(baselineGreeks.delta.toFixed(2)) ? sliderDelta : recalculatedGreeksRaw.delta).toFixed(4)),
      gamma: Number((sliderGamma !== Number(baselineGreeks.gamma.toFixed(4)) ? sliderGamma : recalculatedGreeksRaw.gamma).toFixed(6)),
      theta: Number((sliderTheta !== Math.round(baselineGreeks.theta) ? sliderTheta : recalculatedGreeksRaw.theta).toFixed(2)),
      vega: Number((sliderVega !== Number(baselineGreeks.vega.toFixed(1)) ? sliderVega : recalculatedGreeksRaw.vega).toFixed(2)),
      rho: Number((sliderRho !== Number(baselineGreeks.rho.toFixed(1)) ? sliderRho : recalculatedGreeksRaw.rho).toFixed(2)),
      intrinsicValue: Number(adjustedIntrinsic.toFixed(2)),
      extrinsicValue: Number(adjustedExtrinsic.toFixed(2)),
      breakeven: Number(adjustedBreakeven.toFixed(2))
    };
  }, [
    recalculatedGreeksRaw,
    sliderDelta,
    sliderGamma,
    sliderTheta,
    sliderVega,
    sliderRho,
    baselineGreeks,
    spotDifference,
    sliderDays,
    sliderIv,
    baseIv,
    effectiveSpot,
    baseStrike,
    baseOptionType
  ]);

  // ==========================================
  // P&L ENGINE
  // ==========================================
  const currentPremium = baselineGreeks.price;
  const newPremium = liveGreeks.price;
  const premiumDifference = newPremium - currentPremium;
  const pnlPerLot = premiumDifference * lotSize;
  const totalPnl = premiumDifference * lotSize * lots;
  const returnPercentage = currentPremium > 0 ? (premiumDifference / currentPremium) * 100 : 0;

  // ==========================================
  // CONTRIBUTION BREAKDOWN
  // ==========================================
  const ivChange = sliderIv - baseIv;
  const daysPassed = baseDays - sliderDays;

  // 1. Spot Impact: Pure price move impact
  const spotImpact = spotDifference * (baseOptionType === 'CALL' ? 1 : -1) * 0.1;
  // 2. Delta Impact: Δ * dS
  const deltaImpact = baselineGreeks.delta * spotDifference;
  // 3. Gamma Impact: 0.5 * Γ * (dS)^2
  const gammaImpact = 0.5 * liveGreeks.gamma * Math.pow(spotDifference, 2);
  // 4. Theta Impact: θ * dt (days elapsed)
  const thetaImpact = baselineGreeks.theta * (daysPassed / 1);
  // 5. Vega Impact: ν * dIV
  const vegaImpact = baselineGreeks.vega * ivChange;
  // 6. IV Impact: Overall Volatility impact
  const ivImpact = vegaImpact;
  // 7. Rho Impact: ρ * dR
  const rhoImpact = liveGreeks.rho * 0.05;

  // Preset Handlers
  const handleSpotPreset = (pts: number) => {
    setModifiedSpot(baseSpot + pts);
  };

  const handleIvPreset = (percent: number) => {
    setSliderIv(Math.max(1, Math.min(150, Number((baseIv + percent).toFixed(1)))));
  };

  // Reset All Sliders
  const handleResetAll = () => {
    setModifiedSpot(baseSpot);
    setSliderDelta(Number(baselineGreeks.delta.toFixed(2)));
    setSliderGamma(Number(baselineGreeks.gamma.toFixed(4)));
    setSliderTheta(Math.round(baselineGreeks.theta));
    setSliderVega(Number(baselineGreeks.vega.toFixed(1)));
    setSliderIv(Number(baseIv.toFixed(1)));
    setSliderRho(Number(baselineGreeks.rho.toFixed(1)));
    setSliderDays(Math.min(90, Math.max(0, baseDays)));
  };

  // Save Scenario to MongoDB
  const handleSaveScenario = async () => {
    try {
      const payload = {
        commodity: calculator.commodity,
        currentPrice: baseSpot,
        strike: baseStrike,
        optionType: baseOptionType === 'CALL' ? 'CE' : 'PE',
        iv: sliderIv,
        daysToExpiry: sliderDays,
        lots,
        lotSize,
        movePoints: modifiedSpot - baseSpot,
        recalculatedGreeks: {
          delta: liveGreeks.delta,
          gamma: liveGreeks.gamma,
          theta: liveGreeks.theta,
          vega: liveGreeks.vega,
          rho: liveGreeks.rho,
          pop: liveGreeks.pop,
          premium: liveGreeks.price,
          intrinsicValue: liveGreeks.intrinsicValue,
          extrinsicValue: liveGreeks.extrinsicValue
        },
        pnl: {
          currentPremium,
          futurePremium: newPremium,
          premiumChange: premiumDifference,
          pnlPerLot,
          pnlTotal: totalPnl
        },
        timestamp: new Date().toISOString(),
        user: 'Trader'
      };

      const success = await saveScenarioAnalysisToMongoDB(payload as any);
      if (success) {
        setSaveToast('Scenario saved successfully into MongoDB!');
      } else {
        setSaveToast('Saved locally in browser memory.');
      }
      setTimeout(() => setSaveToast(null), 3500);
    } catch {
      setSaveToast('Scenario saved to local store.');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // ==========================================
  // REAL-TIME CHARTS DATA
  // ==========================================
  // 1. Premium vs Spot & P&L vs Spot
  const spotChartData = useMemo(() => {
    const points = [];
    const minRange = Math.max(50000, baseSpot - 4000);
    const maxRange = baseSpot + 4000;
    const step = 400;
    for (let s = minRange; s <= maxRange; s += step) {
      const res = calculateGreeks(
        s,
        baseStrike,
        Math.max(0.1, sliderDays),
        sliderIv,
        baseRate,
        baseOptionType,
        'BLACK_SCHOLES',
        lots,
        lotSize
      );
      const diff = res.price - currentPremium;
      points.push({
        spot: Math.round(s),
        premium: res.price,
        pnl: diff * lotSize * lots
      });
    }
    return points;
  }, [baseSpot, baseStrike, sliderDays, sliderIv, baseRate, baseOptionType, lots, lotSize, currentPremium]);

  // 2. Premium vs IV & P&L vs IV
  const ivChartData = useMemo(() => {
    const points = [];
    for (let iv = 5; iv <= 120; iv += 5) {
      const res = calculateGreeks(
        effectiveSpot,
        baseStrike,
        Math.max(0.1, sliderDays),
        iv,
        baseRate,
        baseOptionType,
        'BLACK_SCHOLES',
        lots,
        lotSize
      );
      const diff = res.price - currentPremium;
      points.push({
        iv,
        premium: res.price,
        pnl: diff * lotSize * lots
      });
    }
    return points;
  }, [effectiveSpot, baseStrike, sliderDays, baseRate, baseOptionType, lots, lotSize, currentPremium]);

  // 3. Premium vs Theta (Simulated across decay days)
  const thetaChartData = useMemo(() => {
    const points = [];
    for (let d = 0; d <= 60; d += 2) {
      const res = calculateGreeks(
        effectiveSpot,
        baseStrike,
        Math.max(0.01, d),
        sliderIv,
        baseRate,
        baseOptionType,
        'BLACK_SCHOLES',
        lots,
        lotSize
      );
      points.push({
        days: d,
        premium: res.price,
        theta: res.theta
      });
    }
    return points;
  }, [effectiveSpot, baseStrike, sliderIv, baseRate, baseOptionType, lots, lotSize]);

  // 4. Premium vs Vega
  const vegaChartData = useMemo(() => {
    const points = [];
    for (let iv = Math.max(5, sliderIv - 30); iv <= sliderIv + 30; iv += 3) {
      const res = calculateGreeks(
        effectiveSpot,
        baseStrike,
        Math.max(0.1, sliderDays),
        iv,
        baseRate,
        baseOptionType,
        'BLACK_SCHOLES',
        lots,
        lotSize
      );
      points.push({
        iv: Number(iv.toFixed(1)),
        premium: res.price,
        vega: res.vega
      });
    }
    return points;
  }, [effectiveSpot, baseStrike, sliderDays, sliderIv, baseRate, baseOptionType, lots, lotSize]);

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* TOP SECTION: Current Market Values                 */}
      {/* ================================================== */}
      <div className="bg-white/95 dark:bg-[#101828]/95 backdrop-blur-md rounded-3xl border border-[#DCE9EE] dark:border-[#1E293B] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE9EE]/60 dark:border-[#1E293B] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00778A] to-[#2DD4BF] flex items-center justify-center text-white shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1D2939] dark:text-white tracking-tight">
                  Greeks Sensitivity Control Panel
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#00778A]/10 text-[#00778A] dark:bg-[#2DD4BF]/20 dark:text-[#2DD4BF]">
                  Real-Time Engine (60 FPS)
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                Adjust live control sliders to observe instant premium, Greek, and P&L dynamics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#667085] hover:text-[#1D2939] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Sliders</span>
            </button>
            <button
              type="button"
              onClick={handleSaveScenario}
              disabled={isSavingDatabase}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#00778A] hover:bg-[#005B6A] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSavingDatabase ? 'Saving...' : 'Save Scenario'}</span>
            </button>
          </div>
        </div>

        {/* Current Market Values Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 font-mono">
          {/* Spot Price */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Spot Price</span>
            <span className="text-sm font-bold text-[#1D2939] dark:text-white mt-0.5 block">
              ₹{Math.round(baseSpot).toLocaleString('en-IN')}
            </span>
            <span className="text-[9px] font-sans text-[#00778A] dark:text-[#2DD4BF]">{spotPriceSource}</span>
          </div>

          {/* Strike Price */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Strike Price</span>
            <span className="text-sm font-bold text-[#1D2939] dark:text-white mt-0.5 block">
              ₹{baseStrike.toLocaleString('en-IN')}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">K Level</span>
          </div>

          {/* Option Type */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Option Type</span>
            <span className={`text-sm font-bold mt-0.5 block ${baseOptionType === 'CALL' ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {baseOptionType === 'CALL' ? 'CALL (CE)' : 'PUT (PE)'}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">Direction</span>
          </div>

          {/* Premium */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Premium</span>
            <span className="text-sm font-bold text-[#00778A] dark:text-[#2DD4BF] mt-0.5 block">
              ₹{currentPremium.toFixed(2)}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">Current LTP</span>
          </div>

          {/* Lots */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Lots</span>
            <span className="text-sm font-bold text-[#1D2939] dark:text-white mt-0.5 block">
              {lots}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">Position</span>
          </div>

          {/* Lot Size */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Lot Size</span>
            <span className="text-sm font-bold text-[#1D2939] dark:text-white mt-0.5 block">
              {lotSize}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">Qty/Lot</span>
          </div>

          {/* Total Units */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Total Units</span>
            <span className="text-sm font-bold text-[#1D2939] dark:text-white mt-0.5 block">
              {totalQty.toLocaleString('en-IN')}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">{lots} × {lotSize}</span>
          </div>

          {/* P&L */}
          <div className={`p-3 rounded-2xl border ${
            totalPnl >= 0 ? 'bg-[#12B76A]/10 border-[#12B76A]/30 text-[#12B76A]' : 'bg-[#F04438]/10 border-[#F04438]/30 text-[#F04438]'
          }`}>
            <span className="text-[10px] font-sans font-semibold block">Simulated P&L</span>
            <span className="text-sm font-bold mt-0.5 block">
              {totalPnl >= 0 ? '+' : ''}₹{Math.round(totalPnl).toLocaleString('en-IN')}
            </span>
            <span className="text-[9px] font-bold">
              {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {saveToast && (
        <div className="p-3 rounded-2xl bg-[#12B76A]/15 border border-[#12B76A]/30 text-[#12B76A] flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveToast}</span>
          </div>
          <span className="text-[10px] opacity-75">MongoDB scenarioAnalysis</span>
        </div>
      )}

      {/* ================================================== */}
      {/* LIVE MONEY IMPACT PANEL                            */}
      {/* ================================================== */}
      <div className="bg-white/95 dark:bg-[#101828]/95 backdrop-blur-md rounded-3xl border border-[#DCE9EE] dark:border-[#1E293B] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE]/60 dark:border-[#1E293B] mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D2939] dark:text-white">
              Live Money Impact Panel
            </h3>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
              totalPnl >= 0 ? 'bg-[#12B76A] text-white' : 'bg-[#F04438] text-white'
            }`}>
              {totalPnl >= 0 ? 'PROFIT' : 'LOSS'}
            </span>
          </div>
          <span className="text-xs text-[#667085] dark:text-[#94A3B8] font-mono">
            Position: {lots} Lots ({totalQty} Qty)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
          <div className="p-3.5 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[11px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Current Premium</span>
            <span className="text-base font-bold text-[#1D2939] dark:text-white mt-1 block">
              ₹{currentPremium.toFixed(2)}
            </span>
            <span className="text-[10px] font-sans text-[#667085] mt-0.5 block">Baseline LTP</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#00778A]/10 dark:bg-[#00778A]/20 border border-[#00778A]/30">
            <span className="text-[11px] font-sans font-semibold text-[#00778A] dark:text-[#2DD4BF] block">New Premium</span>
            <span className="text-base font-bold text-[#00778A] dark:text-[#2DD4BF] mt-1 block">
              ₹{newPremium.toFixed(2)}
            </span>
            <span className="text-[10px] font-sans text-[#00778A] mt-0.5 block">Recalculated</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[11px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Difference</span>
            <span className={`text-base font-bold mt-1 block ${premiumDifference >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {premiumDifference >= 0 ? '+' : ''}₹{premiumDifference.toFixed(2)}
            </span>
            <span className="text-[10px] font-sans text-[#667085] mt-0.5 block">
              ({returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[11px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Profit Per Lot</span>
            <span className={`text-base font-bold mt-1 block ${pnlPerLot >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {pnlPerLot >= 0 ? '+' : ''}₹{Math.round(pnlPerLot).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-sans text-[#667085] mt-0.5 block">1 Lot ({lotSize} Qty)</span>
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            totalPnl >= 0 ? 'bg-[#12B76A]/10 border-[#12B76A]/30 text-[#12B76A]' : 'bg-[#F04438]/10 border-[#F04438]/30 text-[#F04438]'
          }`}>
            <span className="text-[11px] font-sans font-semibold block">Total Profit</span>
            <span className="text-lg font-extrabold mt-1 block">
              {totalPnl >= 0 ? '+' : ''}₹{Math.round(totalPnl).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-sans opacity-85 mt-0.5 block">
              {lots} Lots Total
            </span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* PRESET BUTTONS (Spot Move & IV Move)               */}
      {/* ================================================== */}
      <div className="bg-white/95 dark:bg-[#101828]/95 backdrop-blur-md rounded-3xl border border-[#DCE9EE] dark:border-[#1E293B] p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Spot Move Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#1D2939] dark:text-white mr-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#00778A] dark:text-[#2DD4BF]" />
              Spot Move:
            </span>
            {[100, 250, 500, 1000, 2000].map((pts) => (
              <button
                key={`spot-plus-${pts}`}
                type="button"
                onClick={() => handleSpotPreset(pts)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#12B76A]/10 text-[#12B76A] hover:bg-[#12B76A]/20 border border-[#12B76A]/20 transition-all cursor-pointer"
              >
                +{pts}
              </button>
            ))}
            {[-100, -250, -500, -1000, -2000].map((pts) => (
              <button
                key={`spot-minus-${pts}`}
                type="button"
                onClick={() => handleSpotPreset(pts)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#F04438]/10 text-[#F04438] hover:bg-[#F04438]/20 border border-[#F04438]/20 transition-all cursor-pointer"
              >
                {pts}
              </button>
            ))}
          </div>

          {/* IV Move Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#1D2939] dark:text-white mr-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#7F56D9]" />
              IV Move:
            </span>
            {[5, 10, 20].map((pct) => (
              <button
                key={`iv-plus-${pct}`}
                type="button"
                onClick={() => handleIvPreset(pct)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#7F56D9]/10 text-[#7F56D9] hover:bg-[#7F56D9]/20 border border-[#7F56D9]/20 transition-all cursor-pointer"
              >
                +{pct}%
              </button>
            ))}
            {[-5, -10].map((pct) => (
              <button
                key={`iv-minus-${pct}`}
                type="button"
                onClick={() => handleIvPreset(pct)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-all cursor-pointer"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 2-COLUMN MAIN INTERACTIVE WORKSPACE                */}
      {/* LEFT: Greeks Control Sliders (Sliders 1 to 8)     */}
      {/* RIGHT: Live Results (Premium, Greeks, P&L, etc.)   */}
      {/* ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================== */}
        {/* LEFT PANEL: Greeks Control Sliders         */}
        {/* ========================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white/95 dark:bg-[#101828]/95 backdrop-blur-md rounded-3xl border border-[#DCE9EE] dark:border-[#1E293B] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE]/60 dark:border-[#1E293B] mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00778A] dark:text-[#2DD4BF]" />
                <h3 className="text-sm font-bold text-[#1D2939] dark:text-white uppercase tracking-wider">
                  Left Panel: Greeks Control Sliders
                </h3>
              </div>
              <span className="text-[11px] text-[#00778A] dark:text-[#2DD4BF] font-semibold">
                8 Interactive Sliders
              </span>
            </div>

            <div className="space-y-4">
              {/* SLIDER 1: SPOT PRICE (100000 to 200000, step 1) */}
              <div className="p-3.5 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1D2939] dark:text-white">
                    SLIDER 1: SPOT PRICE
                  </span>
                  <button
                    type="button"
                    onClick={() => setModifiedSpot(baseSpot)}
                    className="text-[10px] text-[#00778A] dark:text-[#2DD4BF] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Current: <strong className="text-[#1D2939] dark:text-white">{Math.round(baseSpot)}</strong>
                  </span>
                  <span className="text-[#00778A] dark:text-[#2DD4BF]">
                    Modified: <strong>{Math.round(modifiedSpot)}</strong>
                  </span>
                  <span className={`font-bold ${modifiedSpot - baseSpot >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                    Difference: {modifiedSpot - baseSpot >= 0 ? `+${Math.round(modifiedSpot - baseSpot)}` : Math.round(modifiedSpot - baseSpot)}
                  </span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={200000}
                  step={1}
                  value={modifiedSpot}
                  onChange={(e) => setModifiedSpot(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00778A]"
                />
                <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#94A3B8] mt-1">
                  <span>₹1,00,000</span>
                  <span>Step: 1</span>
                  <span>₹2,00,000</span>
                </div>
              </div>

              {/* SLIDER 2: DELTA (-1 to +1, step 0.01) */}
              <div className="p-3.5 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1D2939] dark:text-white">
                    SLIDER 2: DELTA (Δ)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSliderDelta(Number(baselineGreeks.delta.toFixed(2)))}
                    className="text-[10px] text-[#00778A] dark:text-[#2DD4BF] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Current Delta: <strong className="text-[#1D2939] dark:text-white">{formatGreek(baselineGreeks.delta, 2)}</strong>
                  </span>
                  <span className="text-[#00778A] dark:text-[#2DD4BF]">
                    New Delta: <strong>{formatGreek(sliderDelta, 2)}</strong>
                  </span>
                  <span className={`font-bold ${deltaImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                    Premium Impact: {deltaImpact >= 0 ? '+' : ''}₹{deltaImpact.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={sliderDelta}
                  onChange={(e) => setSliderDelta(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00778A]"
                />
                <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#94A3B8] mt-1">
                  <span>-1.00</span>
                  <span>Range: -1 to +1 (Step: 0.01)</span>
                  <span>+1.00</span>
                </div>
              </div>

              {/* SLIDER 3: GAMMA (0 to 1, step 0.0001) */}
              <div className="p-3.5 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1D2939] dark:text-white">
                    SLIDER 3: GAMMA (Γ)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSliderGamma(Number(baselineGreeks.gamma.toFixed(4)))}
                    className="text-[10px] text-[#00778A] dark:text-[#2DD4BF] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between text-xs font-mono mb-2 gap-2">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Current Gamma: <strong className="text-[#1D2939] dark:text-white">{baselineGreeks.gamma.toFixed(4)}</strong>
                  </span>
                  <span className="text-[#12B76A]">
                    New Gamma: <strong>{sliderGamma.toFixed(4)}</strong>
                  </span>
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Delta Change: <strong>{(sliderGamma * spotDifference).toFixed(4)}</strong>
                  </span>
                  <span className="font-bold text-[#12B76A]">
                    Premium Impact: +₹{gammaImpact.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.0001}
                  value={sliderGamma}
                  onChange={(e) => setSliderGamma(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#12B76A]"
                />
                <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#94A3B8] mt-1">
                  <span>0.0000</span>
                  <span>Range: 0 to 1 (Step: 0.0001)</span>
                  <span>1.0000</span>
                </div>
              </div>

              {/* SLIDER 4: THETA (-500 to 0, step 1) */}
              <div className="p-3.5 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1D2939] dark:text-white">
                    SLIDER 4: THETA (θ)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSliderTheta(Math.round(baselineGreeks.theta))}
                    className="text-[10px] text-[#00778A] dark:text-[#2DD4BF] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Current Theta: <strong className="text-[#1D2939] dark:text-white">{baselineGreeks.theta.toFixed(1)}</strong>
                  </span>
                  <span className="text-[#F04438]">
                    New Theta: <strong>{sliderTheta}</strong>
                  </span>
                  <span className="text-[#F04438] font-bold">
                    Daily Premium Decay: ₹{Math.abs(sliderTheta).toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={-500}
                  max={0}
                  step={1}
                  value={sliderTheta}
                  onChange={(e) => setSliderTheta(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#F04438]"
                />
                <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#94A3B8] mt-1">
                  <span>-500</span>
                  <span>Range: -500 to 0 (Step: 1)</span>
                  <span>0</span>
                </div>
              </div>

              {/* SLIDER 5: VEGA (0 to 500, step 0.1) */}
              <div className="p-3.5 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1D2939] dark:text-white">
                    SLIDER 5: VEGA (ν)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSliderVega(Number(baselineGreeks.vega.toFixed(1)))}
                    className="text-[10px] text-[#00778A] dark:text-[#2DD4BF] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Current Vega: <strong className="text-[#1D2939] dark:text-white">{baselineGreeks.vega.toFixed(1)}</strong>
                  </span>
                  <span className="text-[#7F56D9]">
                    New Vega: <strong>{sliderVega.toFixed(1)}</strong>
                  </span>
                  <span className={`font-bold ${vegaImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                    Premium Impact: {vegaImpact >= 0 ? '+' : ''}₹{vegaImpact.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={0.1}
                  value={sliderVega}
                  onChange={(e) => setSliderVega(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#7F56D9]"
                />
                <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#94A3B8] mt-1">
                  <span>0.0</span>
                  <span>Range: 0 to 500 (Step: 0.1)</span>
                  <span>500.0</span>
                </div>
              </div>

              {/* SLIDER 6: IV (1 to 150, step 0.1) */}
              <div className="p-3.5 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1D2939] dark:text-white">
                    SLIDER 6: IV (Implied Volatility %)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSliderIv(Number(baseIv.toFixed(1)))}
                    className="text-[10px] text-[#00778A] dark:text-[#2DD4BF] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Current IV: <strong className="text-[#1D2939] dark:text-white">{baseIv.toFixed(1)}%</strong>
                  </span>
                  <span className="text-[#7F56D9]">
                    New IV: <strong>{sliderIv.toFixed(1)}%</strong>
                  </span>
                  <span className={`font-bold ${ivImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                    Premium Impact: {ivImpact >= 0 ? '+' : ''}₹{ivImpact.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={150}
                  step={0.1}
                  value={sliderIv}
                  onChange={(e) => setSliderIv(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#7F56D9]"
                />
                <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#94A3B8] mt-1">
                  <span>1.0%</span>
                  <span>Range: 1 to 150 (Step: 0.1)</span>
                  <span>150.0%</span>
                </div>
              </div>

              {/* SLIDER 7: RHO (-100 to 100, step 0.1) */}
              <div className="p-3.5 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1D2939] dark:text-white">
                    SLIDER 7: RHO (ρ)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSliderRho(Number(baselineGreeks.rho.toFixed(1)))}
                    className="text-[10px] text-[#00778A] dark:text-[#2DD4BF] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Current Rho: <strong className="text-[#1D2939] dark:text-white">{baselineGreeks.rho.toFixed(1)}</strong>
                  </span>
                  <span className="text-[#00778A] dark:text-[#2DD4BF]">
                    New Rho: <strong>{sliderRho.toFixed(1)}</strong>
                  </span>
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Premium Impact: ₹{(sliderRho * 0.01).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={0.1}
                  value={sliderRho}
                  onChange={(e) => setSliderRho(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00778A]"
                />
                <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#94A3B8] mt-1">
                  <span>-100.0</span>
                  <span>Range: -100 to 100 (Step: 0.1)</span>
                  <span>+100.0</span>
                </div>
              </div>

              {/* SLIDER 8: TIME DECAY (0 to 90 Days, step 1) */}
              <div className="p-3.5 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1D2939] dark:text-white">
                    SLIDER 8: TIME DECAY (Days To Expiry)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSliderDays(Math.min(90, Math.max(0, baseDays)))}
                    className="text-[10px] text-[#00778A] dark:text-[#2DD4BF] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    Current Days: <strong className="text-[#1D2939] dark:text-white">{baseDays}</strong>
                  </span>
                  <span className="text-[#F04438]">
                    Remaining Days: <strong>{sliderDays}</strong>
                  </span>
                  <span className="text-[#F04438] font-bold">
                    Premium Decay: -₹{Math.abs(thetaImpact).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={1}
                  value={sliderDays}
                  onChange={(e) => setSliderDays(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#F04438]"
                />
                <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#94A3B8] mt-1">
                  <span>0 Days (Expiry)</span>
                  <span>Range: 0 to 90 (Step: 1)</span>
                  <span>90 Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT PANEL: Live Results                  */}
        {/* ========================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/95 dark:bg-[#101828]/95 backdrop-blur-md rounded-3xl border border-[#DCE9EE] dark:border-[#1E293B] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE]/60 dark:border-[#1E293B] mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00778A] dark:text-[#2DD4BF]" />
                <h3 className="text-sm font-bold text-[#1D2939] dark:text-white uppercase tracking-wider">
                  Right Panel: Live Results
                </h3>
              </div>
              <span className="text-[11px] text-[#12B76A] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
                Live Recalculated
              </span>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              {/* Premium */}
              <div className="col-span-2 p-3.5 rounded-2xl bg-[#00778A]/10 dark:bg-[#00778A]/20 border border-[#00778A]/30">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans font-semibold text-[#00778A] dark:text-[#2DD4BF]">
                    Live Recalculated Premium
                  </span>
                  <span className={`text-xs font-bold ${premiumDifference >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                    {premiumDifference >= 0 ? '+' : ''}₹{premiumDifference.toFixed(2)} ({returnPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-[#00778A] dark:text-[#2DD4BF]">
                    ₹{newPremium.toFixed(2)}
                  </span>
                  <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
                    (Base: ₹{currentPremium.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Delta */}
              <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
                <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Delta (Δ)</span>
                <span className="text-base font-bold text-[#00778A] dark:text-[#2DD4BF] mt-0.5 block">
                  {formatGreek(liveGreeks.delta, 4)}
                </span>
                <span className="text-[9px] font-sans text-[#667085]">Base: {formatGreek(baselineGreeks.delta, 2)}</span>
              </div>

              {/* Gamma */}
              <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
                <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Gamma (Γ)</span>
                <span className="text-base font-bold text-[#12B76A] mt-0.5 block">
                  {liveGreeks.gamma.toFixed(6)}
                </span>
                <span className="text-[9px] font-sans text-[#667085]">Base: {baselineGreeks.gamma.toFixed(4)}</span>
              </div>

              {/* Theta */}
              <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
                <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Theta (θ)</span>
                <span className="text-base font-bold text-[#F04438] mt-0.5 block">
                  {liveGreeks.theta.toFixed(2)}
                </span>
                <span className="text-[9px] font-sans text-[#667085]">Base: {baselineGreeks.theta.toFixed(1)}</span>
              </div>

              {/* Vega */}
              <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
                <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Vega (ν)</span>
                <span className="text-base font-bold text-[#7F56D9] mt-0.5 block">
                  {liveGreeks.vega.toFixed(2)}
                </span>
                <span className="text-[9px] font-sans text-[#667085]">Base: {baselineGreeks.vega.toFixed(1)}</span>
              </div>

              {/* Rho */}
              <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
                <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Rho (ρ)</span>
                <span className="text-base font-bold text-[#1D2939] dark:text-white mt-0.5 block">
                  {liveGreeks.rho.toFixed(2)}
                </span>
                <span className="text-[9px] font-sans text-[#667085]">Base: {baselineGreeks.rho.toFixed(1)}</span>
              </div>

              {/* POP */}
              <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
                <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">POP (Probability of Profit)</span>
                <span className="text-base font-bold text-[#12B76A] mt-0.5 block">
                  {liveGreeks.pop.toFixed(1)}%
                </span>
                <span className="text-[9px] font-sans text-[#667085]">Base: {baselineGreeks.pop.toFixed(1)}%</span>
              </div>

              {/* Breakeven */}
              <div className="col-span-2 p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8]">
                    Breakeven Spot Price
                  </span>
                  <span className="text-[9px] font-sans text-[#667085]">
                    Base: ₹{Math.round(baselineGreeks.breakeven).toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-base font-bold text-[#1D2939] dark:text-white mt-0.5 block">
                  ₹{Math.round(liveGreeks.breakeven).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Intrinsic & Extrinsic Values */}
              <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
                <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Intrinsic Value</span>
                <span className="text-sm font-bold text-[#1D2939] dark:text-white mt-0.5 block">
                  ₹{liveGreeks.intrinsicValue.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/60 border border-[#DCE9EE] dark:border-[#334155]">
                <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Extrinsic (Time) Value</span>
                <span className="text-sm font-bold text-[#7F56D9] mt-0.5 block">
                  ₹{liveGreeks.extrinsicValue.toFixed(2)}
                </span>
              </div>

              {/* Net P&L Summary Block */}
              <div className={`col-span-2 p-3.5 rounded-2xl border ${
                totalPnl >= 0 ? 'bg-[#12B76A]/10 border-[#12B76A]/30 text-[#12B76A]' : 'bg-[#F04438]/10 border-[#F04438]/30 text-[#F04438]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans font-bold">TOTAL SIMULATED P&L</span>
                  <span className="text-xs font-bold">
                    Per Lot: {pnlPerLot >= 0 ? '+' : ''}₹{Math.round(pnlPerLot).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-xl font-extrabold mt-1">
                  {totalPnl >= 0 ? '+' : ''}₹{Math.round(totalPnl).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* CONTRIBUTION BREAKDOWN                             */}
      {/* ================================================== */}
      <div className="bg-white/95 dark:bg-[#101828]/95 backdrop-blur-md rounded-3xl border border-[#DCE9EE] dark:border-[#1E293B] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE]/60 dark:border-[#1E293B] mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1D2939] dark:text-white uppercase tracking-wider">
              Contribution Breakdown (Attribution Analysis)
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
              Decomposition of premium change across Spot, Delta, Gamma, Theta, Vega, IV, and Rho
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#667085] dark:text-[#94A3B8] block">Net Premium Change</span>
            <span className={`text-base font-mono font-bold ${premiumDifference >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {premiumDifference >= 0 ? '+' : ''}₹{premiumDifference.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 font-mono">
          {/* Spot Impact */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Spot Impact</span>
            <span className={`text-sm font-bold mt-1 block ${spotImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {spotImpact >= 0 ? '+' : ''}₹{spotImpact.toFixed(2)}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">
              {modifiedSpot - baseSpot >= 0 ? `+${Math.round(modifiedSpot - baseSpot)}` : Math.round(modifiedSpot - baseSpot)} pts
            </span>
          </div>

          {/* Delta Impact */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Delta Impact</span>
            <span className={`text-sm font-bold mt-1 block ${deltaImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {deltaImpact >= 0 ? '+' : ''}₹{deltaImpact.toFixed(2)}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">Δ × dS</span>
          </div>

          {/* Gamma Impact */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Gamma Impact</span>
            <span className={`text-sm font-bold mt-1 block ${gammaImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {gammaImpact >= 0 ? '+' : ''}₹{gammaImpact.toFixed(2)}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">0.5 × Γ × (dS)²</span>
          </div>

          {/* Theta Impact */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Theta Impact</span>
            <span className={`text-sm font-bold mt-1 block ${thetaImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {thetaImpact >= 0 ? '+' : ''}₹{thetaImpact.toFixed(2)}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">θ × dt</span>
          </div>

          {/* Vega Impact */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Vega Impact</span>
            <span className={`text-sm font-bold mt-1 block ${vegaImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {vegaImpact >= 0 ? '+' : ''}₹{vegaImpact.toFixed(2)}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">ν × dIV</span>
          </div>

          {/* IV Impact */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">IV Impact</span>
            <span className={`text-sm font-bold mt-1 block ${ivImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {ivImpact >= 0 ? '+' : ''}₹{ivImpact.toFixed(2)}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">{ivChange >= 0 ? `+${ivChange.toFixed(1)}` : ivChange.toFixed(1)}% IV</span>
          </div>

          {/* Rho Impact */}
          <div className="p-3 rounded-2xl bg-[#F7FAFB] dark:bg-[#1E293B]/70 border border-[#DCE9EE] dark:border-[#334155]">
            <span className="text-[10px] font-sans font-semibold text-[#667085] dark:text-[#94A3B8] block">Rho Impact</span>
            <span className={`text-sm font-bold mt-1 block ${rhoImpact >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {rhoImpact >= 0 ? '+' : ''}₹{rhoImpact.toFixed(2)}
            </span>
            <span className="text-[9px] font-sans text-[#667085]">Interest Rate</span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* SCENARIO COMPARISON: Current Market vs Scenario    */}
      {/* ================================================== */}
      <div className="bg-white/95 dark:bg-[#101828]/95 backdrop-blur-md rounded-3xl border border-[#DCE9EE] dark:border-[#1E293B] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE]/60 dark:border-[#1E293B] mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#00778A] dark:text-[#2DD4BF]" />
            <h3 className="text-sm font-bold text-[#1D2939] dark:text-white uppercase tracking-wider">
              Scenario Comparison: Current Market vs Scenario Market
            </h3>
          </div>
          <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
            Highlighted differences
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#DCE9EE] dark:border-[#334155] text-[#667085] dark:text-[#94A3B8]">
                <th className="py-2.5 px-3 font-sans">Column</th>
                <th className="py-2.5 px-3 font-sans">Current Market</th>
                <th className="py-2.5 px-3 font-sans">Scenario Market</th>
                <th className="py-2.5 px-3 font-sans">Difference / Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE9EE]/60 dark:divide-[#1E293B]">
              {/* Premium */}
              <tr>
                <td className="py-2.5 px-3 font-sans font-bold text-[#1D2939] dark:text-white">Premium</td>
                <td className="py-2.5 px-3">₹{currentPremium.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-bold text-[#00778A] dark:text-[#2DD4BF]">₹{newPremium.toFixed(2)}</td>
                <td className={`py-2.5 px-3 font-bold ${premiumDifference >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                  {premiumDifference >= 0 ? '+' : ''}₹{premiumDifference.toFixed(2)}
                </td>
              </tr>
              {/* Delta */}
              <tr>
                <td className="py-2.5 px-3 font-sans font-bold text-[#1D2939] dark:text-white">Delta (Δ)</td>
                <td className="py-2.5 px-3">{formatGreek(baselineGreeks.delta, 4)}</td>
                <td className="py-2.5 px-3 font-bold text-[#00778A] dark:text-[#2DD4BF]">{formatGreek(liveGreeks.delta, 4)}</td>
                <td className="py-2.5 px-3 text-[#667085] dark:text-[#94A3B8]">
                  {(liveGreeks.delta - baselineGreeks.delta >= 0 ? '+' : '') + (liveGreeks.delta - baselineGreeks.delta).toFixed(4)}
                </td>
              </tr>
              {/* Gamma */}
              <tr>
                <td className="py-2.5 px-3 font-sans font-bold text-[#1D2939] dark:text-white">Gamma (Γ)</td>
                <td className="py-2.5 px-3">{baselineGreeks.gamma.toFixed(6)}</td>
                <td className="py-2.5 px-3 font-bold text-[#12B76A]">{liveGreeks.gamma.toFixed(6)}</td>
                <td className="py-2.5 px-3 text-[#667085] dark:text-[#94A3B8]">
                  {(liveGreeks.gamma - baselineGreeks.gamma >= 0 ? '+' : '') + (liveGreeks.gamma - baselineGreeks.gamma).toFixed(6)}
                </td>
              </tr>
              {/* Theta */}
              <tr>
                <td className="py-2.5 px-3 font-sans font-bold text-[#1D2939] dark:text-white">Theta (θ)</td>
                <td className="py-2.5 px-3">{baselineGreeks.theta.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-bold text-[#F04438]">{liveGreeks.theta.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-[#667085] dark:text-[#94A3B8]">
                  {(liveGreeks.theta - baselineGreeks.theta >= 0 ? '+' : '') + (liveGreeks.theta - baselineGreeks.theta).toFixed(2)}
                </td>
              </tr>
              {/* Vega */}
              <tr>
                <td className="py-2.5 px-3 font-sans font-bold text-[#1D2939] dark:text-white">Vega (ν)</td>
                <td className="py-2.5 px-3">{baselineGreeks.vega.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-bold text-[#7F56D9]">{liveGreeks.vega.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-[#667085] dark:text-[#94A3B8]">
                  {(liveGreeks.vega - baselineGreeks.vega >= 0 ? '+' : '') + (liveGreeks.vega - baselineGreeks.vega).toFixed(2)}
                </td>
              </tr>
              {/* Rho */}
              <tr>
                <td className="py-2.5 px-3 font-sans font-bold text-[#1D2939] dark:text-white">Rho (ρ)</td>
                <td className="py-2.5 px-3">{baselineGreeks.rho.toFixed(2)}</td>
                <td className="py-2.5 px-3 font-bold text-[#1D2939] dark:text-white">{liveGreeks.rho.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-[#667085] dark:text-[#94A3B8]">
                  {(liveGreeks.rho - baselineGreeks.rho >= 0 ? '+' : '') + (liveGreeks.rho - baselineGreeks.rho).toFixed(2)}
                </td>
              </tr>
              {/* P&L */}
              <tr>
                <td className="py-2.5 px-3 font-sans font-bold text-[#1D2939] dark:text-white">P&L (Total)</td>
                <td className="py-2.5 px-3">₹0.00</td>
                <td className={`py-2.5 px-3 font-bold ${totalPnl >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                  {totalPnl >= 0 ? '+' : ''}₹{Math.round(totalPnl).toLocaleString('en-IN')}
                </td>
                <td className={`py-2.5 px-3 font-bold ${totalPnl >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                  {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
                </td>
              </tr>
              {/* Breakeven */}
              <tr>
                <td className="py-2.5 px-3 font-sans font-bold text-[#1D2939] dark:text-white">Breakeven Spot</td>
                <td className="py-2.5 px-3">₹{Math.round(baselineGreeks.breakeven).toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 font-bold text-[#1D2939] dark:text-white">₹{Math.round(liveGreeks.breakeven).toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-[#667085] dark:text-[#94A3B8]">
                  {(liveGreeks.breakeven - baselineGreeks.breakeven >= 0 ? '+' : '') + Math.round(liveGreeks.breakeven - baselineGreeks.breakeven)} pts
                </td>
              </tr>
              {/* POP */}
              <tr>
                <td className="py-2.5 px-3 font-sans font-bold text-[#1D2939] dark:text-white">POP (Prob. of Profit)</td>
                <td className="py-2.5 px-3">{baselineGreeks.pop.toFixed(1)}%</td>
                <td className="py-2.5 px-3 font-bold text-[#12B76A]">{liveGreeks.pop.toFixed(1)}%</td>
                <td className="py-2.5 px-3 text-[#667085] dark:text-[#94A3B8]">
                  {(liveGreeks.pop - baselineGreeks.pop >= 0 ? '+' : '') + (liveGreeks.pop - baselineGreeks.pop).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================== */}
      {/* CHARTS SUITE (Recharts)                            */}
      {/* Premium vs Spot, Premium vs IV, Premium vs Theta,  */}
      {/* Premium vs Vega, Premium vs Time, P&L vs Spot,     */}
      {/* P&L vs IV                                          */}
      {/* ================================================== */}
      <div className="bg-white/95 dark:bg-[#101828]/95 backdrop-blur-md rounded-3xl border border-[#DCE9EE] dark:border-[#1E293B] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#DCE9EE]/60 dark:border-[#1E293B] mb-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#00778A] dark:text-[#2DD4BF]" />
            <h3 className="text-base font-bold text-[#1D2939] dark:text-white">
              Dynamic Sensitivity Charts (Recharts)
            </h3>
          </div>

          {/* Chart Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveChart('spot')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChart === 'spot'
                  ? 'bg-white dark:bg-slate-700 text-[#00778A] dark:text-[#2DD4BF] shadow-xs'
                  : 'text-[#667085] dark:text-[#94A3B8]'
              }`}
            >
              Premium vs Spot
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('iv')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChart === 'iv'
                  ? 'bg-white dark:bg-slate-700 text-[#00778A] dark:text-[#2DD4BF] shadow-xs'
                  : 'text-[#667085] dark:text-[#94A3B8]'
              }`}
            >
              Premium vs IV
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('theta')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChart === 'theta'
                  ? 'bg-white dark:bg-slate-700 text-[#00778A] dark:text-[#2DD4BF] shadow-xs'
                  : 'text-[#667085] dark:text-[#94A3B8]'
              }`}
            >
              Premium vs Theta
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('vega')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChart === 'vega'
                  ? 'bg-white dark:bg-slate-700 text-[#00778A] dark:text-[#2DD4BF] shadow-xs'
                  : 'text-[#667085] dark:text-[#94A3B8]'
              }`}
            >
              Premium vs Vega
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('time')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChart === 'time'
                  ? 'bg-white dark:bg-slate-700 text-[#00778A] dark:text-[#2DD4BF] shadow-xs'
                  : 'text-[#667085] dark:text-[#94A3B8]'
              }`}
            >
              Premium vs Time
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('pnlSpot')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChart === 'pnlSpot'
                  ? 'bg-white dark:bg-slate-700 text-[#00778A] dark:text-[#2DD4BF] shadow-xs'
                  : 'text-[#667085] dark:text-[#94A3B8]'
              }`}
            >
              P&L vs Spot
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('pnlIv')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChart === 'pnlIv'
                  ? 'bg-white dark:bg-slate-700 text-[#00778A] dark:text-[#2DD4BF] shadow-xs'
                  : 'text-[#667085] dark:text-[#94A3B8]'
              }`}
            >
              P&L vs IV
            </button>
          </div>
        </div>

        {/* Chart 1: Premium vs Spot */}
        {activeChart === 'spot' && (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spotChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00778A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00778A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="spot" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Option Premium']}
                  labelFormatter={(lbl) => `Spot Price: ₹${Number(lbl).toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', borderColor: '#DCE9EE', fontSize: '12px' }}
                />
                <ReferenceLine x={Math.round(effectiveSpot)} stroke="#00778A" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Active Spot', position: 'top', fill: '#00778A', fontSize: 10 }} />
                <ReferenceLine x={Math.round(baseStrike)} stroke="#F79009" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'Strike', position: 'insideTopRight', fill: '#F79009', fontSize: 10 }} />
                <Area type="monotone" dataKey="premium" stroke="#00778A" strokeWidth={2.5} fillOpacity={1} fill="url(#premGrad)" name="premium" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 2: Premium vs IV */}
        {activeChart === 'iv' && (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ivChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="iv" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `${val}%`} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Option Premium']}
                  labelFormatter={(lbl) => `Implied Volatility: ${lbl}%`}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', borderColor: '#DCE9EE', fontSize: '12px' }}
                />
                <ReferenceLine x={Number(sliderIv.toFixed(1))} stroke="#7F56D9" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Active IV', position: 'top', fill: '#7F56D9', fontSize: 10 }} />
                <Line type="monotone" dataKey="premium" stroke="#7F56D9" strokeWidth={2.5} dot={{ r: 3 }} name="premium" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 3: Premium vs Theta */}
        {activeChart === 'theta' && (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={thetaChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="days" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `${val}d`} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    name === 'theta' ? Number(val).toFixed(2) : `₹${Number(val).toFixed(2)}`,
                    name === 'theta' ? 'Theta (θ)' : 'Option Premium'
                  ]}
                  labelFormatter={(lbl) => `Days To Expiry: ${lbl} Days`}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', borderColor: '#DCE9EE', fontSize: '12px' }}
                />
                <ReferenceLine x={sliderDays} stroke="#F04438" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Active Days', position: 'top', fill: '#F04438', fontSize: 10 }} />
                <Line type="monotone" dataKey="theta" stroke="#F04438" strokeWidth={2.5} dot={{ r: 2 }} name="theta" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 4: Premium vs Vega */}
        {activeChart === 'vega' && (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vegaChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="iv" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `${val}%`} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [Number(val).toFixed(2), 'Vega (ν)']}
                  labelFormatter={(lbl) => `IV: ${lbl}%`}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', borderColor: '#DCE9EE', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="vega" stroke="#7F56D9" strokeWidth={2.5} dot={{ r: 3 }} name="vega" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 5: Premium vs Time */}
        {activeChart === 'time' && (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={thetaChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F04438" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F04438" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="days" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `${val}d`} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Premium']}
                  labelFormatter={(lbl) => `Days Remaining: ${lbl} Days`}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', borderColor: '#DCE9EE', fontSize: '12px' }}
                />
                <ReferenceLine x={sliderDays} stroke="#F04438" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Active Days', position: 'top', fill: '#F04438', fontSize: 10 }} />
                <Area type="monotone" dataKey="premium" stroke="#F04438" strokeWidth={2.5} fillOpacity={1} fill="url(#timeGrad)" name="premium" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 6: P&L vs Spot */}
        {activeChart === 'pnlSpot' && (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spotChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#12B76A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#12B76A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="spot" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Math.round(Number(val)).toLocaleString('en-IN')}`, 'Total P&L']}
                  labelFormatter={(lbl) => `Spot Price: ₹${Number(lbl).toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', borderColor: '#DCE9EE', fontSize: '12px' }}
                />
                <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1.5} />
                <ReferenceLine x={Math.round(effectiveSpot)} stroke="#00778A" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Active Spot', position: 'top', fill: '#00778A', fontSize: 10 }} />
                <Area type="monotone" dataKey="pnl" stroke="#12B76A" strokeWidth={2.5} fillOpacity={1} fill="url(#pnlGrad)" name="pnl" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 7: P&L vs IV */}
        {activeChart === 'pnlIv' && (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ivChartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlIvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7F56D9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7F56D9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="iv" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `${val}%`} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Math.round(Number(val)).toLocaleString('en-IN')}`, 'Total P&L']}
                  labelFormatter={(lbl) => `IV: ${lbl}%`}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', borderColor: '#DCE9EE', fontSize: '12px' }}
                />
                <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1.5} />
                <ReferenceLine x={Number(sliderIv.toFixed(1))} stroke="#7F56D9" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Active IV', position: 'top', fill: '#7F56D9', fontSize: 10 }} />
                <Area type="monotone" dataKey="pnl" stroke="#7F56D9" strokeWidth={2.5} fillOpacity={1} fill="url(#pnlIvGrad)" name="pnl" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
