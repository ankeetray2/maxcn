import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { useGreeksStore } from '../../store/useGreeksStore';
import { BarChart3, TrendingUp, Activity, Clock, Zap, ShieldCheck } from 'lucide-react';

type ChartTab = 'payoff' | 'delta' | 'gamma' | 'theta' | 'vega' | 'pop';

export const AdvancedGreeksCharts: React.FC = () => {
  const { curveData, calculator, calculatedResult } = useGreeksStore();
  const [activeTab, setActiveTab] = useState<ChartTab>('payoff');

  const tabs: Array<{ id: ChartTab; label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = [
    { id: 'payoff', label: 'Payoff Chart', icon: BarChart3, color: '#00778A' },
    { id: 'delta', label: 'Delta Curve (Δ)', icon: Activity, color: '#00778A' },
    { id: 'gamma', label: 'Gamma Curve (Γ)', icon: TrendingUp, color: '#12B76A' },
    { id: 'theta', label: 'Theta Curve (θ)', icon: Clock, color: '#D92D20' },
    { id: 'vega', label: 'Vega Curve (ν)', icon: Zap, color: '#7F56D9' },
    { id: 'pop', label: 'POP Curve (%)', icon: ShieldCheck, color: '#0EA5E9' }
  ];

  const currentSpot = calculator.spotPrice;
  const currentStrike = calculator.strikePrice;
  const breakevenSpot = calculatedResult.breakeven;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-[#101828]/95 backdrop-blur-md p-3 rounded-xl border border-[#DCE9EE] dark:border-[#334155] shadow-lg text-xs font-mono">
          <div className="text-[#64748B] mb-1 font-sans font-semibold">
            Spot Price: ₹{Number(label).toLocaleString('en-IN')}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span style={{ color: entry.color }} className="font-semibold font-sans">
                {entry.name}:
              </span>
              <span className="font-bold text-[#1D2939] dark:text-white">
                {typeof entry.value === 'number'
                  ? entry.value >= 100 || entry.value <= -100
                    ? `₹${entry.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                    : entry.value.toFixed(4)
                  : entry.value}
              </span>
            </div>
          ))}
          {dataPoint.pop !== undefined && activeTab === 'pop' && (
            <div className="text-[11px] text-[#0EA5E9] font-sans mt-1">
              Prob of Profit: {dataPoint.pop}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="advanced-greeks-charts" className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-6 rounded-[22px] border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs">
      {/* Chart Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E4E7EC] dark:border-[#1E293B]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {tabs.map((t) => {
            const isSelected = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#00778A] text-white shadow-xs'
                    : 'bg-[#F2F4F7] dark:bg-[#1E293B] text-[#475467] dark:text-[#CBD5E1] hover:bg-[#E4E7EC]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00778A]" />
            Spot: ₹{currentSpot.toLocaleString('en-IN')}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F79009]" />
            Strike: ₹{currentStrike.toLocaleString('en-IN')}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
            BE: ₹{breakevenSpot.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[340px] w-full pt-2">
        {activeTab === 'payoff' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="pnlGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12B76A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#12B76A" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="pnlRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D92D20" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D92D20" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
              <XAxis
                dataKey="spot"
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                stroke="#94A3B8"
                fontSize={11}
              />
              <YAxis
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                stroke="#94A3B8"
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#64748B" strokeWidth={1.5} />
              <ReferenceLine x={currentSpot} stroke="#00778A" strokeDasharray="3 3" label={{ value: 'Spot', fill: '#00778A', fontSize: 10 }} />
              <ReferenceLine x={currentStrike} stroke="#F79009" strokeDasharray="3 3" label={{ value: 'Strike', fill: '#F79009', fontSize: 10 }} />
              <ReferenceLine x={breakevenSpot} stroke="#12B76A" strokeDasharray="3 3" label={{ value: 'BE', fill: '#12B76A', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="activePayoff"
                name="Expiry Payoff (₹)"
                stroke="#00778A"
                strokeWidth={2.5}
                fill="url(#pnlGreen)"
              />
              <Line
                type="monotone"
                dataKey="pnl"
                name="T+0 P&L Curve (₹)"
                stroke="#7F56D9"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'delta' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="spot" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 1]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={currentSpot} stroke="#00778A" strokeDasharray="3 3" />
              <ReferenceLine x={currentStrike} stroke="#F79009" strokeDasharray="3 3" />
              <ReferenceLine y={0.5} stroke="#94A3B8" strokeDasharray="2 2" />
              <Line
                type="monotone"
                dataKey="delta"
                name="Delta (Δ)"
                stroke="#00778A"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'gamma' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gammaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#12B76A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#12B76A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="spot" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={currentSpot} stroke="#00778A" strokeDasharray="3 3" />
              <ReferenceLine x={currentStrike} stroke="#F79009" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="gamma"
                name="Gamma (Γ)"
                stroke="#12B76A"
                strokeWidth={2.5}
                fill="url(#gammaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'theta' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="spot" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={currentSpot} stroke="#00778A" strokeDasharray="3 3" />
              <ReferenceLine x={currentStrike} stroke="#F79009" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="theta"
                name="Theta (θ Daily)"
                stroke="#D92D20"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'vega' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="vegaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7F56D9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7F56D9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="spot" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={currentSpot} stroke="#00778A" strokeDasharray="3 3" />
              <ReferenceLine x={currentStrike} stroke="#F79009" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="vega"
                name="Vega (ν per 1% IV)"
                stroke="#7F56D9"
                strokeWidth={2.5}
                fill="url(#vegaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'pop' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="popGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="spot" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={currentSpot} stroke="#00778A" strokeDasharray="3 3" label={{ value: 'Spot', fill: '#00778A', fontSize: 10 }} />
              <ReferenceLine x={currentStrike} stroke="#F79009" strokeDasharray="3 3" label={{ value: 'Strike', fill: '#F79009', fontSize: 10 }} />
              <ReferenceLine x={breakevenSpot} stroke="#12B76A" strokeDasharray="3 3" label={{ value: 'BE', fill: '#12B76A', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="pop"
                name="Probability of Profit (%)"
                stroke="#0EA5E9"
                strokeWidth={2.5}
                fill="url(#popGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
