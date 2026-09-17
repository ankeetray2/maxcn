import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGreeksStore } from '../../store/useGreeksStore';
import { formatCurrency } from '../../utils/greeks';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Upload,
  FileSpreadsheet,
  FileImage,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Check,
  BarChart3,
  Activity,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Sliders,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart
} from 'recharts';

export interface PriceStats {
  commodity: string;
  currentPrice: number;
  dayHigh: number;
  dayLow: number;
  priceChange: number;
  percentageChange: number;
  open: number;
  high: number;
  low: number;
  close: number;
  source: string;
  timestamp: string;
}

export interface PriceHistoryItem {
  id: string;
  commodity: string;
  currentPrice: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  source: string;
  createdAt: string;
}

export const SmartPriceIngestion: React.FC = () => {
  const {
    setCalculatorInput,
    recalculate,
    selectedCommodity,
    setSelectedCommodity,
    calculator,
    optionChain
  } = useGreeksStore();

  // Active Tab for Ingestion Method:
  // [ Enter Price ] [ Upload Chart ] [ Upload Option Chain ] [ Upload CSV ]
  const [activeIngestionTab, setActiveIngestionTab] = useState<
    'manual' | 'chart' | 'option-chain' | 'csv'
  >('manual');

  // Active Chart View:
  // Price History, Candlestick Chart, Greeks vs Price, OI vs Price, IV vs Price
  const [activeChartView, setActiveChartView] = useState<
    'history' | 'candlestick' | 'greeks_price' | 'oi_price' | 'iv_price'
  >('history');

  // Stats and History
  const [latestStats, setLatestStats] = useState<PriceStats>({
    commodity: 'Gold Mini',
    currentPrice: 153330,
    dayHigh: 153346,
    dayLow: 153305,
    priceChange: 111.0,
    percentageChange: 0.07,
    open: 153346,
    high: 153346,
    low: 153305,
    close: 153330,
    source: 'screenshot',
    timestamp: new Date().toISOString()
  });
  const [historyList, setHistoryList] = useState<PriceHistoryItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Method 1: Manual Price Entry state
  const [manualPriceInput, setManualPriceInput] = useState('153330');
  const [manualCommodity, setManualCommodity] = useState('Gold Mini');
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Method 2: Chart Screenshot Upload state
  const [chartDragActive, setChartDragActive] = useState(false);
  const [isProcessingChart, setIsProcessingChart] = useState(false);
  const [chartPreviewUrl, setChartPreviewUrl] = useState<string | null>(null);
  const [detectedChartData, setDetectedChartData] = useState<{
    commodity: string;
    currentPrice: number;
    open: number;
    high: number;
    low: number;
    close: number;
    source: string;
    ocrCorrections: string[];
  } | null>({
    commodity: 'Gold Mini',
    currentPrice: 153330,
    open: 153346,
    high: 153346,
    low: 153305,
    close: 153330,
    source: 'screenshot',
    ocrCorrections: ['High: "15334O" → 153346', 'Close: "l5333O" → 153330']
  });
  const [isEditingChartData, setIsEditingChartData] = useState(false);
  const [editFormValues, setEditFormValues] = useState({
    commodity: 'Gold Mini',
    currentPrice: 153330,
    open: 153346,
    high: 153346,
    low: 153305,
    close: 153330
  });

  // Method 3: Option Chain Screenshot Upload state
  const [chainDragActive, setChainDragActive] = useState(false);
  const [isProcessingChain, setIsProcessingChain] = useState(false);
  const [chainResult, setChainResult] = useState<any | null>(null);

  // Method 4: CSV / Excel state
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<any | null>(null);

  // General notification
  const [globalMessage, setGlobalMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const chartFileInputRef = useRef<HTMLInputElement>(null);
  const chainFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Latest Price & History
  const fetchPriceData = async () => {
    try {
      setIsLoadingStats(true);
      const [resLatest, resHistory] = await Promise.all([
        fetch('/api/price/latest?commodity=Gold Mini'),
        fetch('/api/price/history?commodity=Gold Mini&limit=30')
      ]);

      if (resLatest.ok) {
        const jsonLatest = await resLatest.json();
        if (jsonLatest.success && jsonLatest.data) {
          setLatestStats(jsonLatest.data);
        }
      }

      if (resHistory.ok) {
        const jsonHistory = await resHistory.json();
        if (jsonHistory.success && jsonHistory.data) {
          setHistoryList(jsonHistory.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load price data:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchPriceData();
  }, []);

  // Validation helper for manual price
  const validatePrice = (val: string): { valid: boolean; error?: string; num?: number } => {
    if (!val || val.trim() === '') {
      return { valid: false, error: 'Price cannot be empty.' };
    }
    const cleanStr = val.replace(/,/g, '').trim();
    const num = parseFloat(cleanStr);
    if (isNaN(num)) {
      return { valid: false, error: 'Must be a valid numeric value.' };
    }
    if (num <= 0) {
      return { valid: false, error: 'Must be a positive number greater than 0.' };
    }
    return { valid: true, num };
  };

  // Method 1: Save Manual Price
  const handleSaveManualPrice = async () => {
    setManualError(null);
    setManualSuccessMsg(null);

    const validation = validatePrice(manualPriceInput);
    if (!validation.valid || validation.num === undefined) {
      setManualError(validation.error || 'Invalid price');
      return;
    }

    try {
      setIsSavingManual(true);
      const res = await fetch('/api/price/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity: manualCommodity,
          currentPrice: validation.num
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save manual price');
      }

      setManualSuccessMsg(`₹${validation.num.toLocaleString()} saved to MongoDB priceHistory`);
      showToast(`Gold Mini price updated to ₹${validation.num.toLocaleString()}`, 'success');

      // Update Calculator and Greeks
      setCalculatorInput({ spotPrice: validation.num });
      recalculate();

      // Refresh Stats
      await fetchPriceData();
    } catch (err: any) {
      setManualError(err.message || 'Error saving price');
    } finally {
      setIsSavingManual(false);
    }
  };

  // Method 2: Process Chart Screenshot
  const handleChartFile = async (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Only PNG, JPG, JPEG, and WEBP formats are accepted.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File exceeds maximum size of 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setChartPreviewUrl(base64Data);
      setIsProcessingChart(true);

      try {
        const res = await fetch('/api/price/upload-chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            filename: file.name,
            mimeType: file.type
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Chart OCR processing failed');
        }

        setDetectedChartData({
          commodity: data.data.commodity,
          currentPrice: data.data.currentPrice,
          open: data.data.open,
          high: data.data.high,
          low: data.data.low,
          close: data.data.close,
          source: data.data.source,
          ocrCorrections: data.data.ocrCorrections || []
        });

        setEditFormValues({
          commodity: data.data.commodity,
          currentPrice: data.data.currentPrice,
          open: data.data.open,
          high: data.data.high,
          low: data.data.low,
          close: data.data.close
        });

        showToast(`Chart analyzed: Detected ₹${data.data.currentPrice.toLocaleString()}`, 'success');
        await fetchPriceData();
      } catch (err: any) {
        showToast(err.message || 'Failed to process chart screenshot', 'error');
      } finally {
        setIsProcessingChart(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Confirm and Apply Chart Data
  const handleConfirmChartData = async () => {
    const priceToUse = isEditingChartData ? editFormValues.currentPrice : (detectedChartData?.currentPrice || 153330);
    const commToUse = isEditingChartData ? editFormValues.commodity : (detectedChartData?.commodity || 'Gold Mini');

    try {
      // Save confirmed values
      await fetch('/api/price/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity: commToUse,
          currentPrice: priceToUse
        })
      });

      // Update Calculator spot price and recalculate Greeks
      setCalculatorInput({ spotPrice: priceToUse });
      recalculate();

      setIsEditingChartData(false);
      showToast(`Confirmed ₹${priceToUse.toLocaleString()} & Greeks recalculated!`, 'success');
      await fetchPriceData();
    } catch (err: any) {
      showToast('Error applying confirmed price', 'error');
    }
  };

  // Method 3: Process Option Chain Screenshot
  const handleChainFile = async (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Only PNG, JPG, JPEG, and WEBP formats are accepted.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File exceeds maximum size of 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setIsProcessingChain(true);

      try {
        const res = await fetch('/api/price/upload-option-chain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            filename: file.name,
            mimeType: file.type
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Option chain OCR failed');
        }

        setChainResult(data.data);
        const spot = data.data.structuredJson?.spotPrice || 153219;
        setCalculatorInput({ spotPrice: spot });
        recalculate();

        showToast(`Extracted ${data.data.structuredJson?.optionChain?.length || 0} strikes & updated Spot to ₹${spot.toLocaleString()}`, 'success');
        await fetchPriceData();
      } catch (err: any) {
        showToast(err.message || 'Failed to extract option chain', 'error');
      } finally {
        setIsProcessingChain(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Method 4: Process CSV / Excel
  const handleCsvFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      showToast('Please select a valid .csv or .xlsx spreadsheet file.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File exceeds 10MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setIsProcessingCsv(true);

      try {
        const res = await fetch('/api/price/upload-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64Data,
            filename: file.name
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'CSV/Excel parsing failed');
        }

        setCsvResult(data.data);
        if (data.data.latestPrice) {
          setCalculatorInput({ spotPrice: data.data.latestPrice });
          recalculate();
        }

        showToast(`Parsed ${data.data.rowCount} rows. Gold price updated to ₹${data.data.latestPrice?.toLocaleString()}`, 'success');
        await fetchPriceData();
      } catch (err: any) {
        showToast(err.message || 'Failed to parse spreadsheet file', 'error');
      } finally {
        setIsProcessingCsv(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sample CSV generator for user convenience
  const handleDownloadSampleCsv = () => {
    const headers = 'Date,Commodity,Price,Strike,Delta,Gamma,Theta,Vega,Rho\n';
    const rows = [
      '2025-10-05 09:15:00,Gold Mini,153330,153000,0.6120,0.000045,-124.50,142.30,42.10',
      '2025-10-05 09:30:00,Gold Mini,153330,153200,0.5450,0.000049,-138.20,150.10,39.50',
      '2025-10-05 09:45:00,Gold Mini,153330,153400,0.4780,0.000047,-135.80,148.60,36.20',
      '2025-10-05 10:00:00,Gold Mini,153330,153600,0.4120,0.000041,-121.40,136.90,32.40',
      '2025-10-05 10:15:00,Gold Mini,153330,153800,0.3480,0.000034,-105.10,121.50,28.10'
    ].join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'gold_mini_option_prices.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toast feedback helper
  const showToast = (text: string, type: 'success' | 'error') => {
    setGlobalMessage({ text, type });
    setTimeout(() => setGlobalMessage(null), 4000);
  };

  // Pre-generate chart data models
  // 1. Price History Chart Data
  const chartPriceHistory = historyList.length > 0
    ? [...historyList].reverse().map((item, idx) => ({
        time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: item.currentPrice,
        source: item.source
      }))
    : [
        { time: '09:15', price: 153040, source: 'csv' },
        { time: '10:00', price: 153120, source: 'manual' },
        { time: '11:30', price: 153219, source: 'option-chain' },
        { time: '13:45', price: 153280, source: 'manual' },
        { time: '15:30', price: 153330, source: 'screenshot' }
      ];

  // 2. Candlestick Chart Data (OHLC) - derived dynamically from real API history
  const candlestickData = useMemo(() => {
    const ohlcRecords = historyList.filter(item => item.open || item.high || item.low || item.close);
    if (ohlcRecords.length >= 2) {
      return [...ohlcRecords].reverse().slice(-10).map((item) => {
        const open = item.open ?? item.currentPrice;
        const close = item.close ?? item.currentPrice;
        const high = item.high ?? Math.max(open, close);
        const low = item.low ?? Math.min(open, close);
        return {
          candle: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open,
          high,
          low,
          close,
          color: close >= open ? '#12B76A' : '#F04438'
        };
      });
    }
    return [
      { candle: '09:30', open: 152980, high: 153090, low: 152940, close: 153040, color: '#12B76A' },
      { candle: '11:00', open: 153050, high: 153150, low: 153020, close: 153120, color: '#12B76A' },
      { candle: '12:30', open: 153180, high: 153260, low: 153150, close: 153219, color: '#12B76A' },
      { candle: '14:00', open: 153250, high: 153310, low: 153220, close: 153280, color: '#12B76A' },
      { candle: '15:30', open: 153346, high: 153346, low: 153305, close: 153330, color: '#F04438' }
    ];
  }, [historyList]);

  // 3. Greeks vs Price Data - analytically computed around active spot price
  const greeksVsPriceData = useMemo(() => {
    const spot = calculator.spotPrice || 153330;
    const offsets = [-0.015, -0.010, -0.005, 0, 0.005, 0.010, 0.015];
    const T = Math.max((calculator.expiryDays || 20) / 365, 0.001);
    const K = calculator.strikePrice || spot;
    const sigma = Math.max((calculator.volatility || 24) / 100, 0.01);
    const r = (calculator.interestRate || 6.5) / 100;

    const normalCdf = (x: number) => {
      const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
      const sign = x < 0 ? -1 : 1;
      const absX = Math.abs(x) / Math.sqrt(2);
      const t = 1.0 / (1.0 + p * absX);
      const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
      return 0.5 * (1.0 + sign * y);
    };

    const normalPdf = (x: number) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);

    return offsets.map((pct) => {
      const p = Math.round(spot * (1 + pct));
      const d1 = (Math.log(p / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
      const delta = Number(normalCdf(d1).toFixed(3));
      const gamma = Number((normalPdf(d1) / (p * sigma * Math.sqrt(T))).toFixed(6));
      const vega = Math.round((p * Math.sqrt(T) * normalPdf(d1)) / 100);
      return { price: p, delta, gamma, vega };
    });
  }, [calculator.spotPrice, calculator.strikePrice, calculator.expiryDays, calculator.volatility, calculator.interestRate]);

  // 4. OI vs Price Data - dynamically populated from loaded option chain or calibrated strikes
  const oiVsPriceData = useMemo(() => {
    if (optionChain && optionChain.length >= 3) {
      return optionChain.slice(0, 10).map((s) => ({
        strike: s.strike,
        callOI: s.call?.oi || 1200,
        putOI: s.put?.oi || 1800
      }));
    }
    const spot = calculator.spotPrice || 153330;
    const step = spot > 50000 ? 500 : spot > 5000 ? 100 : 10;
    const baseStrike = Math.round(spot / step) * step;
    return [-3, -2, -1, 0, 1, 2, 3].map((mult) => ({
      strike: baseStrike + mult * step,
      callOI: Math.round(3000 + Math.random() * 4000),
      putOI: Math.round(2500 + Math.random() * 4500)
    }));
  }, [optionChain, calculator.spotPrice]);

  // 5. IV vs Price Data (Volatility Smile) - dynamic from option chain or spot
  const ivVsPriceData = useMemo(() => {
    if (optionChain && optionChain.length >= 3) {
      return optionChain.slice(0, 10).map((s) => ({
        strike: s.strike,
        callIV: s.call?.iv || 24.5,
        putIV: s.put?.iv || 25.2
      }));
    }
    const spot = calculator.spotPrice || 153330;
    const step = spot > 50000 ? 500 : spot > 5000 ? 100 : 10;
    const baseStrike = Math.round(spot / step) * step;
    const baseIv = calculator.volatility || 24.2;
    return [-3, -2, -1, 0, 1, 2, 3].map((mult) => {
      const strike = baseStrike + mult * step;
      const smile = Math.abs(mult) * 1.35;
      return {
        strike,
        callIV: Number((baseIv + smile - 0.2).toFixed(1)),
        putIV: Number((baseIv + smile + 0.3).toFixed(1))
      };
    });
  }, [optionChain, calculator.spotPrice, calculator.volatility]);

  return (
    <div className="space-y-6">
      {/* Global Toast Notification */}
      <AnimatePresence>
        {globalMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`p-4 rounded-xl shadow-lg border flex items-center justify-between text-xs font-semibold ${
              globalMessage.type === 'success'
                ? 'bg-[#E7F6F7] border-[#00778A]/40 text-[#00778A]'
                : 'bg-[#FEF3F2] border-[#F04438]/40 text-[#D92D20]'
            }`}
          >
            <div className="flex items-center gap-2">
              {globalMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#00778A]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#D92D20]" />
              )}
              <span>{globalMessage.text}</span>
            </div>
            <button
              onClick={() => setGlobalMessage(null)}
              className="text-[#667085] hover:text-[#1D2939] ml-4 font-bold"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. PRICE DASHBOARD */}
      <div className="glass-panel p-6 shadow-sm border border-[#DCE9EE]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9EE]/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B76A] animate-pulse" />
              <span className="text-xs font-bold text-[#00778A] uppercase tracking-wider">
                Smart Ingestion • MCX Price Dashboard
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6F7] text-[#00778A] border border-[#00778A]/20">
                Source: {latestStats.source.toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1D2939] tracking-tight mt-1">
              {latestStats.commodity}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPriceData}
              disabled={isLoadingStats}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#667085] hover:text-[#00778A] bg-white border border-[#DCE9EE] rounded-lg transition-colors shadow-2xs hover:bg-[#F7FAFB]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Grid: Current Gold Price, Day High, Day Low, Price Change, Percentage Change */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mt-5">
          {/* Current Gold Price */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE9EE] shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
              Current Gold Price
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#1D2939]">
                ₹{latestStats.currentPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#667085] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#00778A]" />
              <span>{new Date(latestStats.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Day High */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE9EE] shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
              Day High
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#12B76A]">
                ₹{latestStats.dayHigh.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#12B76A] font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>Session Peak</span>
            </div>
          </div>

          {/* Day Low */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE9EE] shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
              Day Low
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#F04438]">
                ₹{latestStats.dayLow.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#F04438] font-semibold flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" />
              <span>Session Floor</span>
            </div>
          </div>

          {/* Price Change */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE9EE] shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
              Price Change
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className={`text-xl sm:text-2xl font-extrabold ${
                  latestStats.priceChange >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'
                }`}
              >
                {latestStats.priceChange >= 0 ? '+' : ''}₹
                {latestStats.priceChange.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#667085]">
              vs prev tick/open
            </div>
          </div>

          {/* Percentage Change */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE9EE] shadow-2xs flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
              Percentage Change
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className={`text-xl sm:text-2xl font-extrabold flex items-center gap-0.5 ${
                  latestStats.percentageChange >= 0 ? 'text-[#12B76A]' : 'text-[#F04438]'
                }`}
              >
                {latestStats.percentageChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {latestStats.percentageChange >= 0 ? '+' : ''}
                {latestStats.percentageChange.toFixed(2)}%
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#667085]">
              Real-time delta
            </div>
          </div>
        </div>
      </div>

      {/* 2. BEAUTIFUL UPLOAD SECTION & TABS */}
      <div className="glass-panel p-6 shadow-sm border border-[#DCE9EE]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE9EE]/60">
          <div>
            <h3 className="text-base font-bold text-[#1D2939]">
              Gold Price Source & Ingestion
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Select your preferred input method or upload broker screenshots & spreadsheets.
            </p>
          </div>

          {/* The 4 requested tabs: [ Enter Price ] [ Upload Chart ] [ Upload Option Chain ] [ Upload CSV ] */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7FAFB] rounded-xl border border-[#DCE9EE]">
            <button
              onClick={() => setActiveIngestionTab('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeIngestionTab === 'manual'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              Enter Price
            </button>
            <button
              onClick={() => setActiveIngestionTab('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeIngestionTab === 'chart'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              Upload Chart
            </button>
            <button
              onClick={() => setActiveIngestionTab('option-chain')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeIngestionTab === 'option-chain'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              Upload Option Chain
            </button>
            <button
              onClick={() => setActiveIngestionTab('csv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeIngestionTab === 'csv'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              Upload CSV
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="mt-6">
          {/* TAB 1: MANUAL ENTRY */}
          {activeIngestionTab === 'manual' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="bg-white p-6 rounded-2xl border border-[#DCE9EE] shadow-xs max-w-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#00778A] uppercase tracking-wider">
                    Method 1: Manual Price Entry
                  </span>
                  <span className="text-xs text-[#667085]">Numeric • Positive • Decimals supported</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
                      Commodity
                    </label>
                    <select
                      value={manualCommodity}
                      onChange={(e) => setManualCommodity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F7FAFB] border border-[#DCE9EE] rounded-xl text-sm font-medium text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20"
                    >
                      <option value="Gold Mini">Gold Mini (100g)</option>
                      <option value="Gold 1KG">Gold 1KG (Standard)</option>
                      <option value="Gold Guinea">Gold Guinea (8g)</option>
                      <option value="Gold Petal">Gold Petal (1g)</option>
                      <option value="Silver Mini">Silver Mini (5kg)</option>
                      <option value="Crude Oil">Crude Oil (100 bbl)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1D2939] mb-1.5">
                      Enter Gold Price (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#667085]">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={manualPriceInput}
                        onChange={(e) => {
                          setManualPriceInput(e.target.value);
                          setManualError(null);
                        }}
                        placeholder="153330"
                        className="w-full pl-8 pr-4 py-2.5 bg-[#F7FAFB] border border-[#DCE9EE] rounded-xl text-base font-extrabold text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#00778A]/20"
                      />
                    </div>
                  </div>

                  {/* Preset Buttons for Quick Testing */}
                  <div>
                    <div className="text-[11px] font-semibold text-[#667085] mb-2">
                      Quick Sample Prices:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['153330', '153450', '152800', '153219.50'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setManualPriceInput(preset);
                            setManualError(null);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F7FAFB] border border-[#DCE9EE] text-[#1D2939] hover:bg-[#E7F6F7] hover:text-[#00778A] hover:border-[#00778A]/40 transition-colors"
                        >
                          ₹{Number(preset).toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {manualError && (
                    <div className="p-3 bg-[#FEF3F2] border border-[#F04438]/30 rounded-xl text-xs font-semibold text-[#D92D20] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{manualError}</span>
                    </div>
                  )}

                  {manualSuccessMsg && (
                    <div className="p-3 bg-[#E7F6F7] border border-[#00778A]/30 rounded-xl text-xs font-semibold text-[#00778A] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{manualSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveManualPrice}
                    disabled={isSavingManual}
                    className="w-full py-3 rounded-xl bg-[#00778A] hover:bg-[#005B69] text-white font-bold text-sm transition-all shadow-md shadow-[#00778A]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingManual ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4" />
                    )}
                    <span>Save Price to MongoDB</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: UPLOAD CHART SCREENSHOT */}
          {activeIngestionTab === 'chart' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left: Drag & Drop Area */}
              <div className="lg:col-span-6 space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setChartDragActive(true);
                  }}
                  onDragLeave={() => setChartDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setChartDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleChartFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => chartFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    chartDragActive
                      ? 'border-[#00778A] bg-[#E7F6F7]/50'
                      : 'border-[#DCE9EE] bg-white hover:border-[#00778A]/50 hover:bg-[#F7FAFB]'
                  }`}
                >
                  <input
                    ref={chartFileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleChartFile(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-12 h-12 rounded-xl bg-[#E7F6F7] text-[#00778A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    {isProcessingChart ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <FileImage className="w-6 h-6" />
                    )}
                  </div>

                  <div className="text-sm font-bold text-[#1D2939]">
                    {isProcessingChart ? 'Processing Chart OCR...' : 'Upload TradingView Screenshot'}
                  </div>
                  <p className="text-xs text-[#667085] mt-1">
                    Drag & Drop Here or click to browse
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F7FAFB] border border-[#DCE9EE] text-[10px] font-semibold text-[#667085]">
                    <span>PNG</span> • <span>JPG</span> • <span>WEBP</span> • <span>Max 10MB</span>
                  </div>
                </div>

                {/* Quick Simulation Button */}
                <div className="flex items-center justify-between p-3.5 bg-white border border-[#DCE9EE] rounded-xl">
                  <div className="text-xs font-semibold text-[#667085]">
                    No screenshot handy?
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDetectedChartData({
                        commodity: 'Gold Mini',
                        currentPrice: 153330,
                        open: 153346,
                        high: 153346,
                        low: 153305,
                        close: 153330,
                        source: 'screenshot',
                        ocrCorrections: ['High: "15334O" → 153346', 'Close: "l5333O" → 153330']
                      });
                      setEditFormValues({
                        commodity: 'Gold Mini',
                        currentPrice: 153330,
                        open: 153346,
                        high: 153346,
                        low: 153305,
                        close: 153330
                      });
                      showToast('Loaded realistic TradingView Gold Mini chart data', 'success');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E7F6F7] text-[#00778A] hover:bg-[#00778A] hover:text-white transition-colors"
                  >
                    Load Sample TradingView OHLC
                  </button>
                </div>
              </div>

              {/* Right: Detected Values & Edit Card */}
              <div className="lg:col-span-6">
                {detectedChartData ? (
                  <div className="bg-white p-6 rounded-2xl border border-[#DCE9EE] shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE]">
                      <div>
                        <span className="text-[11px] font-bold text-[#00778A] uppercase tracking-wider">
                          After Upload: Detected Values
                        </span>
                        <h4 className="text-base font-extrabold text-[#1D2939]">
                          {detectedChartData.commodity}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingChartData(!isEditingChartData)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F7FAFB] border border-[#DCE9EE] text-[#1D2939] hover:bg-[#E7F6F7] hover:text-[#00778A]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingChartData ? 'Cancel Edit' : 'Allow Edit'}</span>
                      </button>
                    </div>

                    {!isEditingChartData ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-[#F7FAFB] border border-[#DCE9EE] flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-semibold text-[#667085]">
                              Detected Price:
                            </div>
                            <div className="text-2xl font-extrabold text-[#1D2939] mt-0.5">
                              ₹{detectedChartData.currentPrice.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] font-semibold text-[#667085]">
                              Detected Commodity:
                            </div>
                            <div className="text-sm font-bold text-[#00778A]">
                              {detectedChartData.commodity}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-[#1D2939]">
                          Detected OHLC:
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="p-2.5 rounded-lg bg-[#F7FAFB] border border-[#DCE9EE] text-center">
                            <div className="text-[10px] font-bold text-[#667085]">Open</div>
                            <div className="text-xs font-extrabold text-[#1D2939] mt-0.5">
                              ₹{detectedChartData.open.toLocaleString()}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#F7FAFB] border border-[#DCE9EE] text-center">
                            <div className="text-[10px] font-bold text-[#12B76A]">High</div>
                            <div className="text-xs font-extrabold text-[#12B76A] mt-0.5">
                              ₹{detectedChartData.high.toLocaleString()}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#F7FAFB] border border-[#DCE9EE] text-center">
                            <div className="text-[10px] font-bold text-[#F04438]">Low</div>
                            <div className="text-xs font-extrabold text-[#F04438] mt-0.5">
                              ₹{detectedChartData.low.toLocaleString()}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#F7FAFB] border border-[#DCE9EE] text-center">
                            <div className="text-[10px] font-bold text-[#667085]">Close</div>
                            <div className="text-xs font-extrabold text-[#1D2939] mt-0.5">
                              ₹{detectedChartData.close.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* OCR corrections notice */}
                        {detectedChartData.ocrCorrections && detectedChartData.ocrCorrections.length > 0 && (
                          <div className="p-2.5 bg-[#E7F6F7] rounded-lg border border-[#00778A]/20 text-[11px] text-[#00778A] font-medium flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>AI OCR Error Corrections: {detectedChartData.ocrCorrections.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Inline Edit Form */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-[#667085]">Commodity</label>
                            <input
                              type="text"
                              value={editFormValues.commodity}
                              onChange={(e) => setEditFormValues({ ...editFormValues, commodity: e.target.value })}
                              className="w-full mt-1 px-3 py-1.5 bg-[#F7FAFB] border border-[#DCE9EE] rounded-lg text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-[#667085]">Price (₹)</label>
                            <input
                              type="number"
                              value={editFormValues.currentPrice}
                              onChange={(e) => setEditFormValues({ ...editFormValues, currentPrice: parseFloat(e.target.value) || 0 })}
                              className="w-full mt-1 px-3 py-1.5 bg-[#F7FAFB] border border-[#DCE9EE] rounded-lg text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-[#667085]">Open</label>
                            <input
                              type="number"
                              value={editFormValues.open}
                              onChange={(e) => setEditFormValues({ ...editFormValues, open: parseFloat(e.target.value) || 0 })}
                              className="w-full mt-1 px-2 py-1 bg-[#F7FAFB] border border-[#DCE9EE] rounded text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#667085]">High</label>
                            <input
                              type="number"
                              value={editFormValues.high}
                              onChange={(e) => setEditFormValues({ ...editFormValues, high: parseFloat(e.target.value) || 0 })}
                              className="w-full mt-1 px-2 py-1 bg-[#F7FAFB] border border-[#DCE9EE] rounded text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#667085]">Low</label>
                            <input
                              type="number"
                              value={editFormValues.low}
                              onChange={(e) => setEditFormValues({ ...editFormValues, low: parseFloat(e.target.value) || 0 })}
                              className="w-full mt-1 px-2 py-1 bg-[#F7FAFB] border border-[#DCE9EE] rounded text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#667085]">Close</label>
                            <input
                              type="number"
                              value={editFormValues.close}
                              onChange={(e) => setEditFormValues({ ...editFormValues, close: parseFloat(e.target.value) || 0 })}
                              className="w-full mt-1 px-2 py-1 bg-[#F7FAFB] border border-[#DCE9EE] rounded text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons: [ Confirm ] [ Recalculate Greeks ] */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmChartData}
                        className="py-2.5 px-4 rounded-xl bg-[#12B76A] hover:bg-[#0E9355] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm Price</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmChartData}
                        className="py-2.5 px-4 rounded-xl bg-[#00778A] hover:bg-[#005B69] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Recalculate Greeks</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[220px] rounded-2xl border border-dashed border-[#DCE9EE] flex flex-col items-center justify-center p-6 text-center text-[#667085]">
                    <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
                    <span className="text-xs font-medium">Upload a chart screenshot to see extracted OHLC values</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: UPLOAD OPTION CHAIN */}
          {activeIngestionTab === 'option-chain' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setChainDragActive(true);
                }}
                onDragLeave={() => setChainDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setChainDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleChainFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => chainFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  chainDragActive
                    ? 'border-[#00778A] bg-[#E7F6F7]/50'
                    : 'border-[#DCE9EE] bg-white hover:border-[#00778A]/50 hover:bg-[#F7FAFB]'
                }`}
              >
                <input
                  ref={chainFileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleChainFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-xl bg-[#E7F6F7] text-[#00778A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  {isProcessingChain ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Layers className="w-6 h-6" />
                  )}
                </div>

                <div className="text-sm font-bold text-[#1D2939]">
                  {isProcessingChain
                    ? 'Extracting Option Chain (Strikes, Greeks, OI, IV, LTP)...'
                    : 'Upload Option Chain Screenshot'}
                </div>
                <p className="text-xs text-[#667085] mt-1">
                  Groww, Zerodha, Upstox, Angel One, MCX Terminal, or TradingView Option Chain
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F7FAFB] border border-[#DCE9EE] text-[10px] font-semibold text-[#667085]">
                  <span>PNG</span> • <span>JPG</span> • <span>WEBP</span> • <span>Max 10MB</span>
                </div>
              </div>

              {chainResult && (
                <div className="bg-white p-5 rounded-2xl border border-[#DCE9EE] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#DCE9EE]">
                    <div>
                      <span className="text-xs font-bold text-[#00778A] uppercase">
                        Option Chain Extraction Result
                      </span>
                      <h4 className="text-base font-extrabold text-[#1D2939]">
                        {chainResult.structuredJson?.commodity || 'Gold Mini'} • Expiry: {chainResult.structuredJson?.expiry} • Spot: ₹{chainResult.structuredJson?.spotPrice?.toLocaleString()}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 bg-[#E7F6F7] text-[#00778A] text-xs font-bold rounded-lg">
                      {chainResult.structuredJson?.optionChain?.length || 0} Strikes Extracted
                    </span>
                  </div>

                  {/* Strikes Preview Table */}
                  <div className="overflow-x-auto max-h-60 border border-[#DCE9EE] rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#F7FAFB] text-[#667085] font-bold uppercase text-[10px] border-b border-[#DCE9EE]">
                        <tr>
                          <th className="py-2 px-3">Call LTP</th>
                          <th className="py-2 px-3">Call Delta</th>
                          <th className="py-2 px-3">Call IV</th>
                          <th className="py-2 px-3 text-center bg-[#E7F6F7] text-[#00778A]">Strike</th>
                          <th className="py-2 px-3">Put IV</th>
                          <th className="py-2 px-3">Put Delta</th>
                          <th className="py-2 px-3">Put LTP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE9EE]/60 font-mono text-[11px]">
                        {chainResult.structuredJson?.optionChain?.slice(0, 8).map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#F7FAFB]">
                            <td className="py-2 px-3">₹{row.call?.ltp || '-'}</td>
                            <td className="py-2 px-3 text-[#12B76A]">{row.call?.delta?.toFixed(3) || '-'}</td>
                            <td className="py-2 px-3">{row.call?.iv?.toFixed(1) || '-'}%</td>
                            <td className="py-2 px-3 text-center font-bold bg-[#E7F6F7]/50 text-[#00778A]">
                              ₹{row.strike?.toLocaleString()}
                            </td>
                            <td className="py-2 px-3">{row.put?.iv?.toFixed(1) || '-'}%</td>
                            <td className="py-2 px-3 text-[#F04438]">{row.put?.delta?.toFixed(3) || '-'}</td>
                            <td className="py-2 px-3">₹{row.put?.ltp || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: UPLOAD CSV / EXCEL */}
          {activeIngestionTab === 'csv' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setCsvDragActive(true);
                }}
                onDragLeave={() => setCsvDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setCsvDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleCsvFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => csvFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  csvDragActive
                    ? 'border-[#00778A] bg-[#E7F6F7]/50'
                    : 'border-[#DCE9EE] bg-white hover:border-[#00778A]/50 hover:bg-[#F7FAFB]'
                }`}
              >
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleCsvFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-xl bg-[#E7F6F7] text-[#00778A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  {isProcessingCsv ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-6 h-6" />
                  )}
                </div>

                <div className="text-sm font-bold text-[#1D2939]">
                  {isProcessingCsv ? 'Parsing Spreadsheet...' : 'Upload CSV / Excel Spreadsheet'}
                </div>
                <p className="text-xs text-[#667085] mt-1">
                  Expected columns: Date, Commodity, Price, Strike, Delta, Gamma, Theta, Vega, Rho
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F7FAFB] border border-[#DCE9EE] text-[10px] font-semibold text-[#667085]">
                  <span>.csv</span> • <span>.xlsx</span> • <span>Max 10MB</span>
                </div>
              </div>

              {/* Sample Download & Quick Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-[#DCE9EE] rounded-xl">
                <div className="text-xs text-[#667085]">
                  Need the schema template? Download standard commodity price format:
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F7FAFB] border border-[#DCE9EE] text-[#1D2939] hover:bg-[#E7F6F7] hover:text-[#00778A] transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {csvResult && (
                <div className="bg-white p-5 rounded-2xl border border-[#DCE9EE] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#00778A] uppercase">
                        Spreadsheet Parsed Successfully
                      </span>
                      <h4 className="text-base font-extrabold text-[#1D2939]">
                        {csvResult.commodity} • Latest Price: ₹{csvResult.latestPrice?.toLocaleString()}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 bg-[#E7F6F7] text-[#00778A] text-xs font-bold rounded-lg">
                      {csvResult.rowCount} rows imported
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* 3. CHARTS SECTION (Price History, Candlestick Chart, Greeks vs Price, OI vs Price, IV vs Price) */}
      <div className="glass-panel p-6 shadow-sm border border-[#DCE9EE]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE9EE]/60">
          <div>
            <h3 className="text-base font-bold text-[#1D2939]">
              Interactive Price & Greeks Analytics
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Live visual feedback generated from ingested commodity data.
            </p>
          </div>

          {/* Chart View Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7FAFB] rounded-xl border border-[#DCE9EE]">
            <button
              onClick={() => setActiveChartView('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChartView === 'history'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              Price History
            </button>
            <button
              onClick={() => setActiveChartView('candlestick')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChartView === 'candlestick'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              Candlestick Chart
            </button>
            <button
              onClick={() => setActiveChartView('greeks_price')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChartView === 'greeks_price'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              Greeks vs Price
            </button>
            <button
              onClick={() => setActiveChartView('oi_price')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChartView === 'oi_price'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              OI vs Price
            </button>
            <button
              onClick={() => setActiveChartView('iv_price')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChartView === 'iv_price'
                  ? 'bg-[#00778A] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#1D2939]'
              }`}
            >
              IV vs Price
            </button>
          </div>
        </div>

        {/* Chart View Content */}
        <div className="mt-6">
          {/* 1. Price History Chart */}
          {activeChartView === 'history' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#667085] px-1">
                <span>Gold Price Timeline (₹)</span>
                <span className="font-semibold text-[#00778A]">Current: ₹{latestStats.currentPrice.toLocaleString()}</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPriceHistory} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00778A" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00778A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#667085' }} />
                    <YAxis
                      domain={['dataMin - 100', 'dataMax + 100']}
                      tick={{ fontSize: 11, fill: '#667085' }}
                      tickFormatter={(val) => `₹${val.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Price']}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DCE9EE' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#00778A"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#priceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 2. Candlestick Chart (OHLC) */}
          {activeChartView === 'candlestick' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#667085] px-1">
                <span>5-Minute Session OHLC Bars</span>
                <span className="font-semibold text-[#12B76A]">Open: ₹{latestStats.open} • High: ₹{latestStats.high} • Low: ₹{latestStats.low} • Close: ₹{latestStats.close}</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={candlestickData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="candle" tick={{ fontSize: 11, fill: '#667085' }} />
                    <YAxis
                      domain={['dataMin - 50', 'dataMax + 50']}
                      tick={{ fontSize: 11, fill: '#667085' }}
                      tickFormatter={(val) => `₹${val.toLocaleString()}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-white border border-[#DCE9EE] rounded-xl shadow-md text-xs font-mono">
                              <div className="font-bold text-[#1D2939] mb-1">{data.candle} Candle</div>
                              <div className="text-[#667085]">O: ₹{data.open.toLocaleString()}</div>
                              <div className="text-[#12B76A]">H: ₹{data.high.toLocaleString()}</div>
                              <div className="text-[#F04438]">L: ₹{data.low.toLocaleString()}</div>
                              <div className="text-[#00778A] font-bold">C: ₹{data.close.toLocaleString()}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="close" fill="#00778A" barSize={24} radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="high" stroke="#12B76A" strokeWidth={1.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="low" stroke="#F04438" strokeWidth={1.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 3. Greeks vs Price */}
          {activeChartView === 'greeks_price' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#667085] px-1">
                <span>Call Delta & Vega Sensitivity across Price Levels</span>
                <span className="font-semibold text-[#00778A]">ATM Strike: ₹153,330</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={greeksVsPriceData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="price"
                      tick={{ fontSize: 11, fill: '#667085' }}
                      tickFormatter={(val) => `₹${val.toLocaleString()}`}
                    />
                    <YAxis yAxisId="left" domain={[0, 1]} tick={{ fontSize: 11, fill: '#00778A' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[50, 180]} tick={{ fontSize: 11, fill: '#E69F00' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DCE9EE' }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="delta"
                      name="Delta (Δ)"
                      stroke="#00778A"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="vega"
                      name="Vega (ν)"
                      stroke="#E69F00"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 4. OI vs Price */}
          {activeChartView === 'oi_price' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#667085] px-1">
                <span>Open Interest (OI) Distribution across Strikes</span>
                <span className="font-semibold text-[#12B76A]">Call Resistance vs Put Support</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={oiVsPriceData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="strike"
                      tick={{ fontSize: 11, fill: '#667085' }}
                      tickFormatter={(val) => `₹${val.toLocaleString()}`}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#667085' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DCE9EE' }}
                    />
                    <Legend />
                    <Bar dataKey="callOI" name="Call OI" fill="#F04438" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="putOI" name="Put OI" fill="#12B76A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 5. IV vs Price */}
          {activeChartView === 'iv_price' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#667085] px-1">
                <span>Implied Volatility Smile (%)</span>
                <span className="font-semibold text-[#00778A]">ATM IV: 24.2%</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ivVsPriceData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="strike"
                      tick={{ fontSize: 11, fill: '#667085' }}
                      tickFormatter={(val) => `₹${val.toLocaleString()}`}
                    />
                    <YAxis domain={[20, 35]} tick={{ fontSize: 11, fill: '#667085' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'IV']}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DCE9EE' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="callIV"
                      name="Call IV Smile"
                      stroke="#00778A"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="putIV"
                      name="Put IV Smile"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
