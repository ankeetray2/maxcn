import React, { useEffect } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { ScenarioAnalysisRecord } from '../../types';
import { formatCurrency, formatGreek } from '../../utils/greeks';
import {
  X,
  Database,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

interface SavedScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario?: (record: ScenarioAnalysisRecord) => void;
}

export const SavedScenariosModal: React.FC<SavedScenariosModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario
}) => {
  const { savedScenarios, fetchSavedScenarios, setCalculatorInput, runScenarioSimulation, databaseStatus } = useGreeksStore();

  useEffect(() => {
    if (isOpen) {
      fetchSavedScenarios();
    }
  }, [isOpen, fetchSavedScenarios]);

  if (!isOpen) return null;

  const handleLoadScenario = (scenario: ScenarioAnalysisRecord) => {
    // Map commodity
    const commKey = (scenario.commodity.toUpperCase().includes('SILVER')
      ? 'SILVER'
      : scenario.commodity.toUpperCase().includes('CRUDE')
      ? 'CRUDEOIL'
      : scenario.commodity.toUpperCase().includes('NATURAL')
      ? 'NATURALGAS'
      : scenario.commodity.toUpperCase().includes('COPPER')
      ? 'COPPER'
      : 'GOLD') as any;

    setCalculatorInput({
      commodity: commKey,
      spotPrice: scenario.currentPrice,
      strikePrice: scenario.strike,
      volatility: scenario.iv,
      expiryDays: scenario.daysToExpiry || 18,
      optionType: (scenario.optionType === 'PE' || scenario.optionType === 'PUT') ? 'PUT' : 'CALL',
      contracts: scenario.lots,
      lotSize: scenario.lotSize || 100,
      isCustomLotSize: true
    });

    runScenarioSimulation();

    if (onSelectScenario) {
      onSelectScenario(scenario);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-[24px] border border-[#DCE9EE] shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#DCE9EE] flex items-center justify-between bg-[#F7FAFB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00778A]/10 text-[#00778A] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1D2939]">
                  Saved Scenario Analyses
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#12B76A]/15 text-[#12B76A]">
                  MongoDB: scenarioAnalysis
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Saved market shift simulations with Black-Scholes Greeks and multi-lot P&L projections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSavedScenarios()}
              className="p-2 text-[#667085] hover:text-[#00778A] rounded-xl hover:bg-white border border-transparent hover:border-[#DCE9EE] transition-all"
              title="Refresh from MongoDB"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#667085] hover:text-[#1D2939] rounded-xl hover:bg-white border border-transparent hover:border-[#DCE9EE] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {savedScenarios.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Database className="w-12 h-12 text-[#98A2B3] mx-auto mb-3" />
              <h4 className="text-sm font-bold text-[#1D2939]">No Saved Scenarios Yet</h4>
              <p className="text-xs text-[#667085] max-w-sm mx-auto mt-1">
                Select an expected move (e.g. +1000) on the calculator page and click &quot;Save Scenario to MongoDB&quot; to archive simulations in the <code>scenarioAnalysis</code> collection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedScenarios.map((scen, idx) => {
                const isCall = scen.optionType === 'CE' || scen.optionType === 'CALL';
                const pnl = scen.pnl || {
                  pnlTotal: 0,
                  returnPercentage: 0,
                  currentPremium: 0,
                  futurePremium: 0,
                  premiumChange: 0,
                  pnlPerLot: 0
                };
                const greeks = scen.recalculatedGreeks || { delta: 0, gamma: 0, theta: 0, vega: 0 };

                return (
                  <div
                    key={scen.id || scen._id || idx}
                    className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE] hover:border-[#00778A] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#1D2939]">
                            {scen.commodity}
                          </span>
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-white border border-[#DCE9EE]">
                            {scen.strike} {isCall ? 'CE' : 'PE'}
                          </span>
                          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md font-mono ${
                            scen.movePoints >= 0 ? 'bg-[#12B76A]/15 text-[#12B76A]' : 'bg-[#F04438]/15 text-[#F04438]'
                          }`}>
                            {scen.movePoints >= 0 ? `+${scen.movePoints}` : scen.movePoints} pts
                          </span>
                        </div>

                        <div className="text-[10px] text-[#667085] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{scen.createdAt ? new Date(scen.createdAt).toLocaleDateString('en-IN') : 'Recent'}</span>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="text-xs text-[#667085] space-y-1 mb-3">
                        <div className="flex justify-between">
                          <span>Spot Price:</span>
                          <span className="font-mono font-semibold text-[#1D2939]">
                            ₹{scen.currentPrice?.toLocaleString('en-IN')} → ₹{Math.round((scen.currentPrice || 0) + (scen.movePoints || 0)).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Position Size:</span>
                          <span className="font-mono font-semibold text-[#1D2939]">
                            {scen.lots} Lots × {scen.lotSize || 100} Lot Size
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Premium:</span>
                          <span className="font-mono font-semibold text-[#1D2939]">
                            ₹{pnl.currentPremium} → ₹{pnl.futurePremium} (Δ ₹{pnl.premiumChange || 0})
                          </span>
                        </div>
                      </div>

                      {/* Greeks Pill */}
                      <div className="p-2 rounded-xl bg-white border border-[#DCE9EE] text-[11px] font-mono grid grid-cols-4 gap-1 text-center mb-3">
                        <div>
                          <div className="text-[9px] text-[#667085] font-sans">Δ Delta</div>
                          <div className="font-bold text-[#00778A]">{formatGreek(greeks.delta, 2)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#667085] font-sans">Γ Gamma</div>
                          <div className="font-bold text-[#7A9266]">{Number(greeks.gamma).toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#667085] font-sans">θ Theta</div>
                          <div className="font-bold text-[#F04438]">{Number(greeks.theta).toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-[#667085] font-sans">ν Vega</div>
                          <div className="font-bold text-[#12B76A]">{Number(greeks.vega).toFixed(1)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer: P&L + Load Button */}
                    <div className="pt-3 border-t border-[#DCE9EE]/70 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#667085]">Total Projected P&L</div>
                        <div className={`text-sm font-mono font-bold ${
                          (pnl.pnlTotal || 0) >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'
                        }`}>
                          {(pnl.pnlTotal || 0) >= 0 ? '+' : ''}₹{Math.round(pnl.pnlTotal || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleLoadScenario(scen)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00778A] hover:bg-[#00778A]/90 text-white text-xs font-semibold transition-all shadow-xs"
                      >
                        <span>Load Scenario</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#DCE9EE] bg-[#F7FAFB] flex items-center justify-between text-xs text-[#667085]">
          <div>
            Database: <strong className="text-[#1D2939]">MongoDB</strong> • Collection: <strong className="text-[#1D2939]">scenarioAnalysis</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#DCE9EE] hover:bg-[#F7FAFB] text-[#1D2939] font-semibold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
