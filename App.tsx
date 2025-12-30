
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import LegalOverlay, { LegalPageType } from './components/LegalOverlay';
import TradingViewPopup from './components/TradingViewPopup';
import { Message, AnalysisHistoryItem, InteractionMode, PersonaType } from './types';
import { marketOrchestrator } from './services/marketOrchestrator';
import { usePriceStore } from './store/priceStore';
import { chatHandler } from './services/chatHandler';
import { LineChart } from 'lucide-react';

const HISTORY_CACHE_KEY = 'tintai_analysis_history_v1';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>(() => {
    const cached = localStorage.getItem(HISTORY_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  const [activeLegalPage, setActiveLegalPage] = useState<LegalPageType>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const setActiveSymbol = usePriceStore(s => s.setActiveSymbol);
  const activeSymbol = usePriceStore(s => s.activeSymbol);

  useEffect(() => {
    marketOrchestrator.start();
    return () => marketOrchestrator.stop();
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(analysisHistory));
  }, [analysisHistory]);

  const addToHistory = (query: string, label: string) => {
    setAnalysisHistory(prev => {
      const newItem: AnalysisHistoryItem = {
        id: Date.now().toString(),
        label: label.length > 20 ? label.substring(0, 17) + '...' : label,
        query,
        timestamp: new Date()
      };
      const filtered = prev.filter(item => item.label !== newItem.label);
      const updated = [newItem, ...filtered].slice(0, 15);
      return updated;
    });
  };

  const handleSendMessage = async (content: string, image?: string, explicitMode?: InteractionMode, coinId?: string) => {
    setIsMobileSidebarOpen(false);

    const initialMode: InteractionMode = explicitMode || "PERSONAL_COMPANION";
    const initialPersona: PersonaType = initialMode === "MARKET_STRICT" ? "INSTITUTIONAL_SAAS" : "PERSONAL_HUMANOID";

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content || (image ? "Visual Audit Initiation." : "General Inquiry"),
      image,
      timestamp: new Date(),
      mode: initialMode,
      persona: initialPersona
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsAnalyzing(true);

    try {
      const result = await chatHandler.handleMessage(userMsg.content, image, explicitMode, coinId);
      const finalPersona: PersonaType = result.mode === "MARKET_STRICT" ? "INSTITUTIONAL_SAAS" : "PERSONAL_HUMANOID";

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        mode: result.mode,
        persona: finalPersona
      }]);
      
      if (result.mode === "MARKET_STRICT" || result.content.includes('tradingview_symbol')) {
        const currentActive = usePriceStore.getState().activeSymbol;
        const historyLabel = image ? `SCAN: ${currentActive}` : `AUDIT: ${currentActive}`;
        addToHistory(content || `Analyze ${currentActive}`, historyLabel);
      }

    } catch (error: any) {
      console.error("Audit Fault:", error);
      let errorText = "Gagal mengakses cluster data pasar. Silakan coba lagi.";
      
      if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        errorText = "Limit API reached. Please wait a moment.";
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: JSON.stringify({
          text: `<div style='padding:1rem; border:1px solid #ef4444; border-radius:1rem; background:rgba(239,68,68,0.05);'><span style='color:#ef4444;font-weight:800;text-transform:uppercase;font-size:12px;letter-spacing:0.1em;'>SOVEREIGN_SYSTEM_FAULT</span><br/><br/><span style='color:#ffffff; font-size:14px;'>${errorText}</span></div>`
        }),
        timestamp: new Date(),
        mode: "PERSONAL_COMPANION",
        persona: "PERSONAL_HUMANOID"
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#212121] text-white selection:bg-zinc-800 overflow-hidden font-sans">
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black z-[90] md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <Sidebar 
        onNewChat={() => {
          setMessages([]);
          chatHandler.clearHistory();
          setIsMobileSidebarOpen(false);
        }} 
        onSelectCoin={(symbol, id) => {
          const sym = symbol.toUpperCase();
          const finalSym = sym.endsWith('USDT') ? sym : `${sym}USDT`;
          setActiveSymbol(finalSym);
          handleSendMessage(`Perform Sovereign Audit on ${finalSym}`, undefined, "MARKET_STRICT", id);
        }} 
        analysisHistory={analysisHistory} 
        onSelectHistory={(item) => {
          handleSendMessage(item.query);
          setIsMobileSidebarOpen(false);
        }}
        onOpenLegalPage={(type) => {
          setActiveLegalPage(type);
          setIsMobileSidebarOpen(false);
        }}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* TradingView Toggle Button - Refined position and size */}
        <div className="absolute top-2.5 right-2.5 z-[110]">
          <button 
            onClick={() => setIsChartOpen(!isChartOpen)}
            className={`p-2 rounded-lg border transition-all shadow-xl flex items-center justify-center ${isChartOpen ? 'bg-purple-600 border-purple-400 text-white' : 'bg-[#2f2f2f] border-[#383838] text-zinc-400 hover:text-white'}`}
            title="Toggle TradingView Chart"
          >
            <LineChart size={16} />
          </button>
        </div>

        <div className="flex-1 relative flex overflow-hidden">
          <ChatArea 
            messages={messages} 
            onSendMessage={(c, img) => handleSendMessage(c, img)} 
            isAnalyzing={isAnalyzing} 
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          />
          
          <TradingViewPopup 
            symbol={activeSymbol} 
            isOpen={isChartOpen} 
            onClose={() => setIsChartOpen(false)} 
          />
        </div>

        {activeLegalPage && <LegalOverlay type={activeLegalPage} onClose={() => setActiveLegalPage(null)} />}
      </main>
    </div>
  );
};

export default App;
