import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import { useGreeksStore } from '../../store/useGreeksStore';
import { formatCurrency, formatGreek } from '../../utils/greeks';
import { BarChart3, TrendingUp, Activity, Clock, ShieldAlert, Sparkles, Layers } from 'lucide-react';

export type CurveTabType = 'payoff' | 'delta' | 'gamma' | 'theta' | 'vega' | 'all';

interface GreekCurvesSuiteProps {
  selectedMove?: number;
  simulatedSpotPrice?: number;
}

export const GreekCurvesSuite: React.FC<GreekCurvesSuiteProps> = ({
  selectedMove = 0,
  simulatedSpotPrice
}) => {
  const { calculator, calculatedResult, curveData, settings } = useGreeksStore();
  const [activeCurveTab, setActiveCurveTab] = useState<CurveTabType>('payoff');
  const [showTheoretical, setShowTheoretical] = useState(true);

  const isCall = calculator.optionType === 'CALL';
  const breakeven = isCall
    ? calculator.strikePrice + calculatedResult.price
    : calculator.strikePrice - calculatedResult.price;

  const targetSimulatedSpot = simulatedSpotPrice || (calculator.spotPrice + selectedMove);

  const renderPayoffChart = (height = 360) => (
    <div style={{ height: `${height}px` }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={curveData} margin={{ top: 15, right: 25, left: 15, bottom: 20 }}>
          <defs>
            <linearGradient id="profitAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#12B76A" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#12B76A" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="lossAreaGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#F04438" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#F04438" stopOpacity={0.0} />
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
                <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-[#DCE9EE] shadow-lg text-xs space-y-1.5 font-sans">
                  <div className="font-bold text-[#1D2939] border-b border-[#DCE9EE] pb-1">
                    Spot Price: {formatCurrency(Number(label), settings.currency, 2)}
                  </div>
                  <div className="flex justify-between gap-4 font-mono">
                    <span className="text-[#667085]">Payoff at Expiration:</span>
                    <span className={`font-bold ${data.activePayoff >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                      {data.activePayoff >= 0 ? '+' : ''}{formatCurrency(data.activePayoff, settings.currency, 2)}
                    </span>
                  </div>
                  {showTheoretical && (
                    <div className="flex justify-between gap-4 font-mono">
                      <span className="text-[#667085]">Theoretical P&L:</span>
                      <span className={`font-semibold ${data.pnl >= 0 ? 'text-[#00778A]' : 'text-[#F04438]'}`}>
                        {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl, settings.currency, 2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#98A2B3" strokeWidth={1.5} strokeDasharray="3 3" />
          <ReferenceLine
            x={calculator.strikePrice}
            stroke="#00778A"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            label={{
              value: `Strike: ${calculator.strikePrice}`,
              position: 'insideTopLeft',
              fill: '#00778A',
              fontSize: 11,
              fontWeight: 600
            }}
          />
          <ReferenceLine
            x={calculator.spotPrice}
            stroke="#12B76A"
            strokeWidth={1.5}
            label={{
              value: `Spot: ${calculator.spotPrice}`,
              position: 'insideTopRight',
              fill: '#12B76A',
              fontSize: 11,
              fontWeight: 600
            }}
          />
          {targetSimulatedSpot !== calculator.spotPrice && (
            <ReferenceLine
              x={targetSimulatedSpot}
              stroke="#F79009"
              strokeWidth={2}
              strokeDasharray="2 2"
              label={{
                value: `Simulated: ${targetSimulatedSpot}`,
                position: 'insideBottomRight',
                fill: '#F79009',
                fontSize: 11,
                fontWeight: 700
              }}
            />
          )}
          <ReferenceLine
            x={breakeven}
            stroke="#F04438"
            strokeDasharray="2 2"
            label={{
              value: `BE: ${Math.round(breakeven)}`,
              position: 'bottom',
              fill: '#F04438',
              fontSize: 10
            }}
          />
          <Line
            type="monotone"
            dataKey="activePayoff"
            name="Expiration Payoff"
            stroke="#00778A"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#00778A' }}
          />
          {showTheoretical && (
            <Line
              type="monotone"
              dataKey="pnl"
              name="Pre-Expiry Theoretical P&L"
              stroke="#12B76A"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, fill: '#12B76A' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  const renderGenericCurve = (
    dataKey: 'delta' | 'gamma' | 'theta' | 'vega',
    color: string,
    title: string,
    unit: string,
    decimals = 4,
    height = 320
  ) => (
    <div style={{ height: `${height}px` }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={curveData} margin={{ top: 15, right: 25, left: 15, bottom: 20 }}>
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
            tickFormatter={(val) => Number(val).toFixed(decimals >= 4 ? 3 : 1)}
            tick={{ fontSize: 11, fill: '#667085' }}
            axisLine={false}
            tickLine={false}
            dx={-5}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const val = payload[0].value;
              return (
                <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#DCE9EE] shadow-lg text-xs space-y-1 font-sans">
                  <div className="font-bold text-[#1D2939] border-b border-[#DCE9EE] pb-1">
                    Spot: {formatCurrency(Number(label), settings.currency, 2)}
                  </div>
                  <div className="flex justify-between gap-4 font-mono">
                    <span className="text-[#667085]">{title}:</span>
                    <span className="font-bold text-[#1D2939]">
                      {typeof val === 'number' ? val.toFixed(decimals) : val} {unit}
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <ReferenceLine
            x={calculator.strikePrice}
            stroke="#98A2B3"
            strokeDasharray="3 3"
            label={{ value: 'Strike', position: 'top', fill: '#667085', fontSize: 10 }}
          />
          <ReferenceLine
            x={calculator.spotPrice}
            stroke="#00778A"
            strokeDasharray="2 2"
            label={{ value: 'Current Spot', position: 'insideTopLeft', fill: '#00778A', fontSize: 10 }}
          />
          {targetSimulatedSpot !== calculator.spotPrice && (
            <ReferenceLine
              x={targetSimulatedSpot}
              stroke="#F79009"
              strokeWidth={2}
              strokeDasharray="2 2"
              label={{ value: 'Simulated', position: 'insideTopRight', fill: '#F79009', fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 shadow-sm">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]/60 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#1D2939]">Option Curves & Greek Sensitivity Suite</h3>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#00778A]/10 text-[#00778A]">
              5 Mathematical Curves
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Visualize payoff vs spot along with Delta (Δ), Gamma (Γ), Theta decay (θ), and Vega volatility sensitivity (ν)
          </p>
        </div>

        {/* Chart Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7FAFB] rounded-xl border border-[#DCE9EE]">
          <button
            onClick={() => setActiveCurveTab('payoff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeCurveTab === 'payoff'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] hover:text-[#1D2939]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>1. Payoff Chart</span>
          </button>
          <button
            onClick={() => setActiveCurveTab('delta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeCurveTab === 'delta'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] hover:text-[#1D2939]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2. Delta Curve</span>
          </button>
          <button
            onClick={() => setActiveCurveTab('gamma')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeCurveTab === 'gamma'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] hover:text-[#1D2939]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. Gamma Curve</span>
          </button>
          <button
            onClick={() => setActiveCurveTab('theta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeCurveTab === 'theta'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] hover:text-[#1D2939]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>4. Theta Curve</span>
          </button>
          <button
            onClick={() => setActiveCurveTab('vega')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeCurveTab === 'vega'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] hover:text-[#1D2939]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>5. Vega Curve</span>
          </button>
          <button
            onClick={() => setActiveCurveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              activeCurveTab === 'all'
                ? 'bg-[#00778A] text-white shadow-xs'
                : 'text-[#667085] hover:text-[#1D2939]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Curves Grid</span>
          </button>
        </div>
      </div>

      {/* Chart Content Area */}
      {activeCurveTab === 'payoff' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-[#667085]">
                Breakeven:{' '}
                <strong className="text-[#1D2939] font-mono">
                  {formatCurrency(breakeven, settings.currency, 2)}
                </strong>
              </span>
              <span className="text-[#667085]">
                Max Risk:{' '}
                <strong className="text-[#F04438] font-mono">
                  {formatCurrency(calculatedResult.price * calculatedResult.totalQuantity, settings.currency, 2)}
                </strong>
              </span>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-[#1D2939] cursor-pointer bg-[#F7FAFB] px-3 py-1 rounded-lg border border-[#DCE9EE]">
              <input
                type="checkbox"
                checked={showTheoretical}
                onChange={(e) => setShowTheoretical(e.target.checked)}
                className="accent-[#00778A] rounded"
              />
              <span>Pre-Expiry Theoretical Line</span>
            </label>
          </div>
          {renderPayoffChart(360)}
        </div>
      )}

      {activeCurveTab === 'delta' && (
        <div>
          <div className="flex items-center justify-between mb-3 text-xs text-[#667085]">
            <span>
              Delta indicates the rate of change of option premium per ₹1 underlying spot move. Ranges from 0 to 1 for Calls, 0 to -1 for Puts.
            </span>
            <span className="font-semibold text-[#00778A]">
              Current ATM Delta: {formatGreek(calculatedResult.delta, 4)}
            </span>
          </div>
          {renderGenericCurve('delta', '#00778A', 'Delta (Δ)', '', 4, 340)}
        </div>
      )}

      {activeCurveTab === 'gamma' && (
        <div>
          <div className="flex items-center justify-between mb-3 text-xs text-[#667085]">
            <span>
              Gamma measures the rate of change of Delta. Peaks sharply around the At-The-Money (ATM) strike price: {calculator.strikePrice}.
            </span>
            <span className="font-semibold text-[#7A9266]">
              Current Gamma: {calculatedResult.gamma.toFixed(6)}
            </span>
          </div>
          {renderGenericCurve('gamma', '#7A9266', 'Gamma (Γ)', '', 6, 340)}
        </div>
      )}

      {activeCurveTab === 'theta' && (
        <div>
          <div className="flex items-center justify-between mb-3 text-xs text-[#667085]">
            <span>
              Theta decay represents the daily erosion of option premium as expiration approaches (time decay risk).
            </span>
            <span className="font-semibold text-[#F04438]">
              Current Theta: {calculatedResult.theta.toFixed(2)}/day
            </span>
          </div>
          {renderGenericCurve('theta', '#F04438', 'Theta (θ/day)', '₹/day', 2, 340)}
        </div>
      )}

      {activeCurveTab === 'vega' && (
        <div>
          <div className="flex items-center justify-between mb-3 text-xs text-[#667085]">
            <span>
              Vega represents the sensitivity of the option price to a 1% change in Implied Volatility (IV).
            </span>
            <span className="font-semibold text-[#12B76A]">
              Current Vega: {calculatedResult.vega.toFixed(2)}/1% IV
            </span>
          </div>
          {renderGenericCurve('vega', '#12B76A', 'Vega (ν)', '₹/1% IV', 2, 340)}
        </div>
      )}

      {activeCurveTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
            <h4 className="text-xs font-bold text-[#1D2939] mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#00778A]" />
              1. Payoff Chart (X: Price, Y: Profit/Loss)
            </h4>
            {renderPayoffChart(240)}
          </div>
          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
            <h4 className="text-xs font-bold text-[#1D2939] mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#00778A]" />
              2. Delta Curve (0 to 1)
            </h4>
            {renderGenericCurve('delta', '#00778A', 'Delta (Δ)', '', 4, 240)}
          </div>
          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
            <h4 className="text-xs font-bold text-[#1D2939] mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#7A9266]" />
              3. Gamma Curve (Peak at ATM Strike)
            </h4>
            {renderGenericCurve('gamma', '#7A9266', 'Gamma (Γ)', '', 6, 240)}
          </div>
          <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
            <h4 className="text-xs font-bold text-[#1D2939] mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#F04438]" />
              4. Theta Decay Curve
            </h4>
            {renderGenericCurve('theta', '#F04438', 'Theta (θ/d)', '₹/day', 2, 240)}
          </div>
        </div>
      )}
    </div>
  );
};
