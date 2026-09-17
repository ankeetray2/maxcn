import React from 'react';
import { motion } from 'framer-motion';
import { useGreeksStore } from '../../store/useGreeksStore';
import { COMMODITY_SPECS, getCommoditySpec } from '../../services/mockData';
import { formatCurrency, formatGreek } from '../../utils/greeks';
import {
  TrendingUp,
  Activity,
  Flame,
  Wind,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';

export const ExposureCards: React.FC = () => {
  const { exposure, calculatedResult, calculator, settings, selectedCommodity } = useGreeksStore();
  const spec = getCommoditySpec(selectedCommodity);

  const cards = [
    {
      id: 'delta',
      title: 'Delta Exposure (Δ)',
      symbol: 'Δ',
      greekValue: formatGreek(calculatedResult.delta, 4),
      exposureValue: formatCurrency(Math.abs(exposure.deltaExposure), settings.currency, 0),
      exposureDirection: exposure.deltaExposure >= 0 ? 'Long Bias' : 'Short Bias',
      description: 'Directional monetary exposure per 1 point underlying move.',
      icon: TrendingUp,
      accentColor: '#00778A',
      bgColor: 'bg-[#00778A]/10',
      isBullish: calculatedResult.delta >= 0,
      detail: `${(calculatedResult.delta * 100).toFixed(1)}% equivalent hedge`
    },
    {
      id: 'gamma',
      title: 'Gamma Exposure (Γ)',
      symbol: 'Γ',
      greekValue: formatGreek(calculatedResult.gamma, 5),
      exposureValue: formatCurrency(exposure.gammaExposure, settings.currency, 2),
      exposureDirection: 'Curvature Risk',
      description: 'Acceleration rate of Delta for every 1% move in commodity spot.',
      icon: Activity,
      accentColor: '#7A9266',
      bgColor: 'bg-[#7A9266]/10',
      isBullish: true,
      detail: `Sensitivity: +${(calculatedResult.gamma * 100).toFixed(4)} Δ / ₹100`
    },
    {
      id: 'theta',
      title: 'Theta Decay (θ)',
      symbol: 'θ',
      greekValue: `${formatGreek(calculatedResult.theta, 2)} / day`,
      exposureValue: `${formatCurrency(exposure.thetaDecay, settings.currency, 1)} / day`,
      exposureDirection: exposure.thetaDecay <= 0 ? 'Time Bleed' : 'Time Gain',
      description: 'Expected overnight portfolio decay due to calendar time erosion.',
      icon: Flame,
      accentColor: '#F04438',
      bgColor: 'bg-[#F04438]/10',
      isBullish: exposure.thetaDecay >= 0,
      detail: `${calculator.expiryDays} days to contract settlement`
    },
    {
      id: 'vega',
      title: 'Vega Risk (ν)',
      symbol: 'ν',
      greekValue: `${formatGreek(calculatedResult.vega, 2)} / 1% IV`,
      exposureValue: formatCurrency(exposure.vegaRisk, settings.currency, 1),
      exposureDirection: 'Volatility Shock',
      description: 'Gain or loss per 1.0% shift in implied volatility (IV).',
      icon: Wind,
      accentColor: '#00778A',
      bgColor: 'bg-[#B5CEDA]/30',
      isBullish: exposure.vegaRisk >= 0,
      detail: `Current IV: ${calculator.volatility}%`
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-[#1D2939]">
            Active Risk & Greeks Exposure
          </h2>
          <p className="text-xs text-[#667085]">
            Portfolio exposure based on {calculator.contracts} active contract(s) of {spec?.name || 'Gold'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#667085]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#12B76A]" />
          <span>Lot Size: <strong className="text-[#1D2939]">{spec?.lotSize || 100} {spec?.unit || 'Units'}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * idx }}
              className="glass-panel glass-panel-hover p-5 rounded-[24px] border border-[#DCE9EE] shadow-xs relative"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-heading font-extrabold text-sm"
                    style={{ backgroundColor: `${card.accentColor}18`, color: card.accentColor }}
                  >
                    {card.symbol}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1D2939]">{card.title}</h3>
                    <span className="text-[10px] text-[#667085]">{card.exposureDirection}</span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-mono-num font-bold px-2 py-0.5 rounded-lg ${
                    card.id === 'theta'
                      ? 'bg-[#FEF3F2] text-[#F04438]'
                      : 'bg-[#E6F3F5] text-[#00778A]'
                  }`}
                >
                  {card.greekValue}
                </span>
              </div>

              {/* Exposure metric monetary impact */}
              <div className="mt-3 pt-3 border-t border-[#DCE9EE]/60">
                <div className="text-[11px] text-[#667085]">Net Capital Impact</div>
                <div className="font-heading text-xl font-bold text-[#1D2939] tracking-tight mt-0.5">
                  {card.exposureValue}
                </div>
              </div>

              {/* Description & Detail */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#667085]">
                <span className="truncate max-w-[150px]">{card.detail}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#DCE9EE] font-medium">
                  {calculator.optionType}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
