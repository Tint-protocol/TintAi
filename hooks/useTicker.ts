
import { usePriceStore } from '../store/priceStore';

export const useTicker = (symbol: string) => {
  const ticker = usePriceStore(state => state.tickers[symbol]);
  return ticker || null;
};
