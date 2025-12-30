
import { usePriceStore } from '../store/priceStore';

/* ============================================================
   TINT AI — DERIVATIVES & SPOT AGGREGATION ENGINE
   - Client safe
   - Multi-exchange fallback
   - Production hardened
   ============================================================ */

type DerivativesPayload = {
  symbol: string;
  price?: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  openInterest?: number;
  openInterestChange24h?: number;
  longShortRatio?: number;
  source: string;
  timestamp: number;
};

type ExchangeFetcher = (symbol: string) => Promise<DerivativesPayload | null>;

export class CoinglassService {
  /* ============================================================
     PRIMARY — EXTERNAL SOURCES (Removed local /api/coinglass)
     ============================================================ */

  private fetchFromBinance: ExchangeFetcher = async (symbol) => {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`
      );
      if (!res.ok) return null;
      const d = await res.json();

      return {
        symbol,
        price: +d.lastPrice,
        change24h: +d.priceChangePercent,
        high24h: +d.highPrice,
        low24h: +d.lowPrice,
        volume24h: +d.volume,
        source: 'Binance',
        timestamp: Date.now()
      };
    } catch (e) {
      return null;
    }
  };

  private fetchFromBybit: ExchangeFetcher = async (symbol) => {
    try {
      const res = await fetch(
        `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}USDT`
      );
      if (!res.ok) return null;
      const d = (await res.json())?.result?.list?.[0];
      if (!d) return null;

      return {
        symbol,
        price: +d.lastPrice,
        change24h: +d.price24hPcnt * 100,
        high24h: +d.highPrice24h,
        low24h: +d.lowPrice24h,
        volume24h: +d.volume24h,
        source: 'Bybit',
        timestamp: Date.now()
      };
    } catch (e) {
      return null;
    }
  };

  private fetchFromOKX: ExchangeFetcher = async (symbol) => {
    try {
      const res = await fetch(
        `https://www.okx.com/api/v5/market/ticker?instId=${symbol}-USDT`
      );
      if (!res.ok) return null;
      const d = (await res.json())?.data?.[0];
      if (!d) return null;

      return {
        symbol,
        price: +d.last,
        change24h: 0,
        high24h: +d.high24h,
        low24h: +d.low24h,
        volume24h: +d.vol24h,
        source: 'OKX',
        timestamp: Date.now()
      };
    } catch (e) {
      return null;
    }
  };

  /* ============================================================
     PUBLIC API
     ============================================================ */

  async fetchTicker(symbol: string): Promise<boolean> {
    const baseSymbol = symbol.replace('USDT', '').toUpperCase();
    const fullSymbol = `${baseSymbol}USDT`;

    const sources: ExchangeFetcher[] = [
      this.fetchFromBinance,
      this.fetchFromBybit,
      this.fetchFromOKX
    ];

    for (const source of sources) {
      try {
        const data = await source(baseSymbol);
        if (!data?.price) continue;

        usePriceStore.getState().setTicker(fullSymbol, {
          price: data.price,
          change24h: data.change24h ?? 0,
          high24h: data.high24h ?? 0,
          low24h: data.low24h ?? 0,
          volume24h: data.volume24h ?? 0,
          openInterest: data.openInterest,
          openInterestChange24h: data.openInterestChange24h,
          longShortRatio: data.longShortRatio,
          lastUpdated: data.timestamp
        });

        console.log(
          `[TintAI] Market sync OK — ${baseSymbol} (${data.source})`
        );
        return true;
      } catch (e) {
        continue;
      }
    }

    console.warn(`[TintAI] All market sources failed for ${baseSymbol}`);
    return false;
  }
}

export const coinglassService = new CoinglassService();
