import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface DeltaChartProps {
  data: Array<{
    name: string;
    callDelta: number;
    putDelta: number;
    spotPrice: number;
  }>;
}

export const DeltaChart: React.FC<DeltaChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="callDeltaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00778A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00778A" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="putDeltaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7A9266" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#7A9266" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#DCE9EE" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#667085', fontSize: 11 }}
            axisLine={{ stroke: '#DCE9EE' }}
            tickLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            tick={{ fill: '#667085', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              border: '1px solid #DCE9EE',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
              fontSize: '12px'
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="callDelta"
            name="Call Delta (Δ)"
            stroke="#00778A"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#callDeltaGrad)"
          />
          <Area
            type="monotone"
            dataKey="putDelta"
            name="Put Delta (Δ)"
            stroke="#7A9266"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#putDeltaGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
