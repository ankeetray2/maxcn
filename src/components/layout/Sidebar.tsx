import React from 'react';
import { useGreeksStore, NavigationTab } from '../../store/useGreeksStore';
import { COMMODITY_SPECS } from '../../services/mockData';
import { CommodityType } from '../../types';
import { formatCurrency, formatGreek } from '../../utils/greeks';
import {
  LayoutDashboard,
  Calculator,
  LineChart,
  Upload,
  History,
  Settings,
  ShieldCheck,
  TrendingUp,
  Layers,
  HelpCircle,
  BarChart2,
  FileSpreadsheet,
  Sun,
  Moon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedCommodity,
    setSelectedCommodity,
    exposure,
    settings,
    calculatedResult,
    toggleTheme
  } = useGreeksStore();

  const commodities: CommodityType[] = ['CRUDEOIL', 'GOLD', 'SILVER', 'NATURALGAS', 'COPPER', 'ZINC'];

  const navLinks: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', label: 'Greeks Calculator', icon: Calculator, badge: 'Live' },
    { id: 'analytics', label: 'Analytics & Trends', icon: LineChart },
    { id: 'uploads', label: 'Price Ingestion', icon: Upload, badge: 'Smart' },
    { id: 'history', label: 'Historical Data', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-5">
      {/* Navigation menu card */}
      <div className="glass-panel p-4 shadow-xs">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-[#667085] uppercase">
          Navigation
        </div>
        <div className="space-y-1 mt-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#00778A] text-white shadow-md shadow-[#00778A]/20'
                    : 'text-[#1D2939] hover:bg-white/80 hover:text-[#00778A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#667085]'}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#E6F3F5] text-[#00778A]'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Theme Switcher */}
        <div className="pt-2 mt-2 border-t border-[#DCE9EE]/60">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#667085] hover:text-[#1D2939] hover:bg-white/80 transition-all cursor-pointer"
            title={`Current theme is ${settings.theme}. Click to toggle.`}
          >
            <div className="flex items-center gap-2.5">
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#F59E0B]" />
              ) : (
                <Moon className="w-4 h-4 text-[#00778A]" />
              )}
              <span>Dark Mode</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#00778A]/10 text-[#00778A]">
              {settings.theme === 'dark' ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

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
