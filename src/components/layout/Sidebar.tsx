import React from 'react';
import { useGreeksStore, NavigationTab } from '../../store/useGreeksStore';
import { useAuthStore } from '../../store/authStore';
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
  Moon,
  UserCheck,
  LogIn,
  LogOut,
  Sparkles,
  Lock
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

  const { user, isAuthenticated, logout, setAuthMode } = useAuthStore();

  const commodities: CommodityType[] = ['CRUDEOIL', 'GOLD', 'SILVER', 'NATURALGAS', 'COPPER', 'ZINC'];

  const navLinks: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', label: 'Greeks Calculator', icon: Calculator, badge: 'Live' },
    { id: 'analytics', label: 'Analytics & Trends', icon: LineChart },
    { id: 'uploads', label: 'Price Ingestion', icon: Upload, badge: 'Smart' },
    { id: 'history', label: 'Historical Data', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'auth', label: isAuthenticated ? 'Trader Account' : 'Sign In / Register', icon: UserCheck, badge: isAuthenticated ? 'Active' : 'Google' }
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
                <div className="flex items-center gap-1.5">
                  {!isAuthenticated && (link.id === 'analytics' || link.id === 'history') && (
                    <span
                      title="Authentication required to view"
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#FEF3F2] dark:bg-[#7F1D1D]/30 text-[#F04438]'
                      }`}
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Lock</span>
                    </span>
                  )}
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
                </div>
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

      {/* Trader Account & Google Auth Status Card */}
      <div className="glass-panel p-4 shadow-xs">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#667085] uppercase">
                Trader Session
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#12B76A] bg-[#ECFDF3] px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse" />
                Active
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/70 border border-[#DCE9EE]/80">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt={user.name}
                className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1D2939] truncate">{user.name}</div>
                <div className="text-[11px] font-mono text-[#667085] truncate">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                onClick={() => setActiveTab('auth')}
                className="text-[#00778A] hover:underline font-semibold cursor-pointer"
              >
                Manage Profile
              </button>
              <button
                onClick={logout}
                className="text-[#F04438] hover:underline font-semibold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 text-center">
            <div className="text-left">
              <div className="text-[11px] font-bold tracking-wider text-[#667085] uppercase mb-1">
                Account & Cloud Sync
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Sign in with Google to sync option chains and Greeks calculations across devices.
              </p>
            </div>

            <button
              onClick={() => {
                setAuthMode('login');
                setActiveTab('auth');
              }}
              id="sidebar-btn-google-auth"
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl bg-white hover:bg-[#F8FAFB] text-[#1D2939] border border-[#DCE9EE] hover:border-[#00778A] font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
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
