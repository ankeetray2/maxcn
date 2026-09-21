import React, { useState, useMemo } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { calculateGreeks, formatCurrency, formatGreek, spotForTargetDelta } from '../../utils/greeks';
import { getCommoditySpec } from '../../services/mockData';
import {
  Sliders,
  Sparkles,
  Database,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Calendar,
  Layers
} from 'lucide-react';

export const GreeksSliderMatrix: React.FC = () => {
  const {
    calculator,
    calculatedResult,
    selectedCommodity,
    settings,
    setCalculatorInput,
    saveScenarioAnalysisToMongoDB,
    isSavingDatabase
  } = useGreeksStore();

  const spec = getCommoditySpec(selectedCommodity);

  // Baseline ATM values
  const baseSpot = calculator.spotPrice;
  const baseStrike = calculator.strikePrice;
  const baseIv = calculator.volatility;
  const baseDays = calculator.expiryDays;
  const baseOptionType = calculator.optionType;

  // Active Multi-Variable Sliders State
  const [spotPercent, setSpotPercent] = useState<number>(0);
  const [deltaTargetOffset, setDeltaTargetOffset] = useState<number>(0);
  const [ivPercent, setIvPercent] = useState<number>(0);
  const [daysValue, setDaysValue] = useState<number>(baseDays);
  const [selectedStrike, setSelectedStrike] = useState<number>(baseStrike);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Calculate equivalent spot adjustment from Delta slider using exact Black-Scholes inversion
  const deltaEquivalentSpot = useMemo(() => {
    if (deltaTargetOffset === 0) return 0;
    const isCall = baseOptionType === 'CALL';
    const rawTargetDelta = calculatedResult.delta + deltaTargetOffset;
    const clampedTargetDelta = isCall
      ? Math.max(0.01, Math.min(0.99, rawTargetDelta))
      : Math.max(-0.99, Math.min(-0.01, rawTargetDelta));

    const targetSpot = spotForTargetDelta(
      clampedTargetDelta,
      selectedStrike,
      daysValue,
      baseIv + ivPercent,
      calculator.interestRate,
      baseOptionType
    );
    return targetSpot - baseSpot;
  }, [deltaTargetOffset, calculatedResult.delta, baseOptionType, selectedStrike, daysValue, baseIv, ivPercent, calculator.interestRate, baseSpot]);

  // Net simulated spot price
  const simulatedSpot = Math.max(
    10,
    baseSpot * (1 + spotPercent / 100) + deltaEquivalentSpot
  );

  const simulatedIV = Math.max(1, Math.min(150, baseIv + ivPercent));
  const simulatedDays = Math.max(1, daysValue);

  // Real-time Greeks calculation for slider combination
  const matrixGreeks = useMemo(() => {
    return calculateGreeks(
      simulatedSpot,
      selectedStrike,
      simulatedDays,
      simulatedIV,
      calculator.interestRate,
      baseOptionType,
      settings.pricingModel,
      calculator.contracts,
      calculator.lotSize || spec?.lotSize || 100
    );
  }, [
    simulatedSpot,
    selectedStrike,
    simulatedDays,
    simulatedIV,
    calculator.interestRate,
    baseOptionType,
    settings.pricingModel,
    calculator.contracts,
    calculator.lotSize,
    spec
  ]);

  // Differential and P&L metrics
  const premiumDiff = matrixGreeks.price - calculatedResult.price;
  const totalQty = calculator.contracts * (calculator.lotSize || spec?.lotSize || 100);
  const totalPnl = premiumDiff * totalQty;
  const returnPercent = calculatedResult.price > 0 ? (premiumDiff / calculatedResult.price) * 100 : 0;

  const handleResetAll = () => {
    setSpotPercent(0);
    setDeltaTargetOffset(0);
    setIvPercent(0);
    setDaysValue(baseDays);
    setSelectedStrike(baseStrike);
  };

  const handleApplyToActiveCalculator = () => {
    setCalculatorInput({
      spotPrice: Math.round(simulatedSpot),
      strikePrice: selectedStrike,
      volatility: Number(simulatedIV.toFixed(1)),
      expiryDays: simulatedDays
    });
    setSaveToast('Active Calculator inputs updated to current slider matrix parameters!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveToMongoDB = async () => {
    const success = await saveScenarioAnalysisToMongoDB({
      commodity: selectedCommodity,
      currentPrice: baseSpot,
      strike: selectedStrike,
      optionType: baseOptionType,
      iv: Number(simulatedIV.toFixed(1)),
      daysToExpiry: simulatedDays,
      lots: calculator.contracts,
      lotSize: calculator.lotSize || spec?.lotSize || 100,
      movePoints: Math.round(simulatedSpot - baseSpot),
      recalculatedGreeks: matrixGreeks,
      pnl: {
        currentPremium: calculatedResult.price,
        futurePremium: matrixGreeks.price,
        premiumChange: premiumDiff,
        pnlPerLot: premiumDiff * (calculator.lotSize || spec?.lotSize || 100),
        totalPnl,
        returnPercentage: returnPercent
      }
    });

    if (success) {
      setSaveToast('Scenario saved successfully to MongoDB collection: scenarioAnalysis!');
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  return (
    <div id="greeks-slider-matrix" className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-[24px] bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md border border-[#00778A]/30 dark:border-[#2DD4BF]/30 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00778A]/10 dark:bg-[#00778A]/25 text-[#00778A] dark:text-[#2DD4BF] flex items-center justify-center font-bold">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1D2939] dark:text-white">
                  Interactive Greeks & Delta Slider Matrix
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#12B76A]/15 text-[#12B76A]">
                  Real-Time Engine
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                Dynamically shift Delta, Spot Price, Implied Volatility, and Expiry Days with instant Black-Scholes recalculation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#344054] dark:text-[#CBD5E1] bg-[#F2F4F7] dark:bg-[#1E293B] hover:bg-[#E4E7EC] rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Matrix</span>
            </button>

            <button
              onClick={handleApplyToActiveCalculator}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#00778A] hover:bg-[#006070] rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Apply to Calculator</span>
            </button>

            <button
              onClick={handleSaveToMongoDB}
              disabled={isSavingDatabase}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#12B76A] hover:bg-[#0E9355] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Save to MongoDB</span>
            </button>
          </div>
        </div>

        {saveToast && (
          <div className="mt-4 p-3 rounded-xl bg-[#12B76A]/10 border border-[#12B76A]/30 text-[#12B76A] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveToast}</span>
          </div>
        )}
      </div>

      {/* Main 5-Slider Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLIDER 1: Delta (Δ) Dynamic Slider */}
        <div className="p-5 rounded-[22px] bg-white dark:bg-[#101828] border border-[#00778A]/20 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00778A]" />
              <label className="text-sm font-bold text-[#1D2939] dark:text-white">
                Delta (Δ) Sensitivity Slider
              </label>
            </div>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg ${
              deltaTargetOffset > 0 ? 'bg-[#12B76A]/15 text-[#12B76A]' : deltaTargetOffset < 0 ? 'bg-[#F04438]/15 text-[#F04438]' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}>
              {deltaTargetOffset >= 0 ? `+${deltaTargetOffset.toFixed(2)}` : deltaTargetOffset.toFixed(2)} Δ
              {' '}(Simulated: {matrixGreeks.delta.toFixed(3)})
            </span>
          </div>
          <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] mb-3">
            Inverts Black-Scholes gamma to project required underlying spot movement for target Delta
          </p>
          <input
            type="range"
            min="-0.40"
            max="0.40"
            step="0.01"
            value={deltaTargetOffset}
            onChange={(e) => setDeltaTargetOffset(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 accent-[#00778A] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#667085] mt-1.5 font-mono">
            <span>-0.40 OTM Move</span>
            <span>ATM Baseline ({calculatedResult.delta.toFixed(2)})</span>
            <span>+0.40 ITM Surge</span>
          </div>
        </div>

        {/* SLIDER 2: Underlying Spot Price Slider */}
        <div className="p-5 rounded-[22px] bg-white dark:bg-[#101828] border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#12B76A]" />
              <label className="text-sm font-bold text-[#1D2939] dark:text-white">
                Underlying Spot Move (% & Points)
              </label>
            </div>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg ${
              spotPercent > 0 ? 'bg-[#12B76A]/15 text-[#12B76A]' : spotPercent < 0 ? 'bg-[#F04438]/15 text-[#F04438]' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}>
              {spotPercent >= 0 ? `+${spotPercent}%` : `${spotPercent}%`} (₹{Math.round(simulatedSpot).toLocaleString('en-IN')})
            </span>
          </div>
          <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] mb-3">
            Simulate market rally or plunge from baseline spot ₹{baseSpot.toLocaleString('en-IN')}
          </p>
          <input
            type="range"
            min="-15"
            max="15"
            step="0.5"
            value={spotPercent}
            onChange={(e) => setSpotPercent(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 accent-[#12B76A] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#667085] mt-1.5 font-mono">
            <span>-15% Shock</span>
            <span>0% Baseline</span>
            <span>+15% Bull Surge</span>
          </div>
        </div>

        {/* SLIDER 3: Implied Volatility (IV) Slider */}
        <div className="p-5 rounded-[22px] bg-white dark:bg-[#101828] border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F79009]" />
              <label className="text-sm font-bold text-[#1D2939] dark:text-white">
                Implied Volatility Shift
              </label>
            </div>
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg ${
              ivPercent > 0 ? 'bg-[#F79009]/15 text-[#F79009]' : ivPercent < 0 ? 'bg-[#F04438]/15 text-[#F04438]' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}>
              {ivPercent >= 0 ? `+${ivPercent}%` : `${ivPercent}%`} (IV {simulatedIV.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] mb-3">
            Simulate Vega volatility crush following events or sudden volatility spikes
          </p>
          <input
            type="range"
            min="-20"
            max="25"
            step="0.5"
            value={ivPercent}
            onChange={(e) => setIvPercent(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 accent-[#F79009] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#667085] mt-1.5 font-mono">
            <span>-20% Vol Crush</span>
            <span>Baseline ({baseIv}%)</span>
            <span>+25% Vol Spike</span>
          </div>
        </div>

        {/* SLIDER 4: Days to Expiry (Theta Decay) Slider */}
        <div className="p-5 rounded-[22px] bg-white dark:bg-[#101828] border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#F04438]" />
              <label className="text-sm font-bold text-[#1D2939] dark:text-white">
                Days to Expiry (Theta Time Decay)
              </label>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#F04438]/15 text-[#F04438]">
              {daysValue} Days Remaining ({Math.max(0, baseDays - daysValue)} Days Elapsed)
            </span>
          </div>
          <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] mb-3">
            Simulate accelerated Theta calendar decay as contract approaches MCX expiry
          </p>
          <input
            type="range"
            min="1"
            max={Math.max(60, baseDays)}
            step="1"
            value={daysValue}
            onChange={(e) => setDaysValue(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 accent-[#F04438] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#667085] mt-1.5 font-mono">
            <span>1 Day (Zero Extrinsic)</span>
            <span>{Math.round(baseDays / 2)} Days</span>
            <span>{Math.max(60, baseDays)} Days</span>
          </div>
        </div>
      </div>

      {/* Recalculated Results & Greek Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
        {/* Delta */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101828] border border-[#00778A]/30 shadow-xs">
          <div className="text-xs text-[#667085] dark:text-[#94A3B8] font-bold">Delta (Δ)</div>
          <div className="text-xl font-mono font-extrabold text-[#00778A] dark:text-[#2DD4BF] mt-1">
            {formatGreek(matrixGreeks.delta, settings.decimalPrecision)}
          </div>
          <div className="text-[10px] text-[#667085] mt-0.5">
            Base: {formatGreek(calculatedResult.delta, 3)}
          </div>
        </div>

        {/* Gamma */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101828] border border-[#12B76A]/30 shadow-xs">
          <div className="text-xs text-[#667085] dark:text-[#94A3B8] font-bold">Gamma (Γ)</div>
          <div className="text-xl font-mono font-extrabold text-[#12B76A] mt-1">
            {formatGreek(matrixGreeks.gamma, 5)}
          </div>
          <div className="text-[10px] text-[#667085] mt-0.5">
            Curvature Rate
          </div>
        </div>

        {/* Theta */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101828] border border-[#F04438]/30 shadow-xs">
          <div className="text-xs text-[#667085] dark:text-[#94A3B8] font-bold">Theta (θ / day)</div>
          <div className="text-xl font-mono font-extrabold text-[#F04438] mt-1">
            {formatGreek(matrixGreeks.theta, 2)}
          </div>
          <div className="text-[10px] text-[#667085] mt-0.5">
            Decay / Day
          </div>
        </div>

        {/* Vega */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101828] border border-[#F79009]/30 shadow-xs">
          <div className="text-xs text-[#667085] dark:text-[#94A3B8] font-bold">Vega (ν / 1% IV)</div>
          <div className="text-xl font-mono font-extrabold text-[#F79009] mt-1">
            {formatGreek(matrixGreeks.vega, 2)}
          </div>
          <div className="text-[10px] text-[#667085] mt-0.5">
            Per 1% Vol
          </div>
        </div>

        {/* Option Premium */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#101828] border border-[#00778A]/20 shadow-xs">
          <div className="text-xs text-[#667085] dark:text-[#94A3B8] font-bold">New Premium</div>
          <div className="text-xl font-mono font-extrabold text-[#1D2939] dark:text-white mt-1">
            {formatCurrency(matrixGreeks.price, settings.currency, 2)}
          </div>
          <div className={`text-[10px] font-bold mt-0.5 ${premiumDiff >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
            {premiumDiff >= 0 ? '+' : ''}{premiumDiff.toFixed(2)} ({returnPercent.toFixed(1)}%)
          </div>
        </div>

        {/* Total P&L */}
        <div className={`p-4 rounded-2xl border shadow-xs ${
          totalPnl >= 0
            ? 'bg-[#12B76A]/10 border-[#12B76A]/30 text-[#12B76A]'
            : 'bg-[#F04438]/10 border-[#F04438]/30 text-[#F04438]'
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider">Total P&L</div>
          <div className="text-xl font-mono font-extrabold mt-1">
            {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl, settings.currency, 0)}
          </div>
          <div className="text-[10px] opacity-80 mt-0.5">
            {calculator.contracts} Lots ({totalQty} Units)
          </div>
        </div>
      </div>
    </div>
  );
};
