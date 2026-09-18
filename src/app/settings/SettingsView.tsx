import React, { useState } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { usePriceStore } from '../../store/priceStore';
import { useAuthStore } from '../../store/authStore';
import { PricingModel } from '../../types';
import {
  Settings,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Cpu,
  RotateCcw,
  Database,
  Server,
  Activity,
  Check,
  Sun,
  Moon,
  Monitor,
  Palette,
  User,
  ShieldCheck,
  LogOut,
  ArrowRight
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, databaseStatus, fetchHistoryFromBackend, setActiveTab } = useGreeksStore();
  const { user, isAuthenticated, logout, setAuthMode } = useAuthStore();
  const [savedBanner, setSavedBanner] = useState(false);

  const handleUpdate = (partial: Parameters<typeof updateSettings>[0]) => {
    updateSettings(partial);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleResetDefaults = () => {
    handleUpdate({
      pricingModel: 'BLACK_SCHOLES',
      riskFreeRate: 6.5,
      decimalPrecision: 6,
      currency: 'INR',
      soundEnabled: true,
      deltaAlertThreshold: 0.8,
      vegaAlertThreshold: 25.0
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00778A]/10 text-[#00778A] flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1D2939]">
                Platform & Engine Configuration
              </h2>
              <p className="text-xs text-[#667085]">
                Configure Black-Scholes pricing models, MongoDB persistence, precision, and risk guardrails
              </p>
            </div>
          </div>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE9EE] text-[#667085] hover:text-[#00778A] text-xs font-semibold hover:bg-[#F7FAFB] transition-all shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {savedBanner && (
          <div className="mt-4 p-3 rounded-xl bg-[#ECFDF3] border border-[#12B76A]/20 flex items-center gap-2 text-xs text-[#12B76A] font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings updated and recomputed in real time!</span>
          </div>
        )}
      </div>

      {/* Trader Account & Authentication Section */}
      <div className="bg-white/90 dark:bg-[#121E2A] backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-[#00778A]" />
            <h3 className="text-base font-bold text-[#1D2939] dark:text-white">
              Trader Account & Authentication
            </h3>
          </div>
          {isAuthenticated && user ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF3] text-[#12B76A] border border-[#12B76A]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Google Verified</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F7FAFB] text-[#667085] border border-[#DCE9EE]">
              Guest Mode
            </span>
          )}
        </div>

        {isAuthenticated && user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F7FAFB] dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052]">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt={user.name}
                className="w-12 h-12 rounded-xl object-cover bg-white shadow-xs border border-[#DCE9EE]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1D2939] dark:text-white">{user.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00778A]/10 text-[#00778A] uppercase">
                    {user.role}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#667085] dark:text-[#94A3B8]">{user.email}</div>
                <div className="text-[11px] text-[#12B76A] mt-0.5">
                  AuthProvider: {user.authProvider === 'google' ? 'Google OAuth 2.0 (GSI)' : 'Email/Password'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('auth')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#223344] text-[#00778A] dark:text-white border border-[#DCE9EE] dark:border-[#334155] text-xs font-semibold hover:bg-[#F7FAFB] transition-all cursor-pointer"
              >
                Manage Profile
              </button>
              <button
                onClick={logout}
                className="px-3.5 py-2 rounded-xl bg-[#FEF3F2] dark:bg-red-950/30 text-[#F04438] border border-[#F04438]/20 text-xs font-semibold hover:bg-[#FEE4E2] transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F7FAFB] dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052]">
            <div>
              <h4 className="text-xs font-bold text-[#1D2939] dark:text-white mb-1">
                You are currently trading in Guest Mode
              </h4>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                Sign in with Google to synchronize calculation history, option chain screenshots, and analytics with MongoDB.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setActiveTab('auth');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFB] text-[#1D2939] border border-[#DCE9EE] text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Sign In with Google</span>
              </button>

              <button
                onClick={() => {
                  setAuthMode('register');
                  setActiveTab('auth');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#00778A] hover:bg-[#006070] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Register
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Database & Backend Architecture Status */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#00778A]" />
            <h3 className="text-base font-bold text-[#1D2939]">
              Database & Repository Engine
            </h3>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#12B76A]/10 text-[#12B76A] border border-[#12B76A]/20">
            <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
            <span>{databaseStatus.driver === 'mongodb' ? 'MongoDB Active' : 'Persistent Storage Active'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
            <span className="text-[11px] text-[#667085] block font-semibold">Repository Pattern</span>
            <strong className="text-xs text-[#1D2939] font-mono mt-1 block">
              IGreeksRepository
            </strong>
            <span className="text-[10px] text-[#00778A] mt-1 block">
              MongoDB / Local JSON Failover
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
            <span className="text-[11px] text-[#667085] block font-semibold">Backend API Server</span>
            <strong className="text-xs text-[#1D2939] font-mono mt-1 block">
              Express.js on Node.js
            </strong>
            <span className="text-[10px] text-[#12B76A] mt-1 block">
              /api/greeks Routes Live
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
            <span className="text-[11px] text-[#667085] block font-semibold">Financial Precision</span>
            <strong className="text-xs text-[#1D2939] font-mono mt-1 block">
              6 Decimal Places
            </strong>
            <span className="text-[10px] text-[#7A9266] mt-1 block">
              Enterprise Accuracy
            </span>
          </div>
        </div>
      </div>

      {/* 1. Mathematical Pricing Model */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-[#00778A]" />
          <h3 className="text-base font-bold text-[#1D2939]">
            Options Valuation Model
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => handleUpdate({ pricingModel: 'BLACK_SCHOLES' })}
            className={`p-4 rounded-2xl cursor-pointer border transition-all ${
              settings.pricingModel === 'BLACK_SCHOLES'
                ? 'bg-white border-[#00778A] shadow-xs ring-2 ring-[#00778A]/20'
                : 'bg-white/50 border-[#DCE9EE] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1D2939]">
                Standard Black-Scholes Model
              </span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-[#E6F3F5] text-[#00778A]">
                Requested Spec
              </span>
            </div>
            <p className="mt-2 text-xs text-[#667085] leading-relaxed">
              Standard Black-Scholes analytical formulation calculating d1, d2, N(d1), N(d2), daily theta decay, vega, rho, and probability metrics.
            </p>
          </div>

          <div
            onClick={() => handleUpdate({ pricingModel: 'BLACK_76' })}
            className={`p-4 rounded-2xl cursor-pointer border transition-all ${
              settings.pricingModel === 'BLACK_76'
                ? 'bg-white border-[#00778A] shadow-xs ring-2 ring-[#00778A]/20'
                : 'bg-white/50 border-[#DCE9EE] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1D2939]">
                Fischer Black 1976 (Black-76)
              </span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-bold bg-[#F0F4ED] text-[#7A9266]">
                Futures Mode
              </span>
            </div>
            <p className="mt-2 text-xs text-[#667085] leading-relaxed">
              Features e^(-rT) discounting across underlying futures prices tailored for commodity delivery cycles.
            </p>
          </div>
        </div>
      </div>

      {/* Theme & Visual Appearance */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-[#00778A]" />
          <h3 className="text-base font-bold text-[#1D2939]">
            Theme & Terminal Appearance
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => handleUpdate({ theme: 'light' })}
            className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
              settings.theme === 'light'
                ? 'bg-white border-[#00778A] shadow-xs ring-2 ring-[#00778A]/20'
                : 'bg-white/50 border-[#DCE9EE] hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F7FAFB] border border-[#DCE9EE] flex items-center justify-center text-[#F59E0B]">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1D2939] block">Light Theme</span>
                <span className="text-[10px] text-[#667085]">Clean high-contrast workspace</span>
              </div>
            </div>
            {settings.theme === 'light' && <Check className="w-4 h-4 text-[#00778A]" />}
          </div>

          <div
            onClick={() => handleUpdate({ theme: 'dark' })}
            className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
              settings.theme === 'dark'
                ? 'bg-white border-[#00778A] shadow-xs ring-2 ring-[#00778A]/20'
                : 'bg-white/50 border-[#DCE9EE] hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0E1721] border border-[#223444] flex items-center justify-center text-[#00A3BD]">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1D2939] block">Dark Terminal</span>
                <span className="text-[10px] text-[#667085]">Institutional trading night mode</span>
              </div>
            </div>
            {settings.theme === 'dark' && <Check className="w-4 h-4 text-[#00778A]" />}
          </div>

          <div
            onClick={() => handleUpdate({ theme: 'system' })}
            className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
              settings.theme === 'system'
                ? 'bg-white border-[#00778A] shadow-xs ring-2 ring-[#00778A]/20'
                : 'bg-white/50 border-[#DCE9EE] hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F7FAFB] border border-[#DCE9EE] flex items-center justify-center text-[#667085]">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1D2939] block">System Sync</span>
                <span className="text-[10px] text-[#667085]">Follow OS system preference</span>
              </div>
            </div>
            {settings.theme === 'system' && <Check className="w-4 h-4 text-[#00778A]" />}
          </div>
        </div>
      </div>

      {/* 2. Platform Display & Preferences */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-[#7A9266]" />
          <h3 className="text-base font-bold text-[#1D2939]">
            Display & Calculations Precision
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Currency */}
          <div>
            <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
              Currency Format
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleUpdate({ currency: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] text-xs font-semibold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 shadow-xs"
            >
              <option value="INR">₹ INR (Indian Rupee - MCX)</option>
              <option value="USD">$ USD (US Dollar - COMEX/NYMEX)</option>
            </select>
          </div>

          {/* Decimal Precision */}
          <div>
            <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
              Greek Decimal Precision
            </label>
            <select
              value={settings.decimalPrecision}
              onChange={(e) => handleUpdate({ decimalPrecision: parseInt(e.target.value, 10) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] text-xs font-semibold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 shadow-xs"
            >
              <option value={2}>2 Decimals (e.g. 0.52)</option>
              <option value={4}>4 Decimals (e.g. 0.5214)</option>
              <option value={6}>6 Decimals (e.g. 0.521423) • Enterprise High Precision</option>
            </select>
          </div>

          {/* Risk Free Rate Default */}
          <div>
            <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
              Default Risk-Free Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.riskFreeRate}
              onChange={(e) => handleUpdate({ riskFreeRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] text-xs font-bold font-mono text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* 3. Risk Thresholds */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-[#F04438]" />
          <h3 className="text-base font-bold text-[#1D2939]">
            Risk Guardrails & Alert Thresholds
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
              Delta Exposure Warning Level (|Δ|)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="1.0"
              value={settings.deltaAlertThreshold}
              onChange={(e) => handleUpdate({ deltaAlertThreshold: parseFloat(e.target.value) || 0.8 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] text-xs font-bold font-mono text-[#1D2939] shadow-xs"
            />
            <span className="text-[11px] text-[#667085] mt-1 block">
              Triggers visual alert when net portfolio delta exceeds threshold.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
              Vega Shock Sensitivity Limit (₹)
            </label>
            <input
              type="number"
              step="5"
              value={settings.vegaAlertThreshold}
              onChange={(e) => handleUpdate({ vegaAlertThreshold: parseFloat(e.target.value) || 25 })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] text-xs font-bold font-mono text-[#1D2939] shadow-xs"
            />
            <span className="text-[11px] text-[#667085] mt-1 block">
              Triggers warning when a 1% volatility change impacts portfolio above limit.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Live Gold Price Feed & Refresh Configuration */}
      <PriceRefreshSettingsCard />
    </div>
  );
};

const PriceRefreshSettingsCard: React.FC = () => {
  const {
    currentPrice,
    commodity,
    lastUpdated,
    autoRefreshInterval,
    isAutoRefreshEnabled,
    setAutoRefreshInterval,
    toggleAutoRefresh,
    fetchLatestPrice,
    source
  } = usePriceStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchLatestPrice(commodity || 'Gold Mini', true);
      setRefreshMsg('Price refreshed successfully!');
      setTimeout(() => setRefreshMsg(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const intervalOptions = [
    { label: '10 Seconds', value: 10 },
    { label: '30 Seconds (Default)', value: 30 },
    { label: '60 Seconds (1 Min)', value: 60 },
    { label: '120 Seconds (2 Min)', value: 120 },
    { label: '300 Seconds (5 Min)', value: 300 }
  ];

  return (
    <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00778A]/10 text-[#00778A] flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1D2939]">
                Live Price Feed & Refresh Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF3] text-[#12B76A] border border-[#12B76A]/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse" />
                <span>{source.toUpperCase()}</span>
              </span>
            </div>
            <p className="text-xs text-[#667085]">
              Configure automatic live pricing updates, fallback strategies, and background refresh intervals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00778A] hover:bg-[#006070] text-white font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-60"
            id="settings-refresh-price-btn"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Price</span>
          </button>
        </div>
      </div>

      {refreshMsg && (
        <div className="p-3 rounded-xl bg-[#ECFDF3] border border-[#12B76A]/20 flex items-center gap-2 text-xs text-[#12B76A] font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{refreshMsg}</span>
        </div>
      )}

      {/* Current Feed Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
          <span className="text-[11px] text-[#667085] block font-semibold">Current Active Price</span>
          <strong className="text-lg text-[#1D2939] font-mono mt-0.5 block">
            ₹{currentPrice.toLocaleString('en-IN')}
          </strong>
          <span className="text-[10px] text-[#00778A] mt-1 block">
            {commodity || 'Gold Mini'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
          <span className="text-[11px] text-[#667085] block font-semibold">Last Synchronized</span>
          <strong className="text-sm text-[#1D2939] font-mono mt-1 block">
            {lastUpdated || 'Active'}
          </strong>
          <span className="text-[10px] text-[#12B76A] mt-1 block">
            State Synchronized Globally
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
          <span className="text-[11px] text-[#667085] block font-semibold">Fallback Engine</span>
          <strong className="text-xs text-[#1D2939] font-mono mt-1 block">
            Live API → MongoDB → Manual
          </strong>
          <span className="text-[10px] text-[#667085] mt-1 block">
            Automatic Zero-Downtime Fallback
          </span>
        </div>
      </div>

      {/* Auto Refresh Configuration */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-[#1D2939] block">
              Automatic Background Price Refresh
            </label>
            <span className="text-[11px] text-[#667085]">
              Continuously queries GET /api/price/latest and updates all application views silently
            </span>
          </div>
          <button
            onClick={() => toggleAutoRefresh()}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              isAutoRefreshEnabled ? 'bg-[#00778A]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAutoRefreshEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isAutoRefreshEnabled && (
          <div className="pt-2">
            <label className="text-xs font-semibold text-[#1D2939] block mb-2">
              Refresh Frequency Interval
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {intervalOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAutoRefreshInterval(opt.value)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                    autoRefreshInterval === opt.value
                      ? 'bg-[#00778A] text-white border-[#00778A] shadow-xs'
                      : 'bg-[#F7FAFB] text-[#1D2939] border-[#DCE9EE] hover:bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
