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

interface ThetaChartProps {
  data: Array<{
    name: string;
    daysToExpiry: number;
    thetaDecay: number;
  }>;
}

export const ThetaChart: React.FC<ThetaChartProps> = ({ data }) => {
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
            formatter={(value: any) => [`-${value} ₹/day`, 'Theta Bleed']}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="thetaDecay"
            name="Daily Theta Decay (θ)"
            stroke="#F04438"
            strokeWidth={2.5}
            dot={{ fill: '#F04438', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
