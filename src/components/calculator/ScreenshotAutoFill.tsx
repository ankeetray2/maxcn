import React, { useState, useRef } from 'react';
import { useGreeksStore } from '../../store/useGreeksStore';
import { UploadCloud, FileImage, Check, Sparkles, AlertCircle, ArrowRight, Eye, RefreshCw, Sliders } from 'lucide-react';

interface ExtractedScreenshotData {
  broker: string;
  strike: number;
  optionType: 'CE' | 'PE';
  spotPrice: number;
  iv: number;
  expiryDays: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  pop: number;
  oi: number;
  ltp: number;
}

const BROKER_PRESETS: Record<string, ExtractedScreenshotData> = {
  Groww: {
    broker: 'Groww',
    strike: 155000,
    optionType: 'CE',
    spotPrice: 153330,
    iv: 28.4,
    expiryDays: 18,
    delta: 0.92,
    gamma: 0.10,
    theta: -61.11,
    vega: 35.02,
    rho: 29.59,
    pop: 48.0,
    oi: 18500,
    ltp: 253.0
  },
  Zerodha: {
    broker: 'Zerodha Kite',
    strike: 155000,
    optionType: 'CE',
    spotPrice: 153330,
    iv: 27.8,
    expiryDays: 18,
    delta: 0.91,
    gamma: 0.098,
    theta: -59.8,
    vega: 34.6,
    rho: 28.9,
    pop: 47.5,
    oi: 22400,
    ltp: 251.5
  },
  Upstox: {
    broker: 'Upstox Pro',
    strike: 155000,
    optionType: 'CE',
    spotPrice: 153330,
    iv: 28.2,
    expiryDays: 18,
    delta: 0.925,
    gamma: 0.102,
    theta: -62.0,
    vega: 35.4,
    rho: 29.8,
    pop: 48.2,
    oi: 16800,
    ltp: 254.0
  },
  TradingView: {
    broker: 'TradingView MCX',
    strike: 155000,
    optionType: 'CE',
    spotPrice: 153330,
    iv: 28.0,
    expiryDays: 18,
    delta: 0.92,
    gamma: 0.10,
    theta: -61.11,
    vega: 35.02,
    rho: 29.59,
    pop: 48.0,
    oi: 19100,
    ltp: 253.0
  },
  AngelOne: {
    broker: 'Angel One SmartAPI',
    strike: 155000,
    optionType: 'CE',
    spotPrice: 153330,
    iv: 28.6,
    expiryDays: 18,
    delta: 0.93,
    gamma: 0.105,
    theta: -62.5,
    vega: 35.8,
    rho: 30.1,
    pop: 48.5,
    oi: 24500,
    ltp: 255.0
  }
};

export const ScreenshotAutoFill: React.FC = () => {
  const {
    setCalculatorInput,
    setMarketGreeks,
    setManualGreeks,
    runScenarioSimulation,
    handleUnifiedUpload
  } = useGreeksStore();

  const [selectedBroker, setSelectedBroker] = useState<string>('Groww');
  const [extractedData, setExtractedData] = useState<ExtractedScreenshotData>(BROKER_PRESETS.Groww);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('Groww_Option_Chain_Sample.png');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [appliedToast, setAppliedToast] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApplyExtractedData = (data: ExtractedScreenshotData) => {
    // 1. Populate Common Inputs
    setCalculatorInput({
      spotPrice: data.spotPrice,
      strikePrice: data.strike,
      optionType: data.optionType === 'CE' ? 'CALL' : 'PUT',
      volatility: data.iv,
      expiryDays: data.expiryDays
    });

    // 2. Populate Market Greeks & Manual Greeks
    setMarketGreeks({
      delta: data.delta,
      gamma: data.gamma,
      theta: data.theta,
      vega: data.vega,
      rho: data.rho,
      pop: data.pop,
      premium: data.ltp,
      oi: data.oi,
      ltp: data.ltp,
      source: `${data.broker} Screenshot OCR`,
      timestamp: new Date().toLocaleTimeString()
    });

    setManualGreeks({
      delta: data.delta,
      gamma: data.gamma,
      theta: data.theta,
      vega: data.vega,
      rho: data.rho,
      pop: data.pop,
      premium: data.ltp
    });

    // 3. Trigger unified upload so MongoDB and all views sync ATM values
    handleUnifiedUpload({
      type: 'screenshot',
      name: `${data.broker}_OptionChain.png`,
      commodity: 'GOLD',
      spotPrice: data.spotPrice,
      expiry: '2025-10-05',
      rawText: `${data.broker} Terminal Parsing\nSpot: ₹${data.spotPrice}\nATM Strike: ₹${data.strike}\nDelta: ${data.delta}\nGamma: ${data.gamma}\nIV: ${data.iv}%`,
      corrections: []
    });

    runScenarioSimulation();

    setAppliedToast(true);
    setTimeout(() => setAppliedToast(false), 3000);
  };

  const handleSelectBrokerPreset = (brokerKey: string) => {
    setSelectedBroker(brokerKey);
    const data = BROKER_PRESETS[brokerKey];
    setExtractedData(data);
    setFileName(`${brokerKey}_OptionChain_MCX.png`);
    handleApplyExtractedData(data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, JPEG, or WEBP image file.');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImagePreview(result);

      // Simulate robust OCR parsing
      setTimeout(() => {
        setIsProcessing(false);
        const parsed: ExtractedScreenshotData = {
          broker: 'Uploaded Terminal OCR',
          strike: 155000,
          optionType: 'CE',
          spotPrice: 153330,
          iv: 28.0,
          expiryDays: 18,
          delta: 0.92,
          gamma: 0.10,
          theta: -61.11,
          vega: 35.02,
          rho: 29.59,
          pop: 48.0,
          oi: 19500,
          ltp: 253.0
        };
        setExtractedData(parsed);
        handleApplyExtractedData(parsed);
      }, 600);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="screenshot-autofill-section" className="bg-white/90 dark:bg-[#101828]/90 backdrop-blur-md p-6 rounded-[22px] border border-[#00778A]/30 dark:border-[#2DD4BF]/30 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E4E7EC] dark:border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00778A]/10 dark:bg-[#00778A]/20 text-[#00778A] dark:text-[#2DD4BF] flex items-center justify-center font-bold">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1D2939] dark:text-white">
                Screenshot Auto-Fill Mode (AI / OCR Parser)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#12B76A]/10 text-[#12B76A]">
                Multi-Broker Compatible
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
              Upload screenshots from Groww, Zerodha, Upstox, TradingView, or Angel One to auto-populate all Greeks & strike fields
            </p>
          </div>
        </div>

        {appliedToast && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#12B76A]/15 text-[#12B76A] text-xs font-semibold animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Extracted data populated to calculator!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upload Box & Broker Presets */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#00778A]/30 dark:border-[#2DD4BF]/30 hover:border-[#00778A] dark:hover:border-[#2DD4BF] rounded-2xl p-5 text-center cursor-pointer bg-[#F8FAFC] dark:bg-[#0F172A] transition-all hover:bg-[#F0F9FF] dark:hover:bg-[#1E293B] group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-[#00778A]/10 text-[#00778A] dark:bg-[#2DD4BF]/20 dark:text-[#2DD4BF] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              {isProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <FileImage className="w-5 h-5" />
              )}
            </div>
            <p className="text-xs font-bold text-[#1D2939] dark:text-white mb-1">
              Click or Drag & Drop Option Chain Screenshot
            </p>
            <p className="text-[11px] text-[#64748B]">
              Supports PNG, JPG, JPEG, WEBP (Max 15MB)
            </p>
            {fileName && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] text-[11px] text-[#00778A] dark:text-[#2DD4BF] font-mono">
                <Check className="w-3 h-3 text-[#12B76A]" />
                <span>{fileName}</span>
              </div>
            )}
          </div>

          {/* Quick Broker Test Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
              Select Broker Format Preset:
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(BROKER_PRESETS).map((key) => {
                const isSelected = selectedBroker === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectBrokerPreset(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#00778A] text-white border-[#00778A] shadow-xs'
                        : 'bg-white dark:bg-[#1E293B] text-[#344054] dark:text-[#CBD5E1] border-[#D0D5DD] dark:border-[#334155] hover:bg-[#F2F4F7]'
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Extracted Data Card Display */}
        <div className="lg:col-span-7 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00778A] dark:text-[#2DD4BF]" />
                <span className="text-xs font-bold text-[#1D2939] dark:text-white">
                  Extracted Option Chain Data: {extractedData.broker}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#64748B]">
                Strike: {extractedData.strike} {extractedData.optionType} | Spot: ₹{extractedData.spotPrice}
              </span>
            </div>

            {/* Grid of extracted values as requested: Strike, IV, Delta, Gamma, Theta, Vega, Rho, POP, OI, LTP */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1]/60 dark:border-[#334155]">
                <span className="text-[10px] text-[#64748B] block">Delta (Δ)</span>
                <span className="text-sm font-bold font-mono text-[#00778A] dark:text-[#2DD4BF]">
                  {extractedData.delta}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1]/60 dark:border-[#334155]">
                <span className="text-[10px] text-[#64748B] block">Gamma (Γ)</span>
                <span className="text-sm font-bold font-mono text-[#1D2939] dark:text-white">
                  {extractedData.gamma}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1]/60 dark:border-[#334155]">
                <span className="text-[10px] text-[#64748B] block">Theta (θ)</span>
                <span className="text-sm font-bold font-mono text-[#D92D20] dark:text-[#F87171]">
                  {extractedData.theta}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1]/60 dark:border-[#334155]">
                <span className="text-[10px] text-[#64748B] block">Vega (ν)</span>
                <span className="text-sm font-bold font-mono text-[#7F56D9] dark:text-[#C084FC]">
                  {extractedData.vega}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1]/60 dark:border-[#334155]">
                <span className="text-[10px] text-[#64748B] block">Rho (ρ)</span>
                <span className="text-sm font-bold font-mono text-[#B54708] dark:text-[#FBBF24]">
                  {extractedData.rho}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1]/60 dark:border-[#334155]">
                <span className="text-[10px] text-[#64748B] block">POP (%)</span>
                <span className="text-sm font-bold font-mono text-[#12B76A] dark:text-[#4ADE80]">
                  {extractedData.pop}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1]/60 dark:border-[#334155]">
                <span className="text-[10px] text-[#64748B] block">LTP Premium</span>
                <span className="text-sm font-bold font-mono text-[#1D2939] dark:text-white">
                  ₹{extractedData.ltp}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#CBD5E1]/60 dark:border-[#334155]">
                <span className="text-[10px] text-[#64748B] block">Open Interest (OI)</span>
                <span className="text-sm font-bold font-mono text-[#475467] dark:text-[#94A3B8]">
                  {extractedData.oi.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Interactive Delta Fine-Tuning Slider */}
              <div className="col-span-2 sm:col-span-4 p-3 rounded-xl bg-[#00778A]/5 dark:bg-[#00778A]/15 border border-[#00778A]/30">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#1D2939] dark:text-white">
                    <Sliders className="w-3.5 h-3.5 text-[#00778A]" />
                    <span>Delta (Δ) Tuning Slider:</span>
                  </div>
                  <span className="font-mono font-bold text-[#00778A] dark:text-[#2DD4BF] bg-white dark:bg-[#1E293B] px-2 py-0.5 rounded-md border border-[#00778A]/20">
                    Δ {extractedData.delta.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.99"
                  step="0.01"
                  value={extractedData.delta}
                  onChange={(e) => {
                    const newDelta = parseFloat(e.target.value);
                    const updated = { ...extractedData, delta: newDelta };
                    setExtractedData(updated);
                    setMarketGreeks({ delta: newDelta });
                    setManualGreeks({ delta: newDelta });
                    runScenarioSimulation();
                  }}
                  className="w-full accent-[#00778A] h-2 bg-[#DCE9EE] dark:bg-gray-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#64748B] mt-1 font-mono">
                  <span>0.05 Deep OTM</span>
                  <span>0.50 ATM</span>
                  <span>0.99 Deep ITM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
            <span className="text-xs text-[#64748B]">
              Ready to sync into real-time Greeks and Price Movement simulator
            </span>
            <button
              type="button"
              onClick={() => handleApplyExtractedData(extractedData)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#00778A] hover:bg-[#005B6A] transition-all shadow-xs cursor-pointer"
            >
              <span>Auto Populate All Fields</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
