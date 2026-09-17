import React from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { COMMODITY_SPECS } from '../../services/mockData';
import { CommodityType } from '../../types';
import { formatCurrency, formatGreek } from '../../utils/greeks';
import {
  Layers,
  ExternalLink
} from 'lucide-react';

export const MarketOverview: React.FC = () => {
  const {
    selectedCommodity,
    setSelectedCommodity,
    optionChain,
    setActiveTab,
    settings
  } = useGreeksStore();

  const commodities: CommodityType[] = [
    'GOLD',
    'SILVER',
    'CRUDEOIL',
    'NATURALGAS',
    'COPPER',
    'ZINC',
    'ALUMINIUM',
    'LEAD',
    'NICKEL'
  ];
  const activeSpec = COMMODITY_SPECS[selectedCommodity] || COMMODITY_SPECS.GOLD;

  // Pick 5 central strikes from the current option chain
  const centerIdx = Math.floor(optionChain.length / 2);
  const previewStrikes = optionChain.slice(Math.max(0, centerIdx - 2), Math.min(optionChain.length, centerIdx + 3));

  return (
    <div className="space-y-6">
      {/* MCX Live Commodity Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1D2939]">
              MCX Commodity Markets Overview (9 Instruments)
            </h2>
            <p className="text-xs text-[#667085]">
              Real-time trading parameters, live strikes, and volatility environment
            </p>
          </div>
          <button
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-1 text-xs font-semibold text-[#00778A] hover:underline"
          >
            <span>Full Analytics</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
          {commodities.map((c) => {
            const spec = COMMODITY_SPECS[c];
            const isSelected = selectedCommodity === c;
            const isPos = spec.change24h >= 0;

            return (
              <div
                key={c}
                onClick={() => setSelectedCommodity(c)}
                className={`p-3.5 rounded-[20px] cursor-pointer transition-all border text-left relative overflow-hidden ${
                  isSelected
                    ? 'bg-white border-[#00778A] shadow-sm ring-2 ring-[#00778A]/20'
                    : 'bg-white/70 hover:bg-white border-[#DCE9EE] hover:border-[#B5CEDA]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1D2939] block truncate">{spec.symbol}</span>
                    <span className="text-[10px] text-[#667085]">{spec.category}</span>
                  </div>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isPos ? 'bg-[#ECFDF3] text-[#12B76A]' : 'bg-[#FEF3F2] text-[#F04438]'
                    }`}
                  >
                    {isPos ? '+' : ''}{spec.change24h}%
                  </span>
                </div>

                <div className="mt-2.5">
                  <div className="text-base font-bold text-[#1D2939] font-mono">
                    {formatCurrency(spec.defaultSpot, settings.currency, spec.tickSize < 1 ? 2 : 0)}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[#667085]">
                    <span>IV {spec.defaultIV}%</span>
                    <span>Lot {spec.lotSize}</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00778A]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Option Chain Quick Matrix */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00778A]/10 text-[#00778A] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D2939]">
                {activeSpec.name} Option Chain Greeks Snapshot
              </h3>
              <p className="text-xs text-[#667085]">
                Spot Price: <strong className="text-[#1D2939] font-mono">{formatCurrency(activeSpec.defaultSpot, settings.currency)}</strong> • ATM Strike Step: {activeSpec.strikeStep} • Lot: {activeSpec.lotSize} {activeSpec.unit}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('calculator')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#00778A] text-white hover:bg-[#00778A]/90 transition-colors shadow-xs"
            >
              Analyze in Calculator
            </button>
            <button
              onClick={() => setActiveTab('uploads')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#DCE9EE] text-[#00778A] hover:bg-[#F7FAFB] transition-colors"
            >
              Upload Chain
            </button>
          </div>
        </div>

        {/* Snapshot Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#DCE9EE] text-[#667085] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3 bg-[#00778A]/5 text-[#00778A] font-bold rounded-tl-xl text-center" colSpan={4}>
                  Calls (CE)
                </th>
                <th className="py-2.5 px-3 font-extrabold text-[#1D2939] text-center bg-white">Strike</th>
                <th className="py-2.5 px-3 bg-[#7A9266]/10 text-[#7A9266] font-bold rounded-tr-xl text-center" colSpan={4}>
                  Puts (PE)
                </th>
              </tr>
              <tr className="border-b border-[#DCE9EE] text-[10px] text-[#667085] bg-[#F7FAFB]/70 font-semibold">
                {/* Calls */}
                <th className="py-2 px-3">LTP</th>
                <th className="py-2 px-3">Delta (Δ)</th>
                <th className="py-2 px-3">Theta (θ)</th>
                <th className="py-2 px-3">IV %</th>
                {/* Strike */}
                <th className="py-2 px-3 text-center font-bold text-[#1D2939]">Price</th>
                {/* Puts */}
                <th className="py-2 px-3">IV %</th>
                <th className="py-2 px-3">Delta (Δ)</th>
                <th className="py-2 px-3">Theta (θ)</th>
                <th className="py-2 px-3">LTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE9EE]/60 font-mono">
              {previewStrikes.map((row) => {
                const isATM = Math.abs(row.strike - activeSpec.defaultSpot) < activeSpec.strikeStep;
                return (
                  <tr
                    key={row.strike}
                    className={`transition-colors ${
                      isATM ? 'bg-[#00778A]/5 font-semibold' : 'hover:bg-white'
                    }`}
                  >
                    {/* Call LTP */}
                    <td className="py-2.5 px-3 font-semibold text-[#00778A]">
                      {formatCurrency(row.call.ltp, settings.currency)}
                    </td>
                    {/* Call Delta */}
                    <td className="py-2.5 px-3 text-[#1D2939]">
                      +{row.call.delta}
                    </td>
                    {/* Call Theta */}
                    <td className="py-2.5 px-3 text-[#F04438]">
                      {row.call.theta}
                    </td>
                    {/* Call IV */}
                    <td className="py-2.5 px-3 text-[#667085]">
                      {row.call.iv}%
                    </td>

                    {/* Strike */}
                    <td className="py-2.5 px-3 text-center font-bold text-sm text-[#1D2939] bg-white/60">
                      {row.strike.toLocaleString('en-IN')}
                      {isATM && (
                        <span className="ml-1.5 text-[9px] uppercase px-1 py-0.5 rounded bg-[#00778A] text-white font-sans font-bold">
                          ATM
                        </span>
                      )}
                    </td>

                    {/* Put IV */}
                    <td className="py-2.5 px-3 text-[#667085]">
                      {row.put.iv}%
                    </td>
                    {/* Put Delta */}
                    <td className="py-2.5 px-3 text-[#1D2939]">
                      {row.put.delta}
                    </td>
                    {/* Put Theta */}
                    <td className="py-2.5 px-3 text-[#F04438]">
                      {row.put.theta}
                    </td>
                    {/* Put LTP */}
                    <td className="py-2.5 px-3 font-semibold text-[#7A9266]">
                      {formatCurrency(row.put.ltp, settings.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
