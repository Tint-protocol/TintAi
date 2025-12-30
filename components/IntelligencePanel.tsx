import React from 'react';
import { 
  X, 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  BarChart3, 
  Globe, 
  Activity,
  Radar
} from 'lucide-react';

interface IntelligencePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full md:w-96 glass-panel border-l border-white/10 z-[200] animate-in slide-in-from-right duration-500 overflow-hidden flex flex-col">
      {/* Panel Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_#a855f7]" />
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">Sovereign_Intel</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">
          <X size={20} />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-8">
        
        {/* Global Sentiment */}
        <section className="space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <span className="flex items-center gap-2"><Globe size={12} /> Global_Sentiment</span>
            <span className="text-purple-400">Extreme_Greed</span>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[82%] bg-gradient-to-r from-purple-900 to-purple-500 rounded-full" />
          </div>
          <div className="flex justify-between text-[9px] font-bold text-zinc-600">
            <span>FEAR</span>
            <span>GREED</span>
          </div>
        </section>

        {/* Live Signals Feed */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Activity size={12} /> Neural_Signals
          </div>
          <div className="space-y-3">
            {[
              { id: 1, type: 'WHALE', msg: '5,400 BTC moved to cold storage', time: '2m ago', color: 'text-purple-400' },
              { id: 2, type: 'TREND', msg: 'AI Tokens decoupling from BTC', time: '12m ago', color: 'text-blue-400' },
              { id: 3, type: 'LIQUID', msg: '$42M Shorts liquidated on $SOL', time: '24m ago', color: 'text-red-400' },
              { id: 4, type: 'ALPHA', msg: 'Narrative shift: ZK-Rollups rising', time: '1h ago', color: 'text-green-400' },
            ].map(signal => (
              <div key={signal.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-2 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${signal.color}`}>{signal.type}</span>
                  <span className="text-[9px] text-zinc-600 font-mono">{signal.time}</span>
                </div>
                <p className="text-xs text-zinc-300 font-medium leading-relaxed">{signal.msg}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Market Heatmap Visualization */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Radar size={12} /> Liquidity_Map
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div 
                key={i} 
                className="aspect-square rounded-lg animate-pulse" 
                style={{ 
                  backgroundColor: `rgba(168, 85, 247, ${Math.random() * 0.4 + 0.1})`,
                  animationDelay: `${i * 150}ms`
                }} 
              />
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 font-medium text-center">Scanning depth charts for manipulation patterns...</p>
        </section>

        {/* System Health */}
        <section className="pt-6 border-t border-white/5">
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-center gap-4">
            <Zap size={20} className="text-purple-500 shrink-0" />
            <div>
              <div className="text-[10px] font-black text-white uppercase tracking-widest">Sovereign_Active</div>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Nodes: 14 | Sync: 100%</p>
            </div>
          </div>
        </section>

      </div>

      {/* Static Footer */}
      <div className="p-6 bg-black/40 border-t border-white/5">
        <button 
          onClick={() => window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank')}
          className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
        >
          System_Documentation <ShieldAlert size={12} />
        </button>
      </div>
    </div>
  );
};

export default IntelligencePanel;