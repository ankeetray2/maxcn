import React from 'react';
import { ShieldCheck, BarChart3, Clock, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-[#DCE9EE] bg-white/60 backdrop-blur-md py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#667085]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#00778A] to-[#7A9266] flex items-center justify-center text-white text-xs font-bold font-heading">
              Δ
            </div>
            <div>
              <span className="font-semibold text-[#1D2939]">Commodity Greeks Pro</span>
              <span className="mx-2 text-[#B5CEDA]">•</span>
              <span>MCX Commodity Derivatives Analytics & Black-76 Volatility Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#00778A]" />
              <span>Engine: 64-bit Abramowitz-Stegun CDF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#7A9266]" />
              <span>Tick Latency: 4ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#12B76A]" />
              <span>Institutional Precision</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#DCE9EE]/60 text-[11px] text-[#667085]/80 text-center md:text-left flex flex-col md:flex-row items-center justify-between">
          <p>
            © {new Date().getFullYear()} Commodity Greeks Pro. Commodity futures and options calculations are based on standard MCX specifications.
          </p>
          <p className="mt-2 md:mt-0">
            Precision: 4 Decimals • Supports Gold, Silver, Crude Oil, Natural Gas, Copper & Zinc
          </p>
        </div>
      </div>
    </footer>
  );
};
