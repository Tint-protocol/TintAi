
import { create } from 'zustand';
import { MarketMatrix } from '../types';
import { TickerData } from '../services/market';

/**
 * Enhanced PriceStore interface with tickers tracking and set/get actions.
 */
interface PriceStore {
  matrices: Record<string, MarketMatrix>;
  tickers: Record<string, TickerData>;
  activeSymbol: string;
  updateMatrix: (symbol: string, data: Partial<MarketMatrix>) => void;
  setTicker: (symbol: string, data: Partial<TickerData>) => void;
  getTicker: (symbol: string) => TickerData | undefined;
  setActiveSymbol: (symbol: string) => void;
  getMatrix: (symbol: string) => MarketMatrix | undefined;
}

const DEFAULT_MATRIX = (symbol: string): MarketMatrix => ({
  symbol,
  price: 0,
  change24h: 0,
  volume24h: 0,
  lastUpdated: Date.now(),
  sources: { price: 'N/A', derivatives: 'N/A', liquidity: 'N/A' },
  availability: { spot: false, derivatives: false, orderflow: false }
});

/**
 * Added default ticker initialization structure.
 */
const DEFAULT_TICKER = (symbol: string): TickerData => ({
  symbol,
  price: 0,
  change24h: 0,
  high24h: 0,
  low24h: 0,
  volume24h: 0,
  lastUpdated: Date.now(),
});

export const usePriceStore = create<PriceStore>((set, get) => ({
  matrices: {},
  tickers: {},
  activeSymbol: 'BTCUSDT',
  updateMatrix: (symbol, data) => set((state) => {
    const current = state.matrices[symbol] || DEFAULT_MATRIX(symbol);
    return {
      matrices: {
        ...state.matrices,
        [symbol]: { ...current, ...data, lastUpdated: Date.now() }
      }
    };
  }),
  /**
   * Implementation of setTicker to support partial real-time updates from Binance/Coinglass services.
   */
  setTicker: (symbol, data) => set((state) => {
    const current = state.tickers[symbol] || DEFAULT_TICKER(symbol);
    return {
      tickers: {
        ...state.tickers,
        [symbol]: { ...current, ...data }
      }
    };
  }),
  /**
   * Implementation of getTicker for on-demand market context retrieval.
   */
  getTicker: (symbol) => get().tickers[symbol],
  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  getMatrix: (symbol) => get().matrices[symbol],
}));
