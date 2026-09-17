import React from 'react';
import { motion } from 'framer-motion';
import { useGreeksStore } from '../../store/useGreeksStore';
import {
  Coins,
  Layers,
  Target,
  BarChart3,
  Zap,
  Activity,
  Percent,
  Clock,
  Sparkles,
  ArrowUpRight,
  Database
} from 'lucide-react';

export const StatsCards: React.FC = () => {
  const { price, greeks, history, activeUploadName, selectedCommodity, setActiveTab } = useGreeksStore();

  const lastUpload = history[0];

  const dashboardMetrics = [
    {
      id: 'gold_price',
      title: 'Current Gold Price',
      value: `₹${price.goldPrice.toLocaleString('en-IN')}`,
      subtext: selectedCommodity === 'GOLD' ? 'Active underlying spot' : `Spot benchmark (${price.changePercent > 0 ? '+' : ''}${price.changePercent}%)`,
      badge: 'MCX Live',
      badgeColor: 'text-[#E3A008] bg-[#FEF08A]/20 border border-[#E3A008]/30',
      icon: Coins,
      accentColor: '#D97706'
    },
    {
      id: 'total_strikes',
      title: 'Total Strikes',
      value: `${price.totalStrikes}`,
      subtext: 'Indexed in active matrix',
      badge: 'Synchronized',
      badgeColor: 'text-[#00778A] dark:text-[#38BDF8] bg-[#00778A]/10 border border-[#00778A]/20',
      icon: Layers,
      accentColor: '#00778A'
    },
    {
      id: 'atm_strike',
      title: 'ATM Strike',
      value: `₹${price.atmStrike.toLocaleString('en-IN')}`,
      subtext: 'Central equilibrium pivot',
      badge: 'Zero Moneyness',
      badgeColor: 'text-[#7A9266] dark:text-[#4ADE80] bg-[#7A9266]/10 border border-[#7A9266]/20',
      icon: Target,
      accentColor: '#7A9266'
    },
    {
      id: 'highest_oi',
      title: 'Highest OI',
      value: `₹${greeks.highestOi.strike.toLocaleString('en-IN')}`,
      subtext: `${greeks.highestOi.type} side: ${greeks.highestOi.oi.toLocaleString()} lots`,
      badge: 'Key Resistance/Support',
      badgeColor: 'text-[#12B76A] bg-[#12B76A]/10 border border-[#12B76A]/20',
      icon: BarChart3,
      accentColor: '#12B76A'
    },
    {
      id: 'highest_gamma',
      title: 'Highest Gamma',
      value: `₹${greeks.highestGamma.strike.toLocaleString('en-IN')}`,
      subtext: `Peak convex pin: ${(greeks.highestGamma.gamma * 1000).toFixed(3)}`,
      badge: 'Delta Velocity Risk',
      badgeColor: 'text-[#F04438] bg-[#F04438]/10 border border-[#F04438]/20',
      icon: Zap,
      accentColor: '#F04438'
    },
    {
      id: 'highest_vega',
      title: 'Highest Vega',
      value: `₹${greeks.highestVega.strike.toLocaleString('en-IN')}`,
      subtext: `Max vol shock: ₹${greeks.highestVega.vega.toFixed(1)}/1% IV`,
      badge: 'Vol Sensitivity',
      badgeColor: 'text-[#7F56D9] bg-[#7F56D9]/10 border border-[#7F56D9]/20',
      icon: Activity,
      accentColor: '#7F56D9'
    },
    {
      id: 'pcr',
      title: 'PCR (Put/Call Ratio)',
      value: `${greeks.pcr.toFixed(2)}`,
      subtext: greeks.pcr > 1.2 ? 'Bullish bias (put heavy)' : greeks.pcr < 0.8 ? 'Bearish bias (call heavy)' : 'Neutral balance',
      badge: greeks.pcr > 1.2 ? 'Bullish' : greeks.pcr < 0.8 ? 'Bearish' : 'Neutral',
      badgeColor: greeks.pcr > 1.2 ? 'text-[#12B76A] bg-[#12B76A]/10' : greeks.pcr < 0.8 ? 'text-[#F04438] bg-[#F04438]/10' : 'text-[#667085] bg-gray-100 dark:bg-slate-800',
      icon: Percent,
      accentColor: '#00778A'
    },
    {
      id: 'last_upload',
      title: 'Last Upload',
      value: lastUpload ? (lastUpload.uploadType.length > 18 ? lastUpload.uploadType.slice(0, 18) + '…' : lastUpload.uploadType) : 'Live MCX Feed',
      subtext: lastUpload ? `${lastUpload.uploadDate}` : 'Synchronized via state',
      badge: 'Auto-Parsed',
      badgeColor: 'text-[#00778A] dark:text-[#38BDF8] bg-[#00778A]/10 border border-[#00778A]/20',
      icon: Clock,
      accentColor: '#00778A'
    }
  ];

  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00778A] dark:text-[#38BDF8]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
            Real-Time State Synchronization Overview
          </h3>
        </div>
        <button
          onClick={() => setActiveTab('uploads')}
          className="text-xs font-semibold text-[#00778A] dark:text-[#38BDF8] hover:underline flex items-center gap-1"
        >
          <span>Upload Center</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardMetrics.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              className="bg-white/80 dark:bg-[#121E2A]/80 backdrop-blur-md p-5 rounded-[20px] border border-[#DCE9EE] dark:border-[#223344] shadow-xs hover:border-[#00778A]/40 dark:hover:border-[#38BDF8]/40 transition-all relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ backgroundColor: `${stat.accentColor}18`, color: stat.accentColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
              </div>

              <div className="text-[11px] font-semibold text-[#667085] dark:text-[#94A3B8] tracking-wider uppercase">
                {stat.title}
              </div>

              <div className="mt-1 font-heading text-xl sm:text-2xl font-bold text-[#1D2939] dark:text-[#F0F6F9] tracking-tight truncate">
                {stat.value}
              </div>

              <div className="mt-1.5 text-xs text-[#667085] dark:text-[#8899A6] truncate">
                {stat.subtext}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
