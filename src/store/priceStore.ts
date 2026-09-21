import { create } from 'zustand';
import { useGreeksStore } from './useGreeksStore';

export interface PriceComparisonResult {
  livePrice: number;
  screenshotPrice: number;
  difference: number;
  percentageDifference: number;
  isHigher: boolean;
}

export interface PriceState {
  // Core required fields
  currentPrice: number;
  open: number;
  high: number;
  low: number;
  close: number;
  source: string;
  lastUpdated: string;
  isLoading: boolean;

  // Additional metadata & operational state
  commodity: string;
  change: number;
  changePercent: number;
  error: string | null;
  autoRefreshInterval: number; // in seconds (default 30)
  isAutoRefreshEnabled: boolean;
  lastFetchedAt: number | null;
  initialFetchCompleted: boolean;

  // Actions
  fetchLatestPrice: (commodity?: string, isManual?: boolean) => Promise<void>;
  setAutoRefreshInterval: (seconds: number) => void;
  toggleAutoRefresh: (enabled?: boolean) => void;
  setManualPrice: (price: number) => void;
  setIngestedPrice: (priceData: {
    currentPrice: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    commodity?: string;
    source?: string;
  }) => void;
  comparePrice: (screenshotPrice: number) => PriceComparisonResult;
}

const getInitialAutoRefresh = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('commodity_price_autorefresh_enabled');
      if (saved !== null) return saved === 'true';
    } catch {}
  }
  return false; // Closed by default
};

export const usePriceStore = create<PriceState>((set, get) => ({
  // Default institutional baseline values
  currentPrice: 153330,
  open: 153346,
  high: 153346,
  low: 153305,
  close: 153330,
  change: 587,
  changePercent: 0.38,
  source: 'live',
  lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  isLoading: true, // True on boot to display loading skeleton

  commodity: 'Gold Mini',
  error: null,
  autoRefreshInterval: 30, // 30 seconds default
  isAutoRefreshEnabled: getInitialAutoRefresh(),
  lastFetchedAt: null,
  initialFetchCompleted: false,

  fetchLatestPrice: async (commodityName = 'Gold Mini', isManual = false) => {
    try {
      if (!isManual && !get().initialFetchCompleted) {
        set({ isLoading: true, error: null });
      }

      const res = await fetch(`/api/price/latest?commodity=${encodeURIComponent(commodityName)}`);
      
      let data: any = null;
      if (res.ok) {
        const json = await res.json();
        data = json.data || json;
      } else {
        throw new Error(`HTTP ${res.status}: Failed to fetch live price`);
      }

      const currentPrice = Number(data.currentPrice) || 153330;
      const open = Number(data.open) || 153346;
      const high = Number(data.high ?? data.dayHigh) || Math.max(open, currentPrice);
      const low = Number(data.low ?? data.dayLow) || Math.min(open, currentPrice);
      const close = Number(data.close) || currentPrice;
      const change = Number(data.change ?? data.priceChange ?? (currentPrice - open));
      const changePercent = Number(data.changePercent ?? data.percentageChange ?? (open > 0 ? (change / open) * 100 : 0));
      const source = data.source || 'live';
      
      const rawTimestamp = data.timestamp || data.lastUpdated;
      let formattedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      if (rawTimestamp) {
        try {
          const dateObj = new Date(rawTimestamp);
          if (!isNaN(dateObj.getTime())) {
            formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          }
        } catch {
          // Keep current time
        }
      }

      set({
        currentPrice,
        open,
        high,
        low,
        close,
        change,
        changePercent: Number(changePercent.toFixed(2)),
        source,
        lastUpdated: formattedTime,
        commodity: data.commodity || commodityName,
        isLoading: false,
        error: null,
        lastFetchedAt: Date.now(),
        initialFetchCompleted: true
      });

      // Synchronize with Greeks & Option store while respecting Source Priority:
      // 1. Manual Spot Price Input
      // 2. Uploaded Screenshot Price
      // 3. Live Gold Price
      try {
        const greeksStore = useGreeksStore.getState();
        if (greeksStore) {
          if (greeksStore.spotPriceSource === 'Live Market Price' || !greeksStore.calculator.spotPrice) {
            greeksStore.setSpotPrice(currentPrice, 'Live Market Price');
          } else {
            // Update underlying live price metadata in Greeks Store without overriding user's spot price
            useGreeksStore.setState((state) => ({
              price: {
                ...state.price,
                currentPrice: currentPrice,
                goldPrice: currentPrice,
                dayHigh: high,
                dayLow: low,
                priceChange: change,
                changePercent: Number(changePercent.toFixed(2)),
                timestamp: formattedTime
              }
            }));
          }
        }
      } catch (syncErr) {
        console.warn('Sync with useGreeksStore completed with notice:', syncErr);
      }
    } catch (err: any) {
      console.warn('Live API fetch error, falling back to stored baseline:', err.message);
      
      // Fallback: check if we have an existing price, otherwise use baseline
      const fallbackPrice = get().currentPrice || 153330;
      set({
        isLoading: false,
        source: 'fallback',
        error: err.message,
        lastFetchedAt: Date.now(),
        initialFetchCompleted: true
      });

      // Still ensure calculator has valid spot price
      try {
        const greeksStore = useGreeksStore.getState();
        if (greeksStore && (!greeksStore.calculator.spotPrice || greeksStore.calculator.spotPrice <= 0)) {
          greeksStore.setCalculatorInput({ spotPrice: fallbackPrice });
        }
      } catch {}
    }
  },

  setAutoRefreshInterval: (seconds: number) => {
    const sec = Math.max(5, seconds);
    try {
      localStorage.setItem('commodity_price_autorefresh_interval', String(sec));
    } catch {}
    set({ autoRefreshInterval: sec });
  },

  toggleAutoRefresh: (enabled?: boolean) => {
    set((state) => {
      const next = enabled !== undefined ? enabled : !state.isAutoRefreshEnabled;
      try {
        localStorage.setItem('commodity_price_autorefresh_enabled', String(next));
      } catch {}
      return { isAutoRefreshEnabled: next };
    });
  },

  setManualPrice: (price: number) => {
    if (price <= 0 || isNaN(price)) return;
    const formattedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    set((state) => ({
      currentPrice: price,
      close: price,
      high: Math.max(state.high, price),
      low: Math.min(state.low, price),
      change: price - state.open,
      changePercent: state.open > 0 ? Number((((price - state.open) / state.open) * 100).toFixed(2)) : 0,
      source: 'manual',
      lastUpdated: formattedTime,
      isLoading: false
    }));

    try {
      useGreeksStore.getState().setSpotPrice(price, 'Manual Input');
    } catch {}
  },

  setIngestedPrice: (priceData) => {
    const { currentPrice, open, high, low, close, commodity, source } = priceData;
    if (!currentPrice || currentPrice <= 0 || isNaN(currentPrice)) return;
    const formattedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const resolvedOpen = open ?? currentPrice;
    const resolvedHigh = high ?? Math.max(resolvedOpen, currentPrice);
    const resolvedLow = low ?? Math.min(resolvedOpen, currentPrice);
    const resolvedClose = close ?? currentPrice;
    const change = currentPrice - resolvedOpen;
    const changePercent = resolvedOpen > 0 ? Number(((change / resolvedOpen) * 100).toFixed(2)) : 0;

    set({
      currentPrice,
      open: resolvedOpen,
      high: resolvedHigh,
      low: resolvedLow,
      close: resolvedClose,
      change,
      changePercent,
      commodity: commodity || get().commodity || 'Gold Mini',
      source: source || 'screenshot',
      lastUpdated: formattedTime,
      isLoading: false,
      lastFetchedAt: Date.now()
    });

    try {
      useGreeksStore.getState().setSpotPrice(currentPrice, 'Uploaded Screenshot');
    } catch {}
  },

  comparePrice: (screenshotPrice: number): PriceComparisonResult => {
    const live = get().currentPrice;
    const diff = live - screenshotPrice;
    const pct = screenshotPrice > 0 ? (diff / screenshotPrice) * 100 : 0;
    return {
      livePrice: live,
      screenshotPrice,
      difference: diff,
      percentageDifference: Number(pct.toFixed(2)),
      isHigher: diff > 0
    };
  }
}));
