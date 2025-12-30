
import React, { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Pin, 
  Check, 
  Twitter,
  Instagram,
  Facebook
} from 'lucide-react';

interface InstitutionalActionPanelProps {
  content: string;
  suggestions: string[];
  onSelectSuggestion: (text: string) => void;
  onAction: (type: 'like' | 'dislike' | 'copy' | 'pin') => void;
  isPinned?: boolean;
}

export const InstitutionalActionPanel: React.FC<InstitutionalActionPanelProps> = ({
  content,
  suggestions,
  onSelectSuggestion,
  onAction,
  isPinned = false
}) => {
  const [activeFeedback, setActiveFeedback] = useState<'like' | 'dislike' | null>(null);
  const [copied, setCopied] = useState(false);

  const cleanTextForSharing = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.sections) {
        return parsed.sections.map((s: any) => `${s.title.toUpperCase()}\n${s.content}`).join('\n\n');
      }
      return parsed.text ? parsed.text.replace(/<[^>]*>/g, '') : raw.replace(/<[^>]*>/g, '');
    } catch {
      return raw.replace(/<[^>]*>/g, '');
    }
  };

  const handleCopy = () => {
    const cleaned = cleanTextForSharing(content);
    navigator.clipboard.writeText(cleaned);
    onAction('copy');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: 'like' | 'dislike') => {
    setActiveFeedback(prev => prev === type ? null : type);
    onAction(type);
  };

  const shareText = encodeURIComponent("Check this TintAI Sovereign Audit! #TintAI #TradingIntel");
  const shareUrl = encodeURIComponent(window.location.href);

  return (
    <div className="w-full mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
      
      {/* 1. ACTION BAR */}
      <div className="flex items-center gap-2 border-t border-[#333333] pt-4 flex-wrap">
        
        {/* Feedback Buttons */}
        <div className="flex bg-[#2a2a2a] rounded-lg p-0.5 border border-[#383838]">
          <button 
            onClick={() => handleFeedback('like')}
            className={`p-1.5 transition-all ${activeFeedback === 'like' ? 'text-green-500' : 'text-zinc-600 hover:text-green-400'}`}
          >
            <ThumbsUp size={12} fill={activeFeedback === 'like' ? 'currentColor' : 'none'} />
          </button>
          <div className="w-[1px] bg-[#333333] my-1" />
          <button 
            onClick={() => handleFeedback('dislike')}
            className={`p-1.5 transition-all ${activeFeedback === 'dislike' ? 'text-red-500' : 'text-zinc-600 hover:text-red-400'}`}
          >
            <ThumbsDown size={12} fill={activeFeedback === 'dislike' ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Copy Button */}
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-[#2a2a2a] hover:bg-[#333333] border border-[#383838] rounded-lg text-zinc-500 hover:text-white transition-all group"
        >
          {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
          <span className="text-[9px] font-bold uppercase tracking-widest">{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Social Icons */}
        <div className="flex items-center gap-1.5">
          <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#2a2a2a] hover:bg-black border border-[#383838] rounded-lg text-zinc-500 hover:text-white">
            <Twitter size={12} />
          </a>
          <a href={`https://www.instagram.com/`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-[#2a2a2a] hover:bg-[#E4405F] border border-[#383838] rounded-lg text-zinc-500 hover:text-white">
            <Instagram size={12} />
          </a>
        </div>

        {/* Pin Button */}
        <button 
          onClick={() => onAction('pin')}
          className={`flex items-center gap-2 px-2.5 py-1.5 border rounded-lg transition-all ${
            isPinned 
            ? 'bg-[#2e1a4e] border-purple-500 text-purple-400' 
            : 'bg-[#2a2a2a] hover:bg-[#333333] border-[#383838] text-zinc-500 hover:text-white'
          }`}
        >
          <Pin size={10} className={`${isPinned ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold uppercase tracking-widest">
            {isPinned ? 'Priority Active' : 'Target Priority'}
          </span>
        </button>
      </div>

      {/* 2. SUGGESTIONS */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-0.5 py-1.5 pl-0.5 border-l border-[#333333]">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(suggestion)}
              className="flex items-center gap-3 py-1.5 px-3 hover:bg-[#2a2a2a] rounded-lg text-zinc-500 hover:text-white transition-all text-left"
            >
              <span className="text-[3px] text-zinc-700">●</span>
              <span className="text-[12px] font-medium tracking-tight">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
