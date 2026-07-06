import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, User, Target } from 'lucide-react';
import { formatLargeNumber } from '../utils';
import { aiApi } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'What are the best dividend stocks on NGX right now?',
  'How should I invest ₦500,000 for 3 years?',
  'What is the outlook for Nigerian banking stocks in 2026?',
  'Compare DANGCEM vs BUACEMENT for long-term investment',
  'How do I build a passive income portfolio with ₦1 million?',
];

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm KB & Co's AI Investment Advisor, powered by advanced AI. I can help you with:\n\n• **Portfolio allocation** based on your risk profile\n• **Stock analysis** for NGX-listed companies\n• **Dividend income** strategies\n• **Market outlook** and sector analysis\n• **Investment planning** for your financial goals\n\nWhat would you like to explore today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [advisor, setAdvisor] = useState({ capital: 500000, risk: 'medium', duration: 3, monthly: 50000 });
  const [showForm, setShowForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages.slice(-9), userMsg].map(m => ({ role: m.role, content: m.content }));
      const { content } = await aiApi.chat(history);
      setMessages(prev => [...prev, { role: 'assistant', content, timestamp: new Date().toISOString() }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed. Please check your network and try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ **AI Unavailable**\n\n${message}\n\n*You can still use the Portfolio Advisor form above for investment suggestions.*`,
        timestamp: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  };

  const generatePortfolioAdvice = () => {
    const riskMap: Record<string, string> = {
      low: 'conservative, focusing on dividend-paying blue-chip stocks with low volatility',
      medium: 'balanced, mixing growth and income stocks across multiple sectors',
      high: 'aggressive, targeting high-growth momentum stocks with strong earnings potential',
    };
    const prompt = `I have ₦${formatLargeNumber(advisor.capital).replace('₦', '')} to invest with a ${advisor.risk} risk tolerance over ${advisor.duration} years. I can add ₦${formatLargeNumber(advisor.monthly).replace('₦', '')} monthly. My strategy should be ${riskMap[advisor.risk]}. Please provide a specific NGX stock portfolio allocation with expected returns, dividend income, and diversification recommendations.`;
    setShowForm(false);
    sendMessage(prompt);
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-white">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        const bold = line.slice(2).replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
        return <li key={i} className="ml-3 text-gray-300" dangerouslySetInnerHTML={{ __html: bold }} />;
      }
      if (line.startsWith('#')) {
        return <h4 key={i} className="font-bold text-yellow-400 text-sm mt-2">{line.replace(/^#+\s*/, '')}</h4>;
      }
      if (line.startsWith('*') && line.endsWith('*')) {
        return <p key={i} className="text-[11px] text-gray-600 italic mt-2">{line.replace(/\*/g, '')}</p>;
      }
      const withBold = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong class="text-white">${m}</strong>`);
      return line ? <p key={i} className="text-gray-300" dangerouslySetInnerHTML={{ __html: withBold }} /> : <br key={i} />;
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain size={20} color="#D4AF37" />
            AI Investment Advisor
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Powered by OpenRouter · NGX Market Expert</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all text-black"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}
        >
          <Target size={14} />
          Portfolio Advisor
        </button>
      </div>

      {/* Portfolio Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-card p-5 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Capital (₦)</label>
              <input type="number" value={advisor.capital} onChange={e => setAdvisor(a => ({ ...a, capital: +e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Risk Level</label>
              <select value={advisor.risk} onChange={e => setAdvisor(a => ({ ...a, risk: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}>
                {['low', 'medium', 'high'].map(r => <option key={r} value={r} style={{ background: '#0D1530' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Duration (years)</label>
              <input type="number" min="1" max="20" value={advisor.duration} onChange={e => setAdvisor(a => ({ ...a, duration: +e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Monthly Add (₦)</label>
              <input type="number" value={advisor.monthly} onChange={e => setAdvisor(a => ({ ...a, monthly: +e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            </div>
            <motion.button onClick={generatePortfolioAdvice} whileTap={{ scale: 0.97 }}
              className="col-span-2 md:col-span-4 py-2.5 rounded-xl text-sm font-bold text-black"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
              Generate AI Portfolio Recommendation
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? '' : 'bg-blue-500/20'}`}
              style={msg.role === 'assistant' ? { background: 'rgba(212,175,55,0.15)' } : {}}>
              {msg.role === 'assistant' ? <Brain size={15} color="#D4AF37" /> : <User size={15} color="#60a5fa" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
              style={{
                background: msg.role === 'user' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                border: msg.role === 'user' ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              <div className="text-sm leading-relaxed space-y-1">
                {formatMessage(msg.content)}
              </div>
              <div className="text-[10px] text-gray-600 mt-2">{new Date(msg.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
              <Brain size={15} color="#D4AF37" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: '#D4AF37' }}
                    animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.8 }} />
                ))}
                <span className="text-xs text-gray-500 ml-1">Analyzing...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {QUICK_PROMPTS.map((p, i) => (
          <button key={i} onClick={() => sendMessage(p)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] text-gray-400 hover:text-white transition-all hover:border-yellow-400/30"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about NGX stocks, portfolio strategy, dividends..."
          className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
        />
        <motion.button
          onClick={() => sendMessage(input)}
          whileTap={{ scale: 0.95 }}
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}
        >
          <Send size={16} color="#000" />
        </motion.button>
      </div>
    </div>
  );
}
