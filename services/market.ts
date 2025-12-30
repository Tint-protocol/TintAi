
export interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  // Added missing properties to support coinglass and binance services
  openInterest?: number;
  openInterestChange24h?: number;
  longShortRatio?: number;
  source?: string;
  lastUpdated: number;
}

export interface MarketState {
  tickers: Record<string, TickerData>;
  activeSymbol: string | null;
}