import React, { useState } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
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
  Palette
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, databaseStatus, fetchHistoryFromBackend } = useGreeksStore();
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
    </div>
  );
};
