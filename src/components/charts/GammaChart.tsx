import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface GammaChartProps {
  data: Array<{
    name: string;
    gamma: number;
    spotPrice: number;
  }>;
}

export const GammaChart: React.FC<GammaChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          />
          <Bar
            dataKey="gamma"
            name="Gamma Sensitivity (Γ)"
            fill="#7A9266"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
