import React, { useState, useEffect } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { usePriceStore } from '../../store/priceStore';
import { COMMODITY_SPECS, getCommoditySpec } from '../../services/mockData';
import { CommodityType } from '../../types';
import {
  Calculator,
  RotateCcw,
  Check,
  Layers,
  Database,
  ArrowRight,
  Sparkles,
  Sliders,
  Zap,
  RefreshCw
} from 'lucide-react';

export const GreekForm: React.FC = () => {
  const {
    calculator,
    setCalculatorInput,
    setSpotPrice,
    spotPriceSource,
    currentSpotPrice,
    setLotPreset,
    setSelectedCommodity,
    selectedCommodity,
    saveCurrentCalculationToHistory,
    runScenarioSimulation,
    isSyncingApi,
    settings,
    activeUploadName,
    price,
    optionChain
  } = useGreeksStore();

  const { currentPrice: liveGoldPrice, isLoading: isPriceLoading } = usePriceStore();
  const [savedToast, setSavedToast] = useState(false);

  // Auto-populate Spot Price ONLY on initial empty state if no manual or uploaded spot exists
  useEffect(() => {
    if (liveGoldPrice && (!calculator.spotPrice || calculator.spotPrice <= 0) && spotPriceSource === 'Live Market Price') {
      setSpotPrice(liveGoldPrice, 'Live Market Price');
    }
  }, [liveGoldPrice]);

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

  const currentSpec = getCommoditySpec(selectedCommodity);

  const handleCommodityChange = (comm: CommodityType) => {
    setSelectedCommodity(comm);
  };

  const handleResetDefaults = () => {
    const spec = getCommoditySpec(selectedCommodity);
    setCalculatorInput({
      spotPrice: spec.defaultSpot,
      strikePrice: Math.round(spec.defaultSpot / spec.strikeStep) * spec.strikeStep,
      expiryDays: 30,
      volatility: spec.defaultIV,
      interestRate: 6.5,
      optionType: 'CALL',
      contracts: 2,
      lotSize: spec.lotSize,
      isCustomLotSize: false
    });
    runScenarioSimulation();
  };

  // Benchmark Example requested by user:
  // Commodity: Gold Mini
  // Current Price: 153330
  // Strike: 155000
  // Option Type: CE / PE
  // IV: 28
  // Days to Expiry: 18
  // Lots: 10
  // Lot Size: 100
  const handleLoadGoldMiniBenchmark = () => {
    setSelectedCommodity('GOLD');
    setCalculatorInput({
      commodity: 'GOLD',
      spotPrice: 153330,
      strikePrice: 155000,
      optionType: 'CALL',
      volatility: 28,
      expiryDays: 18,
      interestRate: 6.5,
      contracts: 10,
      lotSize: 100,
      isCustomLotSize: true
    });
    runScenarioSimulation();
  };

  const handleSyncFromUpload = () => {
    const spot = price ? (price.spotPrice || price.currentPrice || price.goldPrice) : 0;
    if (spot) {
      const atmStrike = optionChain.length > 0
        ? optionChain.reduce((prev, curr) => Math.abs(curr.strike - spot) < Math.abs(prev.strike - spot) ? curr : prev).strike
        : (price?.atmStrike || 155000);
      const atmIV = optionChain.find(s => s.strike === atmStrike)?.call.iv || 28;

      setCalculatorInput({
        spotPrice: spot,
        strikePrice: atmStrike,
        volatility: atmIV
      });
      runScenarioSimulation();
    }
  };

  const handleSave = async () => {
    await saveCurrentCalculationToHistory(true);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const isBenchmarkActive =
    calculator.spotPrice === 153330 &&
    calculator.strikePrice === 155000 &&
    calculator.volatility === 28 &&
    calculator.expiryDays === 18 &&
    calculator.contracts === 10 &&
    calculator.lotSize === 100;

  return (
    <div className="bg-white/90 backdrop-blur-md p-6 rounded-[24px] border border-[#DCE9EE] shadow-sm">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]/70 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00778A]/10 text-[#00778A] flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1D2939]">
                Input Section & Greeks Engine
              </h3>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#12B76A]/15 text-[#12B76A]">
                Auto-Filled & Manual
              </span>
            </div>
            <p className="text-xs text-[#667085]">
              Black-Scholes Mathematical Engine with Multi-Lot Scaling
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadGoldMiniBenchmark}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isBenchmarkActive
                ? 'bg-[#00778A] text-white border-[#00778A] shadow-xs'
                : 'bg-white text-[#00778A] border-[#DCE9EE] hover:bg-[#F7FAFB]'
            }`}
            title="Load Gold Mini prompt benchmark (153330 spot, 155000 strike, 28% IV, 18d, 10 lots)"
          >
            Load Benchmark: Gold Mini (153,330)
          </button>

          {activeUploadName && (
            <button
              onClick={handleSyncFromUpload}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#12B76A] bg-[#12B76A]/10 hover:bg-[#12B76A]/20 border border-[#12B76A]/30 transition-all"
              title="Sync values from latest uploaded document"
            >
              Sync Upload ({activeUploadName.substring(0, 14)}...)
            </button>
          )}

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs font-semibold text-[#667085] hover:text-[#00778A] transition-colors p-1.5 rounded-lg hover:bg-[#F7FAFB]"
            title="Reset to default commodity parameters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Dataset & Sync Status */}
      <div className="mb-5 p-3 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#12B76A] animate-pulse" />
          <span className="text-[#1D2939] font-medium">
            Active Dataset:{' '}
            <strong className="text-[#00778A]">
              {selectedCommodity === 'GOLD' ? 'Gold Mini (MCX)' : currentSpec.name}
            </strong>
            {activeUploadName ? ` • Synced via ${activeUploadName}` : ' • Direct Mode'}
          </span>
        </div>
        <div className="text-[#667085] font-mono text-[11px]">
          Spot: ₹{calculator.spotPrice.toLocaleString('en-IN')} | Strike: {calculator.strikePrice} {calculator.optionType === 'CALL' ? 'CE' : 'PE'} | IV: {calculator.volatility}%
        </div>
      </div>

      {/* 8 Primary Input Parameters as required by user prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Commodity */}
        <div>
          <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
            Commodity
          </label>
          <select
            value={calculator.commodity}
            onChange={(e) => handleCommodityChange(e.target.value as CommodityType)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] text-xs font-semibold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 focus:border-[#00778A] shadow-xs"
          >
            <option value="GOLD">Gold Mini</option>
            {commodities.filter(c => c !== 'GOLD').map((c) => {
              const spec = COMMODITY_SPECS[c];
              return (
                <option key={c} value={c}>
                  {spec.name} ({spec.category})
                </option>
              );
            })}
          </select>
        </div>

        {/* 2. Option Type (CE / PE) */}
        <div>
          <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
            Option Type
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7FAFB] rounded-xl border border-[#DCE9EE]">
            <button
              type="button"
              onClick={() => {
                setCalculatorInput({ optionType: 'CALL' });
                runScenarioSimulation();
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                calculator.optionType === 'CALL'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              CE (Call)
            </button>
            <button
              type="button"
              onClick={() => {
                setCalculatorInput({ optionType: 'PUT' });
                runScenarioSimulation();
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                calculator.optionType === 'PUT'
                  ? 'bg-[#7A9266] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              PE (Put)
            </button>
          </div>
        </div>

        {/* 3. Current Price (Spot Price) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-[#1D2939]">
                Spot Price ({settings.currency === 'INR' ? '₹' : '$'})
              </label>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                spotPriceSource === 'Manual Input'
                  ? 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]'
                  : spotPriceSource === 'Uploaded Screenshot'
                  ? 'bg-[#F9F5FF] text-[#6941C6] border-[#E9D7FE]'
                  : 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  spotPriceSource === 'Manual Input'
                    ? 'bg-[#F79009]'
                    : spotPriceSource === 'Uploaded Screenshot'
                    ? 'bg-[#7F56D9]'
                    : 'bg-[#12B76A] animate-pulse'
                }`} />
                {spotPriceSource}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {liveGoldPrice && (
                <button
                  type="button"
                  onClick={() => setSpotPrice(liveGoldPrice, 'Live Market Price')}
                  className="text-[10px] text-[#00778A] hover:underline font-semibold flex items-center gap-1"
                  title="Switch Spot Price to live MCX feed"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Live: ₹{liveGoldPrice.toLocaleString('en-IN')}</span>
                </button>
              )}
              {price?.spotPrice && price.spotPrice !== liveGoldPrice && (
                <button
                  type="button"
                  onClick={() => setSpotPrice(price.spotPrice, 'Uploaded Screenshot')}
                  className="text-[10px] text-[#6941C6] hover:underline font-semibold"
                  title="Switch Spot Price to uploaded screenshot value"
                >
                  <span>Uploaded: ₹{price.spotPrice.toLocaleString('en-IN')}</span>
                </button>
              )}
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              step="1"
              value={calculator.spotPrice || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setSpotPrice(val, 'Manual Input');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] font-mono text-xs font-bold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 focus:border-[#00778A] shadow-xs"
              placeholder="153669"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#667085] mt-1">
            <span>Priority: 1. Manual Input &gt; 2. Uploaded Screenshot &gt; 3. Live Price</span>
            {spotPriceSource === 'Manual Input' && (
              <span className="text-[#B54708] font-medium">Manual input active</span>
            )}
          </div>
        </div>

        {/* 4. Strike */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-[#1D2939]">
              Strike ({settings.currency === 'INR' ? '₹' : '$'})
            </label>
            <button
              type="button"
              onClick={() => setCalculatorInput({ strikePrice: 155000 })}
              className="text-[10px] text-[#00778A] hover:underline font-semibold"
            >
              Set 155000
            </button>
          </div>
          <input
            type="number"
            step="100"
            value={calculator.strikePrice}
            onChange={(e) => setCalculatorInput({ strikePrice: parseFloat(e.target.value) || 0 })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] font-mono text-xs font-bold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 focus:border-[#00778A] shadow-xs"
          />
        </div>

        {/* 5. IV */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-[#1D2939]">
              IV (%)
            </label>
            <span className="text-[10px] text-[#667085]">
              Benchmark: 28%
            </span>
          </div>
          <input
            type="number"
            step="0.1"
            min="1"
            max="250"
            value={calculator.volatility}
            onChange={(e) => setCalculatorInput({ volatility: parseFloat(e.target.value) || 0.1 })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] font-mono text-xs font-bold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 focus:border-[#00778A] shadow-xs"
          />
        </div>

        {/* 6. Days to Expiry */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-[#1D2939]">
              Days to Expiry
            </label>
            <button
              type="button"
              onClick={() => setCalculatorInput({ expiryDays: 18 })}
              className="text-[10px] text-[#00778A] hover:underline font-semibold"
            >
              Set 18d
            </button>
          </div>
          <input
            type="number"
            min="1"
            max="365"
            value={calculator.expiryDays}
            onChange={(e) => setCalculatorInput({ expiryDays: parseInt(e.target.value, 10) || 1 })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] font-mono text-xs font-bold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 focus:border-[#00778A] shadow-xs"
          />
        </div>

        {/* 7. Lots */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-[#1D2939]">
              Lots
            </label>
            <span className="text-[10px] text-[#667085]">
              Position: {calculator.contracts} Lots
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="1000"
            value={calculator.contracts}
            onChange={(e) => setCalculatorInput({ contracts: parseInt(e.target.value, 10) || 1 })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] font-mono text-xs font-bold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 focus:border-[#00778A] shadow-xs"
          />
        </div>

        {/* 8. Lot Size */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-[#1D2939]">
              Lot Size
            </label>
            <span className="text-[10px] text-[#00778A] font-semibold">
              Total: {(calculator.contracts * (calculator.lotSize || 100)).toLocaleString()} Qty
            </span>
          </div>
          <input
            type="number"
            min="1"
            value={calculator.lotSize || 100}
            onChange={(e) => setCalculatorInput({ lotSize: parseFloat(e.target.value) || 1, isCustomLotSize: true })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DCE9EE] font-mono text-xs font-bold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20 focus:border-[#00778A] shadow-xs"
          />
        </div>
      </div>

      {/* Quick chips row */}
      <div className="mt-4 pt-3 border-t border-[#DCE9EE]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[#667085] font-semibold">Quick Expiry:</span>
          {[1, 7, 14, 18, 30, 45].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setCalculatorInput({ expiryDays: d })}
              className={`px-2 py-0.5 rounded-md font-mono transition-all ${
                calculator.expiryDays === d
                  ? 'bg-[#00778A] text-white font-bold'
                  : 'bg-[#F7FAFB] text-[#667085] hover:bg-white border border-[#DCE9EE]'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[#667085] font-semibold">Quick Lots:</span>
          {[1, 5, 10, 20, 50, 100].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setCalculatorInput({ contracts: l })}
              className={`px-2 py-0.5 rounded-md font-mono transition-all ${
                calculator.contracts === l
                  ? 'bg-[#00778A] text-white font-bold'
                  : 'bg-[#F7FAFB] text-[#667085] hover:bg-white border border-[#DCE9EE]'
              }`}
            >
              {l} Lots
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
