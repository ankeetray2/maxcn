import React, { useState } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { COMMODITY_SPECS } from '../../services/mockData';
import { Layers, Info } from 'lucide-react';

export const VolatilitySurfaceChart: React.FC = () => {
  const { selectedCommodity, calculator } = useGreeksStore();
  const spec = COMMODITY_SPECS[selectedCommodity] || COMMODITY_SPECS.GOLD;

  const [selectedCell, setSelectedCell] = useState<{ strike: number; expiry: number; iv: number } | null>(null);

  const expiries = [7, 14, 30, 60, 90]; // Days to expiry
  const baseSpot = calculator.spotPrice;
  const step = spec.strikeStep;
  const centerStrike = Math.round(baseSpot / step) * step;

  // 7 strikes around ATM: -3, -2, -1, ATM, +1, +2, +3
  const strikes = [-3, -2, -1, 0, 1, 2, 3].map((offset) => centerStrike + offset * step);

  // Generate Volatility Surface matrix with realistic volatility smile & term structure
  const surfaceMatrix = strikes.map((strike) => {
    const moneyness = strike / baseSpot; // e.g. 0.95 (ITM/OTM), 1.00 (ATM)
    return {
      strike,
      expiries: expiries.map((expiry) => {
        // Volatility smile: OTM puts / calls typically have higher IV (skew/smile)
        const smileFactor = Math.pow(moneyness - 1, 2) * 120;
        // Term structure: slight upward slope with time (mean reversion)
        const termStructure = Math.sqrt(expiry / 30) * 0.8;
        const iv = Math.max(5, Math.round((spec.defaultIV + smileFactor + termStructure) * 10) / 10);
        return {
          expiryDays: expiry,
          iv
        };
      })
    };
  });

  // Helper for IV heatmap color
  const getIVColor = (iv: number) => {
    const minIV = spec.default52wLowIV;
    const maxIV = spec.default52wHighIV;
    const ratio = Math.min(1, Math.max(0, (iv - minIV) / (maxIV - minIV || 1)));

    if (ratio < 0.3) {
      return 'bg-[#E6F3F5] text-[#00778A] border-[#DCE9EE]';
    } else if (ratio < 0.6) {
      return 'bg-[#B5CEDA]/40 text-[#00778A] font-semibold border-[#B5CEDA]';
    } else if (ratio < 0.8) {
      return 'bg-[#7A9266]/20 text-[#7A9266] font-bold border-[#7A9266]/40';
    } else {
      return 'bg-[#F04438]/20 text-[#F04438] font-bold border-[#F04438]/40';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-[24px] border border-[#DCE9EE] p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE9EE]/60 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00778A]" />
            <h3 className="text-base font-bold text-[#1D2939]">
              Volatility Surface Simulation & Skew Matrix
            </h3>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Cross-sectional implied volatility smile across strikes (moneyness) and term-structure expiries
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#667085]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#E6F3F5] border border-[#DCE9EE]" /> Low IV
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B5CEDA]/40 border border-[#B5CEDA]" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#7A9266]/20 border border-[#7A9266]/40]" /> Elevated
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F04438]/20 border border-[#F04438]/40" /> High Skew
          </span>
        </div>
      </div>

      {/* Surface Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs">
          <thead>
            <tr className="border-b border-[#DCE9EE] text-[#667085]">
              <th className="py-2.5 px-3 text-left font-semibold">Strike Price</th>
              <th className="py-2.5 px-3 font-semibold">Moneyness</th>
              {expiries.map((exp) => (
                <th key={exp} className="py-2.5 px-3 font-semibold">
                  {exp} Days Expiry
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE9EE]/50 font-mono">
            {surfaceMatrix.map((row) => {
              const isATM = row.strike === centerStrike;
              const moneynessPercent = ((row.strike / baseSpot - 1) * 100).toFixed(1);

              return (
                <tr
                  key={row.strike}
                  className={`hover:bg-[#F7FAFB] transition-colors ${
                    isATM ? 'bg-[#00778A]/5 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-left font-bold text-[#1D2939] flex items-center gap-2 font-sans">
                    <span>{row.strike.toLocaleString('en-IN')}</span>
                    {isATM && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00778A] text-white font-mono">
                        ATM
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#667085]">
                    {row.strike > baseSpot ? `+${moneynessPercent}%` : `${moneynessPercent}%`}
                  </td>
                  {row.expiries.map((cell) => {
                    const colorClasses = getIVColor(cell.iv);
                    const isSelected =
                      selectedCell?.strike === row.strike && selectedCell?.expiry === cell.expiryDays;

                    return (
                      <td key={cell.expiryDays} className="py-2 px-2">
                        <button
                          onClick={() =>
                            setSelectedCell({
                              strike: row.strike,
                              expiry: cell.expiryDays,
                              iv: cell.iv
                            })
                          }
                          className={`w-full py-2 px-2.5 rounded-xl border transition-all text-xs ${colorClasses} ${
                            isSelected ? 'ring-2 ring-[#00778A] shadow-sm scale-105' : 'hover:scale-102'
                          }`}
                        >
                          {cell.iv.toFixed(1)}%
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Surface Details inspector */}
      {selectedCell ? (
        <div className="mt-4 p-3.5 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#1D2939]">Selected Volatility Point:</span>
            <span className="text-[#00778A] font-mono font-bold">
              Strike {selectedCell.strike.toLocaleString('en-IN')}
            </span>
            <span>•</span>
            <span className="text-[#667085] font-mono">
              Expiry {selectedCell.expiry} Days
            </span>
            <span>•</span>
            <span className="text-[#1D2939] font-mono font-bold">
              Implied Volatility: {selectedCell.iv}%
            </span>
          </div>
          <button
            onClick={() => setSelectedCell(null)}
            className="text-[11px] text-[#00778A] hover:underline"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="mt-3 text-[11px] text-[#667085] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#00778A]" />
          <span>Click any matrix point to inspect the implied volatility skew for that strike-expiry pair.</span>
        </div>
      )}
    </div>
  );
};
