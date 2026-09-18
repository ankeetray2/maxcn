import { useEffect, useState, useRef } from 'react';
import { usePriceStore } from '../store/priceStore';

export function useAutoPriceSync() {
  const {
    fetchLatestPrice,
    autoRefreshInterval,
    isAutoRefreshEnabled,
    lastFetchedAt,
    isLoading
  } = usePriceStore();

  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tickerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial page load auto-fetch
  useEffect(() => {
    fetchLatestPrice('Gold Mini');
  }, [fetchLatestPrice]);

  // 2. Periodic background auto-refresh (Every 30s or configured interval)
  useEffect(() => {
    if (!isAutoRefreshEnabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = (autoRefreshInterval || 30) * 1000;
    timerRef.current = setInterval(() => {
      fetchLatestPrice('Gold Mini', true);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefreshInterval, isAutoRefreshEnabled, fetchLatestPrice]);

  // 3. Time elapsed counter ("Updated X sec ago")
  useEffect(() => {
    const updateElapsed = () => {
      if (!lastFetchedAt) {
        setSecondsAgo(0);
        return;
      }
      const diffSec = Math.floor((Date.now() - lastFetchedAt) / 1000);
      setSecondsAgo(Math.max(0, diffSec));
    };

    updateElapsed();
    tickerRef.current = setInterval(updateElapsed, 1000);

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [lastFetchedAt]);

  const formatTimeAgo = () => {
    if (isLoading && !lastFetchedAt) return 'Updating...';
    if (secondsAgo < 5) return 'Just now';
    if (secondsAgo < 60) return `${secondsAgo} sec ago`;
    const mins = Math.floor(secondsAgo / 60);
    return `${mins} min ago`;
  };

  return {
    secondsAgo,
    formattedTimeAgo: formatTimeAgo()
  };
}
