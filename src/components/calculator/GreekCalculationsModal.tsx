import React, { useEffect } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { GreekCalculationRecord } from '../../types';
import { normalizeCommodityType } from '../../services/mockData';
import { Database, X, RotateCcw, Clock, Calendar, ChevronRight, Layers, ArrowUpRight } from 'lucide-react';

interface GreekCalculationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GreekCalculationsModal: React.FC<GreekCalculationsModalProps> = ({ isOpen, onClose }) => {
  const {
    savedGreekCalculations,
    fetchGreekCalculationsFromMongoDB,
    setCalculatorInput,
    setManualGreeks,
    setMarketGreeks,
    runScenarioSimulation
  } = useGreeksStore();

  useEffect(() => {
    if (isOpen) {
      fetchGreekCalculationsFromMongoDB();
    }
  }, [isOpen, fetchGreekCalculationsFromMongoDB]);

  if (!isOpen) return null;

  const handleLoadRecord = (rec: GreekCalculationRecord) => {
    const comm = normalizeCommodityType(rec.commodity);
    setCalculatorInput({
      commodity: comm,
      spotPrice: rec.spotPrice,
      strikePrice: rec.strike,
      optionType: rec.optionType === 'CE' ? 'CALL' : 'PUT',
      volatility: rec.iv,
      expiryDays: rec.expiry,
      contracts: rec.lots,
      lotSize: (rec as any).lotSize,
      isCustomLotSize: Boolean((rec as any).lotSize)
    });

    setManualGreeks({
      delta: rec.delta,
      gamma: rec.gamma,
      theta: rec.theta,
      vega: rec.vega,
      rho: rec.rho,
      pop: rec.pop,
      premium: rec.premium
    });

    setMarketGreeks({
      delta: rec.delta,
      gamma: rec.gamma,
      theta: rec.theta,
      vega: rec.vega,
      rho: rec.rho,
      pop: rec.pop,
      premium: rec.premium,
      source: 'MongoDB Record'
    });

    runScenarioSimulation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#101828] rounded-[24px] border border-[#DCE9EE] dark:border-[#1E293B] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E4E7EC] dark:border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00778A]/10 text-[#00778A] dark:bg-[#00778A]/25 dark:text-[#2DD4BF] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D2939] dark:text-white">
                Saved Greek Calculations (MongoDB: <code className="text-[#00778A] dark:text-[#2DD4BF]">greekCalculations</code>)
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                Persistent historical records stored with complete market and scenario analysis snapshots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#1D2939] hover:bg-[#F2F4F7] dark:hover:bg-[#1E293B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of saved records */}
        <div className="p-5 overflow-y-auto space-y-3 divide-y divide-[#F2F4F7] dark:divide-[#1E293B]">
          {savedGreekCalculations.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-10 h-10 text-[#94A3B8] mx-auto mb-3 opacity-50" />
              <p className="text-sm font-semibold text-[#1D2939] dark:text-white">
                No calculations saved yet
              </p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto mt-1">
                Click &quot;Save to MongoDB&quot; on the scenario table to persist your Greeks, market quotes, and expected move simulations.
              </p>
            </div>
          ) : (
            savedGreekCalculations.map((rec) => (
              <div
                key={rec._id || rec.id}
                className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1D2939] dark:text-white">
                      {rec.commodity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#00778A]/10 text-[#00778A] dark:bg-[#2DD4BF]/20 dark:text-[#2DD4BF]">
                      {rec.strike} {rec.optionType}
                    </span>
                    <span className="text-xs text-[#64748B]">
                      Spot: ₹{rec.spotPrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] font-mono">
                    <span>IV: {rec.iv}%</span>
                    <span>•</span>
                    <span>Expiry: {rec.expiry}d</span>
                    <span>•</span>
                    <span>Delta: {rec.delta}</span>
                    <span>•</span>
                    <span>POP: {rec.pop}%</span>
                    <span>•</span>
                    <span>Premium: ₹{rec.premium}</span>
                    {rec.scenarioAnalysis && (
                      <>
                        <span>•</span>
                        <span className="text-[#00778A] dark:text-[#2DD4BF]">
                          {rec.scenarioAnalysis.length} Scenarios
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-[11px] text-[#94A3B8] flex items-center gap-2 pt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(rec.createdAt).toLocaleString()}</span>
                    {rec.uploadedScreenshot && (
                      <span className="text-[#12B76A]">• Screenshot: {rec.uploadedScreenshot}</span>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleLoadRecord(rec)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#00778A] hover:bg-[#005B6A] transition-all shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <span>Load into Calculator</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4E7EC] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-between text-xs text-[#64748B]">
          <span>Total Records: {savedGreekCalculations.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] text-xs font-semibold text-[#1D2939] dark:text-white hover:bg-[#F2F4F7]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
