import React from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { Edit3, RotateCcw, Sparkles, Check } from 'lucide-react';

export const ManualGreeksEntry: React.FC = () => {
  const { manualGreeks, setManualGreeks, calculatedResult, calculator } = useGreeksStore();

  const handleSetExample = () => {
    setManualGreeks({
      delta: 0.92,
      gamma: 0.10,
      theta: -61.11,
      vega: 35.02,
      rho: 29.59,
      pop: 48,
      premium: 253
    });
  };

  const handleCopyFromTheoretical = () => {
    setManualGreeks({
      delta: calculatedResult.delta,
      gamma: calculatedResult.gamma,
      theta: calculatedResult.theta,
      vega: calculatedResult.vega,
      rho: calculatedResult.rho,
      pop: calculatedResult.pop,
      premium: calculatedResult.price
    });
  };

  return (
    <div id="manual-greeks-entry-section" className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-6 rounded-[22px] border border-[#00778A]/30 dark:border-[#2DD4BF]/30 shadow-sm relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00778A] via-[#12B76A] to-[#F79009]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E4E7EC] dark:border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00778A]/10 dark:bg-[#00778A]/20 text-[#00778A] dark:text-[#2DD4BF] flex items-center justify-center font-bold">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1D2939] dark:text-white">
                Manual Greeks Entry Mode
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#00778A]/10 text-[#00778A] dark:bg-[#2DD4BF]/20 dark:text-[#2DD4BF]">
                Direct Input Active
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
              Override theoretical models and supply exact market-traded Greeks and pricing
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const state = useGreeksStore.getState();
              setManualGreeks({
                delta: state.greeks.delta,
                gamma: state.greeks.gamma,
                theta: state.greeks.theta,
                vega: state.greeks.vega,
                rho: state.greeks.rho,
                pop: 50,
                premium: state.greeks.premium
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#12B76A] hover:bg-[#0E9355] transition-all shadow-xs cursor-pointer"
            title="Load the extracted ATM Greeks from the uploaded screenshot"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Ingested ATM Greeks</span>
          </button>

          <button
            type="button"
            onClick={handleSetExample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#00778A] hover:bg-[#005B6A] transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Benchmark</span>
          </button>

          <button
            type="button"
            onClick={handleCopyFromTheoretical}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#344054] dark:text-[#CBD5E1] bg-[#F2F4F7] dark:bg-[#1E293B] hover:bg-[#E4E7EC] transition-all cursor-pointer"
            title="Populate with currently calculated Black-Scholes values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync Theoretical</span>
          </button>
        </div>
      </div>

      {/* 7 Core Manual Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3.5">
        {/* Delta */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-[#1D2939] dark:text-[#E2E8F0]">
              Delta (Δ)
            </label>
            <span className="text-[10px] font-mono text-[#00778A] dark:text-[#2DD4BF] font-bold">
              {manualGreeks.delta.toFixed(2)}
            </span>
          </div>
          <input
            type="number"
            step="0.01"
            value={manualGreeks.delta}
            onChange={(e) => setManualGreeks({ delta: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs font-mono font-bold text-[#00778A] dark:text-[#2DD4BF] focus:outline-none focus:ring-1 focus:ring-[#00778A]"
            placeholder="0.92"
          />
          {/* Interactive Delta Slider */}
          <input
            type="range"
            min={calculator.optionType === 'PUT' ? "-1" : "0"}
            max={calculator.optionType === 'PUT' ? "0" : "1"}
            step="0.01"
            value={
              calculator.optionType === 'PUT'
                ? Math.max(-1, Math.min(0, manualGreeks.delta))
                : Math.max(0, Math.min(1, manualGreeks.delta))
            }
            onChange={(e) => setManualGreeks({ delta: parseFloat(e.target.value) })}
            className="w-full accent-[#00778A] h-1.5 bg-[#CBD5E1] rounded-lg mt-1.5 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#64748B] mt-0.5 font-mono">
            <span>{calculator.optionType === 'PUT' ? '-1.00' : '0.00'}</span>
            <span>{calculator.optionType === 'PUT' ? '-0.50' : '0.50'}</span>
            <span>{calculator.optionType === 'PUT' ? '0.00' : '1.00'}</span>
          </div>
        </div>

        {/* Gamma */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B]">
          <label className="block text-xs font-bold text-[#1D2939] dark:text-[#E2E8F0] mb-1">
            Gamma (Γ)
          </label>
          <input
            type="number"
            step="0.001"
            value={manualGreeks.gamma}
            onChange={(e) => setManualGreeks({ gamma: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs font-mono font-bold text-[#1D2939] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00778A]"
            placeholder="0.10"
          />
          <span className="text-[10px] text-[#64748B] block mt-1">Prompt: 0.10</span>
        </div>

        {/* Theta */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B]">
          <label className="block text-xs font-bold text-[#1D2939] dark:text-[#E2E8F0] mb-1">
            Theta (θ)
          </label>
          <input
            type="number"
            step="0.01"
            value={manualGreeks.theta}
            onChange={(e) => setManualGreeks({ theta: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs font-mono font-bold text-[#D92D20] dark:text-[#F87171] focus:outline-none focus:ring-1 focus:ring-[#00778A]"
            placeholder="-61.11"
          />
          <span className="text-[10px] text-[#64748B] block mt-1">Prompt: -61.11</span>
        </div>

        {/* Vega */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B]">
          <label className="block text-xs font-bold text-[#1D2939] dark:text-[#E2E8F0] mb-1">
            Vega (ν)
          </label>
          <input
            type="number"
            step="0.01"
            value={manualGreeks.vega}
            onChange={(e) => setManualGreeks({ vega: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs font-mono font-bold text-[#7F56D9] dark:text-[#C084FC] focus:outline-none focus:ring-1 focus:ring-[#00778A]"
            placeholder="35.02"
          />
          <span className="text-[10px] text-[#64748B] block mt-1">Prompt: 35.02</span>
        </div>

        {/* Rho */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B]">
          <label className="block text-xs font-bold text-[#1D2939] dark:text-[#E2E8F0] mb-1">
            Rho (ρ)
          </label>
          <input
            type="number"
            step="0.01"
            value={manualGreeks.rho}
            onChange={(e) => setManualGreeks({ rho: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs font-mono font-bold text-[#B54708] dark:text-[#FBBF24] focus:outline-none focus:ring-1 focus:ring-[#00778A]"
            placeholder="29.59"
          />
          <span className="text-[10px] text-[#64748B] block mt-1">Prompt: 29.59</span>
        </div>

        {/* POP */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B]">
          <label className="block text-xs font-bold text-[#1D2939] dark:text-[#E2E8F0] mb-1">
            POP (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={manualGreeks.pop}
            onChange={(e) => setManualGreeks({ pop: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs font-mono font-bold text-[#12B76A] dark:text-[#4ADE80] focus:outline-none focus:ring-1 focus:ring-[#00778A]"
            placeholder="48"
          />
          <span className="text-[10px] text-[#64748B] block mt-1">Prompt: 48%</span>
        </div>

        {/* Premium */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#1E293B]">
          <label className="block text-xs font-bold text-[#1D2939] dark:text-[#E2E8F0] mb-1">
            Premium (₹)
          </label>
          <input
            type="number"
            step="0.5"
            value={manualGreeks.premium}
            onChange={(e) => setManualGreeks({ premium: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-lg text-xs font-mono font-bold text-[#00778A] dark:text-[#2DD4BF] focus:outline-none focus:ring-1 focus:ring-[#00778A]"
            placeholder="253"
          />
          <span className="text-[10px] text-[#64748B] block mt-1">Prompt: ₹253</span>
        </div>
      </div>
    </div>
  );
};
