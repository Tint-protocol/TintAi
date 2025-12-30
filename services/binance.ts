
/**
 * ============================================================
 * ALADIN AI — BINANCE REALTIME MARKET DATA (WS)
 * Production / Fund-Grade / Resilient
 * ============================================================
 */

import { WSClient } from './wsClient';
import { usePriceStore } from '../store/priceStore';

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';
const MAX_STREAMS = 50;
const RECONNECT_DELAY = 3000;

export class BinanceWS {
  private client: WSClient | null = null;
  private streams = new Set<string>();
  private reconnectTimer: any = null;
  private isManuallyStopped = false;

  /* ---------- START ---------- */

  start() {
    const defaultPairs = [
      'btcusdt',
      'ethusdt',
      'solusdt',
      'bnbusdt',
      'dogeusdt',
      'seiusdt',
      'xrpusdt',
      'adausdt',
      'linkusdt',
      'avaxusdt'
    ];

    defaultPairs.forEach(s => this.streams.add(`${s}@ticker`));
    this.connect();

    usePriceStore.subscribe(
      state => {
        if (!state.activeSymbol) return;
        this.addSymbol(state.activeSymbol);
      }
    );
  }

  /* ---------- CONNECTION ---------- */

  private connect() {
    if (this.client) this.client.close();

    const streamList = Array.from(this.streams).slice(0, MAX_STREAMS);
    const url = `${BINANCE_WS_BASE}/${streamList.join('/')}`;

    this.client = new WSClient(
      url,
      data => this.handleMessage(data),
      () => this.handleClose(),
      err => this.handleError(err)
    );

    this.client.connect();
  }

  /* ---------- MESSAGE HANDLER ---------- */

  private handleMessage(data: any) {
    if (data?.e !== '24hrTicker') return;

    const symbol = data.s?.toUpperCase();
    if (!symbol) return;

    usePriceStore.getState().setTicker(symbol, {
      price: parseFloat(data.c),
      change24h: parseFloat(data.P),
      high24h: parseFloat(data.h),
      low24h: parseFloat(data.l),
      volume24h: parseFloat(data.v),
      lastUpdated: Date.now(),
      source: 'Binance WS'
    });
  }

  /* ---------- STREAM MANAGEMENT ---------- */

  private addSymbol(symbol: string) {
    const stream = `${symbol.toLowerCase()}@ticker`;
    if (this.streams.has(stream)) return;

    if (this.streams.size >= MAX_STREAMS) {
      return;
    }

    this.streams.add(stream);
    this.scheduleReconnect();
  }

  /* ---------- RECONNECT STRATEGY ---------- */

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isManuallyStopped) this.connect();
    }, 800);
  }

  private handleClose() {
    if (this.isManuallyStopped) return;
    setTimeout(() => this.connect(), RECONNECT_DELAY);
  }

  private handleError(err: any) {
    // Avoid [object Object] in logs
    console.warn('[Aladin AI] Binance WS encountered a connection issue.');
  }

  /* ---------- STOP ---------- */

  stop() {
    this.isManuallyStopped = true;
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    this.streams.clear();
  }
}

export const binanceWS = new BinanceWS();
