/**
 * useLiveMarket — fetches live NGX prices from the backend /stocks endpoint.
 *
 * On mount it checks localStorage for a cached result ≤ 24 h old.
 * If stale (or absent), it fetches fresh data from the backend and caches it.
 * Live prices are pushed into the Zustand store so every component that reads
 * `prices[symbol]` gets real-time data without any further wiring.
 *
 * Backend source: TradingView screener API (fetched server-side every 24 h).
 */

import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { stocksApi, type LiveStock } from '../services/api';

const CACHE_KEY = 'kbco_live_prices';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface PriceCache {
  fetchedAt: number;   // epoch ms
  stocks: LiveStock[];
}

function loadCache(): PriceCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: PriceCache = JSON.parse(raw);
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

function saveCache(stocks: LiveStock[]): void {
  try {
    const cache: PriceCache = { fetchedAt: Date.now(), stocks };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota exceeded — ignore */ }
}

export function useLiveMarket(): { lastUpdated: Date | null; isLoading: boolean; refresh: () => void } {
  const updatePrice = useStore(s => s.updatePrice);
  const lastUpdatedRef = useRef<Date | null>(null);
  const isLoadingRef = useRef(true);

  function applyStocks(stocks: LiveStock[]) {
    for (const s of stocks) {
      if (s.price > 0) {
        updatePrice(s.symbol, s.price, s.change ?? 0, s.change_pct ?? 0);
      }
    }
    lastUpdatedRef.current = new Date();
    isLoadingRef.current = false;
  }

  async function fetchAndApply() {
    try {
      const stocks = await stocksApi.list();
      if (stocks.length > 0) {
        saveCache(stocks);
        applyStocks(stocks);
      }
    } catch (e) {
      console.warn('[useLiveMarket] Backend unavailable — using static prices', e);
      isLoadingRef.current = false;
    }
  }

  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      applyStocks(cached.stocks);
      // Still schedule a background refresh if cache is more than 1h old
      const age = Date.now() - cached.fetchedAt;
      if (age > 60 * 60 * 1000) {
        fetchAndApply();
      }
    } else {
      fetchAndApply();
    }

    // Schedule next refresh at exactly 24 h from last fetch
    const timer = setInterval(fetchAndApply, CACHE_TTL_MS);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    isLoadingRef.current = true;
    localStorage.removeItem(CACHE_KEY);
    fetchAndApply();
  }

  return {
    lastUpdated: lastUpdatedRef.current,
    isLoading: isLoadingRef.current,
    refresh,
  };
}
