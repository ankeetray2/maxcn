import React from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { ArrowUpDown, HelpCircle, Layers, TrendingUp, TrendingDown, Scale } from 'lucide-react';

export const MarketVsTheoreticalGreeks: React.FC = () => {
  const { marketGreeks, calculatedResult, calculationMode } = useGreeksStore();

  const comparisons = [
    {
      metric: 'Delta (Δ)',
      symbol: 'Δ',
      marketVal: marketGreeks.delta,
      theoreticalVal: calculatedResult.delta,
      formatter: (v: number) => v.toFixed(2),
      diffFormatter: (d: number) => `${d >= 0 ? '+' : ''}${d.toFixed(2)}`,
      description: 'Sensitivity to ₹1 change in underlying spot price',
      color: 'text-[#00778A] dark:text-[#2DD4BF]'
    },
    {
      metric: 'Gamma (Γ)',
      symbol: 'Γ',
      marketVal: marketGreeks.gamma,
      theoreticalVal: calculatedResult.gamma,
      formatter: (v: number) => v.toFixed(4),
      diffFormatter: (d: number) => `${d >= 0 ? '+' : ''}${d.toFixed(4)}`,
      description: 'Rate of Delta change per ₹1 spot change (convexity)',
      color: 'text-[#1D2939] dark:text-white'
    },
    {
      metric: 'Theta (θ)',
      symbol: 'θ',
      marketVal: marketGreeks.theta,
      theoreticalVal: calculatedResult.theta,
      formatter: (v: number) => `₹${v.toFixed(2)}`,
      diffFormatter: (d: number) => `₹${d >= 0 ? '+' : ''}${d.toFixed(2)}`,
      description: 'Daily time decay in option premium',
      color: 'text-[#D92D20] dark:text-[#F87171]'
    },
    {
      metric: 'Vega (ν)',
      symbol: 'ν',
      marketVal: marketGreeks.vega,
      theoreticalVal: calculatedResult.vega,
      formatter: (v: number) => `₹${v.toFixed(2)}`,
      diffFormatter: (d: number) => `₹${d >= 0 ? '+' : ''}${d.toFixed(2)}`,
      description: 'Price shift per 1% change in Implied Volatility (IV)',
      color: 'text-[#7F56D9] dark:text-[#C084FC]'
    },
    {
      metric: 'Rho (ρ)',
      symbol: 'ρ',
      marketVal: marketGreeks.rho,
      theoreticalVal: calculatedResult.rho,
      formatter: (v: number) => `₹${v.toFixed(2)}`,
      diffFormatter: (d: number) => `₹${d >= 0 ? '+' : ''}${d.toFixed(2)}`,
      description: 'Sensitivity per 1% change in risk-free interest rate',
      color: 'text-[#B54708] dark:text-[#FBBF24]'
    },
    {
      metric: 'POP (%)',
      symbol: 'POP',
      marketVal: marketGreeks.pop,
      theoreticalVal: calculatedResult.pop,
      formatter: (v: number) => `${v.toFixed(1)}%`,
      diffFormatter: (d: number) => `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`,
      description: 'Probability of Profit at expiry (normal distribution)',
      color: 'text-[#12B76A] dark:text-[#4ADE80]'
    },
    {
      metric: 'Premium (LTP)',
      symbol: '₹',
      marketVal: marketGreeks.premium,
      theoreticalVal: calculatedResult.price,
      formatter: (v: number) => `₹${v.toFixed(2)}`,
      diffFormatter: (d: number) => `₹${d >= 0 ? '+' : ''}${d.toFixed(2)}`,
      description: 'Traded market price vs Black-Scholes theoretical value',
      color: 'text-[#00778A] dark:text-[#2DD4BF]'
    }
  ];

  return (
    <div id="market-vs-theoretical-greeks" className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-6 rounded-[22px] border border-[#DCE9EE] dark:border-[#1E293B] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E4E7EC] dark:border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00778A]/10 dark:bg-[#00778A]/20 text-[#00778A] dark:text-[#2DD4BF] flex items-center justify-center font-bold">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1D2939] dark:text-white">
              Market Greeks vs Theoretical Greeks
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
              Cross-examination between live broker quotes ({marketGreeks.source || 'Market Data'}) and Black-Scholes Model
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-[#F2F4F7] dark:bg-[#1E293B] text-[#475467] dark:text-[#CBD5E1] font-mono">
            Source: {marketGreeks.source || 'Groww / Option Chain'}
          </span>
        </div>
      </div>

      {/* Direct Comparison Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E4E7EC] dark:border-[#1E293B] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <th className="pb-3 pl-2">Greeks Metric</th>
              <th className="pb-3">Market Traded Value</th>
              <th className="pb-3">Theoretical Value (B&S)</th>
              <th className="pb-3 pr-2 text-right">Difference (Spread)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F4F7] dark:divide-[#1E293B]">
            {comparisons.map((c, i) => {
              const diff = c.marketVal - c.theoreticalVal;
              const isSignificant = Math.abs(diff) > 0.0001;
              const isPositive = diff >= 0;

              return (
                <tr key={i} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/40 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#F2F4F7] dark:bg-[#1E293B] flex items-center justify-center text-xs font-bold font-mono text-[#00778A] dark:text-[#2DD4BF]">
                        {c.symbol}
                      </span>
                      <div>
                        <span className="font-bold text-[#1D2939] dark:text-white block">
                          {c.metric}
                        </span>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                          {c.description}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3">
                    <span className={`font-mono font-bold text-sm ${c.color}`}>
                      {c.formatter(c.marketVal)}
                    </span>
                  </td>

                  <td className="py-3">
                    <span className="font-mono font-bold text-sm text-[#475467] dark:text-[#CBD5E1]">
                      {c.formatter(c.theoreticalVal)}
                    </span>
                  </td>

                  <td className="py-3 pr-2 text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold text-xs"
                      style={{
                        backgroundColor: isSignificant ? (isPositive ? 'rgba(18, 183, 106, 0.12)' : 'rgba(217, 45, 32, 0.12)') : 'rgba(100, 116, 139, 0.1)',
                        color: isSignificant ? (isPositive ? '#12B76A' : '#D92D20') : '#64748B'
                      }}
                    >
                      {isSignificant && (
                        isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{c.diffFormatter(diff)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
