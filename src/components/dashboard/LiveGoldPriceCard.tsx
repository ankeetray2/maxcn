import React, { useState } from 'react';
import { usePriceStore } from '../../store/priceStore';
import { useAutoPriceSync } from '../../hooks/useAutoPriceSync';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Coins,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const LiveGoldPriceCard: React.FC = () => {
  const {
    currentPrice,
    open,
    high,
    low,
    close,
    change,
    changePercent,
    source,
    lastUpdated,
    isLoading,
    commodity,
    fetchLatestPrice,
    autoRefreshInterval,
    isAutoRefreshEnabled
  } = usePriceStore();

  const { formattedTimeAgo } = useAutoPriceSync();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchLatestPrice(commodity || 'Gold Mini', true);
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2000);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const isPositive = change >= 0;

  // Loading skeleton while fetching on boot
  if (isLoading && !currentPrice) {
    return (
      <div className="bg-white dark:bg-[#121E2A] rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#121E2A] rounded-[24px] border border-[#DCE9EE] dark:border-[#223344] p-6 shadow-sm">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#00778A]/10 via-[#12B76A]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#DCE9EE] dark:border-[#223344]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D97706] to-[#F59E0B] flex items-center justify-center text-white shadow-md shadow-[#D97706]/20">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#1D2939] dark:text-[#F0F6F9]">
                  {commodity || 'Gold Mini'}
                </span>

                {/* Status: LIVE Badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#ECFDF3] dark:bg-[#064E3B]/40 text-[#12B76A] border border-[#12B76A]/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12B76A] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#12B76A]"></span>
                  </span>
                  <span>LIVE</span>
                </span>

                {/* Source Badge */}
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-[#F7FAFB] dark:bg-[#1A2936] text-[#667085] dark:text-[#94A3B8] border border-[#DCE9EE] dark:border-[#2E4052]">
                  <Database className="w-3 h-3 text-[#00778A]" />
                  <span>{source === 'live' ? 'Live MCX Stream' : source === 'mongodb' ? 'MongoDB Price' : 'Manual Feed'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-[#667085] dark:text-[#94A3B8]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#00778A]" />
                  <span>Last Updated: <strong className="font-mono text-[#1D2939] dark:text-white">{lastUpdated}</strong> ({formattedTimeAgo})</span>
                </span>
                {isAutoRefreshEnabled && (
                  <span className="hidden md:inline text-[11px] text-[#98A2B3]">
                    • Auto-refreshes every {autoRefreshInterval}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Row: Refresh Button & Status */}
          <div className="flex items-center gap-2.5">
            {justRefreshed && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#12B76A] animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Updated!</span>
              </span>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00778A] hover:bg-[#006070] text-white font-semibold text-xs transition-all shadow-sm shadow-[#00778A]/20 cursor-pointer disabled:opacity-60 group"
              id="refresh-price-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>Refresh Price</span>
            </button>
          </div>
        </div>

        {/* Price & OHLC Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Main Price Box */}
          <div className="p-4 rounded-2xl bg-[#F7FAFB] dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052] flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#667085] dark:text-[#94A3B8]">
              Live Gold Price
            </span>
            <div className="my-1">
              <span className="font-mono text-3xl font-extrabold text-[#1D2939] dark:text-white tracking-tight">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${isPositive ? 'text-[#12B76A]' : 'text-[#F04438]'}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}₹{change.toLocaleString('en-IN')}</span>
              <span>({isPositive ? '+' : ''}{changePercent}%)</span>
            </div>
          </div>

          {/* Day High */}
          <div className="p-4 rounded-2xl bg-[#F7FAFB] dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] dark:text-[#94A3B8]">Day High</span>
              <TrendingUp className="w-4 h-4 text-[#12B76A]" />
            </div>
            <div className="my-1">
              <span className="font-mono text-2xl font-bold text-[#1D2939] dark:text-white">
                ₹{high.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
              Spread from High: ₹{Math.abs(high - currentPrice).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Day Low */}
          <div className="p-4 rounded-2xl bg-[#F7FAFB] dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] dark:text-[#94A3B8]">Day Low</span>
              <TrendingDown className="w-4 h-4 text-[#F04438]" />
            </div>
            <div className="my-1">
              <span className="font-mono text-2xl font-bold text-[#1D2939] dark:text-white">
                ₹{low.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
              Spread from Low: ₹{Math.abs(currentPrice - low).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Session Range & Open */}
          <div className="p-4 rounded-2xl bg-[#F7FAFB] dark:bg-[#1A2936] border border-[#DCE9EE] dark:border-[#2E4052] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#667085] dark:text-[#94A3B8]">Session Open</span>
              <span className="text-[10px] font-bold text-[#00778A] dark:text-[#38BDF8] bg-[#00778A]/10 px-2 py-0.5 rounded">
                MCX
              </span>
            </div>
            <div className="my-1">
              <span className="font-mono text-2xl font-bold text-[#1D2939] dark:text-white">
                ₹{open.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] text-[#667085] dark:text-[#94A3B8]">
              Day Range: ₹{(high - low).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
