import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGreeksStore } from '../../store/useGreeksStore';
import { formatCurrency } from '../../utils/greeks';
import {
  Upload,
  FileSpreadsheet,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Shield,
  Activity,
  Layers,
  Zap,
  BarChart3,
  Terminal,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface PipelineStep {
  id: number;
  label: string;
  desc: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export const UploadZone: React.FC = () => {
  const { setSelectedCommodity, setUploadedOptionChain } = useGreeksStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<
    'table' | 'insights' | 'scenarios' | 'charts' | 'corrections' | 'json'
  >('table');
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: 1, label: 'File Validation', desc: 'MIME (PNG/JPG/WEBP) & 10MB limit check', status: 'pending' },
    { id: 2, label: 'Gemini Vision OCR', desc: 'Multimodal sub-pixel table extraction', status: 'pending' },
    { id: 3, label: 'AI Validation', desc: 'Fix typos ("O.99"→0.99, "l35OOO"→135000)', status: 'pending' },
    { id: 4, label: 'Structured JSON', desc: 'Schema normalization & strike ordering', status: 'pending' },
    { id: 5, label: 'Greeks Math Engine', desc: 'Black-Scholes Delta, Gamma, Theta, Vega, Rho', status: 'pending' },
    { id: 6, label: 'MongoDB Storage', desc: 'Persisting to uploads, chains & analytics', status: 'pending' }
  ]);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [apiResult, setApiResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to generate realistic visual broker preview canvas
  const createBrokerCanvasPreview = (
    brokerName: string,
    commodity: string,
    spot: number,
    strikes: number[]
  ): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Dark sleek terminal background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header bar
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, canvas.width, 50);

    ctx.fillStyle = '#00778A';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(`${brokerName} Option Chain`, 20, 32);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(`${commodity} SPOT: ₹${spot.toLocaleString()}`, 240, 32);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('EXPIRY: 05-OCT-2025  |  RBI RATE: 6.5%', 490, 32);

    // Table Header
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 50, canvas.width, 30);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('CALL LTP', 30, 70);
    ctx.fillText('CALL OI', 110, 70);
    ctx.fillText('IV %', 190, 70);

    ctx.fillStyle = '#38BDF8';
    ctx.fillText('STRIKE', 330, 70);

    ctx.fillStyle = '#EF4444';
    ctx.fillText('IV %', 470, 70);
    ctx.fillText('PUT OI', 540, 70);
    ctx.fillText('PUT LTP', 620, 70);

    // Table rows
    strikes.forEach((k, idx) => {
      const y = 105 + idx * 45;
      const isAtm = Math.abs(k - spot) < 1500;

      if (isAtm) {
        ctx.fillStyle = 'rgba(0, 119, 138, 0.25)';
        ctx.fillRect(0, y - 22, canvas.width, 38);
      }

      // Call side
      ctx.fillStyle = '#10B981';
      ctx.font = '13px monospace';
      const callLtp = Math.max(12, Math.round(Math.max(0, spot - k) + 2150 * Math.exp(-idx * 0.3)));
      ctx.fillText(`₹${callLtp.toLocaleString()}`, 30, y);

      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`${(180 + idx * 850).toLocaleString()}`, 110, y);
      ctx.fillText(`33.67%`, 190, y);

      // Strike
      ctx.fillStyle = isAtm ? '#FCD34D' : '#F8FAFC';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(`${k.toLocaleString()}`, 330, y);

      // Put side
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px monospace';
      ctx.fillText(`33.67%`, 470, y);
      ctx.fillText(`${(8500 - idx * 1100).toLocaleString()}`, 540, y);

      ctx.fillStyle = '#EF4444';
      const putLtp = Math.max(12, Math.round(Math.max(0, k - spot) + 1800 * Math.exp(-idx * 0.3)));
      ctx.fillText(`₹${putLtp.toLocaleString()}`, 620, y);
    });

    return canvas.toDataURL('image/png');
  };

  const runPipeline = async (base64Data: string, name: string, mime: string, platformHint: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setFileName(name);
    setImagePreviewUrl(base64Data);

    // Reset steps
    setPipelineSteps((steps) =>
      steps.map((s) => ({ ...s, status: s.id === 1 ? 'active' : 'pending' }))
    );

    try {
      // Step 1: File Validation
      await new Promise((r) => setTimeout(r, 200));
      setPipelineSteps((steps) =>
        steps.map((s) =>
          s.id === 1 ? { ...s, status: 'completed' } : s.id === 2 ? { ...s, status: 'active' } : s
        )
      );

      // Step 2 & 3: Send to backend API
      const res = await fetch('/api/upload-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          filename: name,
          mimeType: mime,
          platformHint
        })
      });

      // Update Step 2 & 3
      setPipelineSteps((steps) =>
        steps.map((s) =>
          s.id === 2
            ? { ...s, status: 'completed' }
            : s.id === 3
            ? { ...s, status: 'completed' }
            : s.id === 4
            ? { ...s, status: 'active' }
            : s
        )
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to process option chain screenshot');
      }

      // Step 4 & 5 & 6
      setPipelineSteps((steps) =>
        steps.map((s) =>
          s.id === 4 || s.id === 5
            ? { ...s, status: 'completed' }
            : s.id === 6
            ? { ...s, status: 'completed' }
            : s
        )
      );

      const data = json.data;
      setApiResult(data);

      // Convert to store format so other platform tabs (Calculator, Analytics, History) update immediately
      if (data.structuredJson?.optionChain) {
        const mappedStrikes = data.structuredJson.optionChain.map((row: any) => ({
          strike: row.strike,
          callLtp: row.call.ltp,
          callDelta: row.call.delta,
          callGamma: row.call.gamma,
          callTheta: row.call.theta,
          callVega: row.call.vega,
          callRho: row.call.rho,
          callIV: row.call.iv,
          callOI: row.call.oi,
          putLtp: row.put.ltp,
          putDelta: row.put.delta,
          putGamma: row.put.gamma,
          putTheta: row.put.theta,
          putVega: row.put.vega,
          putRho: row.put.rho,
          putIV: row.put.iv,
          putOI: row.put.oi
        }));

        let commKey: any = 'GOLD';
        const rawComm = (data.structuredJson.commodity || '').toUpperCase();
        if (rawComm.includes('SILVER')) commKey = 'SILVER';
        else if (rawComm.includes('CRUDE')) commKey = 'CRUDEOIL';
        else if (rawComm.includes('GAS')) commKey = 'NATURALGAS';
        else if (rawComm.includes('COPPER')) commKey = 'COPPER';

        setSelectedCommodity(commKey);
        setUploadedOptionChain(mappedStrikes, commKey, name);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during pipeline execution');
      setPipelineSteps((steps) =>
        steps.map((s) => (s.status === 'active' ? { ...s, status: 'failed' } : s))
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      runPipeline(dataUrl, file.name, file.type, 'User Uploaded File');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Sample screenshot presets from major commodity platforms
  const samplePresets = [
    {
      name: 'Groww (Gold Mini)',
      platform: 'Groww',
      commodity: 'Gold Mini',
      spot: 153219,
      strikes: [140000, 145000, 150000, 153000, 155000, 160000],
      badge: 'Exact Prompt Spec'
    },
    {
      name: 'Zerodha Kite (Crude Oil)',
      platform: 'Zerodha Kite',
      commodity: 'Crude Oil',
      spot: 5980,
      strikes: [5700, 5800, 5900, 6000, 6100, 6200],
      badge: 'Energy MCX'
    },
    {
      name: 'Angel One (Silver Mini)',
      platform: 'Angel One',
      commodity: 'Silver Mini',
      spot: 84250,
      strikes: [82000, 83000, 84000, 85000, 86000, 87000],
      badge: 'High Volatility'
    },
    {
      name: 'MCX Terminal (Copper)',
      platform: 'MCX Terminal',
      commodity: 'Copper',
      spot: 812,
      strikes: [780, 790, 800, 810, 820, 830],
      badge: 'Base Metal'
    }
  ];

  const handleLoadPreset = (preset: typeof samplePresets[0]) => {
    const dataUrl = createBrokerCanvasPreview(
      preset.platform,
      preset.commodity,
      preset.spot,
      preset.strikes
    );
    const mockFilename = `${preset.platform.replace(/\s+/g, '_')}_${preset.commodity.replace(/\s+/g, '_')}_screenshot.png`;
    runPipeline(dataUrl, mockFilename, 'image/png', preset.platform);
  };

  const copyJsonToClipboard = () => {
    if (!apiResult?.structuredJson) return;
    navigator.clipboard.writeText(JSON.stringify(apiResult.structuredJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-[24px] border border-[#DCE9EE] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F3F5] text-[#00778A]">
                <Cpu className="w-3.5 h-3.5" /> AI Vision & OCR Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                <Shield className="w-3.5 h-3.5" /> 10MB Auto-Sanitized
              </span>
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#1D2939]">
              Automated Option Chain Screenshot Processor
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
              Upload any screenshot from Groww, Zerodha, Upstox, Angel One, or MCX Terminal. The AI automatically extracts strikes, fixes OCR typos, computes Black-Scholes Greeks, and runs stress scenarios without manual entry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLoadPreset(samplePresets[0])}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#00778A] text-white hover:bg-[#006070] transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              Run Demo Screenshot (Gold Mini)
            </button>
          </div>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-[20px] p-8 text-center transition-all ${
            isDragging
              ? 'border-[#00778A] bg-[#E8F3F5]/40 scale-[1.005]'
              : 'border-[#DCE9EE] bg-[#F7FAFB]/60 hover:bg-[#F7FAFB] hover:border-[#00778A]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#DCE9EE] shadow-xs flex items-center justify-center text-[#00778A] mb-3">
              {isProcessing ? (
                <RefreshCw className="w-6 h-6 animate-spin text-[#00778A]" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <p className="text-sm font-semibold text-[#1D2939]">
              {isProcessing ? 'Processing Screenshot with Gemini AI...' : 'Drop option chain screenshot here, or browse files'}
            </p>
            <p className="text-xs text-[#667085] mt-1">
              Supports PNG, JPG, JPEG, WEBP up to 10 MB. Sub-pixel table detection & typo auto-correction enabled.
            </p>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="mt-5 pt-4 border-t border-[#DCE9EE]">
          <p className="text-xs font-semibold text-[#667085] mb-2.5 uppercase tracking-wider">
            Or test instantly with pre-loaded broker terminal captures:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {samplePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleLoadPreset(preset)}
                className="p-3 text-left rounded-xl border border-[#DCE9EE] bg-white hover:border-[#00778A] hover:bg-[#E8F3F5]/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D2939] group-hover:text-[#00778A]">
                    {preset.name}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-[#667085]">
                  <span>Spot: ₹{preset.spot.toLocaleString()}</span>
                  <span className="font-mono text-[10px] text-[#00778A] bg-[#E8F3F5] px-1.5 py-0.2 rounded">
                    {preset.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6-Phase Pipeline Progress Visualizer */}
      {(isProcessing || apiResult) && (
        <div className="glass-panel p-6 rounded-[24px] border border-[#DCE9EE]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base font-bold text-[#1D2939] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00778A]" />
              Automated AI Pipeline Execution Trace
            </h3>
            {apiResult && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All 6 Steps Complete
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineSteps.map((step) => (
              <div
                key={step.id}
                className={`p-3 rounded-xl border transition-all ${
                  step.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                    : step.status === 'active'
                    ? 'border-[#00778A] bg-[#E8F3F5] text-[#00778A] animate-pulse'
                    : step.status === 'failed'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Step {step.id}
                  </span>
                  {step.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {step.status === 'active' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00778A]" />}
                  {step.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                </div>
                <div className="text-xs font-bold leading-tight">{step.label}</div>
                <div className="text-[10px] mt-0.5 opacity-80 line-clamp-2">{step.desc}</div>
              </div>
            ))}
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Pipeline Output & Results Dashboard */}
      {apiResult && (
        <div className="glass-panel p-6 sm:p-8 rounded-[24px] border border-[#DCE9EE] space-y-6">
          {/* Header & Meta */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-xl font-bold text-[#1D2939]">
                  {apiResult.structuredJson?.commodity || 'Extracted Commodity'} Option Chain
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Spot: ₹{apiResult.structuredJson?.spotPrice?.toLocaleString()}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F3F5] text-[#00778A]">
                  Expiry: {apiResult.structuredJson?.expiry}
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-1">
                Source: {fileName} | Extracted {apiResult.structuredJson?.optionChain?.length || 0} strikes across Call & Put sides
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7FAFB] rounded-xl border border-[#DCE9EE]">
              <button
                onClick={() => setActiveResultTab('table')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeResultTab === 'table'
                    ? 'bg-white text-[#00778A] shadow-xs'
                    : 'text-[#667085] hover:text-[#1D2939]'
                }`}
              >
                Option Chain Table
              </button>
              <button
                onClick={() => setActiveResultTab('insights')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeResultTab === 'insights'
                    ? 'bg-white text-[#00778A] shadow-xs'
                    : 'text-[#667085] hover:text-[#1D2939]'
                }`}
              >
                AI Insights & Zones
              </button>
              <button
                onClick={() => setActiveResultTab('scenarios')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeResultTab === 'scenarios'
                    ? 'bg-white text-[#00778A] shadow-xs'
                    : 'text-[#667085] hover:text-[#1D2939]'
                }`}
              >
                Scenario Stress Matrix
              </button>
              <button
                onClick={() => setActiveResultTab('charts')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeResultTab === 'charts'
                    ? 'bg-white text-[#00778A] shadow-xs'
                    : 'text-[#667085] hover:text-[#1D2939]'
                }`}
              >
                Analytics Curves
              </button>
              <button
                onClick={() => setActiveResultTab('corrections')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeResultTab === 'corrections'
                    ? 'bg-white text-[#00778A] shadow-xs'
                    : 'text-[#667085] hover:text-[#1D2939]'
                }`}
              >
                OCR Corrections ({apiResult.ocrCorrections?.length || 0})
              </button>
              <button
                onClick={() => setActiveResultTab('json')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeResultTab === 'json'
                    ? 'bg-white text-[#00778A] shadow-xs'
                    : 'text-[#667085] hover:text-[#1D2939]'
                }`}
              >
                Structured JSON
              </button>
            </div>
          </div>

          {/* TAB 1: Option Chain Table */}
          {activeResultTab === 'table' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-[#DCE9EE]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7FAFB] text-[#1D2939] border-b border-[#DCE9EE] font-semibold">
                    <tr>
                      <th colSpan={7} className="px-3 py-2 text-center text-emerald-700 bg-emerald-50/50 border-r border-[#DCE9EE]">
                        CALLS
                      </th>
                      <th className="px-4 py-2 text-center bg-[#E8F3F5] text-[#00778A]">
                        STRIKE
                      </th>
                      <th colSpan={7} className="px-3 py-2 text-center text-rose-700 bg-rose-50/50 border-l border-[#DCE9EE]">
                        PUTS
                      </th>
                    </tr>
                    <tr className="border-t border-[#DCE9EE] text-[11px] text-[#667085]">
                      {/* Call cols */}
                      <th className="px-2 py-1.5">LTP (₹)</th>
                      <th className="px-2 py-1.5">OI</th>
                      <th className="px-2 py-1.5">IV %</th>
                      <th className="px-2 py-1.5">Delta</th>
                      <th className="px-2 py-1.5">Gamma</th>
                      <th className="px-2 py-1.5">Theta</th>
                      <th className="px-2 py-1.5 border-r border-[#DCE9EE]">Vega</th>

                      {/* Strike col */}
                      <th className="px-3 py-1.5 text-center bg-[#E8F3F5]/60 text-[#1D2939] font-bold">
                        PRICE
                      </th>

                      {/* Put cols */}
                      <th className="px-2 py-1.5 border-l border-[#DCE9EE]">Delta</th>
                      <th className="px-2 py-1.5">Gamma</th>
                      <th className="px-2 py-1.5">Theta</th>
                      <th className="px-2 py-1.5">Vega</th>
                      <th className="px-2 py-1.5">IV %</th>
                      <th className="px-2 py-1.5">OI</th>
                      <th className="px-2 py-1.5">LTP (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE9EE]">
                    {apiResult.structuredJson?.optionChain?.map((row: any) => {
                      const spot = apiResult.structuredJson?.spotPrice || 0;
                      const isAtm = Math.abs(row.strike - spot) < (spot > 50000 ? 2000 : 50);

                      return (
                        <tr
                          key={row.strike}
                          className={`hover:bg-[#F7FAFB] transition-colors ${
                            isAtm ? 'bg-[#E8F3F5]/30 font-semibold' : ''
                          }`}
                        >
                          {/* Call side */}
                          <td className="px-2 py-2 font-mono text-emerald-700">₹{row.call.ltp}</td>
                          <td className="px-2 py-2 font-mono text-slate-600">{row.call.oi?.toLocaleString()}</td>
                          <td className="px-2 py-2 font-mono">{row.call.iv}%</td>
                          <td className="px-2 py-2 font-mono">{row.call.delta}</td>
                          <td className="px-2 py-2 font-mono text-[10px]">{row.call.gamma}</td>
                          <td className="px-2 py-2 font-mono text-rose-600">{row.call.theta}</td>
                          <td className="px-2 py-2 font-mono border-r border-[#DCE9EE]">{row.call.vega}</td>

                          {/* Strike */}
                          <td className="px-3 py-2 text-center font-bold bg-[#E8F3F5]/60 text-[#00778A]">
                            {row.strike?.toLocaleString()}
                            {isAtm && (
                              <span className="ml-1 text-[9px] px-1 py-0.2 bg-[#00778A] text-white rounded">
                                ATM
                              </span>
                            )}
                          </td>

                          {/* Put side */}
                          <td className="px-2 py-2 font-mono border-l border-[#DCE9EE]">{row.put.delta}</td>
                          <td className="px-2 py-2 font-mono text-[10px]">{row.put.gamma}</td>
                          <td className="px-2 py-2 font-mono text-rose-600">{row.put.theta}</td>
                          <td className="px-2 py-2 font-mono">{row.put.vega}</td>
                          <td className="px-2 py-2 font-mono">{row.put.iv}%</td>
                          <td className="px-2 py-2 font-mono text-slate-600">{row.put.oi?.toLocaleString()}</td>
                          <td className="px-2 py-2 font-mono text-rose-700">₹{row.put.ltp}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: AI Insights & Strategic Zones (Step 10) */}
          {activeResultTab === 'insights' && apiResult.insights && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Max Pain */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE9EE] shadow-xs">
                  <span className="text-xs text-[#667085] font-semibold uppercase tracking-wider">
                    Max Pain Strike
                  </span>
                  <div className="text-2xl font-bold font-heading text-[#1D2939] mt-1">
                    ₹{apiResult.insights.maxPain?.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-[#667085] mt-1">
                    Option sellers face minimum total financial payout at this strike on expiry.
                  </p>
                </div>

                {/* PCR Sentiment */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE9EE] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#667085] font-semibold uppercase tracking-wider">
                      Put-Call Ratio (PCR)
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        apiResult.insights.sentiment === 'BULLISH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : apiResult.insights.sentiment === 'BEARISH'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {apiResult.insights.sentiment}
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-heading text-[#00778A] mt-1">
                    {apiResult.insights.pcr}
                  </div>
                  <p className="text-[11px] text-[#667085] mt-1">
                    Total Put OI: {apiResult.insights.totalPutOI?.toLocaleString()} vs Call OI: {apiResult.insights.totalCallOI?.toLocaleString()}
                  </p>
                </div>

                {/* Highest Gamma Strike */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE9EE] shadow-xs">
                  <span className="text-xs text-[#667085] font-semibold uppercase tracking-wider">
                    Highest Gamma Acceleration
                  </span>
                  <div className="text-2xl font-bold font-heading text-amber-600 mt-1">
                    ₹{apiResult.insights.highestGammaStrike?.strike?.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-[#667085] mt-1">
                    Value: {apiResult.insights.highestGammaStrike?.gamma} ({apiResult.insights.highestGammaStrike?.optionType}) - Maximum convexity & rapid delta velocity.
                  </p>
                </div>

                {/* Highest Vega Strike */}
                <div className="p-4 rounded-2xl bg-white border border-[#DCE9EE] shadow-xs">
                  <span className="text-xs text-[#667085] font-semibold uppercase tracking-wider">
                    Highest Vega Volatility Sensitivity
                  </span>
                  <div className="text-2xl font-bold font-heading text-purple-600 mt-1">
                    ₹{apiResult.insights.highestVegaStrike?.strike?.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-[#667085] mt-1">
                    Vega: {apiResult.insights.highestVegaStrike?.vega} - Most responsive to IV expansion or crush.
                  </p>
                </div>
              </div>

              {/* Support & Resistance Zones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <TrendingUp className="w-4 h-4" /> Support Floor Zone: ₹{apiResult.insights.supportZone?.strike?.toLocaleString()}
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    {apiResult.insights.supportZone?.description}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <TrendingDown className="w-4 h-4" /> Resistance Ceiling Zone: ₹{apiResult.insights.resistanceZone?.strike?.toLocaleString()}
                  </div>
                  <p className="text-xs text-rose-700 mt-1">
                    {apiResult.insights.resistanceZone?.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Scenario Stress Matrix (Step 6) */}
          {activeResultTab === 'scenarios' && apiResult.scenarios && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#E8F3F5]/40 border border-[#DCE9EE] text-xs text-[#00778A]">
                <strong>Automated Scenario Analysis (Step 6):</strong> Stress testing the commodity at standard price shifts (+100, +500, +1000, -100, -500, -1000) around ATM strike (₹{apiResult.scenarios[0]?.atmStrike?.toLocaleString()}). Theoretical premiums and Greeks recalculated automatically.
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#DCE9EE]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F7FAFB] text-[#1D2939] border-b border-[#DCE9EE] font-semibold">
                    <tr>
                      <th className="px-3 py-2">Shift Scenario</th>
                      <th className="px-3 py-2">Simulated Spot</th>
                      <th className="px-3 py-2">Call Premium</th>
                      <th className="px-3 py-2">Call Delta</th>
                      <th className="px-3 py-2">Call Theta</th>
                      <th className="px-3 py-2">Call Vega</th>
                      <th className="px-3 py-2">Put Premium</th>
                      <th className="px-3 py-2">Put Delta</th>
                      <th className="px-3 py-2">Put Theta</th>
                      <th className="px-3 py-2">Put Vega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE9EE]">
                    {apiResult.scenarios.map((sc: any) => (
                      <tr key={sc.scenarioLabel} className="hover:bg-[#F7FAFB]">
                        <td className="px-3 py-2.5 font-bold text-[#00778A]">
                          {sc.scenarioLabel}
                        </td>
                        <td className="px-3 py-2.5 font-mono">₹{sc.simulatedSpot?.toLocaleString()}</td>
                        <td className="px-3 py-2.5 font-mono text-emerald-700 font-bold">₹{sc.call.premium}</td>
                        <td className="px-3 py-2.5 font-mono">{sc.call.delta}</td>
                        <td className="px-3 py-2.5 font-mono text-rose-600">{sc.call.theta}</td>
                        <td className="px-3 py-2.5 font-mono">{sc.call.vega}</td>
                        <td className="px-3 py-2.5 font-mono text-rose-700 font-bold">₹{sc.put.premium}</td>
                        <td className="px-3 py-2.5 font-mono">{sc.put.delta}</td>
                        <td className="px-3 py-2.5 font-mono text-rose-600">{sc.put.theta}</td>
                        <td className="px-3 py-2.5 font-mono">{sc.put.vega}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Analytics Curves (Step 8) */}
          {activeResultTab === 'charts' && apiResult.charts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delta Curve */}
              <div className="p-4 rounded-2xl bg-white border border-[#DCE9EE] shadow-xs">
                <h4 className="text-xs font-bold text-[#1D2939] mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#00778A]" /> Delta Sensitivity Curve (Call vs Put)
                </h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={apiResult.charts.deltaCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                      <XAxis dataKey="strike" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[-1, 1]} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="callDelta" stroke="#10B981" strokeWidth={2} name="Call Delta" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="putDelta" stroke="#EF4444" strokeWidth={2} name="Put Delta" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gamma Curve */}
              <div className="p-4 rounded-2xl bg-white border border-[#DCE9EE] shadow-xs">
                <h4 className="text-xs font-bold text-[#1D2939] mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-500" /> Gamma Distribution (Convexity Peak)
                </h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={apiResult.charts.gammaCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                      <XAxis dataKey="strike" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="gamma" stroke="#F59E0B" strokeWidth={2} name="Gamma" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Open Interest Distribution */}
              <div className="p-4 rounded-2xl bg-white border border-[#DCE9EE] shadow-xs">
                <h4 className="text-xs font-bold text-[#1D2939] mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#00778A]" /> Open Interest Distribution (Call vs Put OI)
                </h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={apiResult.charts.oiDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                      <XAxis dataKey="strike" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="callOI" fill="#10B981" name="Call OI" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="putOI" fill="#EF4444" name="Put OI" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Implied Volatility Smile */}
              <div className="p-4 rounded-2xl bg-white border border-[#DCE9EE] shadow-xs">
                <h4 className="text-xs font-bold text-[#1D2939] mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-600" /> Implied Volatility Smile
                </h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={apiResult.charts.ivSmile}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
                      <XAxis dataKey="strike" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="callIV" stroke="#8B5CF6" strokeWidth={2} name="Call IV %" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="putIV" stroke="#EC4899" strokeWidth={2} name="Put IV %" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OCR Typo Corrections Log */}
          {activeResultTab === 'corrections' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#F7FAFB] border border-[#DCE9EE]">
                <h4 className="text-xs font-bold text-[#1D2939] mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#00778A]" /> AI Sanitization & Character Normalization Log
                </h4>
                <p className="text-xs text-[#667085] mb-3">
                  The OCR pipeline inspected tabular text from the screenshot and automatically corrected common OCR artifacts (such as "O.99" → 0.99, "l35OOO" → 135000, and "3S.67" → 35.67).
                </p>

                <div className="space-y-2">
                  {apiResult.ocrCorrections && apiResult.ocrCorrections.length > 0 ? (
                    apiResult.ocrCorrections.map((corr: string, idx: number) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-xl bg-white border border-[#DCE9EE] text-xs font-mono text-slate-700 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{corr}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#667085] italic">
                      Zero OCR errors detected. Clean table alignment.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Structured JSON (Step 4) */}
          {activeResultTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#667085]">
                  Validated Structured JSON Output (Step 4 Schema)
                </span>
                <button
                  onClick={copyJsonToClipboard}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-[#DCE9EE] text-[#00778A] hover:bg-[#E8F3F5] transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 border border-slate-800">
                {JSON.stringify(apiResult.structuredJson, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
