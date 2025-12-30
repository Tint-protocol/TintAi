
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Menu, 
  Pin,
  X,
  Database,
  Link as LinkIcon,
  ShieldCheck,
  Fingerprint,
  ArrowRightLeft,
  Clock,
  Box,
  Hash,
  User,
  ArrowRight,
  Copy,
  Check,
  ShieldAlert
} from 'lucide-react';
import { Message, InstitutionalMetadata } from '../types';
import { ValidatedAudit, AuditSection } from '../services/audit/validator';
import { InstitutionalActionPanel } from './InstitutionalActionPanel';
import { blockchainService } from '../services/blockchainService';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (content: string, image?: string) => void;
  isAnalyzing: boolean;
  onToggleSidebar?: () => void;
}

const formatValue = (val: any) => {
  if (val === undefined || val === null || val === '∞') return '∞';
  if (typeof val === 'number') {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  }
  return val;
};

const MetricItem = ({ label, value, change, isWide = false }: { label: string; value: any; change?: any; isWide?: boolean }) => (
  <div className={`p-3 bg-[#111111] border border-[#222222] rounded-xl flex flex-col justify-between gap-1 ${isWide ? 'col-span-2' : ''}`}>
    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
    <div className="flex items-baseline justify-between">
      <span className="text-[11px] font-bold text-white truncate">{value}</span>
      {change && (
        <span className={`text-[9px] font-mono ${parseFloat(change) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {parseFloat(change) >= 0 ? '↑' : '↓'}{Math.abs(parseFloat(change))}%
        </span>
      )}
    </div>
  </div>
);

const MetadataView: React.FC<{ metadata: InstitutionalMetadata, score: number }> = ({ metadata, score }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddr = () => {
    if (metadata.contract_address) {
      navigator.clipboard.writeText(metadata.contract_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-[1.2rem] overflow-hidden mb-6 shadow-none max-w-full">
      <div className="px-5 py-3 flex items-center justify-between border-b border-[#333333] bg-[#222222]">
        <div className="flex items-center gap-3">
          <img src={metadata.logo_url} alt="" className="w-8 h-8 rounded-lg bg-[#2a2a2a] p-1.5 border border-[#333333]" />
          <div className="flex flex-col">
            <h2 className="text-[13px] font-black text-purple-500 uppercase tracking-tight">{metadata.asset_name}</h2>
            <span className="text-[8px] font-black text-purple-700 uppercase tracking-widest leading-none">{metadata.symbol} SOVEREIGN_MATRIX</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1 bg-[#1a2e1a] rounded-full text-[8px] font-black text-green-500 uppercase tracking-widest border border-green-900">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Verified_{score}%
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-2">
        <MetricItem label="Market Cap" value={formatValue(metadata.market_cap)} change={metadata.market_cap_change} />
        <MetricItem label="Volume (24h)" value={formatValue(metadata.spot_volume_24h)} change={metadata.volume_change_24h} />
        <MetricItem label="FDV" value={formatValue(metadata.fdv || metadata.market_cap)} />
        <MetricItem label="Vol/Mkt Cap" value={metadata.vol_mkt_cap_ratio ? `${metadata.vol_mkt_cap_ratio}%` : 'N/A'} />
      </div>

      <div className="px-4 py-2 bg-[#171717] border-t border-[#333333] flex justify-between items-center opacity-50">
        <span className="text-[7px] font-mono text-zinc-600 uppercase">Audit_Hash: {metadata.hash?.substring(0, 16)}</span>
        <span className="text-[7px] font-mono text-zinc-600 uppercase">Network: BINANCE_SMART_WS</span>
      </div>
    </div>
  );
};

const AuditSectionView: React.FC<{ section: AuditSection; index: number; color?: string }> = ({ section, index, color = "#22c55e" }) => (
  <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 group">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-black uppercase tracking-tighter text-[13px] md:text-[14px] flex items-center gap-2" style={{ color }}>
        <span className="text-zinc-600 font-mono text-[10px]">#{String(index + 1).padStart(2, '0')}</span>
        {section.title}
      </h3>
      {section.source_lineage && (
        <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 group-hover:text-purple-500 group-hover:border-purple-900 transition-colors">
          Source: {section.source_lineage}
        </span>
      )}
    </div>
    <p className="text-zinc-300 text-[13px] md:text-[14px] leading-[1.6] font-medium pl-5 border-l border-[#333333] ml-1.5">
      {section.content}
    </p>
  </div>
);

const formatAge = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
};

const ForensicHashCard: React.FC<{ data: any }> = ({ data }) => {
  const items = [
    { label: 'Transaction Hash', value: data.hash || 'N/A', icon: <Hash size={12} />, isCode: true },
    { label: 'Action Block', value: data.blockNumber || 'Pending', icon: <Box size={12} /> },
    { label: 'Age', value: formatAge(data.timestamp || Date.now()), icon: <Clock size={12} /> },
    { label: 'Amount', value: `${data.value || '0.00'} UNITS`, icon: <Database size={12} />, isHighlight: true },
  ];

  return (
    <div className="bg-[#111111] border border-[#333333] rounded-[1.2rem] overflow-hidden mb-4">
      <div className="px-5 py-3 bg-[#1a1a1a] border-b border-[#333333] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Fingerprint size={16} className="text-zinc-400" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Forensic_Node_Active</span>
        </div>
      </div>
      <div className="p-4 space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.02] rounded-lg transition-colors group">
            <div className="flex items-center gap-3 text-zinc-500">
              <span className="text-zinc-600">{item.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </div>
            <div className={`text-right ${item.isCode ? 'font-mono' : 'font-bold'}`}>
              <span className={`text-[11px] ${item.isHighlight ? 'text-white font-black' : 'text-zinc-300'}`}>
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AuditRenderer: React.FC<{ audit: ValidatedAudit }> = ({ audit }) => (
  <div className="w-full">
    {audit.auditType === 'TRANSACTION' ? (
      <ForensicHashCard data={audit.metadata} />
    ) : (
      <>
        {audit.status === 'REJECTED' && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-center gap-4">
            <ShieldAlert className="text-red-500" size={24} />
            <div>
              <div className="text-[10px] font-black text-red-500 uppercase tracking-widest">Hallucination_Detected</div>
              <p className="text-xs text-zinc-400">AI output failed numerical consistency check. Rerunning sovereign audit recommended.</p>
            </div>
          </div>
        )}
        <MetadataView metadata={audit.metadata} score={audit.integrity_score || 0} />
        <div className="space-y-1">
          {audit.sections.map((sec, i) => (
            <AuditSectionView key={i} section={sec} index={i} />
          ))}
        </div>
      </>
    )}
  </div>
);

const AssistantMessageRenderer: React.FC<{ content: string }> = ({ content }) => {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch {
      return { text: content };
    }
  }, [content]);

  if (parsed.sections && Array.isArray(parsed.sections)) {
    return <AuditRenderer audit={parsed as ValidatedAudit} />;
  }

  if (parsed.text) {
    return (
      <div 
        className="text-zinc-100 text-[14px] font-medium leading-[1.6]"
        dangerouslySetInnerHTML={{ __html: parsed.text }}
      />
    );
  }

  return <div className="text-zinc-700 text-[12px] font-mono">{content}</div>;
};

const ChatArea: React.FC<ChatAreaProps> = ({ messages, onSendMessage, isAnalyzing, onToggleSidebar }) => {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${Math.max(Math.min(textAreaRef.current.scrollHeight, 250), 40)}px`;
    }
  }, [input]);

  const detection = useMemo(() => {
    const val = input.trim();
    if (!val) return null;
    if (blockchainService.isAddress(val)) return { type: 'ADDRESS', label: 'CONTRACT_TARGET' };
    if (blockchainService.isTransactionHash(val)) return { type: 'HASH', label: 'TX_TARGET' };
    return null;
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isAnalyzing]);

  const submitChat = () => {
    if(!isAnalyzing && (input.trim() || imagePreview)) {
      onSendMessage(input, imagePreview || undefined);
      setInput('');
      setImagePreview(null);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setImagePreview(reader.result as string);
          reader.readAsDataURL(file);
        }
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col relative h-full bg-[#212121] overflow-hidden">
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <button onClick={onToggleSidebar} className="p-2.5 bg-[#2f2f2f] border border-[#333333] rounded-xl text-zinc-400">
          <Menu size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-20 lg:px-40 py-8 md:py-16 space-y-6 scroll-smooth pb-[400px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center pt-20 space-y-8">
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter" style={{ fontFamily: "'Arial Black', Gadget, sans-serif" }}>TINT<span className="text-purple-500">AI</span></h1>
            <p className="text-zinc-600 text-lg font-medium max-w-xl">Sovereign Market Logic. Deterministic Data Audits.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start w-full'}`}>
              <div className={msg.role === 'user' ? 'max-w-[85%] md:max-w-[70%] bg-[#2f2f2f] px-5 py-3 rounded-2xl border border-[#333333]' : 'w-full'}>
                {msg.role === 'user' ? (
                  <div className="space-y-2">
                    {msg.image && <img src={msg.image} className="max-w-full rounded-lg border border-white/10 mb-2" />}
                    <p className="text-zinc-100 text-[14px] font-medium leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <>
                    <AssistantMessageRenderer content={msg.content} />
                    <InstitutionalActionPanel 
                      content={msg.content}
                      suggestions={[]}
                      onSelectSuggestion={(t) => setInput(t)}
                      onAction={() => {}}
                    />
                  </>
                )}
              </div>
            </div>
          ))
        )}
        {isAnalyzing && (
          <div className="flex items-center gap-4">
            <div className="typing-dots"><span></span><span></span><span></span></div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-500 animate-pulse">Running_Sovereign_Audit...</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-80 p-4 md:p-6 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent z-[100]">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {imagePreview && (
              <div className="relative animate-in zoom-in duration-200">
                <img src={imagePreview} className="w-12 h-12 object-cover rounded-lg border border-purple-500 shadow-lg" />
                <button onClick={() => setImagePreview(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 rounded-full shadow-md"><X size={10} /></button>
              </div>
            )}
            {detection && <div className="px-2.5 py-1 bg-[#2a2a2a] border border-[#383838] rounded-full text-[8px] font-black text-zinc-400 uppercase tracking-widest">{detection.label}</div>}
          </div>
          <div className="relative bg-[#2f2f2f] border border-[#383838] rounded-[1.2rem] px-4 py-3 flex items-end gap-3 group focus-within:border-zinc-600 transition-all">
            <input type="file" ref={fileInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} accept="image/*" className="hidden" />
            <textarea
              ref={textAreaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitChat(); } }}
              onPaste={handlePaste}
              placeholder="Query MarketMatrix or Paste Chart (Ctrl+V)..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-white text-[15px] py-1 resize-none max-h-[250px] placeholder:text-zinc-700 font-medium"
            />
            <div className="flex items-center gap-3 shrink-0 mb-1.5">
               <button onClick={() => fileInputRef.current?.click()} className="text-zinc-600 hover:text-white p-1" title="Visual Scan"><ImageIcon size={18}/></button>
               <button onClick={submitChat} className={`p-2.5 rounded-xl transition-all ${ (input.trim() || imagePreview) ? 'bg-white text-black' : 'bg-[#212121] text-zinc-700'}`}><Send size={16}/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
