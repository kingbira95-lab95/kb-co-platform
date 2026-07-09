import { useState, useEffect, useRef } from 'react';
import StockLogo from '../components/StockLogo';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ReferenceLine,
} from 'recharts';
import { NGX_STOCKS } from '../data/stocks';
import { useStore } from '../store';
import { formatPrice, formatLargeNumber, getRiskColor, getScoreColor } from '../utils';
import { getStockAnalysis, getStockNews, getTechnicalAnalysis } from '../services/openrouter';
import {
  ArrowLeft, TrendingUp, TrendingDown, Star, Download, ExternalLink,
  Building2, Globe, Users, Calendar, FileText, AlertCircle,
  BarChart3, DollarSign, Info, ChevronRight, Plus, Brain, Activity,
  Newspaper, Award,
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const TODAY_STR = new Date().toISOString().split('T')[0] + 'T00:00:00';

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = prices[i] - prices[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function AIBlock({ content, loading }: { content: string; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-3 rounded shimmer-premium" style={{ width: `${70 + i * 10}%` }} />
        ))}
      </div>
    );
  }
  return (
    <div className="text-[12px] text-gray-300 leading-relaxed whitespace-pre-wrap">
      {content || <span className="text-gray-600">AI analysis not available</span>}
    </div>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium p-3 text-center card-float"
    >
      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-bold" style={{ color: color ?? '#e5e7eb' }}>{value}</div>
      {sub && <div className="text-[9px] text-gray-600 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

function TabBtn({ label, icon: Icon, active, onClick }: {
  id?: string; label: string; icon?: React.ElementType; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap ${
        active
          ? 'text-yellow-400 border border-yellow-400/25'
          : 'text-gray-500 hover:text-gray-300 border border-transparent'
      }`}
      style={active ? { background: 'rgba(212,175,55,0.1)' } : {}}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  );
}

function SubTabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 whitespace-nowrap border-b-2 ${
        active
          ? 'text-yellow-400 border-yellow-400 bg-yellow-400/5'
          : 'text-gray-500 border-transparent hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

// Custom recharts tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white font-semibold">
            {typeof p.value === 'number' && p.value > 1000
              ? formatLargeNumber(p.value * (p.name?.includes('EPS') ? 1 : 1_000_000))
              : typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
          <span className="text-gray-500">{p.name}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

interface NgxData {
  tradingInfo?: { open?: number; high?: number; low?: number; prevClose?: number; volume?: number; value?: number; sharesOutstanding?: number };
  recentTrades?: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number; value?: number }>;
  documents?: {
    financialStatements?: Array<{ title: string; date: string; url: string }>;
    corporateDisclosures?: Array<{ title: string; date: string; url: string }>;
    directorsDealing?: Array<{ title: string; date: string; url: string }>;
  };
  error?: string;
}

export default function StockProfile({ symbol, onBack }: { symbol: string; onBack: () => void }) {
  const stock = NGX_STOCKS.find(s => s.symbol === symbol);
  const { prices, addToWatchlist, isInWatchlist, addHolding, activePortfolioId, addNotification } = useStore();

  const [tab, setTab] = useState<'summary' | 'financials' | 'news' | 'technicals'>('summary');
  const [finTab, setFinTab] = useState<'overview' | 'statement' | 'statistics' | 'dividends' | 'earnings' | 'revenue'>('overview');
  const [chartRange, setChartRange] = useState<'1Y' | '3Y' | '5Y' | 'ALL'>('ALL');
  const [ngxData, setNgxData] = useState<NgxData | null>(null);
  const [ngxLoading, setNgxLoading] = useState(true);

  // AI states
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiNews, setAiNews] = useState('');
  const [aiTech, setAiTech] = useState('');
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiNewsLoading, setAiNewsLoading] = useState(false);
  const [aiTechLoading, setAiTechLoading] = useState(false);

  const aiAnalysisFetched = useRef(false);
  const aiNewsFetched = useRef(false);
  const aiTechFetched = useRef(false);

  // Fetch NGX live data
  useEffect(() => {
    setNgxLoading(true);
    fetch(`${BASE_URL}/stocks/ngx-profile/${symbol}`)
      .then(r => r.json())
      .then((d: NgxData) => { setNgxData(d); setNgxLoading(false); })
      .catch(() => setNgxLoading(false));
  }, [symbol]);

  // Lazy-load AI analysis when tab opens
  useEffect(() => {
    if (!stock || tab !== 'summary' || aiAnalysisFetched.current) return;
    aiAnalysisFetched.current = true;
    setAiAnalysisLoading(true);
    getStockAnalysis(
      stock.symbol, stock.name, stock.sector, currentPrice,
      stock.priceHistory, stock.financials,
    ).then(r => { setAiAnalysis(r); setAiAnalysisLoading(false); })
     .catch(() => { setAiAnalysis('AI analysis unavailable at this time.'); setAiAnalysisLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, symbol]);

  useEffect(() => {
    if (!stock || tab !== 'news' || aiNewsFetched.current) return;
    aiNewsFetched.current = true;
    setAiNewsLoading(true);
    getStockNews(stock.symbol, stock.name, stock.sector)
      .then(r => { setAiNews(r); setAiNewsLoading(false); })
      .catch(() => { setAiNews('News unavailable at this time.'); setAiNewsLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, symbol]);

  useEffect(() => {
    if (!stock || tab !== 'technicals' || aiTechFetched.current) return;
    aiTechFetched.current = true;
    setAiTechLoading(true);
    getTechnicalAnalysis(stock.symbol, stock.priceHistory, currentPrice)
      .then(r => { setAiTech(r); setAiTechLoading(false); })
      .catch(() => { setAiTech('Technical analysis unavailable.'); setAiTechLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, symbol]);

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={48} className="text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Stock Not Found</h2>
        <button onClick={onBack} className="text-yellow-400 hover:underline flex items-center gap-1.5 text-sm">
          <ArrowLeft size={14} /> Back to Stocks
        </button>
      </div>
    );
  }

  const liveData = prices[symbol];
  const currentPrice = liveData?.price ?? stock.price;
  const change = liveData?.change ?? stock.change;
  const changePct = liveData?.changePct ?? stock.changePct;
  const isUp = changePct >= 0;
  const inWatchlist = isInWatchlist(symbol);

  // Chart data
  const currentYear = new Date().getFullYear();
  const rangeYears: Record<string, number> = { '1Y': 1, '3Y': 3, '5Y': 5, 'ALL': 20 };
  const chartData = stock.priceHistory
    .filter(ph => ph.year >= currentYear - rangeYears[chartRange])
    .map(ph => ({ year: String(ph.year), price: ph.price }));
  const firstPrice = chartData[0]?.price ?? currentPrice;
  const chartPctChange = ((currentPrice - firstPrice) / firstPrice) * 100;
  const chartColor = chartPctChange >= 0 ? '#22c55e' : '#ef4444';

  const priceNums = stock.priceHistory.map(p => p.price);
  const rsiVal = calcRSI(priceNums);
  const ma3 = calcMA(priceNums, 3);
  const ma5 = calcMA(priceNums, 5);

  const handleAddToPortfolio = () => {
    if (activePortfolioId) {
      addHolding(activePortfolioId, { symbol: stock.symbol, shares: 100, buyPrice: currentPrice, buyDate: new Date().toISOString() });
      addNotification({ type: 'portfolio', title: 'Added to Portfolio', message: `100 shares of ${symbol} @ ₦${formatPrice(currentPrice)}`, symbol });
    }
  };

  // Financial chart data
  const finChartData = stock.financials.years.map((yr, i) => ({
    year: String(yr),
    revenue: stock.financials.revenue[i],
    income: stock.financials.netIncome[i],
    eps: stock.financials.eps[i],
  }));


  // Technicals computed data
  const techData = stock.priceHistory.map((p, i, arr) => {
    const slice = arr.slice(0, i + 1).map(x => x.price);
    return {
      year: String(p.year),
      price: p.price,
      ma3: calcMA(slice, 3),
      ma5: calcMA(slice, 5),
      yoy: i > 0 ? ((p.price - arr[i - 1].price) / arr[i - 1].price * 100) : 0,
    };
  });

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1E' }}>
      {/* ── Sticky breadcrumb ── */}
      <div className="sticky top-0 z-40 px-4 md:px-6 py-2.5 flex items-center gap-2 border-b"
        style={{ background: 'rgba(10,15,30,0.97)', borderColor: 'rgba(212,175,55,0.12)', backdropFilter: 'blur(16px)' }}>
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-gray-400 hover:text-yellow-400 transition-colors text-sm font-medium">
          <ArrowLeft size={14} /> Stocks
        </button>
        <ChevronRight size={11} className="text-gray-700" />
        <span className="text-white font-bold text-sm">{symbol}</span>
        <span className="text-gray-600 text-xs hidden sm:inline">· {stock.name}</span>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => addToWatchlist(symbol)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
              ${inWatchlist ? 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30' : 'bg-white/5 text-gray-400 hover:text-yellow-400 border-white/10'}`}>
            <Star size={11} fill={inWatchlist ? 'currentColor' : 'none'} />
            {inWatchlist ? 'Watching' : 'Watchlist'}
          </button>
          <a href={`https://ngxgroup.com/exchange/data/company-profile/?symbol=${symbol}&directory=companydirectory&tdate=${TODAY_STR}`}
            target="_blank" rel="noreferrer"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white bg-white/5 border border-white/10 transition-all">
            <ExternalLink size={10} /> NGX
          </a>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 md:px-6 py-5 space-y-4">
        {/* ── Hero ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Price card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-premium p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <StockLogo symbol={symbol} sector={stock?.sector} size={56} />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 breathe ${isUp ? 'bg-green-400' : 'bg-red-400'}`}
                    style={{ borderColor: '#0A0F1E' }} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white">{symbol}</h1>
                  <p className="text-[11px] text-gray-400 leading-tight">{stock.name}</p>
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500 uppercase tracking-wide">{stock.sector}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${getRiskColor(stock.riskLevel)}18`, color: getRiskColor(stock.riskLevel) }}>
                      {stock.riskLevel} Risk
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <motion.div key={currentPrice} className="text-3xl font-black text-white number-spin">
                  ₦{formatPrice(currentPrice)}
                </motion.div>
                <motion.div key={changePct} className={`flex items-center justify-end gap-1 mt-1 text-sm font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isUp ? '+' : ''}{change.toFixed(2)}&nbsp;({isUp ? '+' : ''}{changePct.toFixed(2)}%)
                </motion.div>
                <div className="text-[10px] text-gray-600 mt-0.5">Today's change</div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { l: '52W High', v: `₦${formatPrice(stock.high52w)}` },
                { l: '52W Low', v: `₦${formatPrice(stock.low52w)}` },
                { l: 'Mkt Cap', v: formatLargeNumber(stock.marketCap) },
                { l: 'Volume', v: `${(stock.volume / 1000).toFixed(0)}K` },
                { l: 'P/E', v: `${stock.peRatio.toFixed(1)}x` },
                { l: 'EPS', v: `₦${stock.eps.toFixed(2)}` },
                { l: 'Div Yield', v: `${stock.dividendYield.toFixed(2)}%` },
                { l: 'PEG', v: stock.pegRatio.toFixed(2), c: stock.pegRatio < 1 ? '#22c55e' : stock.pegRatio < 2 ? '#f59e0b' : '#ef4444' },
              ].map(item => (
                <div key={item.l} className="bg-white/[0.03] rounded-xl p-2 text-center border border-white/[0.04]">
                  <div className="text-[9px] text-gray-600 mb-0.5">{item.l}</div>
                  <div className="text-[11px] font-bold" style={{ color: item.c ?? '#e5e7eb' }}>{item.v}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddToPortfolio}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-black text-black transition-all"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}>
                <Plus size={14} /> Add to Portfolio
              </motion.button>
              <button onClick={() => addToWatchlist(symbol)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
                  ${inWatchlist ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' : 'text-gray-400 border-white/10 hover:border-yellow-400/30 hover:text-yellow-400'}`}>
                <Star size={13} className="inline mr-1" fill={inWatchlist ? 'currentColor' : 'none'} />
                {inWatchlist ? 'Watchlisted' : 'Watch'}
              </button>
            </div>
          </motion.div>

          {/* Scores card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="glass-premium p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">KB & Co Ratings</div>
              <Award size={14} className="text-yellow-400" />
            </div>
            <div className="space-y-3.5">
              {[
                { l: 'KB Rating', v: stock.kbRating, c: stock.kbRating >= 75 ? '#22c55e' : stock.kbRating >= 60 ? '#D4AF37' : '#ef4444' },
                { l: 'Buy Score', v: stock.buyScore, c: '#22c55e' },
                { l: 'Value', v: stock.valueScore, c: '#3b82f6' },
                { l: 'Growth', v: stock.growthScore, c: '#a855f7' },
                { l: 'Momentum', v: stock.momentumScore, c: '#f59e0b' },
              ].map((s, i) => (
                <div key={s.l}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-gray-500">{s.l}</span>
                    <span className="text-xs font-black tabular-nums" style={{ color: s.c }}>{s.v}/100</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.v}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full" style={{ background: s.c }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider">Recommendation</div>
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="text-sm font-black px-4 py-2 rounded-full inline-block"
                style={{
                  background: stock.kbRating >= 75 ? 'rgba(34,197,94,0.12)' : stock.kbRating >= 60 ? 'rgba(212,175,55,0.12)' : 'rgba(239,68,68,0.12)',
                  color: stock.kbRating >= 75 ? '#22c55e' : stock.kbRating >= 60 ? '#D4AF37' : '#ef4444',
                  border: `1px solid ${stock.kbRating >= 75 ? 'rgba(34,197,94,0.3)' : stock.kbRating >= 60 ? 'rgba(212,175,55,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                {stock.kbRating >= 75 ? '★ STRONG BUY' : stock.kbRating >= 60 ? '● HOLD' : '▼ SELL'}
              </motion.div>
              <div className="text-[10px] text-gray-600 mt-2">{stock.investmentHorizon} horizon</div>
            </div>
          </motion.div>
        </div>

        {/* ── Main tab bar ── */}
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          <TabBtn id="summary"     label="Summary"     icon={Activity}    active={tab === 'summary'}     onClick={() => setTab('summary')} />
          <TabBtn id="financials"  label="Financials"  icon={BarChart3}   active={tab === 'financials'}  onClick={() => setTab('financials')} />
          <TabBtn id="news"        label="News"        icon={Newspaper}   active={tab === 'news'}        onClick={() => setTab('news')} />
          <TabBtn id="technicals"  label="Technicals"  icon={TrendingUp}   active={tab === 'technicals'}  onClick={() => setTab('technicals')} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SUMMARY TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {tab === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-4">
              {/* Price chart */}
              <div className="glass-premium p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-black text-white">Price History (2020 – Present)</h3>
                    <span className={`text-xs font-semibold ${chartPctChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {chartPctChange >= 0 ? '+' : ''}{chartPctChange.toFixed(2)}% in selected range
                    </span>
                  </div>
                  <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {(['1Y', '3Y', '5Y', 'ALL'] as const).map(r => (
                      <button key={r} onClick={() => setChartRange(r)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${chartRange === r ? 'bg-yellow-400/20 text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                    <defs>
                      <linearGradient id={`pgrad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={60}
                      tickFormatter={v => v >= 1000 ? `₦${(v / 1000).toFixed(0)}K` : `₦${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2.5}
                      fill={`url(#pgrad-${symbol})`}
                      dot={{ fill: chartColor, r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: chartColor, strokeWidth: 2, stroke: '#0A0F1E' }} />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Year price table */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {chartData.map((d, i) => {
                    const prev = chartData[i - 1];
                    const pct = prev ? ((d.price - prev.price) / prev.price * 100) : null;
                    return (
                      <div key={d.year} className="text-center">
                        <div className="text-[9px] text-gray-600 uppercase">{d.year}</div>
                        <div className="text-[11px] font-black text-white">₦{formatPrice(d.price)}</div>
                        {pct !== null && (
                          <div className={`text-[9px] font-semibold ${pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overview 2-col */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company info */}
                <div className="glass-premium p-5">
                  <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                    <Building2 size={13} className="text-yellow-400" /> Company Profile
                  </h3>
                  <p className="text-[12px] text-gray-400 leading-relaxed mb-4">{stock.description}</p>
                  {[
                    { i: Globe, l: 'Website', v: stock.website, link: `https://${stock.website}` },
                    { i: Users, l: 'CEO', v: stock.ceo },
                    { i: Users, l: 'Employees', v: stock.employees.toLocaleString() },
                    { i: Calendar, l: 'Founded', v: String(stock.founded) },
                    { i: Info, l: 'Horizon', v: stock.investmentHorizon },
                  ].map(item => (
                    <div key={item.l} className="flex justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <item.i size={10} /> {item.l}
                      </div>
                      {item.link
                        ? <a href={item.link} target="_blank" rel="noreferrer" className="text-[11px] text-yellow-400 hover:underline flex items-center gap-1">{item.v} <ExternalLink size={9} /></a>
                        : <span className="text-[11px] font-semibold text-white">{item.v}</span>}
                    </div>
                  ))}
                </div>

                {/* Trading info */}
                <div className="glass-premium p-5">
                  <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                    <DollarSign size={13} className="text-yellow-400" /> Trading Information
                  </h3>
                  {ngxLoading ? (
                    <div className="space-y-2">{[1,2,3,4,5,6].map(i => <div key={i} className="h-4 rounded shimmer-premium" />)}</div>
                  ) : (
                    [
                      { l: 'Last Price', v: `₦${formatPrice(currentPrice)}`, c: '#fff' },
                      { l: 'Change', v: `${isUp?'+':''}${change.toFixed(2)} (${changePct.toFixed(2)}%)`, c: isUp?'#22c55e':'#ef4444' },
                      { l: 'Open (NGX)', v: ngxData?.tradingInfo?.open ? `₦${formatPrice(ngxData.tradingInfo.open)}` : '—' },
                      { l: 'Day High', v: ngxData?.tradingInfo?.high ? `₦${formatPrice(ngxData.tradingInfo.high)}` : '—' },
                      { l: 'Day Low', v: ngxData?.tradingInfo?.low ? `₦${formatPrice(ngxData.tradingInfo.low)}` : '—' },
                      { l: 'Prev Close', v: ngxData?.tradingInfo?.prevClose ? `₦${formatPrice(ngxData.tradingInfo.prevClose)}` : '—' },
                      { l: 'Volume', v: ngxData?.tradingInfo?.volume ? formatLargeNumber(ngxData.tradingInfo.volume) : `${(stock.volume/1000).toFixed(0)}K` },
                      { l: 'Market Cap', v: formatLargeNumber(stock.marketCap) },
                      { l: 'P/E Ratio', v: `${stock.peRatio.toFixed(2)}x` },
                      { l: 'EPS', v: `₦${stock.eps.toFixed(2)}` },
                      { l: 'Div Yield', v: `${stock.dividendYield.toFixed(2)}%` },
                      { l: '52W Range', v: `₦${formatPrice(stock.low52w)} – ₦${formatPrice(stock.high52w)}` },
                    ].map(item => (
                      <div key={item.l} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <span className="text-[11px] text-gray-500">{item.l}</span>
                        <span className="text-[11px] font-bold" style={{ color: item.c ?? '#e5e7eb' }}>{item.v}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Last 7 days trades */}
              <div className="glass-premium p-5">
                <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                  <Activity size={13} className="text-yellow-400" /> Last 7 Days Trades
                </h3>
                {ngxLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded shimmer-premium" />)}</div>
                ) : ngxData?.recentTrades?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          {['Date', 'Open', 'High', 'Low', 'Close', 'Volume', 'Value'].map((h, i) => (
                            <th key={h} className={`py-2 px-2 text-gray-500 font-semibold ${i===0?'text-left':'text-right'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ngxData.recentTrades.map((t, i) => (
                          <tr key={i} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <td className="py-2 px-2 text-gray-400">{t.date}</td>
                            <td className="py-2 px-2 text-right text-gray-300">₦{formatPrice(t.open)}</td>
                            <td className="py-2 px-2 text-right text-green-400">₦{formatPrice(t.high)}</td>
                            <td className="py-2 px-2 text-right text-red-400">₦{formatPrice(t.low)}</td>
                            <td className={`py-2 px-2 text-right font-bold ${t.close>=t.open?'text-green-400':'text-red-400'}`}>₦{formatPrice(t.close)}</td>
                            <td className="py-2 px-2 text-right text-gray-400">{formatLargeNumber(t.volume)}</td>
                            <td className="py-2 px-2 text-right text-gray-400">{formatLargeNumber(t.value ?? t.volume*t.close)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-gray-600 mb-2">Live trade data fetched from NGX Group</p>
                    <a href={`https://ngxgroup.com/exchange/data/company-profile/?symbol=${symbol}&directory=companydirectory&tdate=${TODAY_STR}`}
                      target="_blank" rel="noreferrer" className="text-yellow-400 text-xs hover:underline flex items-center gap-1 justify-center">
                      View on NGX <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>

              {/* AI Analysis */}
              <div className="glass-premium p-5">
                <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                  <Brain size={13} className="text-yellow-400" /> AI Investment Analysis
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 font-bold">Powered by GPT</span>
                </h3>
                <AIBlock content={aiAnalysis} loading={aiAnalysisLoading} />
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              FINANCIALS TAB
          ═══════════════════════════════════════════════════════════════════ */}
          {tab === 'financials' && (
            <motion.div key="financials" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-4">
              {/* Subtabs */}
              <div className="flex gap-0.5 overflow-x-auto pb-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {(['overview', 'statement', 'statistics', 'dividends', 'earnings', 'revenue'] as const).map(st => (
                  <SubTabBtn key={st} label={st.charAt(0).toUpperCase() + st.slice(1)} active={finTab === st} onClick={() => setFinTab(st)} />
                ))}
              </div>

              {/* ─ Overview ─ */}
              {finTab === 'overview' && (
                <motion.div key="fin-overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* Key metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
                    {[
                      { l: 'Gross Margin', v: `${stock.financials.grossMargin}%`, c: '#22c55e' },
                      { l: 'Net Margin', v: `${stock.financials.netMargin}%`, c: '#22c55e' },
                      { l: 'ROE', v: `${stock.financials.roe}%`, c: '#3b82f6' },
                      { l: 'ROA', v: `${stock.financials.roa}%`, c: '#3b82f6' },
                      { l: 'Debt/Equity', v: `${stock.financials.debtToEquity}x`, c: stock.financials.debtToEquity < 1 ? '#22c55e' : '#f59e0b' },
                      { l: 'Current Ratio', v: `${stock.financials.currentRatio}x`, c: stock.financials.currentRatio >= 1.5 ? '#22c55e' : '#f59e0b' },
                      { l: 'Quick Ratio', v: `${stock.financials.quickRatio}x`, c: '#9ca3af' },
                      { l: 'Total Equity', v: formatLargeNumber(stock.financials.equity * 1e6), c: '#D4AF37' },
                    ].map(item => <StatCard key={item.l} label={item.l} value={item.v} color={item.c} />)}
                  </div>

                  {/* Revenue vs Income chart */}
                  <div className="glass-premium p-5">
                    <h3 className="text-sm font-black text-white mb-4">Revenue vs Net Income</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={finChartData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={45}
                          tickFormatter={v => `${(v/1000).toFixed(0)}B`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" name="Revenue" fill="rgba(212,175,55,0.55)" radius={[3,3,0,0]} />
                        <Bar dataKey="income" name="Net Income" fill="rgba(34,197,94,0.65)" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* EPS trend */}
                  <div className="glass-premium p-5">
                    <h3 className="text-sm font-black text-white mb-4">EPS Trend</h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={finChartData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `₦${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="eps" name="EPS (₦)" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: '#D4AF37', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* ─ Statement ─ */}
              {finTab === 'statement' && (
                <motion.div key="fin-statement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="glass-premium p-5">
                    <h3 className="text-sm font-black text-white mb-4">Income Statement (₦M)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <th className="text-left py-2 pr-4 text-gray-500 font-semibold">Metric</th>
                            {stock.financials.years.map(yr => (
                              <th key={yr} className="text-right py-2 px-2 text-gray-500 font-semibold">{yr}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { l: 'Revenue', k: 'revenue' as const, fmt: (v: number) => formatLargeNumber(v * 1e6), color: '#D4AF37' },
                            { l: 'Net Income', k: 'netIncome' as const, fmt: (v: number) => formatLargeNumber(v * 1e6), color: '#22c55e' },
                            { l: 'EPS (₦)', k: 'eps' as const, fmt: (v: number) => v.toFixed(2), color: '#3b82f6' },
                          ].map(row => (
                            <tr key={row.l} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                              <td className="py-2.5 pr-4 font-semibold" style={{ color: row.color }}>{row.l}</td>
                              {stock.financials[row.k].map((val, i) => (
                                <td key={i} className="py-2.5 px-2 text-right text-white font-semibold">{row.fmt(val)}</td>
                              ))}
                            </tr>
                          ))}
                          <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <td className="py-2.5 pr-4 text-gray-500">Gross Margin</td>
                            {stock.financials.years.map((_, i) => (
                              <td key={i} className="py-2.5 px-2 text-right text-green-400">{stock.financials.grossMargin}%</td>
                            ))}
                          </tr>
                          <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <td className="py-2.5 pr-4 text-gray-500">Net Margin</td>
                            {stock.financials.years.map((_, i) => (
                              <td key={i} className="py-2.5 px-2 text-right text-green-400">{stock.financials.netMargin}%</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Balance Sheet */}
                  <div className="glass-premium p-5">
                    <h3 className="text-sm font-black text-white mb-4">Balance Sheet Summary</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
                      {[
                        { l: 'Total Assets', v: formatLargeNumber(stock.financials.totalAssets * 1e6) },
                        { l: 'Total Liabilities', v: formatLargeNumber(stock.financials.totalLiabilities * 1e6), c: '#ef4444' },
                        { l: 'Equity', v: formatLargeNumber(stock.financials.equity * 1e6), c: '#22c55e' },
                        { l: 'Op. Cash Flow', v: formatLargeNumber(stock.financials.operatingCashFlow * 1e6), c: '#D4AF37' },
                        { l: 'Free Cash Flow', v: formatLargeNumber(stock.financials.freeCashFlow * 1e6), c: '#D4AF37' },
                        { l: 'D/E Ratio', v: `${stock.financials.debtToEquity}x`, c: stock.financials.debtToEquity < 1 ? '#22c55e' : '#f59e0b' },
                      ].map(item => <StatCard key={item.l} label={item.l} value={item.v} color={item.c} />)}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─ Statistics ─ */}
              {finTab === 'statistics' && (
                <motion.div key="fin-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
                    {[
                      { l: 'P/E Ratio', v: `${stock.peRatio.toFixed(2)}x`, c: stock.peRatio < 15 ? '#22c55e' : stock.peRatio < 30 ? '#f59e0b' : '#ef4444' },
                      { l: 'PEG Ratio', v: `${stock.pegRatio.toFixed(2)}x`, c: stock.pegRatio < 1 ? '#22c55e' : '#f59e0b' },
                      { l: 'EPS (TTM)', v: `₦${stock.eps.toFixed(2)}` },
                      { l: 'Div Yield', v: `${stock.dividendYield.toFixed(2)}%`, c: '#D4AF37' },
                      { l: 'Div/Share', v: `₦${stock.dividendPerShare.toFixed(2)}`, c: '#D4AF37' },
                      { l: 'Market Cap', v: formatLargeNumber(stock.marketCap) },
                      { l: 'ROE', v: `${stock.financials.roe}%`, c: '#22c55e' },
                      { l: 'ROA', v: `${stock.financials.roa}%`, c: '#22c55e' },
                      { l: 'Gross Margin', v: `${stock.financials.grossMargin}%` },
                      { l: 'Net Margin', v: `${stock.financials.netMargin}%` },
                      { l: 'Current Ratio', v: `${stock.financials.currentRatio}x` },
                      { l: 'Quick Ratio', v: `${stock.financials.quickRatio}x` },
                    ].map(item => <StatCard key={item.l} label={item.l} value={item.v} color={item.c} />)}
                  </div>
                  {/* Radar chart */}
                  <div className="glass-premium p-5">
                    <h3 className="text-sm font-black text-white mb-4">Financial Health Radar</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={[
                        { subject: 'Profitability', v: Math.min(stock.financials.netMargin * 2, 100) },
                        { subject: 'Growth', v: stock.growthScore },
                        { subject: 'Value', v: stock.valueScore },
                        { subject: 'Momentum', v: stock.momentumScore },
                        { subject: 'Safety', v: 100 - Math.min(stock.financials.debtToEquity * 30, 90) },
                        { subject: 'Income', v: Math.min(stock.dividendYield * 10, 100) },
                      ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <Radar name={symbol} dataKey="v" stroke="#D4AF37" fill="rgba(212,175,55,0.2)" strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* ─ Dividends ─ */}
              {finTab === 'dividends' && (
                <motion.div key="fin-div" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {stock.dividendHistory.length > 0 ? (
                    <>
                      <div className="glass-premium p-5">
                        <h3 className="text-sm font-black text-white mb-4">Dividend History</h3>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={stock.dividendHistory.map(d => ({ year: String(d.year), amount: d.dividend, yield: d.yield }))}
                            margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={35} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="amount" name="Dividend (₦)" fill="#D4AF37" radius={[3,3,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="glass-premium p-5">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                              {['Year', 'Amount', 'Yield', 'Ex-Date', 'Pay Date'].map((h, i) => (
                                <th key={h} className={`py-2 px-2 text-gray-500 font-semibold ${i===0?'text-left':'text-right'}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stock.dividendHistory.map(d => (
                              <tr key={d.year} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                <td className="py-2.5 px-2 font-bold text-white">{d.year}</td>
                                <td className="py-2.5 px-2 text-right text-yellow-400 font-bold">₦{d.dividend.toFixed(2)}</td>
                                <td className="py-2.5 px-2 text-right text-green-400">{d.yield.toFixed(2)}%</td>
                                <td className="py-2.5 px-2 text-right text-gray-400">{d.exDate}</td>
                                <td className="py-2.5 px-2 text-right text-gray-400">{d.payDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="glass-premium p-10 text-center">
                      <DollarSign size={36} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No dividend history available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─ Earnings ─ */}
              {finTab === 'earnings' && (
                <motion.div key="fin-earn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="glass-premium p-5">
                    <h3 className="text-sm font-black text-white mb-4">Earnings Per Share (₦)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={finChartData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `₦${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="eps" name="EPS (₦)" fill="#D4AF37" radius={[4,4,0,0]}>
                          {finChartData.map((_, i) => (
                            <rect key={i} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass-premium p-5">
                    <h3 className="text-sm font-black text-white mb-4">EPS History</h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <th className="text-left py-2 text-gray-500 font-semibold">Year</th>
                          {stock.financials.years.map(yr => <th key={yr} className="text-right py-2 px-2 text-gray-500 font-semibold">{yr}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2.5 text-yellow-400 font-semibold">EPS (₦)</td>
                          {stock.financials.eps.map((v, i) => <td key={i} className="py-2.5 px-2 text-right text-white font-bold">₦{v.toFixed(2)}</td>)}
                        </tr>
                        <tr>
                          <td className="py-2.5 text-gray-500">Net Income</td>
                          {stock.financials.netIncome.map((v, i) => <td key={i} className="py-2.5 px-2 text-right text-green-400">{formatLargeNumber(v * 1e6)}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ─ Revenue ─ */}
              {finTab === 'revenue' && (
                <motion.div key="fin-rev" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="glass-premium p-5">
                    <h3 className="text-sm font-black text-white mb-4">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={finChartData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={45} tickFormatter={v => `${(v/1000).toFixed(0)}B`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#D4AF37" strokeWidth={2.5} fill="url(#revGrad)"
                          dot={{ fill: '#D4AF37', r: 4 }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="glass-premium p-5">
                    <h3 className="text-sm font-black text-white mb-4">Revenue History (₦M)</h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <th className="text-left py-2 text-gray-500 font-semibold">Year</th>
                          {stock.financials.years.map(yr => <th key={yr} className="text-right py-2 px-2 text-gray-500 font-semibold">{yr}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2.5 text-yellow-400 font-semibold">Revenue</td>
                          {stock.financials.revenue.map((v, i) => <td key={i} className="py-2.5 px-2 text-right text-white font-bold">{formatLargeNumber(v * 1e6)}</td>)}
                        </tr>
                        <tr>
                          <td className="py-2.5 text-gray-500">YoY Growth</td>
                          {stock.financials.revenue.map((v, i) => {
                            if (i === 0) return <td key={i} className="py-2.5 px-2 text-right text-gray-600">—</td>;
                            const pct = ((v - stock.financials.revenue[i-1]) / stock.financials.revenue[i-1]) * 100;
                            return <td key={i} className={`py-2.5 px-2 text-right font-semibold ${pct>=0?'text-green-400':'text-red-400'}`}>{pct>=0?'+':''}{pct.toFixed(1)}%</td>;
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              NEWS TAB
          ═══════════════════════════════════════════════════════════════════ */}
          {tab === 'news' && (
            <motion.div key="news" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-4">
              <div className="glass-premium p-5">
                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                  <Brain size={13} className="text-yellow-400" /> AI-Generated Market Intelligence
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 font-bold">GPT-powered</span>
                </h3>
                <AIBlock content={aiNews} loading={aiNewsLoading} />
              </div>

              {/* Shortcut links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'NGX Company Profile', url: `https://ngxgroup.com/exchange/data/company-profile/?symbol=${symbol}&directory=companydirectory&tdate=${TODAY_STR}`, icon: Building2 },
                  { label: 'NGX Price List', url: 'https://ngxgroup.com/exchange/data/equities-price-list/', icon: BarChart3 },
                  { label: 'Google Finance', url: `https://www.google.com/search?q=${encodeURIComponent(stock.name + ' stock NGX 2024 news')}`, icon: Globe },
                ].map(link => (
                  <a key={link.label} href={link.url} target="_blank" rel="noreferrer"
                    className="glass-premium p-4 flex items-center gap-3 hover:border-yellow-400/30 transition-all group card-float">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-yellow-400/10 group-hover:bg-yellow-400/20 transition-colors">
                      <link.icon size={15} className="text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors">{link.label}</div>
                      <div className="text-[10px] text-gray-600">External source</div>
                    </div>
                    <ExternalLink size={11} className="ml-auto text-gray-600 group-hover:text-yellow-400" />
                  </a>
                ))}
              </div>

              {/* Documents */}
              <div className="space-y-3">
                {[
                  { key: 'financialStatements' as const, label: 'Financial Statements' },
                  { key: 'corporateDisclosures' as const, label: 'Corporate Disclosures' },
                  { key: 'directorsDealing' as const, label: 'Directors Dealings' },
                ].map(({ key, label }) => {
                  const docs = ngxData?.documents?.[key] ?? [];
                  return (
                    <div key={key} className="glass-premium p-4">
                      <h4 className="text-xs font-black text-white mb-2 flex items-center gap-2">
                        <FileText size={11} className="text-yellow-400" /> {label}
                      </h4>
                      {ngxLoading ? (
                        <div className="h-6 rounded shimmer-premium" />
                      ) : docs.length > 0 ? (
                        <div className="space-y-1">
                          {docs.map((doc, i) => (
                            <div key={i} className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                              <div>
                                <div className="text-[11px] text-white">{doc.title}</div>
                                <div className="text-[9px] text-gray-600">{doc.date}</div>
                              </div>
                              {doc.url && (
                                <a href={doc.url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-400/10 text-yellow-400 text-[9px] font-bold hover:bg-yellow-400/20 flex-shrink-0 ml-3">
                                  <Download size={9} /> PDF
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <a href={`https://ngxgroup.com/exchange/data/company-profile/?symbol=${symbol}&directory=companydirectory&tdate=${TODAY_STR}`}
                          target="_blank" rel="noreferrer"
                          className="text-[11px] text-yellow-400 hover:underline flex items-center gap-1">
                          View on NGX <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TECHNICALS TAB
          ═══════════════════════════════════════════════════════════════════ */}
          {tab === 'technicals' && (
            <motion.div key="tech" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-4">
              {/* Key technical indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
                {[
                  { l: 'RSI (14)', v: rsiVal.toFixed(1), c: rsiVal > 70 ? '#ef4444' : rsiVal < 30 ? '#22c55e' : '#D4AF37', sub: rsiVal > 70 ? 'Overbought' : rsiVal < 30 ? 'Oversold' : 'Neutral' },
                  { l: 'MA (3yr)', v: ma3 ? `₦${formatPrice(ma3)}` : '—', c: ma3 && currentPrice > ma3 ? '#22c55e' : '#ef4444', sub: ma3 && currentPrice > ma3 ? 'Above MA' : 'Below MA' },
                  { l: 'MA (5yr)', v: ma5 ? `₦${formatPrice(ma5)}` : '—', c: ma5 && currentPrice > ma5 ? '#22c55e' : '#ef4444', sub: ma5 && currentPrice > ma5 ? 'Bullish' : 'Bearish' },
                  { l: 'Trend', v: chartPctChange >= 15 ? 'Strong Up' : chartPctChange >= 0 ? 'Uptrend' : chartPctChange >= -15 ? 'Downtrend' : 'Strong Down',
                    c: chartPctChange >= 0 ? '#22c55e' : '#ef4444' },
                  { l: 'KB Score', v: `${stock.kbRating}/100`, c: getScoreColor(stock.kbRating) },
                  { l: 'Momentum', v: `${stock.momentumScore}/100`, c: getScoreColor(stock.momentumScore) },
                  { l: '52W Position', v: `${(((currentPrice - stock.low52w) / (stock.high52w - stock.low52w)) * 100).toFixed(0)}%`, sub: 'Of 52W Range' },
                  { l: 'Volatility', v: stock.riskLevel, c: getRiskColor(stock.riskLevel) },
                ].map(item => <StatCard key={item.l} label={item.l} value={item.v} color={item.c} sub={item.sub} />)}
              </div>

              {/* Price + MA overlay chart */}
              <div className="glass-premium p-5">
                <h3 className="text-sm font-black text-white mb-4">Price vs Moving Averages</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={techData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={58}
                      tickFormatter={v => v >= 1000 ? `₦${(v/1000).toFixed(0)}K` : `₦${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="price" name="Price" stroke="#fff" strokeWidth={2} dot={{ fill: '#fff', r: 3 }} />
                    <Line type="monotone" dataKey="ma3" name="MA3" stroke="#D4AF37" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                    <Line type="monotone" dataKey="ma5" name="MA5" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-3 text-[10px]">
                  <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-white inline-block" /> Price</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-yellow-400 inline-block rounded" style={{ borderTop: '2px dashed #D4AF37' }} /> MA (3yr)</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-400 inline-block" /> MA (5yr)</span>
                </div>
              </div>

              {/* YoY returns bar */}
              <div className="glass-premium p-5">
                <h3 className="text-sm font-black text-white mb-4">Annual Returns (%)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={techData.filter(d => d.yoy !== 0)} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={35} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}%` : `${v}%`, 'Return']}
                      contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8 }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                    <Bar dataKey="yoy" name="Annual Return" radius={[3,3,0,0]}>
                      {techData.filter(d => d.yoy !== 0).map((entry, i) => (
                        <rect key={i} fill={entry.yoy >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* AI Technical Analysis */}
              <div className="glass-premium p-5">
                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                  <Brain size={13} className="text-yellow-400" /> AI Technical Analysis
                </h3>
                <AIBlock content={aiTech} loading={aiTechLoading} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
