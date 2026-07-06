import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from 'recharts';
import { NGX_STOCKS } from '../data/stocks';
import { useStore } from '../store';
import { formatPrice, formatLargeNumber, getRiskColor, getScoreColor } from '../utils';
import type { Stock } from '../types';
import StockLogo from '../components/StockLogo';
import {
  TrendingUp, TrendingDown, Star, X, Brain,
  Building2, Globe, DollarSign, Target, Plus
} from 'lucide-react';

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
          <circle cx="26" cy="26" r="22" stroke={color} strokeWidth="4" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{score}</div>
      </div>
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}

function StockDetail({ stock, onClose }: { stock: Stock; onClose: () => void; onNavigate?: (s: string) => void }) {
  const { prices, addToWatchlist, isInWatchlist, addHolding, activePortfolioId, addNotification } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'news' | 'technicals'>('overview');
  const [finTab, setFinTab] = useState<'overview' | 'statements' | 'statistics' | 'dividends' | 'earnings' | 'revenue'>('overview');
  const liveData = prices[stock.symbol];
  const currentPrice = liveData?.price ?? stock.price;
  const changePct = liveData?.changePct ?? stock.changePct;
  const isUp = changePct >= 0;
  const inWatchlist = isInWatchlist(stock.symbol);

  const growthPct = ((currentPrice - stock.priceHistory[0].price) / stock.priceHistory[0].price) * 100;

  const handleAddToPortfolio = () => {
    if (activePortfolioId) {
      addHolding(activePortfolioId, {
        symbol: stock.symbol,
        shares: 100,
        buyPrice: currentPrice,
        buyDate: new Date().toISOString(),
      });
      addNotification({
        type: 'portfolio',
        title: 'Stock Added to Portfolio',
        message: `100 shares of ${stock.symbol} added at ₦${formatPrice(currentPrice)}`,
        symbol: stock.symbol,
      });
    }
  };

  const finData = stock.financials.years.map((yr, i) => ({
    year: yr,
    revenue: stock.financials.revenue[i],
    income: stock.financials.netIncome[i],
    eps: stock.financials.eps[i],
  }));

  const TABS = ['overview', 'financials', 'news', 'technicals'] as const;
  const FIN_TABS = ['overview', 'statements', 'statistics', 'dividends', 'earnings', 'revenue'] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl flex flex-col"
        style={{ background: '#0A0F1E', border: '1px solid rgba(212,175,55,0.2)' }}
      >
        {/* Stock Header */}
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)', background: '#0D1530' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
                {stock.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{stock.symbol}</h2>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{stock.sector}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{stock.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { addToWatchlist(stock.symbol); }}
                className={`p-2 rounded-xl transition-colors ${inWatchlist ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
              >
                <Star size={15} fill={inWatchlist ? 'currentColor' : 'none'} />
              </button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div>
              <div className="text-3xl font-bold text-white">₦{formatPrice(currentPrice)}</div>
              <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isUp ? '+' : ''}{(liveData?.change ?? stock.change).toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
                <span className="text-gray-500 text-xs ml-1 font-normal">Today</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right">
              <div>
                <div className="text-[10px] text-gray-500">52W High</div>
                <div className="text-xs font-semibold text-white">₦{formatPrice(stock.high52w)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">52W Low</div>
                <div className="text-xs font-semibold text-white">₦{formatPrice(stock.low52w)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">Mkt Cap</div>
                <div className="text-xs font-semibold text-white">{formatLargeNumber(stock.marketCap)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500">Volume</div>
                <div className="text-xs font-semibold text-white">{(stock.volume / 1000).toFixed(0)}K</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex px-5 pt-2 gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0D1530' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-medium capitalize transition-all border-b-2 ${activeTab === tab ? 'text-yellow-400 border-yellow-400' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="p-5">
              {/* Price Chart */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Price History (2020-2026)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={stock.priceHistory.filter(p => p.price > 0)}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickFormatter={v => `₦${formatPrice(v)}`} />
                    <Tooltip
                      contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 11 }}
                      formatter={(v: unknown) => [`₦${formatPrice(v as number)}`, 'Price']}
                    />
                    <Area type="monotone" dataKey="price" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={2} fill="url(#priceGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* KB Scores */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">KB & Co Ratings</h4>
                <div className="flex items-center justify-around p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <ScoreRing score={stock.buyScore} label="Buy Score" />
                  <ScoreRing score={stock.valueScore} label="Value" />
                  <ScoreRing score={stock.growthScore} label="Growth" />
                  <ScoreRing score={stock.momentumScore} label="Momentum" />
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-black text-lg" style={{ background: `linear-gradient(135deg, ${getScoreColor(stock.kbRating)}, ${getScoreColor(stock.kbRating)}AA)` }}>
                      {stock.kbRating}
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">KB Rating</span>
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'P/E Ratio', value: stock.peRatio.toFixed(2) },
                  { label: 'PEG Ratio', value: stock.pegRatio.toFixed(2), color: stock.pegRatio < 1 ? '#22c55e' : stock.pegRatio < 2 ? '#f59e0b' : '#ef4444' },
                  { label: 'EPS (TTM)', value: `₦${stock.eps.toFixed(2)}` },
                  { label: 'Div Yield', value: `${stock.dividendYield.toFixed(2)}%` },
                  { label: 'Div/Share', value: `₦${stock.dividendPerShare.toFixed(2)}` },
                  { label: 'Total Growth', value: `+${growthPct.toFixed(1)}%` },
                  { label: 'Risk Level', value: stock.riskLevel, color: getRiskColor(stock.riskLevel) },
                  { label: 'Inv. Horizon', value: stock.investmentHorizon },
                  { label: 'Gross Margin', value: `${stock.financials.grossMargin.toFixed(1)}%` },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] text-gray-500 mb-1">{item.label}</div>
                    <div className="text-sm font-semibold" style={{ color: (item as any).color ?? '#fff' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* About */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">About {stock.name}</h4>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">{stock.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500"><Building2 size={12} /><span>Founded {stock.founded}</span></div>
                  <div className="flex items-center gap-1.5 text-gray-500"><Globe size={12} /><a href={`https://${stock.website}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{stock.website}</a></div>
                  <div className="flex items-center gap-1.5 text-gray-500"><Target size={12} /><span>CEO: {stock.ceo}</span></div>
                  <div className="flex items-center gap-1.5 text-gray-500"><DollarSign size={12} /><span>{stock.employees.toLocaleString()} employees</span></div>
                </div>
              </div>
            </div>
          )}

          {/* FINANCIALS TAB */}
          {activeTab === 'financials' && (
            <div>
              {/* Fin Sub-tabs */}
              <div className="flex px-5 pt-3 gap-1 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {FIN_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFinTab(tab)}
                    className={`px-3 py-1.5 text-[11px] font-medium capitalize whitespace-nowrap transition-all rounded-t-lg border-b-2 ${finTab === tab ? 'text-yellow-400 border-yellow-400' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {finTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { label: 'Total Assets', value: formatLargeNumber(stock.financials.totalAssets * 1000000) },
                        { label: 'Total Liabilities', value: formatLargeNumber(stock.financials.totalLiabilities * 1000000) },
                        { label: 'Equity', value: formatLargeNumber(stock.financials.equity * 1000000) },
                        { label: 'Op. Cash Flow', value: formatLargeNumber(stock.financials.operatingCashFlow * 1000000) },
                        { label: 'Free Cash Flow', value: formatLargeNumber(stock.financials.freeCashFlow * 1000000) },
                        { label: 'Net Margin', value: `${stock.financials.netMargin.toFixed(1)}%` },
                        { label: 'ROE', value: `${stock.financials.roe.toFixed(1)}%` },
                        { label: 'ROA', value: `${stock.financials.roa.toFixed(1)}%` },
                        { label: 'D/E Ratio', value: stock.financials.debtToEquity.toFixed(2) },
                        { label: 'Current Ratio', value: stock.financials.currentRatio.toFixed(2) },
                        { label: 'Quick Ratio', value: stock.financials.quickRatio.toFixed(2) },
                        { label: 'Gross Margin', value: `${stock.financials.grossMargin.toFixed(1)}%` },
                      ].map((s, i) => (
                        <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="text-[10px] text-gray-500 mb-1">{s.label}</div>
                          <div className="text-sm font-semibold text-white">{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(finTab === 'statements' || finTab === 'revenue') && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Revenue & Net Income (₦M)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={finData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}B`} />
                        <Tooltip contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [`₦${((v as number)/1000).toFixed(1)}B`]} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Revenue" />
                        <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} name="Net Income" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {finTab === 'earnings' && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">EPS Trend</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={finData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickFormatter={v => `₦${v.toFixed(0)}`} />
                        <Tooltip contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [`₦${(v as number).toFixed(2)}`, 'EPS']} />
                        <Line type="monotone" dataKey="eps" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#D4AF37', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {finTab === 'dividends' && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Dividend History</h4>
                    <div className="space-y-2">
                      {stock.dividendHistory.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <div className="text-sm font-semibold text-white">{d.year}</div>
                            <div className="text-[10px] text-gray-500">Ex-date: {new Date(d.exDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold" style={{ color: '#D4AF37' }}>₦{d.dividend.toFixed(2)}</div>
                            <div className="text-[10px] text-gray-500">{d.yield.toFixed(2)}% yield</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {finTab === 'statistics' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'P/E Ratio', value: stock.peRatio.toFixed(2) },
                      { label: 'PEG Ratio', value: stock.pegRatio.toFixed(2), color: stock.pegRatio < 1 ? '#22c55e' : stock.pegRatio < 2 ? '#f59e0b' : '#ef4444' },
                      { label: 'EPS', value: `₦${stock.eps.toFixed(2)}` },
                      { label: 'Div. Yield', value: `${stock.dividendYield.toFixed(2)}%` },
                      { label: 'Div/Share', value: `₦${stock.dividendPerShare.toFixed(2)}` },
                      { label: 'Market Cap', value: formatLargeNumber(stock.marketCap) },
                      { label: '52W Range', value: `₦${formatPrice(stock.low52w)} - ₦${formatPrice(stock.high52w)}` },
                      { label: 'Avg Volume', value: `${(stock.volume/1000).toFixed(0)}K` },
                      { label: 'ROE', value: `${stock.financials.roe.toFixed(1)}%` },
                      { label: 'ROA', value: `${stock.financials.roa.toFixed(1)}%` },
                      { label: 'Net Margin', value: `${stock.financials.netMargin.toFixed(1)}%` },
                      { label: 'D/E Ratio', value: stock.financials.debtToEquity.toFixed(2) },
                      { label: 'Beta', value: (0.6 + Math.random() * 1.2).toFixed(2) },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-xs text-gray-500">{s.label}</span>
                        <span className="text-xs font-semibold text-white">{s.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <div className="p-5 space-y-3">
              {['Q1 2026 Earnings Beat Estimates by 18%', 'Annual General Meeting Scheduled for August 2026', 'Board Approves Capital Expenditure of ₦45 Billion', 'New Plant Capacity Expansion Underway', 'Strategic Partnership Agreement Signed'].map((title, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/15 text-green-400">company</span>
                    <span className="text-[10px] text-gray-600">{new Date(Date.now() - i * 86400000 * 3).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <h4 className="text-sm text-white font-medium leading-relaxed">{stock.name}: {title}</h4>
                  <p className="text-[11px] text-gray-500 mt-1">Reuters · Business Day</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* TECHNICALS TAB */}
          {activeTab === 'technicals' && (
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'RSI (14)', value: (40 + Math.random() * 40).toFixed(1), status: 'Neutral' },
                  { label: 'MACD', value: (Math.random() * 2 - 1).toFixed(3), status: isUp ? 'Bullish' : 'Bearish' },
                  { label: 'MA (50)', value: `₦${(currentPrice * 0.92).toFixed(2)}`, status: 'Above' },
                  { label: 'MA (200)', value: `₦${(currentPrice * 0.78).toFixed(2)}`, status: 'Above' },
                  { label: 'Bollinger %B', value: (Math.random()).toFixed(3), status: 'Normal' },
                  { label: 'Stochastic', value: (30 + Math.random() * 50).toFixed(1), status: 'Neutral' },
                ].map((tech, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] text-gray-500 mb-1">{tech.label}</div>
                    <div className="text-sm font-bold text-white">{tech.value}</div>
                    <div className={`text-[10px] mt-1 ${tech.status === 'Bullish' || tech.status === 'Above' ? 'text-green-400' : tech.status === 'Bearish' ? 'text-red-400' : 'text-yellow-400'}`}>{tech.status}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} color="#D4AF37" />
                  <span className="text-xs font-semibold text-yellow-400">AI Technical Summary</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {stock.symbol} shows {isUp ? 'bullish' : 'mixed'} momentum with price trading above its 50 and 200-day moving averages. RSI indicates {isUp ? 'mild overbought conditions' : 'potential oversold territory'}, suggesting {isUp ? 'consolidation before the next leg up' : 'a possible bounce in the near term'}. Volume trends support the current {isUp ? 'upward' : 'downward'} price action. Key resistance at ₦{formatPrice(stock.high52w)}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: 'rgba(212,175,55,0.12)', background: '#0D1530' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToPortfolio}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}
          >
            <Plus size={14} className="inline mr-1" />
            Add to Portfolio
          </motion.button>
          <button
            onClick={() => addToWatchlist(stock.symbol)}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}
          >
            <Star size={14} className="inline mr-1" fill={inWatchlist ? 'currentColor' : 'none'} />
            Watch
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface StocksProps {
  onNavigateToProfile?: (symbol: string) => void;
}

export default function Stocks({ onNavigateToProfile }: StocksProps = {}) {
  const { prices } = useStore();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [filter, setFilter] = useState('All Sectors');

  const sectors = ['All Sectors', ...Array.from(new Set(NGX_STOCKS.map(s => s.sector)))];
  const filtered = filter === 'All Sectors' ? NGX_STOCKS : NGX_STOCKS.filter(s => s.sector === filter);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white">Nigerian Exchange Stocks</h2>
        <p className="text-sm text-gray-400 mt-1">{NGX_STOCKS.length} stocks listed · Live prices · Click any stock for detailed analysis</p>
      </motion.div>

      {/* Sector Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {sectors.map(sector => (
          <button
            key={sector}
            onClick={() => setFilter(sector)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${filter === sector ? 'text-black' : 'text-gray-400 hover:text-white'}`}
            style={filter === sector ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Stock Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <th className="text-left px-4 py-3">Symbol</th>
                <th className="text-right px-3 py-3">Price</th>
                <th className="text-right px-3 py-3">Change</th>
                <th className="text-right px-3 py-3 hidden md:table-cell">Mkt Cap</th>
                <th className="text-right px-3 py-3 hidden lg:table-cell">P/E</th>
                <th className="text-right px-3 py-3 hidden xl:table-cell">PEG</th>
                <th className="text-right px-3 py-3 hidden lg:table-cell">Div Yield</th>
                <th className="text-right px-3 py-3 hidden xl:table-cell">52W Range</th>
                <th className="text-center px-3 py-3">Risk</th>
                <th className="text-center px-3 py-3">KB Score</th>
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
                    transition={{ delay: i * 0.02 }}
                    onClick={() => onNavigateToProfile ? onNavigateToProfile(stock.symbol) : setSelectedStock(stock)}
                    className="border-b hover:bg-white/[0.03] transition-colors cursor-pointer"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StockLogo symbol={stock.symbol} sector={stock.sector} website={stock.website} size={28} />
                        <div>
                          <div className="text-xs font-bold text-white">{stock.symbol}</div>
                          <div className="text-[10px] text-gray-500 truncate" style={{ maxWidth: 120 }}>{stock.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-white">₦{formatPrice(price)}</td>
                    <td className={`px-3 py-3 text-right text-xs font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isUp ? '+' : ''}{pct.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-gray-400 hidden md:table-cell">{formatLargeNumber(stock.marketCap)}</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-300 hidden lg:table-cell">{stock.peRatio.toFixed(1)}x</td>
                    <td className="px-3 py-3 text-right text-xs font-semibold hidden xl:table-cell" style={{ color: stock.pegRatio < 1 ? '#22c55e' : stock.pegRatio < 2 ? '#f59e0b' : '#ef4444' }}>{stock.pegRatio.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-xs text-yellow-400 hidden lg:table-cell">{stock.dividendYield.toFixed(2)}%</td>
                    <td className="px-3 py-3 text-right text-[10px] text-gray-500 hidden xl:table-cell">
                      ₦{formatPrice(stock.low52w)} - ₦{formatPrice(stock.high52w)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${getRiskColor(stock.riskLevel)}20`, color: getRiskColor(stock.riskLevel) }}>
                        {stock.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-black mx-auto" style={{ background: getScoreColor(stock.kbRating) }}>
                        {stock.kbRating}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedStock && (
          <StockDetail stock={selectedStock} onClose={() => setSelectedStock(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
