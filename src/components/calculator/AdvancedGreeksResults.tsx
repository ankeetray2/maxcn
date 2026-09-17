import React from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import {
  TrendingUp,
  Percent,
  Clock,
  Activity,
  Zap,
  ShieldCheck,
  Target,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

interface AdvancedGreeksResultsProps {
  expectedMovePoints?: number;
  futurePremium?: number;
  simulatedSpot?: number;
}

export const AdvancedGreeksResults: React.FC<AdvancedGreeksResultsProps> = ({
  expectedMovePoints = 0,
  futurePremium,
  simulatedSpot
}) => {
  const { calculatedResult, manualGreeks, calculationMode, calculator } = useGreeksStore();

  const isManual = calculationMode === 'manual';
  const effectiveDelta = isManual ? manualGreeks.delta : calculatedResult.delta;
  const effectiveGamma = isManual ? manualGreeks.gamma : calculatedResult.gamma;
  const effectiveTheta = isManual ? manualGreeks.theta : calculatedResult.theta;
  const effectiveVega = isManual ? manualGreeks.vega : calculatedResult.vega;
  const effectiveRho = isManual ? manualGreeks.rho : calculatedResult.rho;
  const effectivePop = isManual ? manualGreeks.pop : calculatedResult.pop;
  const currentPremium = isManual ? manualGreeks.premium : calculatedResult.price;

  const displayFuturePremium = futurePremium !== undefined ? futurePremium : currentPremium;
  const premiumChange = displayFuturePremium - currentPremium;

  return (
    <div id="advanced-greeks-results" className="space-y-4">
      {/* Top Banner: Current vs Future Premium & Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Current Premium */}
        <div className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-4 rounded-2xl border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Current Premium
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#00778A]/10 text-[#00778A] dark:bg-[#2DD4BF]/20 dark:text-[#2DD4BF]">
              {isManual ? 'Manual' : 'B&S Model'}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#1D2939] dark:text-white tracking-tight">
            ₹{currentPremium.toFixed(2)}
          </div>
          <div className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center justify-between">
            <span>Spot: ₹{calculator.spotPrice.toLocaleString('en-IN')}</span>
            <span>Lots: {calculator.contracts} × {calculator.lotSize}</span>
          </div>
        </div>

        {/* Future Premium (after Expected Move) */}
        <div className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-4 rounded-2xl border border-[#00778A]/40 dark:border-[#2DD4BF]/40 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#00778A] dark:text-[#2DD4BF] uppercase tracking-wider">
              Future Premium
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              expectedMovePoints >= 0 ? 'bg-[#12B76A]/15 text-[#12B76A]' : 'bg-[#D92D20]/15 text-[#D92D20]'
            }`}>
              {expectedMovePoints >= 0 ? `+${expectedMovePoints}` : expectedMovePoints} Pts
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#00778A] dark:text-[#2DD4BF] tracking-tight">
            ₹{displayFuturePremium.toFixed(2)}
          </div>
          <div className="mt-1 text-xs flex items-center justify-between">
            <span className="text-[#64748B] dark:text-[#94A3B8]">
              New Spot: ₹{(simulatedSpot || (calculator.spotPrice + expectedMovePoints)).toLocaleString('en-IN')}
            </span>
            <span className={`font-mono font-semibold ${premiumChange >= 0 ? 'text-[#12B76A]' : 'text-[#D92D20]'}`}>
              {premiumChange >= 0 ? `+₹${premiumChange.toFixed(2)}` : `-₹${Math.abs(premiumChange).toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* POP (Probability of Profit) */}
        <div className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-4 rounded-2xl border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Probability of Profit (POP)
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#12B76A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#12B76A] dark:text-[#4ADE80] tracking-tight">
            {effectivePop}%
          </div>
          <div className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
            Breakeven Spot: ₹{calculatedResult.breakeven.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Value Decomposition (Intrinsic vs Extrinsic) */}
        <div className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-4 rounded-2xl border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Intrinsic / Extrinsic Value
            </span>
            <Layers className="w-3.5 h-3.5 text-[#7F56D9]" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-bold font-mono text-[#1D2939] dark:text-white">
              ₹{calculatedResult.intrinsicValue.toFixed(2)}
            </div>
            <span className="text-xs text-[#64748B]">/</span>
            <div className="text-lg font-bold font-mono text-[#7F56D9] dark:text-[#C084FC]">
              ₹{calculatedResult.extrinsicValue.toFixed(2)}
            </div>
          </div>
          <div className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
            {calculatedResult.intrinsicValue > 0 ? 'In-The-Money (ITM)' : 'Out-Of-The-Money (OTM)'}
          </div>
        </div>
      </div>

      {/* Greeks Grid: Delta, Gamma, Theta, Vega, Rho */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* Delta */}
        <div className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-3.5 rounded-xl border border-[#DCE9EE] dark:border-[#1E293B] hover:border-[#00778A]/40 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8]">DELTA (Δ)</span>
            <Activity className="w-3.5 h-3.5 text-[#00778A]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#00778A] dark:text-[#2DD4BF]">
            {effectiveDelta.toFixed(2)}
          </div>
          <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1 line-clamp-1">
            Per ₹1 spot change
          </p>
        </div>

        {/* Gamma */}
        <div className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-3.5 rounded-xl border border-[#DCE9EE] dark:border-[#1E293B] hover:border-[#00778A]/40 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8]">GAMMA (Γ)</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#1D2939] dark:text-white" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1D2939] dark:text-white">
            {effectiveGamma.toFixed(4)}
          </div>
          <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1 line-clamp-1">
            Delta sensitivity per ₹1
          </p>
        </div>

        {/* Theta */}
        <div className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-3.5 rounded-xl border border-[#DCE9EE] dark:border-[#1E293B] hover:border-[#D92D20]/40 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8]">THETA (θ)</span>
            <Clock className="w-3.5 h-3.5 text-[#D92D20]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#D92D20] dark:text-[#F87171]">
            ₹{effectiveTheta.toFixed(2)}
          </div>
          <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1 line-clamp-1">
            Daily time decay
          </p>
        </div>

        {/* Vega */}
        <div className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-3.5 rounded-xl border border-[#DCE9EE] dark:border-[#1E293B] hover:border-[#7F56D9]/40 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8]">VEGA (ν)</span>
            <Zap className="w-3.5 h-3.5 text-[#7F56D9]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#7F56D9] dark:text-[#C084FC]">
            ₹{effectiveVega.toFixed(2)}
          </div>
          <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1 line-clamp-1">
            Per 1% IV shift
          </p>
        </div>

        {/* Rho */}
        <div className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-3.5 rounded-xl border border-[#DCE9EE] dark:border-[#1E293B] hover:border-[#B54708]/40 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8]">RHO (ρ)</span>
            <Percent className="w-3.5 h-3.5 text-[#B54708]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#B54708] dark:text-[#FBBF24]">
            ₹{effectiveRho.toFixed(2)}
          </div>
          <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1 line-clamp-1">
            Per 1% Interest Rate
          </p>
        </div>
      </div>
    </div>
  );
};
