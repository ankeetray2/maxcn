import React, { useState } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { COMMODITY_SPECS } from '../../services/mockData';
import { CommodityType } from '../../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Activity,
  Layers,
  Zap,
  TrendingDown,
  Wind,
  Smile,
  BarChart2,
  Percent,
  Sparkles,
  RefreshCw,
  Download,
  Info
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const {
    analytics,
    price,
    selectedCommodity,
    setSelectedCommodity,
    greeks,
    downloadActiveExcel,
    downloadActiveCsv,
    activeUploadName
  } = useGreeksStore();

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'delta' | 'gamma' | 'theta' | 'vega' | 'smile' | 'oi' | 'pcr'
  >('all');

  const spec = COMMODITY_SPECS[selectedCommodity] || COMMODITY_SPECS.GOLD;

  const commodities: CommodityType[] = [
    'GOLD',
    'SILVER',
    'CRUDEOIL',
    'NATURALGAS',
    'COPPER',
    'ZINC'
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B131B]/95 text-white p-3 rounded-xl border border-[#223344] shadow-xl text-xs backdrop-blur-md">
          <div className="font-bold text-[#38BDF8] mb-1">Strike: ₹{Number(label).toLocaleString('en-IN')}</div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-gray-300 font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-white/90 dark:bg-[#121E2A]/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00778A]/10 text-[#00778A] dark:text-[#38BDF8] flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#1D2939] dark:text-[#F0F6F9]">
                  {spec.name} Greeks & Volatility Analytics
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#12B76A]/10 text-[#12B76A] border border-[#12B76A]/20">
                  Auto-Generated
                </span>
              </div>
              <p className="text-xs text-[#667085] dark:text-[#8899A6]">
                Real-time multi-dimensional Greeks curves derived from {activeUploadName || 'active ingestion stream'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadActiveExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1A2936] text-[#00778A] dark:text-[#38BDF8] border border-[#DCE9EE] dark:border-[#2E4052] hover:bg-[#F7FAFB] dark:hover:bg-[#223344] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={downloadActiveCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#00778A] hover:bg-[#006070] text-white transition-all shadow-xs"
            >
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Commodity Selector Bar */}
        <div className="mt-5 pt-4 border-t border-[#DCE9EE]/60 dark:border-[#223344] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {commodities.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCommodity(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCommodity === c
                    ? 'bg-[#00778A] text-white shadow-xs'
                    : 'bg-white dark:bg-[#1A2936] text-[#667085] dark:text-[#8899A6] hover:text-[#1D2939] dark:hover:text-[#F0F6F9] border border-[#DCE9EE] dark:border-[#2E4052]'
                }`}
              >
                {COMMODITY_SPECS[c].symbol}
              </button>
            ))}
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 text-xs font-medium text-[#667085] dark:text-[#8899A6] flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
              <span>Live Spot:</span>{' '}
              <span className="font-mono font-bold text-[#1D2939] dark:text-[#F0F6F9]">
                ₹{price.spotPrice.toLocaleString('en-IN')}
              </span>
              <span className={`text-[11px] font-semibold ${(price.changePercent ?? 0) >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                ({(price.changePercent ?? 0) >= 0 ? '+' : ''}{price.changePercent ?? 0}%)
              </span>
            </div>
            <div>
              ATM: <span className="font-bold text-[#00778A] dark:text-[#38BDF8]">₹{price.atmStrike.toLocaleString('en-IN')}</span>
            </div>
            <div>
              PCR: <span className="font-bold text-[#12B76A]">{greeks.pcr}</span>
            </div>
            <div>
              Max Pain: <span className="font-bold text-[#F04438]">₹{greeks.maxPain.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* 7 Required Chart Filter Tabs */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All 7 Charts' },
            { id: 'delta', label: '1. Delta Chart' },
            { id: 'gamma', label: '2. Gamma Chart' },
            { id: 'theta', label: '3. Theta Chart' },
            { id: 'vega', label: '4. Vega Chart' },
            { id: 'smile', label: '5. IV Smile' },
            { id: 'oi', label: '6. OI Distribution' },
            { id: 'pcr', label: '7. PCR Chart' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-[#00778A] dark:bg-[#00778A] text-white shadow-xs'
                  : 'bg-white/80 dark:bg-[#1A2936] text-[#667085] dark:text-[#8899A6] border border-[#DCE9EE] dark:border-[#2E4052] hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Institutional Commentary Insights */}
      {analytics.insights && analytics.insights.length > 0 && (
        <div className="bg-[#00778A]/5 dark:bg-[#00778A]/10 p-5 rounded-[20px] border border-[#00778A]/20">
          <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wider text-[#00778A] dark:text-[#38BDF8]">
            <Sparkles className="w-4 h-4" />
            <span>Algorithmic Insights & Skew Analysis</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#475467] dark:text-[#94A3B8]">
            {analytics.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00778A] dark:bg-[#38BDF8] mt-1.5 shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Auto-Generated Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: DELTA CHART */}
        {(activeFilter === 'all' || activeFilter === 'delta') && (
          <div className="bg-white dark:bg-[#121E2A] p-5 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00778A]/10 text-[#00778A] dark:text-[#38BDF8] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1D2939] dark:text-[#F0F6F9]">Delta Chart (Δ)</h3>
                  <p className="text-[11px] text-[#667085] dark:text-[#8899A6]">Call Delta (0 to 1) & Put Delta (-1 to 0)</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                ATM: ₹{price.atmStrike.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.deltaChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="strike" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#64748B" strokeDasharray="3 3" />
                  <ReferenceLine x={price.atmStrike} stroke="#E11D48" strokeDasharray="4 4" label={{ value: 'ATM', fill: '#E11D48', fontSize: 10 }} />
                  <Line type="monotone" dataKey="callDelta" name="Call Delta (CE)" stroke="#12B76A" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="putDelta" name="Put Delta (PE)" stroke="#F04438" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: GAMMA CHART */}
        {(activeFilter === 'all' || activeFilter === 'gamma') && (
          <div className="bg-white dark:bg-[#121E2A] p-5 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F04438]/10 text-[#F04438] flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1D2939] dark:text-[#F0F6F9]">Gamma Chart (Γ)</h3>
                  <p className="text-[11px] text-[#667085] dark:text-[#8899A6]">Curvature risk (max sensitivity near ATM)</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold">
                Peak: ₹{greeks.highestGamma.strike.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.gammaChart}>
                  <defs>
                    <linearGradient id="gammaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F04438" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F04438" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="strike" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={price.atmStrike} stroke="#00778A" strokeDasharray="4 4" label={{ value: 'ATM', fill: '#00778A', fontSize: 10 }} />
                  <Area type="monotone" dataKey="gamma" name="Gamma (x1000)" stroke="#F04438" strokeWidth={2.5} fillOpacity={1} fill="url(#gammaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: THETA CHART */}
        {(activeFilter === 'all' || activeFilter === 'theta') && (
          <div className="bg-white dark:bg-[#121E2A] p-5 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1D2939] dark:text-[#F0F6F9]">Theta Chart (θ)</h3>
                  <p className="text-[11px] text-[#667085] dark:text-[#8899A6]">Daily time decay per contract across strikes</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold">
                Daily Decay
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.thetaChart}>
                  <defs>
                    <linearGradient id="thetaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="strike" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={price.atmStrike} stroke="#E11D48" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="theta" name="Theta Decay (₹/day)" stroke="#D97706" strokeWidth={2.5} fillOpacity={1} fill="url(#thetaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 4: VEGA CHART */}
        {(activeFilter === 'all' || activeFilter === 'vega') && (
          <div className="bg-white dark:bg-[#121E2A] p-5 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#7F56D9]/10 text-[#7F56D9] flex items-center justify-center">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1D2939] dark:text-[#F0F6F9]">Vega Chart (ν)</h3>
                  <p className="text-[11px] text-[#667085] dark:text-[#8899A6]">Price sensitivity per 1% change in implied volatility</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold">
                Max: ₹{greeks.highestVega.strike.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.vegaChart}>
                  <defs>
                    <linearGradient id="vegaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7F56D9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7F56D9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="strike" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={price.atmStrike} stroke="#7F56D9" strokeDasharray="4 4" />
                  <Area type="monotone" dataKey="vega" name="Vega (₹ per 1% IV)" stroke="#7F56D9" strokeWidth={2.5} fillOpacity={1} fill="url(#vegaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 5: IV SMILE */}
        {(activeFilter === 'all' || activeFilter === 'smile') && (
          <div className="bg-white dark:bg-[#121E2A] p-5 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00778A]/10 text-[#00778A] dark:text-[#38BDF8] flex items-center justify-center">
                  <Smile className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1D2939] dark:text-[#F0F6F9]">IV Smile / Volatility Smirk</h3>
                  <p className="text-[11px] text-[#667085] dark:text-[#8899A6]">Implied Volatility (%) across OTM/ITM strikes</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-semibold">
                Vol Skew
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.ivSmile}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="strike" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <YAxis unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine x={price.atmStrike} stroke="#E11D48" strokeDasharray="4 4" label={{ value: 'ATM', fill: '#E11D48', fontSize: 10 }} />
                  <Line type="monotone" dataKey="callIV" name="Call IV (%)" stroke="#00778A" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="putIV" name="Put IV (%)" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 6: OI DISTRIBUTION */}
        {(activeFilter === 'all' || activeFilter === 'oi') && (
          <div className="bg-white dark:bg-[#121E2A] p-5 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#12B76A]/10 text-[#12B76A] flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1D2939] dark:text-[#F0F6F9]">OI Distribution (Open Interest)</h3>
                  <p className="text-[11px] text-[#667085] dark:text-[#8899A6]">Call OI vs Put OI build-up per strike</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold">
                High OI: ₹{greeks.highestOi.strike.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.oiDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="strike" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine x={price.atmStrike} stroke="#E11D48" strokeDasharray="4 4" />
                  <Bar dataKey="callOI" name="Call OI" fill="#12B76A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="putOI" name="Put OI" fill="#F04438" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 7: PCR CHART */}
        {(activeFilter === 'all' || activeFilter === 'pcr') && (
          <div className="bg-white dark:bg-[#121E2A] p-5 rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00778A]/10 text-[#00778A] dark:text-[#38BDF8] flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1D2939] dark:text-[#F0F6F9]">PCR Chart (Put-Call Ratio by Strike)</h3>
                  <p className="text-[11px] text-[#667085] dark:text-[#8899A6]">Strike-level sentiment (&gt;1.2 Bullish support, &lt;0.8 Bearish ceiling)</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-semibold">
                Overall PCR: {greeks.pcr.toFixed(2)}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.pcrChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="strike" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={1.2} stroke="#12B76A" strokeDasharray="3 3" label={{ value: 'Bullish (1.2)', fill: '#12B76A', fontSize: 10 }} />
                  <ReferenceLine y={0.8} stroke="#F04438" strokeDasharray="3 3" label={{ value: 'Bearish (0.8)', fill: '#F04438', fontSize: 10 }} />
                  <ReferenceLine x={price.atmStrike} stroke="#00778A" strokeDasharray="4 4" label={{ value: 'ATM', fill: '#00778A', fontSize: 10 }} />
                  <Line type="monotone" dataKey="pcr" name="Strike PCR" stroke="#00778A" strokeWidth={3} dot={{ r: 4, fill: '#00778A' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
