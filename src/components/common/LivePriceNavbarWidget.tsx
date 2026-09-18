import React, { useState } from 'react';
import { usePriceStore } from '../../store/priceStore';
import { useAutoPriceSync } from '../../hooks/useAutoPriceSync';
import { RefreshCw, ArrowUpRight, ArrowDownRight, Clock, ChevronDown, Check } from 'lucide-react';

export const LivePriceNavbarWidget: React.FC = () => {
  const {
    currentPrice,
    commodity,
    change,
    changePercent,
    high,
    low,
    lastUpdated,
    isLoading,
    fetchLatestPrice,
    isAutoRefreshEnabled,
    autoRefreshInterval
  } = usePriceStore();

  const { formattedTimeAgo } = useAutoPriceSync();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleManualRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsRefreshing(true);
      await fetchLatestPrice(commodity || 'Gold Mini', true);
    } finally {
      setTimeout(() => setIsRefreshing(false), 450);
    }
  };

  const isPositive = change >= 0;

  // Loading skeleton during initial fetch
  if (isLoading && !currentPrice) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121E2A] border border-[#DCE9EE] dark:border-[#223344] animate-pulse">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
        <div className="space-y-1">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121E2A] border border-[#DCE9EE] dark:border-[#223344] shadow-xs hover:border-[#00778A] dark:hover:border-[#38BDF8] transition-all cursor-pointer select-none group"
        title="Click to view OHLC breakdown & details"
      >
        {/* Pulsing Status Dot */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12B76A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#12B76A]"></span>
          </span>
          <span className="text-[10px] font-extrabold tracking-wider text-[#12B76A] uppercase">
            LIVE
          </span>
        </div>

        {/* Commodity & Price */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#667085] dark:text-[#94A3B8]">
              {commodity || 'Gold Mini'}
            </span>
            <span className={`inline-flex items-center text-[10px] font-semibold ${isPositive ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {isPositive ? '+' : ''}{changePercent}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-[#1D2939] dark:text-[#F0F6F9]">
              ₹{currentPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-[#98A2B3] dark:text-[#64748B]">
              • {formattedTimeAgo}
            </span>
          </div>
        </div>

        {/* Quick Refresh Button */}
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-[#667085] hover:text-[#00778A] dark:hover:text-[#38BDF8] hover:bg-[#F7FAFB] dark:hover:bg-[#1E293B] transition-colors ml-1"
          title="Refresh Price (Auto-refreshes every 30s)"
          aria-label="Refresh Price"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00778A]' : ''}`} />
        </button>

        <ChevronDown className="w-3 h-3 text-[#98A2B3] group-hover:text-[#1D2939] transition-transform" />
      </div>

      {/* Popover detailed details dropdown */}
      {isExpanded && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsExpanded(false)} 
          />
          <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#121E2A] border border-[#DCE9EE] dark:border-[#223344] shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE] dark:border-[#223344]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#12B76A] animate-pulse" />
                <span className="text-xs font-bold text-[#1D2939] dark:text-white uppercase tracking-wider">
                  {commodity || 'Gold Mini'} Live Feed
                </span>
              </div>
              <span className="text-[10px] text-[#667085] dark:text-[#94A3B8] font-mono">
                {lastUpdated}
              </span>
            </div>

            <div className="py-3">
              <div className="text-2xl font-mono font-extrabold text-[#1D2939] dark:text-white">
                ₹{currentPrice.toLocaleString('en-IN')}
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-semibold mt-0.5 ${isPositive ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
                <span>{isPositive ? '+' : ''}₹{change.toLocaleString('en-IN')}</span>
                <span>({isPositive ? '+' : ''}{changePercent}%)</span>
                <span className="text-[#98A2B3] font-normal text-[11px] ml-1">Today</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 pb-3 border-t border-[#DCE9EE] dark:border-[#223344] text-xs">
              <div className="p-2 rounded-xl bg-[#F7FAFB] dark:bg-[#1A2936]">
                <span className="text-[10px] text-[#667085] dark:text-[#94A3B8] block">Day High</span>
                <span className="font-mono font-bold text-[#12B76A]">₹{high.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#F7FAFB] dark:bg-[#1A2936]">
                <span className="text-[10px] text-[#667085] dark:text-[#94A3B8] block">Day Low</span>
                <span className="font-mono font-bold text-[#F04438]">₹{low.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCE9EE] dark:border-[#223344] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-[#667085] dark:text-[#94A3B8]">
                <Clock className="w-3 h-3" />
                <span>Auto: {isAutoRefreshEnabled ? `${autoRefreshInterval}s` : 'Off'}</span>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-[#00778A] dark:text-[#38BDF8] hover:underline font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Price</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
