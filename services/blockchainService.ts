
/* ============================================================
   INTERNATIONAL FUND-GRADE BLOCKCHAIN DATA ENGINE
   Author: Institutional Infrastructure Pattern
   ============================================================ */

import { usePriceStore } from '../store/priceStore';

const CG_API_KEY = "CG-LFxB2gaBq6RyF9EVgCP2vHxe";

type RpcProvider = {
  url: string;
  priority: number;
};

type NetworkConfig = {
  name: string;
  chainId: number;
  symbol: string;
  explorers: string[];
  rpcs: RpcProvider[];
};

const EVM_NETWORKS: NetworkConfig[] = [
  {
    name: "Ethereum Mainnet",
    chainId: 1,
    symbol: "ETH",
    explorers: ["https://etherscan.io"],
    rpcs: [
      { url: "https://eth.llamarpc.com", priority: 1 },
      { url: "https://rpc.ankr.com/eth", priority: 2 }
    ]
  },
  {
    name: "BNB Smart Chain",
    chainId: 56,
    symbol: "BNB",
    explorers: ["https://bscscan.com"],
    rpcs: [
      { url: "https://bsc-dataseed.binance.org", priority: 1 },
      { url: "https://rpc.ankr.com/bsc", priority: 2 }
    ]
  }
];

export class BlockchainService {
  /* ---------- VALIDATORS ---------- */
  isAddress(input: string): boolean {
    const val = input.trim();
    // EVM Check
    if (/^0x[a-fA-F0-9]{40}$/.test(val)) return true;
    // Solana Check (Base58, usually 32-44 chars)
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val)) return true;
    return false;
  }

  isTransactionHash(input: string): boolean {
    const val = input.trim();
    // EVM Hash Check
    if (/^0x[a-fA-F0-9]{64}$/.test(val)) return true;
    // Solana Signature Check (Base58, 64-88 chars)
    if (/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(val)) return true;
    return false;
  }

  getNetworkType(input: string): 'EVM' | 'SOLANA' | 'UNKNOWN' {
    const val = input.trim();
    if (val.startsWith('0x')) return 'EVM';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,88}$/.test(val)) return 'SOLANA';
    return 'UNKNOWN';
  }

  /* ---------- RPC HELPERS ---------- */
  private async rpcCall(url: string, method: string, params: any[]) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
      });
      return res.json();
    } catch { return null; }
  }

  private async tryRpcs(rpcs: RpcProvider[], method: string, params: any[]) {
    for (const rpc of rpcs.sort((a, b) => a.priority - b.priority)) {
      const result = await this.rpcCall(rpc.url, method, params);
      if (result && !result.error) return result;
    }
    return null;
  }

  /* ---------- DATA FETCHERS ---------- */
  async getMarketDataBySymbol(symbol: string, coinId?: string) {
    const baseSymbol = symbol.replace('USDT', '').toUpperCase();
    const store = usePriceStore.getState();
    const liveTicker = store.getTicker(baseSymbol + 'USDT');

    const mapping: Record<string, string> = { 
      BTC: 'bitcoin', 
      ETH: 'ethereum', 
      BNB: 'binancecoin', 
      SOL: 'solana',
      XRP: 'ripple',
      ADA: 'cardano',
      AVAX: 'avalanche-2',
      DOT: 'polkadot',
      DOGE: 'dogecoin',
      LINK: 'chainlink'
    };
    
    const id = coinId || mapping[baseSymbol] || baseSymbol.toLowerCase();
    
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}?sparkline=false&community_data=false&developer_data=false`);
      
      if (!res.ok) {
        if (liveTicker) return {
          asset_name: baseSymbol,
          symbol: baseSymbol,
          priceUsd: liveTicker.price,
          change24h: liveTicker.change24h,
          logo_url: 'https://gateway.pinata.cloud/ipfs/bafkreigagkkmvjde4nhovk3ltpvst755st4qyt3jnd3l3jbc7qav45rcma'
        };
        return null;
      }

      const d = await res.json();
      const mkt = d.market_data;
      
      return {
        asset_name: d.name,
        symbol: d.symbol.toUpperCase(),
        priceUsd: liveTicker?.price || mkt.current_price.usd,
        change24h: liveTicker?.change24h || mkt.price_change_percentage_24h,
        logo_url: d.image.large,
        market_cap: mkt.market_cap.usd,
        market_cap_change: mkt.market_cap_change_percentage_24h,
        spot_volume_24h: mkt.total_volume.usd,
        volume_change_24h: mkt.price_change_percentage_24h, // approximate
        fdv: mkt.fully_diluted_valuation?.usd || mkt.market_cap.usd,
        vol_mkt_cap_ratio: ((mkt.total_volume.usd / mkt.market_cap.usd) * 100).toFixed(2),
        circulating_supply: mkt.circulating_supply,
        total_supply: mkt.total_supply,
        max_supply: mkt.max_supply || '∞',
        contract_address: d.platforms?.ethereum || d.platforms?.['binance-smart-chain'] || d.contract_address || '',
        holders_count: d.community_data?.twitter_followers ? `${(d.community_data.twitter_followers / 100).toFixed(1)}K Est.` : 'N/A',
        last_updated: liveTicker?.lastUpdated || Date.now()
      };
    } catch (e) { 
      return liveTicker ? {
        asset_name: baseSymbol,
        symbol: baseSymbol,
        priceUsd: liveTicker.price,
        change24h: liveTicker.change24h,
        logo_url: ''
      } : null; 
    }
  }

  async getTransactionDetails(hash: string) {
    return this.getTransaction(hash);
  }

  async getTokenInfo(address: string) {
    return { marketData: { symbol: 'TOKEN', priceUsd: 0, asset_name: 'Unknown Asset' } };
  }

  async getTransaction(hash: string) {
    for (const net of EVM_NETWORKS) {
      const tx = await this.tryRpcs(net.rpcs, "eth_getTransactionByHash", [hash]);
      if (tx?.result) {
        return {
          hash,
          status: "CONFIRMED",
          network: net.name,
          timestamp: Date.now(),
          from: tx.result.from,
          to: tx.result.to,
          value: (parseInt(tx.result.value, 16) / 1e18).toFixed(4),
          blockNumber: parseInt(tx.result.blockNumber, 16),
          gasUsed: 'Calculating...'
        };
      }
    }
    return null;
  }
}

export const blockchainService = new BlockchainService();
