
import React, { useEffect, useRef } from 'react';
import { X, Maximize2, ExternalLink } from 'lucide-react';

interface TradingViewPopupProps {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
}

const TradingViewPopup: React.FC<TradingViewPopupProps> = ({ symbol, isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      
      const config = {
        "autosize": true,
        "symbol": symbol.startsWith('BINANCE:') ? symbol : `BINANCE:${symbol}`,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com",
        "backgroundColor": "rgba(23, 23, 23, 1)",
        "gridColor": "rgba(42, 42, 42, 0.06)",
        "hide_top_toolbar": false,
        "save_image": false,
      };

      script.innerHTML = JSON.stringify(config);
      containerRef.current.appendChild(script);
    }
  }, [isOpen, symbol]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 w-full lg:w-[45%] h-[calc(100%-140px)] z-[90] p-4 pointer-events-none">
      <div className="w-full h-full bg-[#171717] border border-[#333333] rounded-[1.2rem] overflow-hidden flex flex-col pointer-events-auto">
        {/* Header Panel - Clean & Flat */}
        <div className="px-4 py-2 bg-[#1a1a1a] border-b border-[#333333] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-zinc-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live_Terminal: {symbol}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-zinc-600 hover:text-white transition-colors">
              <ExternalLink size={14} />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 bg-[#2a2a2a] hover:bg-[#333333] border border-[#383838] rounded-lg text-zinc-400 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 w-full bg-[#171717] relative">
          <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
        </div>
      </div>
    </div>
  );
};

export default TradingViewPopup;
