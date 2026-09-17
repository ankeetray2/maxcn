import React from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { CalculationMode } from '../../types';
import { Cpu, Edit3, Image, Sparkles, CheckCircle2 } from 'lucide-react';

export const ModeSelector: React.FC = () => {
  const { calculationMode, setCalculationMode } = useGreeksStore();

  const modes: Array<{
    id: CalculationMode;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
  }> = [
    {
      id: 'auto',
      title: 'Auto Calculate',
      description: 'Calculates Delta, Gamma, Theta, Vega, Rho, POP, Breakeven, and Premium via Black-Scholes Model',
      icon: Cpu,
      badge: 'B&S Engine'
    },
    {
      id: 'manual',
      title: 'Manual Greeks Entry',
      description: 'Directly enter customized Market Delta, Gamma, Theta, Vega, Rho, POP, and Premium values',
      icon: Edit3,
      badge: 'Direct Input'
    },
    {
      id: 'screenshot',
      title: 'Screenshot Auto Fill',
      description: 'Upload option chain screenshots from Groww, Zerodha, Upstox, TradingView, or Angel One to extract Greeks',
      icon: Image,
      badge: 'AI OCR Parser'
    }
  ];

  return (
    <div id="calculator-mode-selection" className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-5 rounded-[22px] border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00778A]/10 text-[#00778A] dark:bg-[#00778A]/25 dark:text-[#2DD4BF] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1D2939] dark:text-white tracking-tight">
              Calculation Mode Selection
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
              Choose how Greeks and Pricing inputs are ingested into the platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7FAFB] dark:bg-[#0F172A] border border-[#DCE9EE] dark:border-[#334155] text-xs">
          <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
          <span className="text-[#667085] dark:text-[#94A3B8]">Active Mode:</span>
          <strong className="text-[#00778A] dark:text-[#2DD4BF] capitalize">
            {calculationMode === 'auto' ? 'Auto Calculate (B&S)' : calculationMode === 'manual' ? 'Manual Greeks Entry' : 'Screenshot Auto-Fill'}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modes.map((m) => {
          const isSelected = calculationMode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setCalculationMode(m.id)}
              className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-br from-[#00778A]/10 to-[#00778A]/5 border-[#00778A] dark:border-[#2DD4BF] shadow-xs ring-2 ring-[#00778A]/20'
                  : 'bg-white dark:bg-[#1E293B]/60 border-[#E4E7EC] dark:border-[#334155] hover:border-[#00778A]/40 dark:hover:border-[#2DD4BF]/40 hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#00778A] text-white dark:bg-[#2DD4BF] dark:text-[#0F172A]'
                        : 'bg-[#F2F4F7] dark:bg-[#334155] text-[#475467] dark:text-[#CBD5E1] group-hover:text-[#00778A]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1D2939] dark:text-white block">
                      {m.title}
                    </span>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#00778A] dark:text-[#2DD4BF]">
                      {m.badge}
                    </span>
                  </div>
                </div>

                {/* Radio indicator */}
                <div className="flex items-center">
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00778A] dark:text-[#2DD4BF]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-[#D0D5DD] dark:border-[#475467]" />
                  )}
                </div>
              </div>

              <p className="text-xs text-[#667085] dark:text-[#94A3B8] leading-relaxed line-clamp-2">
                {m.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
