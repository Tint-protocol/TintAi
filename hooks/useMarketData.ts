
import { usePriceStore } from '../store/priceStore';

export const useMarketData = () => {
  const activeSymbol = usePriceStore(state => state.activeSymbol);
  const ticker = usePriceStore(state => state.tickers[activeSymbol]);

  return {
    symbol: activeSymbol,
    price: ticker?.price || 0,
    change: ticker?.change24h || 0,
    volume: ticker?.volume24h || 0,
    isLive: ticker ? (Date.now() - ticker.lastUpdated < 60000) : false,
    raw: ticker
  };
};
