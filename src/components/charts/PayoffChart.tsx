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
  Area,
  ComposedChart
} from 'recharts';
import { useGreeksStore } from '../../store/useGreeksStore';
import { formatCurrency } from '../../utils/greeks';
import { HelpCircle, TrendingUp, AlertTriangle } from 'lucide-react';

export const PayoffChart: React.FC = () => {
  const { curveData, calculator, calculatedResult, settings } = useGreeksStore();
  const [showTheoretical, setShowTheoretical] = useState(true);

  if (!curveData || curveData.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 text-center text-[#667085]">
        No payoff curve generated. Run calculation to visualize payoff diagram.
      </div>
    );
  }

  const isCall = calculator.optionType === 'CALL';
  const breakeven = isCall
    ? calculator.strikePrice + calculatedResult.price
    : calculator.strikePrice - calculatedResult.price;

  const maxLoss = calculatedResult.price * calculatedResult.totalQuantity;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]/60 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[#1D2939]">Option Payoff Diagram</h3>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
              isCall ? 'bg-[#00778A]/10 text-[#00778A]' : 'bg-[#7A9266]/15 text-[#7A9266]'
            }`}>
              {calculator.commodity} {calculator.strikePrice} {calculator.optionType}
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Payoff profile at expiration vs. theoretical pre-expiry curve
          </p>
        </div>

        {/* Controls & Breakeven info */}
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-[#667085]">Breakeven: </span>
            <span className="font-mono font-semibold text-[#1D2939]">
              {formatCurrency(breakeven, settings.currency, 2)}
            </span>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-[#1D2939] cursor-pointer select-none bg-[#F7FAFB] px-3 py-1.5 rounded-lg border border-[#DCE9EE]">
            <input
              type="checkbox"
              checked={showTheoretical}
              onChange={(e) => setShowTheoretical(e.target.checked)}
              className="accent-[#00778A] rounded"
            />
            <span>Pre-Expiry Curve</span>
          </label>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={curveData} margin={{ top: 10, right: 25, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#12B76A" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#12B76A" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(val) => `${val >= 0 ? '+' : ''}${Math.round(val)}`}
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
                      Underlying Spot: {formatCurrency(Number(label), settings.currency, 2)}
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#667085]">Payoff at Expiry:</span>
                      <span className={`font-mono font-bold ${data.activePayoff >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                        {data.activePayoff >= 0 ? '+' : ''}{formatCurrency(data.activePayoff, settings.currency, 2)}
                      </span>
                    </div>
                    {showTheoretical && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#667085]">Theoretical P&L:</span>
                        <span className={`font-mono font-semibold ${data.pnl >= 0 ? 'text-[#00778A]' : 'text-[#F04438]'}`}>
                          {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl, settings.currency, 2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between gap-4 text-[11px] pt-1 border-t border-[#DCE9EE]/60 text-[#667085]">
                      <span>Delta: {(data.delta).toFixed(4)}</span>
                      <span>Theta: {(data.theta).toFixed(2)}/d</span>
                    </div>
                  </div>
                );
              }}
            />
            {/* Zero PnL reference line */}
            <ReferenceLine y={0} stroke="#98A2B3" strokeWidth={1.5} strokeDasharray="4 4" />
            
            {/* Current Spot reference line */}
            <ReferenceLine
              x={calculator.spotPrice}
              stroke="#00778A"
              strokeWidth={1.5}
              label={{ value: 'Spot', position: 'top', fill: '#00778A', fontSize: 11, fontWeight: 600 }}
            />

            {/* Strike Price reference line */}
            <ReferenceLine
              x={calculator.strikePrice}
              stroke="#7A9266"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              label={{ value: 'Strike', position: 'insideBottomRight', fill: '#7A9266', fontSize: 11 }}
            />

            {/* Expiry Payoff line */}
            <Line
              type="linear"
              dataKey="activePayoff"
              name="Payoff at Expiry"
              stroke="#12B76A"
              strokeWidth={2.5}
              dot={false}
            />

            {/* Theoretical pre-expiry curve */}
            {showTheoretical && (
              <Line
                type="monotone"
                dataKey="pnl"
                name="Pre-Expiry Theoretical"
                stroke="#00778A"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Payoff Stats Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#DCE9EE]/60">
        <div className="bg-[#F7FAFB] p-2.5 rounded-xl border border-[#DCE9EE]/60">
          <div className="text-[11px] text-[#667085]">Max Risk (Premium)</div>
          <div className="text-sm font-semibold text-[#F04438] font-mono mt-0.5">
            -{formatCurrency(maxLoss, settings.currency, 2)}
          </div>
        </div>
        <div className="bg-[#F7FAFB] p-2.5 rounded-xl border border-[#DCE9EE]/60">
          <div className="text-[11px] text-[#667085]">Max Profit</div>
          <div className="text-sm font-semibold text-[#12B76A] font-mono mt-0.5">
            {isCall ? 'Unlimited (Long Call)' : formatCurrency((calculator.strikePrice - calculatedResult.price) * calculatedResult.totalQuantity, settings.currency, 2)}
          </div>
        </div>
        <div className="bg-[#F7FAFB] p-2.5 rounded-xl border border-[#DCE9EE]/60">
          <div className="text-[11px] text-[#667085]">Breakeven Spot</div>
          <div className="text-sm font-semibold text-[#1D2939] font-mono mt-0.5">
            {formatCurrency(breakeven, settings.currency, 2)}
          </div>
        </div>
        <div className="bg-[#F7FAFB] p-2.5 rounded-xl border border-[#DCE9EE]/60">
          <div className="text-[11px] text-[#667085]">Probability of Profit (POP)</div>
          <div className="text-sm font-semibold text-[#00778A] font-mono mt-0.5">
            {calculatedResult.probabilityITM}%
          </div>
        </div>
      </div>
    </div>
  );
};
