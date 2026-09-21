import React from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { COMMODITY_SPECS } from '../../services/mockData';
import { CommodityType } from '../../types';
import { formatCurrency, formatGreek } from '../../utils/greeks';
import {
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    selectedCommodity,
    setSelectedCommodity,
    exposure,
    settings,
    calculatedResult
  } = useGreeksStore();

  const commodities: CommodityType[] = ['CRUDEOIL', 'GOLD', 'SILVER', 'NATURALGAS', 'COPPER', 'ZINC'];

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-5">
      {/* MCX Commodity Quick Watchlist */}
      <div className="glass-panel p-4 shadow-xs">
        <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold tracking-wider text-[#667085] uppercase">
          <span>MCX Watchlist</span>
          <span className="text-[10px] text-[#00778A] font-semibold">Active: {selectedCommodity}</span>
        </div>
        <div className="space-y-1.5 mt-2">
          {commodities.map((c) => {
            const spec = COMMODITY_SPECS[c];
            const isSelected = selectedCommodity === c;
            const isPositive = spec.change24h >= 0;

            return (
              <div
                key={c}
                onClick={() => setSelectedCommodity(c)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-white border-[#00778A] shadow-xs ring-1 ring-[#00778A]/20'
                    : 'bg-white/40 border-[#DCE9EE]/60 hover:bg-white hover:border-[#B5CEDA]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1D2939]">{spec.symbol}</span>
                    <span className="text-[10px] text-[#667085]">{spec.category}</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      isPositive ? 'text-[#12B76A]' : 'text-[#F04438]'
                    }`}
                  >
                    {isPositive ? '+' : ''}{spec.change24h}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-[#667085]">Spot: {formatCurrency(spec.defaultSpot, settings.currency, spec.tickSize < 1 ? 2 : 0)}</span>
                  <span className="font-mono-num text-[10px] text-[#00778A] font-medium">IV: {spec.defaultIV}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Position Risk Monitor */}
      <div className="glass-panel p-4 shadow-xs">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D2939]">
            <ShieldCheck className="w-4 h-4 text-[#00778A]" />
            <span>Greek Risk Profile</span>
          </div>
          <span className="text-[10px] font-semibold text-[#7A9266] bg-[#F0F4ED] px-2 py-0.5 rounded-full">
            {settings.pricingModel === 'BLACK_76' ? 'Black-76' : 'Black-Scholes'}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-white/70 border border-[#DCE9EE]/80">
            <div className="flex justify-between text-[#667085] text-[11px]">
              <span>Net Delta (Δ)</span>
              <span className="font-mono-num font-bold text-[#1D2939]">
                {formatGreek(calculatedResult.delta, 3)}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#667085] flex justify-between">
              <span>Value Exposure:</span>
              <span className="font-semibold text-[#00778A]">
                {formatCurrency(Math.abs(exposure.deltaExposure), settings.currency, 0)}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/70 border border-[#DCE9EE]/80">
            <div className="flex justify-between text-[#667085] text-[11px]">
              <span>Daily Theta Decay (θ)</span>
              <span className="font-mono-num font-bold text-[#F04438]">
                {formatCurrency(exposure.thetaDecay, settings.currency, 1)} / day
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/70 border border-[#DCE9EE]/80">
            <div className="flex justify-between text-[#667085] text-[11px]">
              <span>1% Vega Shock (ν)</span>
              <span className="font-mono-num font-bold text-[#7A9266]">
                {formatCurrency(exposure.vegaRisk, settings.currency, 1)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick model formula explanation */}
        <div className="mt-3.5 pt-3 border-t border-[#DCE9EE]/60 text-[11px] text-[#667085] flex items-start gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-[#00778A] shrink-0 mt-0.5" />
          <p>
            MCX options use discounted Fischer Black 1976 futures model with 365 calendar days time-decay.
          </p>
        </div>
      </div>
    </aside>
  );
};
