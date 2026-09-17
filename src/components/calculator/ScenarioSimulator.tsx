import React, { useState } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { formatCurrency, formatGreek } from '../../utils/greeks';
import { TrendingUp, TrendingDown, RefreshCw, Plus, Play, Sparkles, ShieldAlert } from 'lucide-react';

export const ScenarioSimulator: React.FC = () => {
  const {
    scenarioPoints,
    isLoadingScenario,
    runScenarioSimulation,
    calculator,
    calculatedResult,
    settings
  } = useGreeksStore();

  const [customMoveInput, setCustomMoveInput] = useState<string>('');

  const handleAddCustomMove = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customMoveInput);
    if (!isNaN(val) && val !== 0) {
      const standardMoves = [-1000, -500, -100, 100, 500, 1000];
      const combined = Array.from(new Set([...standardMoves, val])).sort((a, b) => a - b);
      runScenarioSimulation(combined);
      setCustomMoveInput('');
    }
  };

  const handlePresetSimulation = (moves: number[]) => {
    runScenarioSimulation(moves);
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 shadow-sm">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]/60 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[#1D2939]">Spot Price Scenario Simulator</h3>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#00778A]/10 text-[#00778A]">
              Black-Scholes Multi-Greek Engine
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Simulates market shocks (+100, +500, +1000, -100, -500, -1000) & recalculates all 5 Greeks with position P&L
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => runScenarioSimulation()}
            disabled={isLoadingScenario}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#00778A] hover:bg-[#00778A]/90 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingScenario ? 'animate-spin' : ''}`} />
            <span>{isLoadingScenario ? 'Simulating...' : 'Recalculate Scenarios'}</span>
          </button>
        </div>
      </div>

      {/* Preset shock filters & Custom Move Input */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-[#F7FAFB] rounded-2xl border border-[#DCE9EE]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#667085]">Quick Shocks:</span>
          <button
            onClick={() => handlePresetSimulation([-1000, -500, -100, 100, 500, 1000])}
            className="px-2.5 py-1 text-xs rounded-lg bg-white border border-[#DCE9EE] text-[#1D2939] hover:border-[#00778A] hover:text-[#00778A] transition-all"
          >
            Standard (±100, ±500, ±1000)
          </button>
          <button
            onClick={() => handlePresetSimulation([-2000, -1000, -300, 300, 1000, 2000])}
            className="px-2.5 py-1 text-xs rounded-lg bg-white border border-[#DCE9EE] text-[#1D2939] hover:border-[#00778A] hover:text-[#00778A] transition-all"
          >
            High Volatility
          </button>
          <button
            onClick={() => handlePresetSimulation([-50, -25, -10, 10, 25, 50])}
            className="px-2.5 py-1 text-xs rounded-lg bg-white border border-[#DCE9EE] text-[#1D2939] hover:border-[#00778A] hover:text-[#00778A] transition-all"
          >
            Micro Shocks (±10, ±25, ±50)
          </button>
        </div>

        {/* Custom move form */}
        <form onSubmit={handleAddCustomMove} className="flex items-center gap-2">
          <input
            type="number"
            value={customMoveInput}
            onChange={(e) => setCustomMoveInput(e.target.value)}
            placeholder="Custom move (e.g. +750, -250)"
            className="px-3 py-1.5 text-xs rounded-xl bg-white border border-[#DCE9EE] focus:outline-none focus:ring-1 focus:ring-[#00778A] w-48 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium bg-[#00778A] text-white rounded-xl hover:bg-[#00778A]/90 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Scenarios Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#DCE9EE] text-[#667085] uppercase tracking-wider font-semibold">
              <th className="py-3 px-3">Spot Scenario</th>
              <th className="py-3 px-3">Simulated Spot</th>
              <th className="py-3 px-3">Premium</th>
              <th className="py-3 px-3">Delta (Δ)</th>
              <th className="py-3 px-3">Gamma (Γ)</th>
              <th className="py-3 px-3">Theta (Θ/d)</th>
              <th className="py-3 px-3">Vega (V)</th>
              <th className="py-3 px-3">Rho (ρ)</th>
              <th className="py-3 px-3 text-right">Unit P&L</th>
              <th className="py-3 px-3 text-right">Total Position P&L</th>
              <th className="py-3 px-3 text-right">Return %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE9EE]/60 font-mono">
            {/* Current Baseline Row */}
            <tr className="bg-[#00778A]/5 font-semibold text-[#1D2939]">
              <td className="py-3 px-3 font-sans flex items-center gap-1.5 text-[#00778A]">
                <span className="w-2 h-2 rounded-full bg-[#00778A]" />
                Current Baseline
              </td>
              <td className="py-3 px-3">{formatCurrency(calculator.spotPrice, settings.currency, 2)}</td>
              <td className="py-3 px-3 text-[#00778A] font-bold">
                {formatCurrency(calculatedResult.price, settings.currency, 2)}
              </td>
              <td className="py-3 px-3">{formatGreek(calculatedResult.delta, 4)}</td>
              <td className="py-3 px-3">{calculatedResult.gamma.toFixed(6)}</td>
              <td className="py-3 px-3 text-[#F04438]">{calculatedResult.theta.toFixed(2)}</td>
              <td className="py-3 px-3 text-[#12B76A]">{calculatedResult.vega.toFixed(2)}</td>
              <td className="py-3 px-3">{calculatedResult.rho.toFixed(2)}</td>
              <td className="py-3 px-3 text-right">₹0.00</td>
              <td className="py-3 px-3 text-right">₹0.00</td>
              <td className="py-3 px-3 text-right">0.00%</td>
            </tr>

            {/* Scenario points */}
            {scenarioPoints.map((pt, idx) => {
              const isPositive = pt.totalPnl > 0;
              const isZero = pt.totalPnl === 0;

              return (
                <tr
                  key={idx}
                  className="hover:bg-[#F7FAFB] transition-colors text-[#1D2939]"
                >
                  <td className="py-3 px-3 font-sans font-medium flex items-center gap-1.5">
                    {pt.spotMove > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-[#12B76A]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-[#F04438]" />
                    )}
                    <span>{pt.moveLabel}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold">
                    {formatCurrency(pt.simulatedSpot, settings.currency, 2)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#1D2939]">
                    {formatCurrency(pt.recalculatedPremium, settings.currency, 2)}
                  </td>
                  <td className="py-3 px-3 text-[#00778A]">{formatGreek(pt.delta, 4)}</td>
                  <td className="py-3 px-3 text-[#667085]">{pt.gamma.toFixed(6)}</td>
                  <td className="py-3 px-3 text-[#F04438]">{pt.theta.toFixed(2)}</td>
                  <td className="py-3 px-3 text-[#12B76A]">{pt.vega.toFixed(2)}</td>
                  <td className="py-3 px-3 text-[#667085]">{pt.rho.toFixed(2)}</td>
                  <td className={`py-3 px-3 text-right font-semibold ${
                    isZero ? 'text-[#667085]' : isPositive ? 'text-[#12B76A]' : 'text-[#F04438]'
                  }`}>
                    {pt.unitPnl > 0 ? '+' : ''}{formatCurrency(pt.unitPnl, settings.currency, 2)}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${
                    isZero ? 'text-[#667085]' : isPositive ? 'text-[#12B76A]' : 'text-[#F04438]'
                  }`}>
                    {pt.totalPnl > 0 ? '+' : ''}{formatCurrency(pt.totalPnl, settings.currency, 2)}
                  </td>
                  <td className={`py-3 px-3 text-right font-bold ${
                    isZero ? 'text-[#667085]' : isPositive ? 'text-[#12B76A]' : 'text-[#F04438]'
                  }`}>
                    {pt.returnPercentage > 0 ? '+' : ''}{pt.returnPercentage.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Position context footer */}
      <div className="mt-4 pt-3 border-t border-[#DCE9EE]/60 flex flex-wrap items-center justify-between text-xs text-[#667085]">
        <div>
          Position Size: <strong className="text-[#1D2939]">{calculatedResult.lots} Lots</strong> × {calculatedResult.lotSize} ({calculatedResult.totalQuantity} total units)
        </div>
        <div>
          Current Total Outlay / Margin: <strong className="text-[#1D2939]">{formatCurrency(calculatedResult.positionValue, settings.currency, 2)}</strong>
        </div>
      </div>
    </div>
  );
};
