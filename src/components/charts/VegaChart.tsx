import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface VegaChartProps {
  data: Array<{
    name: string;
    vegaRisk: number;
    daysToExpiry: number;
  }>;
}

export const VegaChart: React.FC<VegaChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="vegaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00778A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00778A" stopOpacity={0.0} />
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
            formatter={(value: any) => [`${value} ₹ / 1% IV`, 'Vega Sensitivity']}
          />
          <Area
            type="monotone"
            dataKey="vegaRisk"
            name="Vega Sensitivity (ν)"
            stroke="#00778A"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#vegaGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
