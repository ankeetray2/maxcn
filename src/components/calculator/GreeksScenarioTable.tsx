import React, { useState } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  TrendingDown,
  Database,
  Check,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  exportGreeksReportExcel,
  exportGreeksReportCsv,
  printOrDownloadPdfReport
} from '../../utils/excel';

interface GreeksScenarioTableProps {
  onSelectMove?: (points: number) => void;
  selectedMove?: number;
}

export const GreeksScenarioTable: React.FC<GreeksScenarioTableProps> = ({
  onSelectMove,
  selectedMove = 0
}) => {
  const {
    scenarioPoints,
    calculator,
    calculatedResult,
    manualGreeks,
    marketGreeks,
    calculationMode,
    saveGreekCalculationToMongoDB,
    isSavingDatabase
  } = useGreeksStore();

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Standard requested points: -2000, -1500, -1000, -500, 0, +500, +1000, +1500, +2000
  // Filter or map scenarioPoints to ensure these exact rows are displayed cleanly
  const requiredMoves = [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000];

  const rows = requiredMoves.map((m) => {
    const existing = scenarioPoints.find((s) => s.spotMove === m);
    if (existing) {
      return {
        priceMove: existing.spotMove,
        newPrice: existing.simulatedSpot,
        premium: existing.recalculatedPremium,
        delta: existing.delta,
        gamma: existing.gamma,
        theta: existing.theta,
        vega: existing.vega,
        rho: existing.rho,
        pnl: existing.totalPnl,
        unitPnl: existing.unitPnl
      };
    }
    // Fallback if not yet loaded in scenarioPoints
    const newPrice = Math.max(1, calculator.spotPrice + m);
    return {
      priceMove: m,
      newPrice,
      premium: calculatedResult.price,
      delta: calculatedResult.delta,
      gamma: calculatedResult.gamma,
      theta: calculatedResult.theta,
      vega: calculatedResult.vega,
      rho: calculatedResult.rho,
      pnl: 0,
      unitPnl: 0
    };
  });

  const handleExportExcel = () => {
    exportGreeksReportExcel({
      commodity: calculator.commodity,
      spotPrice: calculator.spotPrice,
      strike: calculator.strikePrice,
      optionType: calculator.optionType === 'CALL' ? 'CE' : 'PE',
      expiry: calculator.expiryDays,
      iv: calculator.volatility,
      lots: calculator.contracts,
      lotSize: calculator.lotSize,
      mode: calculationMode,
      calculatedGreeks: {
        delta: calculatedResult.delta,
        gamma: calculatedResult.gamma,
        theta: calculatedResult.theta,
        vega: calculatedResult.vega,
        rho: calculatedResult.rho,
        pop: calculatedResult.pop,
        premium: calculatedResult.price,
        breakeven: calculatedResult.breakeven,
        intrinsicValue: calculatedResult.intrinsicValue,
        extrinsicValue: calculatedResult.extrinsicValue
      },
      marketGreeks: {
        delta: marketGreeks.delta,
        gamma: marketGreeks.gamma,
        theta: marketGreeks.theta,
        vega: marketGreeks.vega,
        rho: marketGreeks.rho,
        pop: marketGreeks.pop,
        premium: marketGreeks.premium,
        source: marketGreeks.source
      },
      scenarioRows: rows
    });
  };

  const handleExportCsv = () => {
    exportGreeksReportCsv({
      commodity: calculator.commodity,
      spotPrice: calculator.spotPrice,
      strike: calculator.strikePrice,
      optionType: calculator.optionType === 'CALL' ? 'CE' : 'PE',
      expiry: calculator.expiryDays,
      iv: calculator.volatility,
      lots: calculator.contracts,
      lotSize: calculator.lotSize,
      mode: calculationMode,
      calculatedGreeks: {
        delta: calculatedResult.delta,
        gamma: calculatedResult.gamma,
        theta: calculatedResult.theta,
        vega: calculatedResult.vega,
        rho: calculatedResult.rho,
        pop: calculatedResult.pop,
        premium: calculatedResult.price,
        breakeven: calculatedResult.breakeven,
        intrinsicValue: calculatedResult.intrinsicValue,
        extrinsicValue: calculatedResult.extrinsicValue
      },
      scenarioRows: rows
    });
  };

  const handlePrintPdf = () => {
    printOrDownloadPdfReport({
      commodity: calculator.commodity,
      spotPrice: calculator.spotPrice,
      strike: calculator.strikePrice,
      optionType: calculator.optionType === 'CALL' ? 'CE' : 'PE',
      expiry: calculator.expiryDays,
      iv: calculator.volatility,
      lots: calculator.contracts,
      lotSize: calculator.lotSize,
      mode: calculationMode,
      calculatedGreeks: {
        delta: calculatedResult.delta,
        gamma: calculatedResult.gamma,
        theta: calculatedResult.theta,
        vega: calculatedResult.vega,
        rho: calculatedResult.rho,
        pop: calculatedResult.pop,
        premium: calculatedResult.price,
        breakeven: calculatedResult.breakeven,
        intrinsicValue: calculatedResult.intrinsicValue,
        extrinsicValue: calculatedResult.extrinsicValue
      },
      marketGreeks: {
        delta: marketGreeks.delta,
        gamma: marketGreeks.gamma,
        theta: marketGreeks.theta,
        vega: marketGreeks.vega,
        rho: marketGreeks.rho,
        pop: marketGreeks.pop,
        premium: marketGreeks.premium,
        source: marketGreeks.source
      },
      scenarioRows: rows
    });
  };

  const handleSaveToDb = async () => {
    const success = await saveGreekCalculationToMongoDB();
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div id="greeks-scenario-table-section" className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-6 rounded-[22px] border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#E4E7EC] dark:border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#1D2939] dark:text-white">
              Price Movement Scenario Analysis Matrix (-2,000 to +2,000 Points)
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#00778A]/10 text-[#00778A] dark:bg-[#2DD4BF]/20 dark:text-[#2DD4BF]">
              {rows.length} Scenarios
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
            Click any scenario row to instantly lock that spot price and simulate sensitivity
          </p>
        </div>

        {/* Action Toolbar: Excel, CSV, PDF, MongoDB */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#12B76A] bg-[#12B76A]/10 hover:bg-[#12B76A]/20 transition-all border border-[#12B76A]/20 cursor-pointer"
            title="Export Excel (.xlsx) report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#475467] dark:text-[#CBD5E1] bg-[#F2F4F7] dark:bg-[#1E293B] hover:bg-[#E4E7EC] transition-all cursor-pointer"
            title="Export CSV (.csv) table"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#00778A] dark:text-[#2DD4BF] bg-[#00778A]/10 dark:bg-[#00778A]/25 hover:bg-[#00778A]/20 transition-all cursor-pointer"
            title="Download institutional printable PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download PDF Report</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToDb}
            disabled={isSavingDatabase}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#00778A] hover:bg-[#005B6A] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="Save scenario & calculation to MongoDB greekCalculations collection"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#12B76A]" />
                <span>Saved to MongoDB!</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>{isSavingDatabase ? 'Saving...' : 'Save to MongoDB'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Responsive Scenario Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E4E7EC] dark:border-[#1E293B] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="pb-3 pl-2">Price Move</th>
              <th className="pb-3">New Price</th>
              <th className="pb-3">Premium</th>
              <th className="pb-3">Delta (Δ)</th>
              <th className="pb-3">Gamma (Γ)</th>
              <th className="pb-3">Theta (θ)</th>
              <th className="pb-3">Vega (ν)</th>
              <th className="pb-3">Rho (ρ)</th>
              <th className="pb-3 pr-2 text-right">P&L (Total ₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F4F7] dark:divide-[#1E293B]">
            {rows.map((row, i) => {
              const isSelected = selectedMove === row.priceMove;
              const isBaseline = row.priceMove === 0;
              const isPositivePnl = row.pnl >= 0;

              return (
                <tr
                  key={i}
                  onClick={() => onSelectMove && onSelectMove(row.priceMove)}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#00778A]/10 dark:bg-[#00778A]/20 font-semibold'
                      : isBaseline
                      ? 'bg-[#F8FAFC] dark:bg-[#1E293B]/40'
                      : 'hover:bg-[#F8FAFB] dark:hover:bg-[#1E293B]/30'
                  }`}
                >
                  <td className="py-2.5 pl-2">
                    <div className="flex items-center gap-1.5 font-mono font-bold">
                      {isBaseline ? (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[#E4E7EC] dark:bg-[#334155] text-[#344054] dark:text-[#CBD5E1]">
                          0 (Baseline)
                        </span>
                      ) : row.priceMove > 0 ? (
                        <span className="flex items-center text-[#12B76A] dark:text-[#4ADE80]">
                          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                          +{row.priceMove}
                        </span>
                      ) : (
                        <span className="flex items-center text-[#D92D20] dark:text-[#F87171]">
                          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                          {row.priceMove}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 font-mono text-[#1D2939] dark:text-white font-semibold">
                    ₹{row.newPrice.toLocaleString('en-IN')}
                  </td>

                  <td className="py-2.5 font-mono font-bold text-[#00778A] dark:text-[#2DD4BF]">
                    ₹{row.premium.toFixed(2)}
                  </td>

                  <td className="py-2.5 font-mono text-[#1D2939] dark:text-white">
                    {row.delta.toFixed(4)}
                  </td>

                  <td className="py-2.5 font-mono text-[#475467] dark:text-[#CBD5E1]">
                    {row.gamma.toFixed(5)}
                  </td>

                  <td className="py-2.5 font-mono text-[#D92D20] dark:text-[#F87171]">
                    ₹{row.theta.toFixed(2)}
                  </td>

                  <td className="py-2.5 font-mono text-[#7F56D9] dark:text-[#C084FC]">
                    ₹{row.vega.toFixed(2)}
                  </td>

                  <td className="py-2.5 font-mono text-[#B54708] dark:text-[#FBBF24]">
                    ₹{row.rho.toFixed(2)}
                  </td>

                  <td className="py-2.5 pr-2 text-right">
                    <span
                      className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md inline-block ${
                        isBaseline
                          ? 'text-[#64748B] bg-[#F2F4F7] dark:bg-[#1E293B]'
                          : isPositivePnl
                          ? 'text-[#12B76A] dark:text-[#4ADE80] bg-[#12B76A]/10 dark:bg-[#12B76A]/20'
                          : 'text-[#D92D20] dark:text-[#F87171] bg-[#D92D20]/10 dark:bg-[#D92D20]/20'
                      }`}
                    >
                      {row.pnl >= 0 ? `+₹${row.pnl.toLocaleString('en-IN')}` : `-₹${Math.abs(row.pnl).toLocaleString('en-IN')}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
