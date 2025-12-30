
import React from 'react';
import { X, Shield, Scale, AlertTriangle, HelpCircle, ArrowRight, FileText, Cpu, Zap, Network } from 'lucide-react';

export type LegalPageType = 'privacy' | 'terms' | 'risk' | 'help' | 'documentation' | null;

interface LegalOverlayProps {
  type: LegalPageType;
  onClose: () => void;
}

const LegalOverlay: React.FC<LegalOverlayProps> = ({ type, onClose }) => {
  if (!type) return null;

  const contentMap = {
    privacy: {
      title: 'Privacy Protocol',
      icon: <Shield className="text-purple-500" size={32} />,
      sections: [
        { h: 'Data Sovereignty', p: 'TintAI operates on a need-to-know basis. Chat logs are encrypted and processed locally where possible. We do not sell your trading strategies or personal identifiers.' },
        { h: 'Wallet Connectivity', p: 'Connecting a wallet only grants read-only access for portfolio analysis. TintAI will never ask for your private keys or seed phrases.' },
        { h: 'Third-Party nodes', p: 'Requests are routed through sovereign nodes. While we use Gemini for intelligence, prompts are anonymized to protect user identity.' }
      ]
    },
    terms: {
      title: 'Terms of Use',
      icon: <Scale className="text-blue-500" size={32} />,
      sections: [
        { h: 'Usage License', p: 'TintAI is provided for personal, non-commercial trading intelligence. Automated scraping or reverse engineering of the Sovereign Engine is prohibited.' },
        { h: 'AI Limitations', p: 'Users acknowledge that AI-generated signals are probabilistic, not deterministic. The system may "hallucinate" market data during extreme volatility.' },
        { h: 'Account Responsibility', p: 'You are responsible for any actions taken based on TintAI analysis. TintDAO is not liable for technical glitches or API outages.' }
      ]
    },
    risk: {
      title: 'Risk Disclosure',
      icon: <AlertTriangle className="text-red-500" size={32} />,
      sections: [
        { h: 'Financial Volatility', p: 'Cryptocurrency trading involves high risk. Prices can drop to zero instantly. Do not trade with money you cannot afford to lose.' },
        { h: 'Algorithm Risk', p: 'Trading algorithms and AI signals are tools, not guarantees. Past performance of a chart pattern does not indicate future results.' },
        { h: 'Leverage Warning', p: 'Using TintAI signals for leveraged trading significantly increases the risk of total liquidation. Proceed with extreme caution.' }
      ]
    },
    help: {
      title: 'Help Center',
      icon: <HelpCircle className="text-green-500" size={32} />,
      sections: [
        { h: 'How to scan charts?', p: 'Click the image icon in the input bar and upload a screenshot of your chart. TintAI will identify patterns, RSI levels, and key zones.' },
        { h: 'Contract Audit', p: 'Paste a 0x contract address directly into the chat. The system will trigger the Sovereign Audit Protocol to check security and liquidity.' },
        { h: 'Custom Indicators', p: 'You can ask TintAI to calculate Fibonacci levels or identify specific candlestick formations like "Bullish Engulfing" or "Pin Bars".' }
      ]
    },
    documentation: {
      title: 'System Documentation',
      icon: <FileText className="text-purple-500" size={32} />,
      sections: [
        { h: 'Sovereign Intelligence Engine', p: 'TintAI operates on a high-performance intelligence core designed for consistency, discipline, and institutional-grade reasoning. Every response is governed by strict logical constraints to ensure analytical integrity and decision transparency.' },
        { h: 'Live Market Intelligence Fabric', p: 'TintAI continuously synchronizes with multiple real-time and on-chain data sources to maintain accurate market context and situational awareness, even under volatile or degraded network conditions.' },
        { h: 'Comprehensive Market Audit Framework', p: 'Formal analyses are generated through a multi-layered audit framework that evaluates market structure, risk dynamics, momentum behavior, and institutional positioning to produce structured, decision-ready intelligence.' },
        { h: 'Integrity & Consistency Assurance', p: 'All analytical outputs undergo internal integrity verification to ensure alignment between displayed insights and the underlying market data at the moment of execution.' }
      ]
    }
  };

  const content = contentMap[type];

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col animate-in fade-in duration-300 overflow-y-auto custom-scroll">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto w-full px-8 py-20 relative z-10">
        <button 
          onClick={onClose}
          className="fixed top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
        >
          <X size={24} />
        </button>

        <header className="flex items-center gap-6 mb-16 animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
            {content.icon}
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter" style={{ fontFamily: "'Arial Black', Gadget, sans-serif" }}>{content.title}</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">TintAI Sovereign Protocol v8.8.8</p>
          </div>
        </header>

        <div className="grid md:grid-cols-1 gap-8">
          {content.sections.map((section, idx) => (
            <div 
              key={idx} 
              className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:border-white/10 transition-all group animate-in slide-in-from-bottom-4"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3 mb-4" style={{ fontFamily: "'Arial Black', Gadget, sans-serif" }}>
                <span className="text-purple-500 font-mono text-sm">0{idx + 1}</span>
                {section.h}
              </h2>
              <p className="text-zinc-400 leading-relaxed font-medium">
                {section.p}
              </p>
            </div>
          ))}
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            © 2025 TintDAO Sovereign Ecosystem
          </div>
          <button onClick={onClose} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-purple-400 transition-colors">
            Return to Terminal <ArrowRight size={12} />
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LegalOverlay;
