import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGreeksStore } from '../../store/useGreeksStore';
import { COMMODITY_SPECS, getCommoditySpec } from '../../services/mockData';
import { calculateGreeks, formatCurrency, formatGreek } from '../../utils/greeks';
import {
  TrendingUp,
  Activity,
  Sliders,
  Sparkles,
  Percent,
  Layers,
  ShieldCheck,
  Target
} from 'lucide-react';

export const ResultCards: React.FC = () => {
  const {
    calculatedResult,
    calculator,
    selectedCommodity,
    settings
  } = useGreeksStore();

  const spec = getCommoditySpec(selectedCommodity);

  // Scenario stress sliders
  const [spotOffsetPercent, setSpotOffsetPercent] = useState<number>(0);
  const [ivOffsetPercent, setIvOffsetPercent] = useState<number>(0);

  const simulatedSpot = calculator.spotPrice * (1 + spotOffsetPercent / 100);
  const simulatedIV = Math.max(1, calculator.volatility + ivOffsetPercent);

  const scenarioResult = calculateGreeks(
    simulatedSpot,
    calculator.strikePrice,
    calculator.expiryDays,
    simulatedIV,
    calculator.interestRate,
    calculator.optionType,
    settings.pricingModel,
    calculator.contracts,
    calculator.lotSize || spec?.lotSize || 100
  );

  const priceDiff = scenarioResult.price - calculatedResult.price;
  const priceDiffPercent = calculatedResult.price > 0 ? (priceDiff / calculatedResult.price) * 100 : 0;

  const greekCards = [
    {
      id: 'delta',
      name: 'Delta (Δ)',
      symbol: 'Δ',
      value: formatGreek(calculatedResult.delta, settings.decimalPrecision),
      positionValue: `${formatGreek(calculatedResult.positionDelta, 2)} Δ`,
      interpretation: calculatedResult.delta >= 0 ? 'Bullish Exposure' : 'Bearish Exposure',
      explanation: 'Change in option price per ₹1 move in spot.',
      color: '#00778A',
      bgColor: 'bg-[#00778A]/10'
    },
    {
      id: 'gamma',
      name: 'Gamma (Γ)',
      symbol: 'Γ',
      value: formatGreek(calculatedResult.gamma, settings.decimalPrecision),
      positionValue: `${calculatedResult.positionGamma.toFixed(4)} Γ`,
      interpretation: 'Curvature / Delta Accel',
      explanation: 'Change in Delta per ₹1 move in spot price.',
      color: '#7A9266',
      bgColor: 'bg-[#7A9266]/10'
    },
    {
      id: 'theta',
      name: 'Theta (θ)',
      symbol: 'θ',
      value: `${formatGreek(calculatedResult.theta, 2)} / day`,
      positionValue: `${formatCurrency(calculatedResult.positionTheta, settings.currency, 1)} / day`,
      interpretation: 'Daily Time Decay',
      explanation: 'Daily theoretical value loss per calendar day.',
      color: '#F04438',
      bgColor: 'bg-[#F04438]/10'
    },
    {
      id: 'vega',
      name: 'Vega (ν)',
      symbol: 'ν',
      value: `${formatGreek(calculatedResult.vega, 2)} / 1% IV`,
      positionValue: `${formatCurrency(calculatedResult.positionVega, settings.currency, 1)} / 1%`,
      interpretation: 'Volatility Sensitivity',
      explanation: 'Change in price per 1.0% shift in implied volatility.',
      color: '#00778A',
      bgColor: 'bg-[#B5CEDA]/30'
    },
    {
      id: 'rho',
      name: 'Rho (ρ)',
      symbol: 'ρ',
      value: `${formatGreek(calculatedResult.rho, 2)} / 1% Rate`,
      positionValue: `${formatCurrency(calculatedResult.positionRho, settings.currency, 1)} / 1%`,
      interpretation: 'Interest Rate Sensitivity',
      explanation: 'Change in price per 1.0% shift in benchmark rate.',
      color: '#7A9266',
      bgColor: 'bg-[#F0F4ED]'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Primary Theoretical Price Banner */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#00778A]/30 bg-gradient-to-r from-white/95 via-white/90 to-[#E6F3F5]/60 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg bg-[#00778A] text-white">
                {calculator.optionType} Strike {calculator.strikePrice}
              </span>
              <span className="text-xs text-[#667085]">
                {spec.name} • T: {calculator.expiryDays} Days ({(calculator.expiryDays / 365).toFixed(4)} Yrs)
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-xs font-semibold text-[#667085]">Theoretical Price:</span>
              <span className="text-3xl font-extrabold text-[#1D2939] tracking-tight font-mono">
                {formatCurrency(calculatedResult.price, settings.currency, 2)}
              </span>
              <span className="text-xs text-[#667085]">/ unit</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-[#667085] font-mono">
              <span>d1: <strong className="text-[#1D2939]">{calculatedResult.d1.toFixed(6)}</strong></span>
              <span>•</span>
              <span>d2: <strong className="text-[#1D2939]">{calculatedResult.d2.toFixed(6)}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 py-3 px-4 rounded-2xl bg-white/90 border border-[#DCE9EE] text-xs">
            <div>
              <span className="text-[#667085] block text-[11px]">Intrinsic Value</span>
              <strong className="text-[#1D2939] font-mono font-bold">
                {formatCurrency(calculatedResult.intrinsicValue, settings.currency, 2)}
              </strong>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">Extrinsic (Time)</span>
              <strong className="text-[#00778A] font-mono font-bold">
                {formatCurrency(calculatedResult.timeValue, settings.currency, 2)}
              </strong>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">Position Outlay</span>
              <strong className="text-[#7A9266] font-mono font-bold">
                {formatCurrency(calculatedResult.positionValue, settings.currency, 0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Greek Output Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {greekCards.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-white/90 backdrop-blur-md p-5 rounded-[24px] border border-[#DCE9EE] shadow-xs flex flex-col justify-between hover:border-[#00778A]/40 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1D2939]">{card.name}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs"
                  style={{ backgroundColor: `${card.color}15`, color: card.color }}
                >
                  {card.symbol}
                </div>
              </div>

              <div className="text-xl font-extrabold text-[#1D2939] tracking-tight font-mono mt-1">
                {card.value}
              </div>

              <div className="mt-1 text-xs font-semibold text-[#00778A] font-mono">
                Pos: {card.positionValue}
              </div>

              <div className="mt-2 text-[10px] font-semibold text-[#667085] bg-[#F7FAFB] px-2 py-0.5 rounded-md inline-block border border-[#DCE9EE]/60">
                {card.interpretation}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#DCE9EE]/60 text-[11px] text-[#667085] leading-snug">
              {card.explanation}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Metrics Row: Probabilities & IV Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-[20px] border border-[#DCE9EE] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-1">
            <span className="font-semibold">Probability ITM (POP)</span>
            <Target className="w-4 h-4 text-[#00778A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1D2939]">
            {calculatedResult.probabilityITM}%
          </div>
          <div className="text-[11px] text-[#667085] mt-1">
            Prob OTM: <strong className="text-[#1D2939]">{calculatedResult.probabilityOTM}%</strong>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-[20px] border border-[#DCE9EE] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-1">
            <span className="font-semibold">Probability of Touch</span>
            <Activity className="w-4 h-4 text-[#7A9266]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1D2939]">
            {calculatedResult.probabilityTouch}%
          </div>
          <div className="text-[11px] text-[#667085] mt-1">
            Expected 2 × ITM threshold chance
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-[20px] border border-[#DCE9EE] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-1">
            <span className="font-semibold">IV Rank (52-Week)</span>
            <Percent className="w-4 h-4 text-[#00778A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#00778A]">
            {calculatedResult.ivRank}%
          </div>
          <div className="text-[11px] text-[#667085] mt-1">
            52w: {spec.default52wLowIV}% – {spec.default52wHighIV}%
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-4 rounded-[20px] border border-[#DCE9EE] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-1">
            <span className="font-semibold">Delta Exposure</span>
            <ShieldCheck className="w-4 h-4 text-[#12B76A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1D2939]">
            {formatCurrency(calculatedResult.totalDeltaExposure, settings.currency, 0)}
          </div>
          <div className="text-[11px] text-[#667085] mt-1">
            Equivalent Underlying Capital
          </div>
        </div>
      </div>

      {/* Interactive Scenario Stress Simulator */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00778A]" />
            <h4 className="text-sm font-bold text-[#1D2939]">
              Instant What-If Sensitivity Tester
            </h4>
          </div>
          {(spotOffsetPercent !== 0 || ivOffsetPercent !== 0) && (
            <button
              onClick={() => {
                setSpotOffsetPercent(0);
                setIvOffsetPercent(0);
              }}
              className="text-[11px] text-[#00778A] hover:underline font-semibold"
            >
              Reset Sensitivity
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spot Price Shift Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-[#1D2939]">Underlying Spot Shift:</span>
              <span className={`font-mono font-bold ${spotOffsetPercent > 0 ? 'text-[#12B76A]' : spotOffsetPercent < 0 ? 'text-[#F04438]' : 'text-[#667085]'}`}>
                {spotOffsetPercent > 0 ? `+${spotOffsetPercent}%` : `${spotOffsetPercent}%`}
                {' '}({formatCurrency(simulatedSpot, settings.currency, 1)})
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="0.5"
              value={spotOffsetPercent}
              onChange={(e) => setSpotOffsetPercent(parseFloat(e.target.value))}
              className="w-full accent-[#00778A] h-2 bg-[#DCE9EE] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#667085] mt-1">
              <span>-15% Shock</span>
              <span>0% Baseline</span>
              <span>+15% Rally</span>
            </div>
          </div>

          {/* IV Shift Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-[#1D2939]">Implied Volatility Shift:</span>
              <span className={`font-mono font-bold ${ivOffsetPercent > 0 ? 'text-[#12B76A]' : ivOffsetPercent < 0 ? 'text-[#F04438]' : 'text-[#667085]'}`}>
                {ivOffsetPercent > 0 ? `+${ivOffsetPercent}%` : `${ivOffsetPercent}%`}
                {' '}(IV {simulatedIV.toFixed(1)}%)
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="0.5"
              value={ivOffsetPercent}
              onChange={(e) => setIvOffsetPercent(parseFloat(e.target.value))}
              className="w-full accent-[#7A9266] h-2 bg-[#DCE9EE] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#667085] mt-1">
              <span>-20% Vol Crush</span>
              <span>Baseline IV</span>
              <span>+20% Vol Spike</span>
            </div>
          </div>
        </div>

        {/* Projected outcome box */}
        <div className="mt-5 p-4 rounded-2xl bg-white border border-[#DCE9EE] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[#667085] block text-[11px]">Scenario Option Price:</span>
            <span className="text-lg font-bold text-[#1D2939] font-mono">
              {formatCurrency(scenarioResult.price, settings.currency, 2)}
            </span>
            <span className={`ml-2 text-[11px] font-bold ${priceDiff >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {priceDiff >= 0 ? '+' : ''}{formatCurrency(priceDiff, settings.currency, 2)} ({priceDiffPercent.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[#667085] block text-[11px]">New Delta (Δ):</span>
              <span className="font-mono font-bold text-[#00778A]">
                {formatGreek(scenarioResult.delta, 4)}
              </span>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">New Theta (θ):</span>
              <span className="font-mono font-bold text-[#F04438]">
                {formatGreek(scenarioResult.theta, 2)} / d
              </span>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">New Vega (ν):</span>
              <span className="font-mono font-bold text-[#7A9266]">
                {formatGreek(scenarioResult.vega, 2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
