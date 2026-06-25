import { useState } from 'react';
import { motion } from 'framer-motion';
import { NGX_STOCKS } from '../data/stocks';
import { useStore } from '../store';
import { formatPrice, formatLargeNumber, getRiskColor, getScoreColor } from '../utils';
import { TrendingUp, TrendingDown, Filter, Star, Search } from 'lucide-react';

export default function Screener() {
  const { prices, addToWatchlist } = useStore();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    sector: 'All',
    risk: 'All',
    minDivYield: 0,
    minKbScore: 0,
    minMarketCap: 0,
    sortBy: 'kbRating' as keyof typeof NGX_STOCKS[0],
    sortDir: 'desc' as 'asc' | 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  const sectors = ['All', ...Array.from(new Set(NGX_STOCKS.map(s => s.sector)))];

  const filtered = NGX_STOCKS.filter(s => {
    if (search && !s.symbol.includes(search.toUpperCase()) && !s.name.toUpperCase().includes(search.toUpperCase())) return false;
    if (filters.sector !== 'All' && s.sector !== filters.sector) return false;
    if (filters.risk !== 'All' && s.riskLevel !== filters.risk) return false;
    if (s.dividendYield < filters.minDivYield) return false;
    if (s.kbRating < filters.minKbScore) return false;
    if (s.marketCap < filters.minMarketCap * 1e9) return false;
    return true;
  }).sort((a, b) => {
    const av = (a as any)[filters.sortBy];
    const bv = (b as any)[filters.sortBy];
    return filters.sortDir === 'desc' ? bv - av : av - bv;
  });

  const handleSort = (col: string) => {
    setFilters(f => ({
      ...f,
      sortBy: col as any,
      sortDir: f.sortBy === col ? (f.sortDir === 'desc' ? 'asc' : 'desc') : 'desc',
    }));
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white">Stock Screener</h2>
        <p className="text-sm text-gray-400 mt-1">Filter and discover NGX stocks by fundamentals, dividends, and risk profile</p>
      </motion.div>

      {/* Search + Filter Toggle */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by symbol or company name..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showFilters ? 'text-black' : 'text-gray-300'}`}
          style={showFilters ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)' } : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
        >
          <Filter size={14} />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 mb-5 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div>
            <label className="text-[10px] text-gray-500 block mb-1.5 uppercase">Sector</label>
            <select value={filters.sector} onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}>
              {sectors.map(s => <option key={s} value={s} style={{ background: '#0D1530' }}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1.5 uppercase">Risk Level</label>
            <select value={filters.risk} onChange={e => setFilters(f => ({ ...f, risk: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}>
              {['All', 'Low', 'Medium', 'High'].map(r => <option key={r} value={r} style={{ background: '#0D1530' }}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1.5 uppercase">Min Div Yield (%)</label>
            <input type="number" min="0" max="20" step="0.5" value={filters.minDivYield}
              onChange={e => setFilters(f => ({ ...f, minDivYield: +e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1.5 uppercase">Min KB Score</label>
            <input type="number" min="0" max="100" step="5" value={filters.minKbScore}
              onChange={e => setFilters(f => ({ ...f, minKbScore: +e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
          </div>
        </motion.div>
      )}

      {/* Results */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-sm font-semibold text-white">{filtered.length} stocks found</span>
          <span className="text-xs text-gray-500">Click column headers to sort</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {[
                  { key: 'symbol', label: 'Stock', align: 'left' },
                  { key: 'price', label: 'Price', align: 'right' },
                  { key: 'changePct', label: 'Change%', align: 'right' },
                  { key: 'marketCap', label: 'Mkt Cap', align: 'right' },
                  { key: 'dividendYield', label: 'Div Yield', align: 'right' },
                  { key: 'peRatio', label: 'P/E', align: 'right' },
                  { key: 'pegRatio', label: 'PEG', align: 'right' },
                  { key: 'riskLevel', label: 'Risk', align: 'center' },
                  { key: 'kbRating', label: 'KB Score', align: 'center' },
                ].map(col => (
                  <th key={col.key} className={`px-3 py-3 cursor-pointer hover:text-white transition-colors text-${col.align}`} onClick={() => handleSort(col.key)}>
                    {col.label} {filters.sortBy === col.key ? (filters.sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                ))}
                <th className="px-3 py-3 text-center">Watch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((stock, i) => {
                const live = prices[stock.symbol];
                const price = live?.price ?? stock.price;
                const pct = live?.changePct ?? stock.changePct;
                const isUp = pct >= 0;
                return (
                  <motion.tr
                    key={stock.symbol}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    className="border-b hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold text-black" style={{ background: '#D4AF37' }}>
                          {stock.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{stock.symbol}</div>
                          <div className="text-[9px] text-gray-500 hidden sm:block truncate" style={{ maxWidth: 100 }}>{stock.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-white">₦{formatPrice(price)}</td>
                    <td className={`px-3 py-3 text-right text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="flex items-center justify-end gap-0.5">
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isUp ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-gray-400">{formatLargeNumber(stock.marketCap)}</td>
                    <td className="px-3 py-3 text-right text-xs text-yellow-400">{stock.dividendYield.toFixed(2)}%</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-300">{stock.peRatio.toFixed(1)}x</td>
                    <td className="px-3 py-3 text-right text-xs font-semibold" style={{ color: stock.pegRatio < 1 ? '#22c55e' : stock.pegRatio < 2 ? '#f59e0b' : '#ef4444' }}>{stock.pegRatio.toFixed(2)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${getRiskColor(stock.riskLevel)}20`, color: getRiskColor(stock.riskLevel) }}>
                        {stock.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold text-black mx-auto" style={{ background: getScoreColor(stock.kbRating) }}>
                        {stock.kbRating}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={e => { e.stopPropagation(); addToWatchlist(stock.symbol); }}
                        className="text-gray-600 hover:text-yellow-400 transition-colors p-1">
                        <Star size={12} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
