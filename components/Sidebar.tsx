
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Search, 
  Settings, 
  History, 
  Activity,
  X,
  Loader2,
  ImageIcon
} from 'lucide-react';
import { AnalysisHistoryItem } from '../types';
import { LegalPageType } from './LegalOverlay';
import { usePriceStore } from '../store/priceStore';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  sparkline_in_7d?: { price: number[] };
}

interface SidebarProps {
  onNewChat: () => void;
  onSelectCoin: (symbol: string, id: string) => void;
  analysisHistory: AnalysisHistoryItem[];
  onSelectHistory: (item: AnalysisHistoryItem) => void;
  onOpenLegalPage: (type: LegalPageType) => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const CG_API_KEY = process.env.COINGECKO_API_KEY || "CG-LFxB2gaBq6RyF9EVgCP2vHxe";
const CACHE_KEY = "tintai_market_cache_v2";
const CACHE_TTL = 30 * 60 * 1000;

const FALLBACK_COINS: Coin[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 96420.50, price_change_percentage_24h: 1.25, sparkline_in_7d: { price: [95000, 96200, 95800, 96500, 96420] } },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 2742.10, price_change_percentage_24h: -0.42, sparkline_in_7d: { price: [2800, 2750, 2710, 2730, 2742] } },
];

const Sparkline = ({ data, isPositive }: { data?: number[], isPositive: boolean }) => {
  if (!data || data.length === 0) return <div className="w-[50px] md:w-[65px] h-3 bg-[#2a2a2a] rounded-full" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 65;
  const height = 16;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={isPositive ? '#22c55e' : '#ef4444'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const AssetSkeleton = () => (
  <div className="w-full p-2 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 bg-[#2a2a2a] rounded-full animate-pulse" />
      <div className="flex flex-col gap-1">
        <div className="w-10 h-2 bg-[#2a2a2a] rounded animate-pulse" />
        <div className="w-16 h-1.5 bg-[#2a2a2a] rounded animate-pulse" />
      </div>
    </div>
    <div className="w-14 h-3 bg-[#2a2a2a] rounded animate-pulse" />
  </div>
);

const CoinRow = ({ coin, onSelect, activeFlashes }: { coin: Coin, onSelect: (s: string, id: string) => void, activeFlashes: any }) => {
  const storePrice = usePriceStore(state => state.tickers[`${coin.symbol.toUpperCase()}USDT`]);
  
  const price = storePrice?.price ?? coin.current_price ?? 0;
  const change = storePrice?.change24h ?? coin.price_change_percentage_24h ?? 0;
  const isPositive = change >= 0;
  const flash = activeFlashes[coin.id];

  return (
    <button onClick={() => onSelect(coin.symbol, coin.id)} className="w-full text-left p-2 md:p-2.5 hover:bg-[#2a2a2a] rounded-lg transition-all group flex items-center justify-between border border-transparent hover:border-[#383838]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <img src={coin.image} alt="" className="w-5 h-5 md:w-6 md:h-6 rounded-full shrink-0 object-contain bg-[#1a1a1a] p-1" />
        <div className="flex flex-col min-w-0 overflow-hidden">
          <span className="text-[9px] md:text-[10px] font-black text-white uppercase leading-none truncate">{coin.symbol}</span>
          <span className="text-[7px] md:text-[8px] text-zinc-600 font-bold truncate leading-tight mt-1">{coin.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Sparkline data={coin.sparkline_in_7d?.price} isPositive={isPositive} />
        <div className="text-right flex flex-col min-w-[55px] md:min-w-[68px]">
          <span className={`text-[9px] md:text-[10px] font-mono font-bold text-white leading-none ${flash === 'up' ? 'animate-price-up' : flash === 'down' ? 'animate-price-down' : ''}`}>
            ${price < 1 ? price.toFixed(price < 0.001 ? 6 : 4) : price.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </span>
          <span className={`text-[7px] md:text-[8px] font-mono mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      </div>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  onNewChat, 
  onSelectCoin, 
  analysisHistory, 
  onSelectHistory, 
  onOpenLegalPage,
  isMobileOpen = false,
  onClose
}) => {
  const [allCoins, setAllCoins] = useState<Coin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFlashes, setActiveFlashes] = useState<Record<string, 'up' | 'down'>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { all, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setAllCoins(all);
          setLoading(false);
          setIsInitialLoad(false);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const fetchMarketData = async () => {
      const headers = { 'x-cg-demo-api-key': CG_API_KEY };
      try {
        const pages = [1, 2, 3, 4];
        const fetchPage = async (page: number) => {
           const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=true`, { headers });
           if (!res.ok) throw new Error('API_LIMIT');
           return res.json();
        };

        const results = await Promise.all(pages.map(page => fetchPage(page).catch(() => [])));
        const combined = results.flat();
        
        if (combined.length > 0) {
          setAllCoins(combined);
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            all: combined,
            timestamp: Date.now()
          }));
        } else if (allCoins.length === 0) {
          setAllCoins(FALLBACK_COINS);
        }
      } catch (e) {
        if (allCoins.length === 0) {
          setAllCoins(FALLBACK_COINS);
        }
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const flashInterval = setInterval(() => {
      if (allCoins.length === 0) return;
      const count = Math.floor(Math.random() * 2) + 1;
      const newFlashes: Record<string, 'up' | 'down'> = {};
      for (let i = 0; i < count; i++) {
        const coin = allCoins[Math.floor(Math.random() * allCoins.length)];
        if (coin) newFlashes[coin.id] = Math.random() > 0.5 ? 'up' : 'down';
      }
      setActiveFlashes(prev => ({ ...prev, ...newFlashes }));
      setTimeout(() => {
        setActiveFlashes(prev => {
          const next = { ...prev };
          Object.keys(newFlashes).forEach(id => delete next[id]);
          return next;
        });
      }, 1000);
    }, 4000);
    return () => clearInterval(flashInterval);
  }, [allCoins]);

  const displayCoins = useMemo(() => {
    if (!searchQuery.trim()) return allCoins;
    const q = searchQuery.toLowerCase();
    return allCoins.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [searchQuery, allCoins]);

  const APP_LOGO_URL = "https://gateway.pinata.cloud/ipfs/bafkreiaq3ywo4lt72hvjkr362rxwilr4ajo57uwshzd5jwtqrdocacr2e4";
  const HEADING_STYLE = { fontFamily: "'Arial Black', Gadget, sans-serif", fontWeight: 900 };

  return (
    <div className={`
      w-80 bg-[#171717] 
      flex flex-col h-full font-sans select-none overflow-hidden 
      fixed md:relative transform transition-transform duration-300 z-[100] md:z-50
      ${isInitialLoad ? 'animate-pulse-light' : ''}
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Header Area */}
      <div className="p-4 md:p-6 pb-2 space-y-4 md:space-y-5 shrink-0">
        <div className="flex items-center justify-between md:justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center overflow-hidden shrink-0">
              <img src={APP_LOGO_URL} alt="TintAI Logo" className="w-full h-full object-contain scale-110" />
            </div>
            <div className="flex flex-col items-start overflow-hidden">
              <span className="font-black text-1.8xl md:text-3xl tracking-tighter leading-none translate-y-[3px]">
                <span className="text-white">Tint</span>
                <span className="text-purple-500">AI</span></span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 md:hidden hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2.5 bg-[#2a2a2a] hover:bg-white text-white hover:text-black py-2.5 md:py-3.5 rounded-xl transition-all text-[10px] md:text-[11px] font-black uppercase tracking-widest border border-[#383838] active:scale-[0.98]">
          <PlusCircle size={15} /> <span>New Analysis</span>
        </button>
      </div>

      {/* History Area */}
      <div className="px-4 md:px-5 py-2 flex flex-col min-h-0 flex-shrink-0">
        <div className="text-[11px] md:text-[12px] text-white tracking-[0.08em] flex items-center gap-2 px-1 mb-2 shrink-0" style={HEADING_STYLE}>
          <History size={11} className="text-purple-500" /> History
        </div>
        <div className="max-h-24 md:max-h-32 overflow-y-auto custom-scroll pr-1 space-y-1">
          {analysisHistory.length === 0 ? (
            <div className="px-4 py-2 border border-dashed border-[#333333] rounded-xl text-center">
              <span className="text-[8px] text-zinc-700 uppercase font-bold tracking-[0.2em]">EMPTY</span>
            </div>
          ) : (
            analysisHistory.map((item) => (
              <button key={item.id} onClick={() => onSelectHistory(item)} className="w-full text-left px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333333] rounded-lg transition-all group flex items-center gap-3">
                <Activity size={9} className="text-zinc-600 group-hover:text-white shrink-0" />
                <span className="text-[10px] text-zinc-400 group-hover:text-white truncate font-bold tracking-tight">{item.label.toUpperCase()}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Search Area */}
      <div className="px-4 md:px-5 py-2 shrink-0">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors" size={12} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Market" className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl py-2 md:py-2.5 pl-9 pr-4 text-[9px] md:text-[10px] text-white placeholder:text-zinc-800 focus:outline-none focus:border-[#444444] transition-all font-bold tracking-wide" />
        </div>
      </div>

      {/* Market Data Area - Unified Background */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        <div className="px-4 md:px-5 py-2.5 md:py-3 text-[11px] md:text-[12px] text-white tracking-[0.08em] flex items-center justify-between shrink-0 border-t border-[#333333]" style={HEADING_STYLE}>
          <span className="flex items-center gap-3">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            <span className="flex items-center gap-2">Market Data</span>
          </span>
          {loading && allCoins.length === 0 ? <Loader2 size={10} className="animate-spin text-zinc-700" /> : null}
        </div>
        <div className="flex-1 overflow-y-auto px-2 md:px-3 py-1.5 space-y-0.5 custom-scroll">
          {allCoins.length === 0 && loading ? (
            <div className="space-y-1">{[...Array(12)].map((_, i) => <AssetSkeleton key={i} />)}</div>
          ) : (
            displayCoins.map((coin) => (
              <CoinRow 
                key={coin.id} 
                coin={coin} 
                onSelect={onSelectCoin} 
                activeFlashes={activeFlashes} 
              />
            ))
          )}
        </div>
      </div>

      {/* Footer Area - Unified Background */}
      <div className="h-16 md:h-20 border-t border-[#333333] shrink-0 flex items-center px-4 md:px-5 justify-between gap-2 md:gap-3 relative z-[60]">
        <button 
          className={`p-2.5 md:p-3 transition-all rounded-xl border border-[#333333] active:scale-95 shrink-0 text-zinc-600 hover:text-white bg-[#1a1a1a] hover:border-[#444444]`}
        >
          <Settings size={18} />
        </button>
        <button className="flex-1 bg-white hover:bg-zinc-200 text-black py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-xl active:scale-[0.97] transition-all">
          Connect Wallet
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
