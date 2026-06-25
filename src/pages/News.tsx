import { useState } from 'react';
import { motion } from 'framer-motion';
import { MARKET_NEWS } from '../data/news';
import { formatTimeAgo } from '../utils';
import { Newspaper, TrendingUp, DollarSign, Building, Globe } from 'lucide-react';

const CATEGORIES = ['All', 'market', 'earnings', 'dividend', 'company', 'economy'] as const;
type Cat = typeof CATEGORIES[number];

const CAT_ICONS: Record<string, React.ElementType> = {
  market: TrendingUp,
  earnings: Building,
  dividend: DollarSign,
  company: Building,
  economy: Globe,
};

export default function News() {
  const [activeCategory, setActiveCategory] = useState<Cat>('All');

  const filtered = activeCategory === 'All' ? MARKET_NEWS : MARKET_NEWS.filter(n => n.category === activeCategory);

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Newspaper size={20} color="#D4AF37" />
          Market News & Analysis
        </h2>
        <p className="text-sm text-gray-400 mt-1">Latest NGX news, earnings releases, and market insights</p>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all capitalize ${activeCategory === cat ? 'text-black' : 'text-gray-400 hover:text-white'}`}
            style={activeCategory === cat ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {cat === 'All' ? 'All News' : cat}
          </button>
        ))}
      </div>

      {/* Featured */}
      {filtered[0] && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6 cursor-pointer hover:border-yellow-400/30 transition-all" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${filtered[0].sentiment === 'positive' ? 'bg-green-400/15 text-green-400' : filtered[0].sentiment === 'negative' ? 'bg-red-400/15 text-red-400' : 'bg-gray-600/30 text-gray-400'}`}>
              {filtered[0].category}
            </span>
            <span className="text-xs text-gray-600">FEATURED</span>
            <span className="text-xs text-gray-600">·</span>
            <span className="text-xs text-gray-600">{formatTimeAgo(filtered[0].publishedAt)}</span>
          </div>
          <h2 className="text-lg font-bold text-white leading-snug mb-3">{filtered[0].title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">{filtered[0].summary}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{filtered[0].source}</span>
            {filtered[0].symbols && filtered[0].symbols.length > 0 && (
              <div className="flex gap-1">
                {filtered[0].symbols.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-lg font-medium" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.slice(1).map((item, i) => {
          const Icon = CAT_ICONS[item.category] ?? Newspaper;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card glass-card-hover p-4 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)' }}>
                    <Icon size={13} color="#D4AF37" />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${item.sentiment === 'positive' ? 'bg-green-400/15 text-green-400' : item.sentiment === 'negative' ? 'bg-red-400/15 text-red-400' : 'bg-gray-600/30 text-gray-400'}`}>
                    {item.category}
                  </span>
                </div>
                <span className="text-[10px] text-gray-600">{formatTimeAgo(item.publishedAt)}</span>
              </div>
              <h3 className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{item.summary}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-[10px] text-gray-600">{item.source}</span>
                {item.symbols && item.symbols.slice(0, 2).map(s => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37' }}>{s}</span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
