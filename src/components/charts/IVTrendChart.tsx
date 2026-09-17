import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface IVTrendChartProps {
  data: Array<{
    name: string;
    impliedVol: number;
    historicalVol: number;
  }>;
}

export const IVTrendChart: React.FC<IVTrendChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DCE9EE" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#667085', fontSize: 11 }}
            axisLine={{ stroke: '#DCE9EE' }}
            tickLine={false}
          />
          <YAxis
            unit="%"
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
            formatter={(val: any) => [`${val}%`, '']}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="impliedVol"
            name="Implied Volatility (IV)"
            stroke="#00778A"
            strokeWidth={2.5}
            dot={{ fill: '#00778A', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="historicalVol"
            name="Historical Volatility (HV 30D)"
            stroke="#7A9266"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ fill: '#7A9266', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
