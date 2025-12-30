
import { WSClient } from './wsClient';
import { usePriceStore } from '../store/priceStore';

export class MarketDataOrchestrator {
  private clients: Record<string, WSClient> = {};
  private activeSymbol: string = 'BTCUSDT';

  start() {
    this.connectBinance(); // Spot
    this.connectBybit();   // Derivatives
    
    usePriceStore.subscribe(state => {
      if (state.activeSymbol !== this.activeSymbol) {
        this.activeSymbol = state.activeSymbol;
        this.resubscribe();
      }
    });
  }

  private connectBinance() {
    const url = `wss://stream.binance.com:9443/ws/${this.activeSymbol.toLowerCase()}@ticker`;
    this.clients.binance = new WSClient(url, (data) => {
      if (data.e === '24hrTicker') {
        usePriceStore.getState().updateMatrix(data.s, {
          price: parseFloat(data.c),
          change24h: parseFloat(data.P),
          volume24h: parseFloat(data.v),
          sources: { ...usePriceStore.getState().matrices[data.s]?.sources, price: 'Binance' },
          availability: { ...usePriceStore.getState().matrices[data.s]?.availability, spot: true }
        });
      }
    });
    this.clients.binance.connect();
  }

  private connectBybit() {
    const url = `wss://stream.bybit.com/v5/public/linear`;
    this.clients.bybit = new WSClient(url, (data) => {
      if (data.topic?.includes('ticker')) {
        const d = data.data;
        usePriceStore.getState().updateMatrix(this.activeSymbol, {
          openInterest: parseFloat(d.openInterest || '0'),
          fundingRate: parseFloat(d.fundingRate || '0'),
          sources: { ...usePriceStore.getState().matrices[this.activeSymbol]?.sources, derivatives: 'Bybit' },
          availability: { ...usePriceStore.getState().matrices[this.activeSymbol]?.availability, derivatives: true }
        });
      }
    });
    this.clients.bybit.connect();
    
    // Subscribe to specific instrument
    setTimeout(() => {
      this.clients.bybit.send({ op: 'subscribe', args: [`tickers.${this.activeSymbol}`] });
    }, 1000);
  }

  private resubscribe() {
    // Logic to update topics without full reconnect if supported, or cycle connections
    this.connectBinance();
    this.connectBybit();
  }

  stop() {
    Object.values(this.clients).forEach(c => c.close());
  }
}

export const marketOrchestrator = new MarketDataOrchestrator();
