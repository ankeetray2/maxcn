import React from 'react';
import { usePriceStore } from '../../store/priceStore';
import { useGreeksStore } from '../../store/useGreeksStore';
import { ArrowUpRight, ArrowDownRight, Scale, Check, Radio } from 'lucide-react';

interface PriceComparisonCardProps {
  screenshotPrice: number;
  sourceLabel?: string;
  onApplyScreenshotPrice?: () => void;
  onKeepLivePrice?: () => void;
}

export const PriceComparisonCard: React.FC<PriceComparisonCardProps> = ({
  screenshotPrice,
  sourceLabel = 'Screenshot',
  onApplyScreenshotPrice,
  onKeepLivePrice
}) => {
  const { currentPrice: livePrice, commodity } = usePriceStore();
  const { setCalculatorInput, recalculate } = useGreeksStore();

  const difference = livePrice - screenshotPrice;
  const percentageDiff = screenshotPrice > 0 ? (difference / screenshotPrice) * 100 : 0;
  const isLiveHigher = difference > 0;
  const isExactMatch = difference === 0;

  const handleApplyScreenshot = () => {
    setCalculatorInput({ spotPrice: screenshotPrice });
    recalculate();
    if (onApplyScreenshotPrice) onApplyScreenshotPrice();
  };

  const handleApplyLive = () => {
    setCalculatorInput({ spotPrice: livePrice });
    recalculate();
    if (onKeepLivePrice) onKeepLivePrice();
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#F7FAFB] via-white to-[#F0F9FF] dark:from-[#121E2A] dark:via-[#162330] dark:to-[#1A2936] border border-[#00778A]/25 dark:border-[#38BDF8]/25 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE] dark:border-[#223344]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#00778A]/10 text-[#00778A] dark:text-[#38BDF8] flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1D2939] dark:text-[#F0F6F9]">
              Price Comparison: Current Live vs {sourceLabel}
            </h4>
            <p className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
              Comparing underlying market spot for {commodity || 'Gold Mini'}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#00778A]/10 text-[#00778A] dark:text-[#38BDF8] border border-[#00778A]/20">
          Delta: {isExactMatch ? 'Exact Match' : `${isLiveHigher ? '+' : ''}${difference.toLocaleString('en-IN')} pts`}
        </span>
      </div>

      {/* Comparison Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Live Price Box */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#DCE9EE] dark:border-[#334155] shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#667085] dark:text-[#94A3B8] mb-1">
            <span>Current Live Price</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#ECFDF3] text-[#12B76A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-extrabold text-[#1D2939] dark:text-white">
            ₹{livePrice.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[10px] text-[#667085] dark:text-[#94A3B8]">
            Real-time feed
          </div>
        </div>

        {/* Screenshot Price Box */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#DCE9EE] dark:border-[#334155] shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#667085] dark:text-[#94A3B8] mb-1">
            <span>Screenshot Price</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Extracted
            </span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-extrabold text-[#1D2939] dark:text-white">
            ₹{screenshotPrice.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[10px] text-[#667085] dark:text-[#94A3B8]">
            OCR Document Source
          </div>
        </div>

        {/* Difference Box */}
        <div className={`p-3.5 rounded-xl border shadow-xs ${
          isExactMatch
            ? 'bg-[#F7FAFB] dark:bg-[#1E293B] border-[#DCE9EE] dark:border-[#334155]'
            : isLiveHigher
            ? 'bg-[#ECFDF3] dark:bg-[#064E3B]/30 border-[#12B76A]/30 text-[#12B76A]'
            : 'bg-[#FEF3F2] dark:bg-[#7F1D1D]/30 border-[#F04438]/30 text-[#F04438]'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
            <span>Difference</span>
            {isExactMatch ? (
              <Check className="w-3.5 h-3.5" />
            ) : isLiveHigher ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-[#12B76A]" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-[#F04438]" />
            )}
          </div>
          <div className="font-mono text-xl sm:text-2xl font-extrabold">
            {isLiveHigher ? `+${difference.toLocaleString('en-IN')}` : difference.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[10px] font-semibold opacity-90">
            {isExactMatch ? '0.00% variance' : `${isLiveHigher ? '+' : ''}${percentageDiff.toFixed(2)}% vs screenshot`}
          </div>
        </div>
      </div>

      {/* Select Which Price to Use */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-xs text-[#667085] dark:text-[#94A3B8]">
          Select which underlying price to apply for Greeks analysis:
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApplyScreenshot}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1E293B] text-[#1D2939] dark:text-white border border-[#DCE9EE] dark:border-[#334155] hover:bg-[#F7FAFB] dark:hover:bg-[#2E4052] transition-all"
          >
            Apply Screenshot (₹{screenshotPrice.toLocaleString('en-IN')})
          </button>
          <button
            type="button"
            onClick={handleApplyLive}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#00778A] hover:bg-[#006070] text-white transition-all shadow-xs"
          >
            Use Live Price (₹{livePrice.toLocaleString('en-IN')})
          </button>
        </div>
      </div>
    </div>
  );
};
