import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Code2,
  Cpu,
  Layers,
  Zap,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface TerminalDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TerminalDocsModal: React.FC<TerminalDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'black76' | 'specs' | 'shortcuts'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#F8FAFC] dark:bg-[#08111F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 flex items-center justify-center text-[#0EA5E9]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                Terminal Documentation & Knowledge Base
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                MCX Options Analytics Platform v1.0.0 Manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 text-xs font-mono">
          {[
            { id: 'overview', label: 'Platform Overview' },
            { id: 'black76', label: 'Black-76 Math' },
            { id: 'specs', label: 'MCX Specifications' },
            { id: 'shortcuts', label: 'Hotkeys' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0EA5E9] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#0EA5E9]" />
                  What is Commodity Greeks Pro?
                </h3>
                <p>
                  Commodity Greeks Pro is an institutional-grade quantitative analytics terminal crafted specifically for Indian Multi Commodity Exchange (MCX) derivatives traders, option sellers, and risk desk managers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold text-slate-900 dark:text-white block font-mono">1. Pure MCX Precision</span>
                    Accurate lot sizing, tick increments, and contract units for Gold, Silver, Crude Oil, Natural Gas, Copper, and Zinc.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold text-slate-900 dark:text-white block font-mono">2. Black-76 Model</span>
                    Built specifically for commodity futures options where underlying spot is the active front-month futures contract.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  Key Modules
                </h3>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-300">
                  <li><strong className="text-slate-900 dark:text-white font-mono">Live Greeks Engine:</strong> Instant calculation of Delta (Δ), Gamma (Γ), Theta (Θ), Vega (ν), Rho (ρ), and Probability of Profit (POP).</li>
                  <li><strong className="text-slate-900 dark:text-white font-mono">Interactive Dual Sliders:</strong> Calibrate Target Delta (Δ) using inverse Black-Scholes and simulate spot price shifts.</li>
                  <li><strong className="text-slate-900 dark:text-white font-mono">Option Chain Screenshot OCR:</strong> Automated extraction of strikes, LTP, and IV from broker screens (Groww, Zerodha, Upstox).</li>
                  <li><strong className="text-slate-900 dark:text-white font-mono">MongoDB Persistence:</strong> Cloud-persisted calculations, scenario simulations, and audit trails.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'black76' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Black (1976) Futures Option Pricing Formula
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                  Unlike equity options (Black-Scholes-Merton), MCX commodity options are options on futures contracts. The underlying asset does not have a cost of carry or dividend yield in the same manner, leading to the Black-76 formulation:
                </p>

                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs font-mono space-y-2 text-slate-800 dark:text-slate-200">
                  <div><strong>Call Price:</strong> C = e^(-rT) * [ F * N(d1) - K * N(d2) ]</div>
                  <div><strong>Put Price:</strong> P = e^(-rT) * [ K * N(-d2) - F * N(-d1) ]</div>
                  <div className="pt-2 border-t border-slate-300 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    d1 = [ ln(F/K) + (0.5 * σ²) * T ] / [ σ * √T ]<br />
                    d2 = d1 - σ * √T
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div><strong className="text-[#0EA5E9]">Delta (Call):</strong> e^(-rT) * N(d1)</div>
                  <div><strong className="text-[#0EA5E9]">Delta (Put):</strong> -e^(-rT) * N(-d1)</div>
                  <div><strong className="text-[#0EA5E9]">Gamma:</strong> e^(-rT) * [ N'(d1) / (F * σ * √T) ]</div>
                  <div><strong className="text-[#0EA5E9]">Vega:</strong> e^(-rT) * F * √T * N'(d1) * 0.01 (per 1% vol)</div>
                  <div><strong className="text-[#0EA5E9]">Theta:</strong> -[ (F * σ * e^(-rT) * N'(d1)) / (2 * √T) ] - r*Premium (scaled to per day)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Standard MCX Contract Specifications and Lot Sizing:
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">Commodity</th>
                      <th className="p-2.5">Trading Unit</th>
                      <th className="p-2.5">Lot Size</th>
                      <th className="p-2.5">Tick Size</th>
                      <th className="p-2.5">Strike Interval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">GOLD (1 KG)</td>
                      <td className="p-2.5">100 Grams</td>
                      <td className="p-2.5">1 Kg</td>
                      <td className="p-2.5">₹1.00</td>
                      <td className="p-2.5">₹100 / ₹250</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">SILVER (30 KG)</td>
                      <td className="p-2.5">1 Kg</td>
                      <td className="p-2.5">30 Kg</td>
                      <td className="p-2.5">₹1.00</td>
                      <td className="p-2.5">₹250 / ₹500</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">CRUDE OIL</td>
                      <td className="p-2.5">1 Barrel</td>
                      <td className="p-2.5">100 Barrels</td>
                      <td className="p-2.5">₹1.00</td>
                      <td className="p-2.5">₹50</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">NATURAL GAS</td>
                      <td className="p-2.5">1 mmBtu</td>
                      <td className="p-2.5">1,250 mmBtu</td>
                      <td className="p-2.5">₹0.10</td>
                      <td className="p-2.5">₹5.00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">COPPER</td>
                      <td className="p-2.5">1 Kg</td>
                      <td className="p-2.5">2,500 Kg</td>
                      <td className="p-2.5">₹0.05</td>
                      <td className="p-2.5">₹5.00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">ZINC</td>
                      <td className="p-2.5">1 Kg</td>
                      <td className="p-2.5">5,000 Kg</td>
                      <td className="p-2.5">₹0.05</td>
                      <td className="p-2.5">₹2.50</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  Trading Terminal Hotkeys
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Calculator View</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">Alt + C</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Dashboard View</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">Alt + D</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Price Ingestion / Upload</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">Alt + U</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Analytics & Volatility</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">Alt + A</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Toggle Dark / Light Theme</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">Alt + T</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Refresh Market Tick</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold">Alt + R</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Compliant with SEBI & MCX circular specifications
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
