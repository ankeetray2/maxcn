import React, { useState, useMemo } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { calculateGreeks, formatCurrency, formatGreek } from '../../utils/greeks';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Copy,
  Download,
  Share2,
  RefreshCw,
  Eye
} from 'lucide-react';

interface PriceMovementSimulatorProps {
  onSelectMove?: (move: number, simulatedSpot: number) => void;
  onOpenSavedModal?: () => void;
}

export const PriceMovementSimulator: React.FC<PriceMovementSimulatorProps> = ({
  onSelectMove,
  onOpenSavedModal
}) => {
  const {
    calculator,
    calculatedResult,
    settings,
    isSavingDatabase,
    lastSaveStatus,
    saveScenarioAnalysisToMongoDB,
    savedScenarios
  } = useGreeksStore();

  // Selected expected move in points (default: +1000 as per prompt benchmark)
  const [selectedMove, setSelectedMove] = useState<number>(1000);
  const [customPointsInput, setCustomPointsInput] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Quick Move Preset Buttons as defined in user requirements
  const positiveMoves = [100, 250, 500, 1000, 1500, 2000];
  const negativeMoves = [-100, -250, -500, -1000, -1500, -2000];
  const customExamples = [500, 1200, -800, 2500];

  // Dynamic Spot Price Calculation
  const currentPrice = calculator.spotPrice;
  const newPrice = Math.max(0.01, currentPrice + selectedMove);

  // Recalculate Greeks in real-time for the new price using Black-Scholes
  const simulatedGreeks = useMemo(() => {
    return calculateGreeks(
      newPrice,
      calculator.strikePrice,
      calculator.expiryDays,
      calculator.volatility,
      calculator.interestRate,
      calculator.optionType,
      settings.pricingModel,
      calculator.contracts,
      calculator.lotSize
    );
  }, [newPrice, calculator, settings.pricingModel]);

  // P&L Analysis
  const currentPremium = calculatedResult.price;
  const futurePremium = simulatedGreeks.price;
  const premiumChange = futurePremium - currentPremium;
  const pnlPerLot = premiumChange * calculator.lotSize;
  const totalQuantity = calculator.contracts * calculator.lotSize;
  const pnlTotal = premiumChange * totalQuantity;
  const returnPercentage = currentPremium > 0 ? (premiumChange / currentPremium) * 100 : 0;

  // Handler for setting points
  const handleSelectMove = (points: number) => {
    setSelectedMove(points);
    const simSpot = Math.max(0.01, currentPrice + points);
    if (onSelectMove) {
      onSelectMove(points, simSpot);
    }
  };

  const handleCustomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customPointsInput);
    if (!isNaN(val)) {
      handleSelectMove(val);
    }
  };

  // Scenario Table Rows: -2000, -1500, -1000, -500, 0, +500, +1000, +1500, +2000
  const standardTableMoves = [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000];
  const tableMoves = useMemo(() => {
    if (!standardTableMoves.includes(selectedMove)) {
      return Array.from(new Set([...standardTableMoves, selectedMove])).sort((a, b) => a - b);
    }
    return standardTableMoves;
  }, [selectedMove]);

  const scenarioTableData = useMemo(() => {
    return tableMoves.map((pts) => {
      const spot = Math.max(0.01, currentPrice + pts);
      const res = calculateGreeks(
        spot,
        calculator.strikePrice,
        calculator.expiryDays,
        calculator.volatility,
        calculator.interestRate,
        calculator.optionType,
        settings.pricingModel,
        calculator.contracts,
        calculator.lotSize
      );
      const premDiff = res.price - currentPremium;
      const lotPnl = premDiff * calculator.lotSize;
      const totPnl = premDiff * totalQuantity;
      return {
        move: pts,
        simulatedPrice: spot,
        delta: res.delta,
        gamma: res.gamma,
        theta: res.theta,
        vega: res.vega,
        rho: res.rho,
        premium: res.price,
        pnlPerLot: lotPnl,
        pnlTotal: totPnl,
        returnPercent: currentPremium > 0 ? (premDiff / currentPremium) * 100 : 0
      };
    });
  }, [tableMoves, currentPrice, currentPremium, calculator, settings.pricingModel, totalQuantity]);

  // Save to MongoDB collection: scenarioAnalysis
  const handleSaveToMongoDB = async () => {
    const payload = {
      commodity: calculator.commodity === 'GOLD' ? 'Gold Mini' : calculator.commodity,
      currentPrice,
      strike: calculator.strikePrice,
      optionType: (calculator.optionType === 'CALL' ? 'CE' : 'PE') as 'CE' | 'PE',
      iv: calculator.volatility,
      daysToExpiry: calculator.expiryDays,
      lots: calculator.contracts,
      lotSize: calculator.lotSize,
      movePoints: selectedMove,
      recalculatedGreeks: {
        delta: Number(simulatedGreeks.delta.toFixed(4)),
        gamma: Number(simulatedGreeks.gamma.toFixed(6)),
        theta: Number(simulatedGreeks.theta.toFixed(2)),
        vega: Number(simulatedGreeks.vega.toFixed(2)),
        rho: Number(simulatedGreeks.rho.toFixed(2)),
        premium: Number(simulatedGreeks.price.toFixed(2)),
        intrinsicValue: Number(simulatedGreeks.intrinsicValue.toFixed(2)),
        extrinsicValue: Number(simulatedGreeks.extrinsicValue.toFixed(2))
      },
      pnl: {
        currentPremium: Number(currentPremium.toFixed(2)),
        futurePremium: Number(futurePremium.toFixed(2)),
        premiumChange: Number(premiumChange.toFixed(2)),
        pnlPerLot: Number(pnlPerLot.toFixed(2)),
        pnlTotal: Number(pnlTotal.toFixed(2)),
        returnPercentage: Number(returnPercentage.toFixed(2))
      }
    };

    const success = await saveScenarioAnalysisToMongoDB(payload);
    if (success) {
      setSaveSuccessMsg(`Saved to MongoDB (scenarioAnalysis): ${selectedMove >= 0 ? '+' : ''}${selectedMove} pts`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  const copyScenarioData = () => {
    const summary = `Scenario Analysis: ${calculator.commodity} ${calculator.strikePrice} ${calculator.optionType}
Current Price: ₹${currentPrice} | Move: ${selectedMove >= 0 ? '+' : ''}${selectedMove} | New Price: ₹${newPrice}
Delta: ${simulatedGreeks.delta.toFixed(4)} | Gamma: ${simulatedGreeks.gamma.toFixed(6)} | Theta: ${simulatedGreeks.theta.toFixed(2)} | Vega: ${simulatedGreeks.vega.toFixed(2)}
Current Premium: ₹${currentPremium.toFixed(2)} -> Future: ₹${futurePremium.toFixed(2)} (Δ ₹${premiumChange.toFixed(2)})
Total P&L (${calculator.contracts} Lots x ${calculator.lotSize}): ₹${pnlTotal.toFixed(2)} (${returnPercentage.toFixed(2)}%)`;
    navigator.clipboard.writeText(summary);
    setSaveSuccessMsg('Scenario details copied to clipboard!');
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. PRICE MOVEMENT SIMULATOR CARD */}
      <div className="bg-white/90 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]/60 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#1D2939]">Price Movement Simulator</h3>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#00778A]/10 text-[#00778A]">
                Expected Move Engine
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Simulate market point shifts and calculate real-time Greeks, multi-lot P&L, and scenario payoffs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToMongoDB}
              disabled={isSavingDatabase}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#00778A] hover:bg-[#00778A]/90 rounded-xl transition-all shadow-xs disabled:opacity-50"
            >
              <Database className={`w-3.5 h-3.5 ${isSavingDatabase ? 'animate-pulse' : ''}`} />
              <span>{isSavingDatabase ? 'Saving to MongoDB...' : 'Save Scenario to MongoDB'}</span>
            </button>

            {onOpenSavedModal && (
              <button
                onClick={onOpenSavedModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#00778A] bg-[#00778A]/10 hover:bg-[#00778A]/20 rounded-xl transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Saved ({savedScenarios.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Save confirmation toast banner */}
        {saveSuccessMsg && (
          <div className="mb-5 p-3 rounded-xl bg-[#12B76A]/10 border border-[#12B76A]/30 text-[#12B76A] text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccessMsg}</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-white/70 rounded">
              Collection: scenarioAnalysis
            </span>
          </div>
        )}

        {/* Real-time Recalculation Equation Banner */}
        <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00778A]/10 text-[#00778A] flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#667085] font-semibold uppercase tracking-wider">
                Real-Time Spot Shift Formula
              </div>
              <div className="text-sm font-mono font-bold text-[#1D2939] flex items-center gap-2 mt-0.5">
                <span>Current Price: ₹{currentPrice.toLocaleString('en-IN')}</span>
                <span className="text-[#667085]">+</span>
                <span className={`px-2 py-0.5 rounded-lg ${selectedMove >= 0 ? 'bg-[#12B76A]/15 text-[#12B76A]' : 'bg-[#F04438]/15 text-[#F04438]'}`}>
                  {selectedMove >= 0 ? `+${selectedMove}` : selectedMove}
                </span>
                <span className="text-[#667085]">=</span>
                <span className="text-[#00778A] bg-white px-2.5 py-0.5 rounded-lg border border-[#DCE9EE]">
                  New Price: ₹{Math.round(newPrice).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-[#667085]">Expected Move</div>
              <div className="text-lg font-mono font-bold text-[#1D2939]">
                [ {selectedMove >= 0 ? `+${selectedMove}` : selectedMove} ]
              </div>
            </div>
            <button
              onClick={() => handleSelectMove(1000)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE9EE] text-xs font-semibold text-[#667085] hover:text-[#00778A]"
              title="Reset to benchmark +1000"
            >
              Reset +1000
            </button>
          </div>
        </div>

        {/* Buttons Section: Positive Shocks & Negative Shocks */}
        <div className="space-y-4 mb-6">
          {/* Positive Moves */}
          <div>
            <div className="text-xs font-bold text-[#1D2939] mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#12B76A]" />
              <span>Upside Market Moves (+ Points):</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {positiveMoves.map((pts) => (
                <button
                  key={pts}
                  onClick={() => handleSelectMove(pts)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                    selectedMove === pts
                      ? 'bg-[#12B76A] text-white border-[#12B76A] shadow-xs scale-[1.02]'
                      : 'bg-white text-[#1D2939] border-[#DCE9EE] hover:border-[#12B76A] hover:bg-[#12B76A]/5'
                  }`}
                >
                  +{pts}
                </button>
              ))}
            </div>
          </div>

          {/* Negative Moves */}
          <div>
            <div className="text-xs font-bold text-[#1D2939] mb-2 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#F04438]" />
              <span>Downside Market Moves (- Points):</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {negativeMoves.map((pts) => (
                <button
                  key={pts}
                  onClick={() => handleSelectMove(pts)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                    selectedMove === pts
                      ? 'bg-[#F04438] text-white border-[#F04438] shadow-xs scale-[1.02]'
                      : 'bg-white text-[#1D2939] border-[#DCE9EE] hover:border-[#F04438] hover:bg-[#F04438]/5'
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Input Form */}
        <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
                Enter Custom Points:
              </label>
              <form onSubmit={handleCustomInputSubmit} className="flex items-center gap-2 max-w-md">
                <input
                  type="number"
                  value={customPointsInput}
                  onChange={(e) => setCustomPointsInput(e.target.value)}
                  placeholder="e.g. 500, 1200, -800, 2500"
                  className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl bg-white border border-[#DCE9EE] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 focus:border-[#00778A]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#00778A] text-white rounded-xl hover:bg-[#00778A]/90 transition-all"
                >
                  Apply Move
                </button>
              </form>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#667085] block mb-1">
                Examples:
              </span>
              <div className="flex items-center gap-1.5">
                {customExamples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => {
                      setCustomPointsInput(String(ex));
                      handleSelectMove(ex);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                      selectedMove === ex
                        ? 'bg-[#00778A] text-white border-[#00778A]'
                        : 'bg-white text-[#1D2939] border-[#DCE9EE] hover:border-[#00778A]'
                    }`}
                  >
                    {ex > 0 ? `+${ex}` : ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME RECALCULATION & P&L ANALYSIS HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* P&L Analysis Highlights (5 cols) */}
        <div className="lg:col-span-5 bg-white/90 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE]/60 mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-[#1D2939]">P&L Analysis</h4>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  pnlTotal >= 0 ? 'bg-[#12B76A]/10 text-[#12B76A]' : 'bg-[#F04438]/10 text-[#F04438]'
                }`}>
                  {pnlTotal >= 0 ? 'Profit' : 'Loss'}
                </span>
              </div>
              <span className="text-xs text-[#667085]">
                {calculator.contracts} Lots × {calculator.lotSize} Size = {totalQuantity.toLocaleString()} Units
              </span>
            </div>

            {/* Premium Comparison */}
            <div className="space-y-3 font-mono text-xs mb-5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7FAFB] border border-[#DCE9EE]/70">
                <span className="text-[#667085] font-sans">Current Premium:</span>
                <span className="font-bold text-[#1D2939]">
                  {formatCurrency(currentPremium, settings.currency, 2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7FAFB] border border-[#DCE9EE]/70">
                <span className="text-[#667085] font-sans">Future Premium:</span>
                <span className="font-bold text-[#00778A]">
                  {formatCurrency(futurePremium, settings.currency, 2)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#DCE9EE]">
                <span className="text-[#667085] font-sans font-semibold">Premium Change:</span>
                <span className={`font-bold ${premiumChange >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                  {premiumChange >= 0 ? '+' : ''}{formatCurrency(premiumChange, settings.currency, 2)} ({returnPercentage.toFixed(2)}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#DCE9EE]">
                <span className="text-[#667085] font-sans font-semibold">Profit/Loss per Lot:</span>
                <span className={`font-bold ${pnlPerLot >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                  {pnlPerLot >= 0 ? '+' : ''}{formatCurrency(pnlPerLot, settings.currency, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Big Total Profit/Loss Card */}
          <div className={`p-4 rounded-2xl border ${
            pnlTotal >= 0
              ? 'bg-[#12B76A]/10 border-[#12B76A]/30 text-[#12B76A]'
              : 'bg-[#F04438]/10 border-[#F04438]/30 text-[#F04438]'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">
                Total Profit / Loss ({calculator.contracts} Lots)
              </span>
              <span className="text-xs font-bold font-mono">
                {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(2)}%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold">
              {pnlTotal >= 0 ? '+' : ''}{formatCurrency(pnlTotal, settings.currency, 2)}
            </div>
            <div className="text-[11px] text-[#667085] mt-1 font-sans">
              Based on {selectedMove >= 0 ? `+${selectedMove}` : selectedMove} pts move from ₹{currentPrice.toLocaleString('en-IN')} to ₹{Math.round(newPrice).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Recalculated Greeks Card (7 cols) */}
        <div className="lg:col-span-7 bg-white/90 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE]/60 mb-4">
            <div>
              <h4 className="text-base font-bold text-[#1D2939]">Recalculated Black-Scholes Greeks</h4>
              <p className="text-xs text-[#667085]">
                Delta, Gamma, Theta, Vega, Rho, Premium, Intrinsic Value, Extrinsic Value
              </p>
            </div>
            <button
              onClick={copyScenarioData}
              className="flex items-center gap-1 text-xs text-[#667085] hover:text-[#00778A] p-1.5 rounded-lg hover:bg-[#F7FAFB]"
              title="Copy details"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Delta */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
              <div className="text-[11px] font-semibold text-[#667085]">Delta (Δ)</div>
              <div className="text-lg font-mono font-bold text-[#00778A] mt-0.5">
                {formatGreek(simulatedGreeks.delta, 4)}
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Base: {formatGreek(calculatedResult.delta, 4)}
              </div>
            </div>

            {/* Gamma */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
              <div className="text-[11px] font-semibold text-[#667085]">Gamma (Γ)</div>
              <div className="text-lg font-mono font-bold text-[#7A9266] mt-0.5">
                {simulatedGreeks.gamma.toFixed(6)}
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Base: {calculatedResult.gamma.toFixed(6)}
              </div>
            </div>

            {/* Theta */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
              <div className="text-[11px] font-semibold text-[#667085]">Theta (θ/day)</div>
              <div className="text-lg font-mono font-bold text-[#F04438] mt-0.5">
                {simulatedGreeks.theta.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Base: {calculatedResult.theta.toFixed(2)}
              </div>
            </div>

            {/* Vega */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
              <div className="text-[11px] font-semibold text-[#667085]">Vega (ν/1% IV)</div>
              <div className="text-lg font-mono font-bold text-[#12B76A] mt-0.5">
                {simulatedGreeks.vega.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Base: {calculatedResult.vega.toFixed(2)}
              </div>
            </div>

            {/* Rho */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
              <div className="text-[11px] font-semibold text-[#667085]">Rho (ρ/1% Rate)</div>
              <div className="text-lg font-mono font-bold text-[#1D2939] mt-0.5">
                {simulatedGreeks.rho.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Base: {calculatedResult.rho.toFixed(2)}
              </div>
            </div>

            {/* Premium */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
              <div className="text-[11px] font-semibold text-[#667085]">Recalculated Premium</div>
              <div className="text-lg font-mono font-bold text-[#00778A] mt-0.5">
                ₹{simulatedGreeks.price.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Base: ₹{currentPremium.toFixed(2)}
              </div>
            </div>

            {/* Intrinsic Value */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
              <div className="text-[11px] font-semibold text-[#667085]">Intrinsic Value</div>
              <div className="text-lg font-mono font-bold text-[#1D2939] mt-0.5">
                ₹{simulatedGreeks.intrinsicValue.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Moneyness: {simulatedGreeks.moneyness}
              </div>
            </div>

            {/* Extrinsic Value */}
            <div className="p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
              <div className="text-[11px] font-semibold text-[#667085]">Extrinsic Value</div>
              <div className="text-lg font-mono font-bold text-[#1D2939] mt-0.5">
                ₹{simulatedGreeks.extrinsicValue.toFixed(2)}
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Time Value Risk
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SCENARIO TABLE (Automatically generated: -2000, -1500, -1000, -500, 0, +500, +1000, +1500, +2000) */}
      <div className="bg-white/90 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]/60 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-[#1D2939]">Scenario Analysis Matrix</h4>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#00778A]/10 text-[#00778A]">
                Move • Price • Delta • Gamma • Theta • Vega • P&L
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Click any scenario row to instantly simulate that move across all metrics and charts
            </p>
          </div>

          <div className="text-xs text-[#667085]">
            Highlighted row = Active Expected Move ({selectedMove >= 0 ? `+${selectedMove}` : selectedMove})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE9EE] text-[#667085] uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Move (Points)</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Delta (Δ)</th>
                <th className="py-3 px-3">Gamma (Γ)</th>
                <th className="py-3 px-3">Theta (θ)</th>
                <th className="py-3 px-3">Vega (ν)</th>
                <th className="py-3 px-3">Premium</th>
                <th className="py-3 px-3 text-right">P&L per Lot</th>
                <th className="py-3 px-3 text-right font-bold">Total P&L</th>
                <th className="py-3 px-3 text-right">Return %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE9EE]/60 font-mono">
              {scenarioTableData.map((row) => {
                const isActive = row.move === selectedMove;
                const isZero = row.move === 0;

                return (
                  <tr
                    key={row.move}
                    onClick={() => handleSelectMove(row.move)}
                    className={`cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#00778A]/10 font-bold text-[#1D2939] border-l-4 border-l-[#00778A]'
                        : isZero
                        ? 'bg-[#F7FAFB] text-[#1D2939]'
                        : 'hover:bg-[#F7FAFB] text-[#1D2939]'
                    }`}
                  >
                    <td className="py-3 px-3 font-sans flex items-center gap-1.5">
                      {isActive && <span className="w-2 h-2 rounded-full bg-[#00778A]" />}
                      <span className={row.move > 0 ? 'text-[#12B76A]' : row.move < 0 ? 'text-[#F04438]' : 'text-[#667085]'}>
                        {row.move === 0 ? '0 (Current)' : row.move > 0 ? `+${row.move}` : row.move}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      ₹{Math.round(row.simulatedPrice).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-[#00778A]">{formatGreek(row.delta, 4)}</td>
                    <td className="py-3 px-3 text-[#7A9266]">{row.gamma.toFixed(6)}</td>
                    <td className="py-3 px-3 text-[#F04438]">{row.theta.toFixed(2)}</td>
                    <td className="py-3 px-3 text-[#12B76A]">{row.vega.toFixed(2)}</td>
                    <td className="py-3 px-3 font-semibold">₹{row.premium.toFixed(2)}</td>
                    <td className={`py-3 px-3 text-right ${row.pnlPerLot >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                      {row.pnlPerLot >= 0 ? '+' : ''}₹{Math.round(row.pnlPerLot).toLocaleString('en-IN')}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${row.pnlTotal >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                      {row.pnlTotal >= 0 ? '+' : ''}₹{Math.round(row.pnlTotal).toLocaleString('en-IN')}
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold ${row.returnPercent >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                      {row.returnPercent >= 0 ? '+' : ''}{row.returnPercent.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
