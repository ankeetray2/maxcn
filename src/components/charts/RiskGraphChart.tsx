import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { useGreeksStore } from '../../store/useGreeksStore';
import { formatCurrency } from '../../utils/greeks';

export const RiskGraphChart: React.FC = () => {
  const { curveData, calculator, settings } = useGreeksStore();
  const [activeGreek, setActiveGreek] = useState<'delta' | 'gamma' | 'theta' | 'vega'>('delta');

  if (!curveData || curveData.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 text-center text-[#667085]">
        No risk curve generated.
      </div>
    );
  }

  const greekConfigs = {
    delta: {
      name: 'Delta Curve',
      color: '#00778A',
      unit: 'Δ',
      desc: 'Directional sensitivity relative to underlying commodity spot price'
    },
    gamma: {
      name: 'Gamma Curve',
      color: '#7A9266',
      unit: 'Γ',
      desc: 'Rate of change of delta per ₹1 move in spot price'
    },
    theta: {
      name: 'Daily Theta Decay',
      color: '#F04438',
      unit: 'Θ/day',
      desc: 'Daily time decay exposure at different spot levels'
    },
    vega: {
      name: 'Vega Exposure',
      color: '#12B76A',
      unit: 'V/1% IV',
      desc: 'Sensitivity to a 1% shift in annualized implied volatility'
    }
  };

  const activeConfig = greekConfigs[activeGreek];

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]/60 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[#1D2939]">{activeConfig.name}</h3>
          <p className="text-xs text-[#667085] mt-0.5">{activeConfig.desc}</p>
        </div>

        {/* Greek selector buttons */}
        <div className="flex items-center gap-1 bg-[#F7FAFB] p-1 rounded-xl border border-[#DCE9EE]">
          {(['delta', 'gamma', 'theta', 'vega'] as const).map((greekKey) => (
            <button
              key={greekKey}
              onClick={() => setActiveGreek(greekKey)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                activeGreek === greekKey
                  ? 'bg-white text-[#00778A] shadow-sm font-semibold'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              {greekKey}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curveData} margin={{ top: 10, right: 25, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5EEF2" vertical={false} />
            <XAxis
              dataKey="spot"
              tickFormatter={(val) => Math.round(val).toLocaleString('en-IN')}
              tick={{ fontSize: 11, fill: '#667085' }}
              axisLine={{ stroke: '#DCE9EE' }}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#667085' }}
              axisLine={false}
              tickLine={false}
              dx={-5}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-[#DCE9EE] shadow-lg text-xs space-y-1.5">
                    <div className="font-semibold text-[#1D2939] border-b border-[#DCE9EE] pb-1">
                      Spot: {formatCurrency(Number(label), settings.currency, 2)}
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#667085] capitalize">{activeGreek}:</span>
                      <span className="font-mono font-bold" style={{ color: activeConfig.color }}>
                        {Number(data[activeGreek]).toFixed(activeGreek === 'gamma' ? 6 : 4)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-[#667085]">
                      <span>Option Premium:</span>
                      <span className="font-mono">{formatCurrency(data.theoreticalPrice, settings.currency, 2)}</span>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              x={calculator.spotPrice}
              stroke="#00778A"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={{ value: 'Spot', position: 'top', fill: '#00778A', fontSize: 11, fontWeight: 600 }}
            />
            <ReferenceLine
              x={calculator.strikePrice}
              stroke="#7A9266"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              label={{ value: 'Strike', position: 'insideBottomRight', fill: '#7A9266', fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey={activeGreek}
              stroke={activeConfig.color}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
