import React, { useState, useEffect } from 'react';
import { GreekForm } from '../../components/calculator/GreekForm';
import { ModeSelector } from '../../components/calculator/ModeSelector';
import { ManualGreeksEntry } from '../../components/calculator/ManualGreeksEntry';
import { ScreenshotAutoFill } from '../../components/calculator/ScreenshotAutoFill';
import { MarketVsTheoreticalGreeks } from '../../components/calculator/MarketVsTheoreticalGreeks';
import { AdvancedGreeksResults } from '../../components/calculator/AdvancedGreeksResults';
import { PriceMovementSimulator } from '../../components/calculator/PriceMovementSimulator';
import { GreeksScenarioTable } from '../../components/calculator/GreeksScenarioTable';
import { SavedScenariosModal } from '../../components/calculator/SavedScenariosModal';
import { GreekCalculationsModal } from '../../components/calculator/GreekCalculationsModal';
import { ScenarioSimulator } from '../../components/calculator/ScenarioSimulator';
import { GreeksSliderMatrix } from '../../components/calculator/GreeksSliderMatrix';
import { AdvancedGreeksCharts } from '../../components/charts/AdvancedGreeksCharts';
import { useGreeksStore } from '../../store/useGreeksStore';
import {
  exportGreeksReportExcel,
  exportGreeksReportCsv,
  printOrDownloadPdfReport
} from '../../utils/excel';
import {
  Calculator,
  BarChart3,
  LineChart,
  Sliders,
  Database,
  Table,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const CalculatorView: React.FC = () => {
  const {
    calculationMode,
    runScenarioSimulation,
    scenarioPoints,
    savedScenarios,
    fetchSavedScenarios,
    savedGreekCalculations,
    fetchGreekCalculationsFromMongoDB,
    calculator,
    calculatedResult,
    manualGreeks,
    marketGreeks,
    loadDraft
  } = useGreeksStore();

  const [activeVisualizerTab, setActiveVisualizerTab] = useState<
    'priceSimulator' | 'scenarioTable' | 'chartsSuite' | 'sliderMatrix'
  >('priceSimulator');

  const [isSavedScenariosModalOpen, setIsSavedScenariosModalOpen] = useState<boolean>(false);
  const [isGreekCalculationsModalOpen, setIsGreekCalculationsModalOpen] = useState<boolean>(false);
  const [activeMovePoints, setActiveMovePoints] = useState<number>(1000);

  useEffect(() => {
    loadDraft();
    if (scenarioPoints.length === 0) {
      runScenarioSimulation();
    }
    fetchSavedScenarios();
    fetchGreekCalculationsFromMongoDB();
  }, [runScenarioSimulation, scenarioPoints.length, fetchSavedScenarios, fetchGreekCalculationsFromMongoDB, loadDraft]);

  // Handler for exporting from top bar
  const handleExportExcel = () => {
    const rows = [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000].map((m) => {
      const existing = scenarioPoints.find((s) => s.spotMove === m);
      return {
        priceMove: m,
        newPrice: existing?.simulatedSpot ?? (calculator.spotPrice + m),
        premium: existing?.recalculatedPremium ?? calculatedResult.price,
        delta: existing?.delta ?? calculatedResult.delta,
        gamma: existing?.gamma ?? calculatedResult.gamma,
        theta: existing?.theta ?? calculatedResult.theta,
        vega: existing?.vega ?? calculatedResult.vega,
        rho: existing?.rho ?? calculatedResult.rho,
        pnl: existing?.totalPnl ?? 0
      };
    });

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
    const rows = [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000].map((m) => {
      const existing = scenarioPoints.find((s) => s.spotMove === m);
      return {
        priceMove: m,
        newPrice: existing?.simulatedSpot ?? (calculator.spotPrice + m),
        premium: existing?.recalculatedPremium ?? calculatedResult.price,
        delta: existing?.delta ?? calculatedResult.delta,
        gamma: existing?.gamma ?? calculatedResult.gamma,
        theta: existing?.theta ?? calculatedResult.theta,
        vega: existing?.vega ?? calculatedResult.vega,
        rho: existing?.rho ?? calculatedResult.rho,
        pnl: existing?.totalPnl ?? 0
      };
    });

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
    const rows = [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000].map((m) => {
      const existing = scenarioPoints.find((s) => s.spotMove === m);
      return {
        priceMove: m,
        newPrice: existing?.simulatedSpot ?? (calculator.spotPrice + m),
        premium: existing?.recalculatedPremium ?? calculatedResult.price,
        delta: existing?.delta ?? calculatedResult.delta,
        gamma: existing?.gamma ?? calculatedResult.gamma,
        theta: existing?.theta ?? calculatedResult.theta,
        vega: existing?.vega ?? calculatedResult.vega,
        rho: existing?.rho ?? calculatedResult.rho,
        pnl: existing?.totalPnl ?? 0
      };
    });

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

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar: Platform Header & Export Shortcuts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#1D2939] dark:text-white tracking-tight">
              Advanced Greeks Calculator
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-[#00778A]/10 text-[#00778A] dark:bg-[#2DD4BF]/20 dark:text-[#2DD4BF]">
              MCX Commodity Options
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-0.5">
            Institutional Black-Scholes Engine • Delta, Gamma, Theta, Vega, Rho, POP, Breakeven & Price Shift Sensitivity
          </p>
        </div>

        {/* Action Buttons: Export Excel, Export CSV, Download PDF, View MongoDB Collections */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#12B76A] bg-[#12B76A]/10 hover:bg-[#12B76A]/20 transition-all border border-[#12B76A]/20 cursor-pointer"
            title="Export Excel spreadsheet report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#475467] dark:text-[#CBD5E1] bg-[#F2F4F7] dark:bg-[#1E293B] hover:bg-[#E4E7EC] transition-all cursor-pointer"
            title="Export CSV data"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#00778A] dark:text-[#2DD4BF] bg-[#00778A]/10 dark:bg-[#00778A]/25 hover:bg-[#00778A]/20 transition-all cursor-pointer"
            title="Download PDF Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF Report</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGreekCalculationsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#00778A] hover:bg-[#005B6A] transition-all shadow-xs cursor-pointer"
            title="View persistent calculations saved in MongoDB greekCalculations collection"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Saved ({savedGreekCalculations.length})</span>
          </button>
        </div>
      </div>

      {/* 1. Mode Selection (Auto Calculate, Manual Greeks Entry, Screenshot Auto Fill) */}
      <ModeSelector />

      {/* 2. Conditional Mode Panels */}
      {calculationMode === 'manual' && <ManualGreeksEntry />}
      {calculationMode === 'screenshot' && <ScreenshotAutoFill />}

      {/* 3. Common Inputs Section (Commodity, Spot, Strike, CE/PE, Expiry, IV, Lots, Lot Size) */}
      <GreekForm />

      {/* 4. Market Greeks vs Theoretical Greeks Comparison Card */}
      <MarketVsTheoreticalGreeks />

      {/* 5. Results Section (Current Premium, Future Premium, Delta, Gamma, Theta, Vega, Rho, POP, Breakeven, Intrinsic, Extrinsic) */}
      <AdvancedGreeksResults expectedMovePoints={activeMovePoints} />

      {/* 6. Visualizer Navigation Tabs (Price Movement Simulator, Scenario Table, Greek Charts Suite, Slider Matrix) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md rounded-2xl border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveVisualizerTab('priceSimulator')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeVisualizerTab === 'priceSimulator'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] dark:text-[#94A3B8] hover:text-[#1D2939] hover:bg-[#F7FAFB] dark:hover:bg-[#1E293B]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Price Movement Simulator (Expected Move)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveVisualizerTab('scenarioTable')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeVisualizerTab === 'scenarioTable'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] dark:text-[#94A3B8] hover:text-[#1D2939] hover:bg-[#F7FAFB] dark:hover:bg-[#1E293B]'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Scenario Table (-2,000 to +2,000 Pts)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveVisualizerTab('chartsSuite')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeVisualizerTab === 'chartsSuite'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] dark:text-[#94A3B8] hover:text-[#1D2939] hover:bg-[#F7FAFB] dark:hover:bg-[#1E293B]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Greek Curves & POP Chart</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveVisualizerTab('sliderMatrix')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeVisualizerTab === 'sliderMatrix'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] dark:text-[#94A3B8] hover:text-[#1D2939] hover:bg-[#F7FAFB] dark:hover:bg-[#1E293B]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>IV & Expiry Slider Matrix</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2">
          <button
            type="button"
            onClick={() => setIsSavedScenariosModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#00778A] dark:text-[#2DD4BF] bg-[#00778A]/10 dark:bg-[#00778A]/20 hover:bg-[#00778A]/20 transition-all border border-[#00778A]/20 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>MongoDB Scenarios ({savedScenarios.length})</span>
          </button>
        </div>
      </div>

      {/* 7. Active Tab View */}
      {activeVisualizerTab === 'priceSimulator' && (
        <PriceMovementSimulator
          onSelectMove={(pts) => setActiveMovePoints(pts)}
          onOpenSavedModal={() => setIsSavedScenariosModalOpen(true)}
        />
      )}

      {activeVisualizerTab === 'scenarioTable' && (
        <GreeksScenarioTable
          selectedMove={activeMovePoints}
          onSelectMove={(pts) => setActiveMovePoints(pts)}
        />
      )}

      {activeVisualizerTab === 'chartsSuite' && <AdvancedGreeksCharts />}

      {activeVisualizerTab === 'sliderMatrix' && <GreeksSliderMatrix />}

      {/* Modals */}
      <GreekCalculationsModal
        isOpen={isGreekCalculationsModalOpen}
        onClose={() => setIsGreekCalculationsModalOpen(false)}
      />

      <SavedScenariosModal
        isOpen={isSavedScenariosModalOpen}
        onClose={() => setIsSavedScenariosModalOpen(false)}
      />
    </div>
  );
};
