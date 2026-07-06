import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { INVESTMENT_PORTFOLIOS } from '../data/portfolios';
import { NGX_STOCKS } from '../data/stocks';
import { useStore } from '../store';
import { formatPrice, formatLargeNumber, getRiskColor } from '../utils';
import type { Portfolio } from '../types';
import { Shield, Zap, Crown, ChevronRight, X, Plus, Brain, BarChart3, RefreshCw } from 'lucide-react';
import StockLogo from '../components/StockLogo';

const PORTFOLIO_ICONS: Record<string, React.ElementType> = {
  premium: Crown,
  safe: Shield,
  balanced: BarChart3,
  highYield: Zap,
};

const PERF_DATA = [
  { year: '2021', premium: 42, safe: 28, balanced: 51, highYield: 108 },
  { year: '2022', premium: 18, safe: 12, balanced: 24, highYield: 38 },
  { year: '2023', premium: 56, safe: 34, balanced: 68, highYield: 142 },
  { year: '2024', premium: 34, safe: 22, balanced: 42, highYield: 89 },
  { year: '2025', premium: 28, safe: 18, balanced: 35, highYield: 72 },
  { year: '2026', premium: 22, safe: 14, balanced: 28, highYield: 58 },
];

function PortfolioCard({ portfolio, onClick }: { portfolio: Portfolio; onClick: () => void }) {
  const Icon = PORTFOLIO_ICONS[portfolio.type] || Crown;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="glass-card p-5 cursor-pointer relative overflow-hidden"
      style={{ borderColor: `${portfolio.color}25` }}
    >
      {/* Glow bg */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 20%, ${portfolio.color}, transparent 60%)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${portfolio.color}20` }}>
            <Icon size={18} color={portfolio.color} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{portfolio.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${getRiskColor(portfolio.riskLevel)}15`, color: getRiskColor(portfolio.riskLevel) }}>
              {portfolio.riskLevel} Risk
            </span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-500 mt-1" />
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed mb-4 line-clamp-2">{portfolio.description}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <div className="text-base font-bold text-green-400">+{portfolio.totalReturn.toFixed(0)}%</div>
          <div className="text-[10px] text-gray-500">Total Return</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold" style={{ color: portfolio.color }}>{portfolio.annualReturn.toFixed(1)}%</div>
          <div className="text-[10px] text-gray-500">Ann. Return</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold text-white">{portfolio.stocks.length}</div>
          <div className="text-[10px] text-gray-500">Stocks</div>
        </div>
      </div>

      {/* Mini stock list */}
      <div className="flex flex-wrap gap-1 mb-4">
        {portfolio.stocks.slice(0, 5).map(ps => (
          <span key={ps.symbol} className="text-[10px] px-2 py-0.5 rounded-lg text-gray-300" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {ps.symbol}
          </span>
        ))}
        {portfolio.stocks.length > 5 && (
          <span className="text-[10px] px-2 py-0.5 rounded-lg text-gray-500" style={{ background: 'rgba(255,255,255,0.04)' }}>
            +{portfolio.stocks.length - 5}
          </span>
        )}
      </div>

      {/* Min investment */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="text-xs text-gray-500">Min Investment</div>
        <div className="text-xs font-semibold" style={{ color: portfolio.color }}>
          {formatLargeNumber(portfolio.minInvestment)}
        </div>
      </div>
    </motion.div>
  );
}

function PortfolioDetail({ portfolio, onClose }: { portfolio: Portfolio; onClose: () => void }) {
  const { prices, user, addHolding, activePortfolioId, addNotification } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'stocks' | 'performance' | 'ai'>('overview');
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);

  const portfolioStocks = portfolio.stocks.map(ps => {
    const stock = NGX_STOCKS.find(s => s.symbol === ps.symbol);
    if (!stock) return null;
    const currentPrice = prices[ps.symbol]?.price ?? stock.price;
    const change = prices[ps.symbol]?.changePct ?? stock.changePct;
    // Allocation based on weight and minInvestment
    const allocation = portfolio.minInvestment * (ps.weight / 100);
    const shares = Math.floor(allocation / currentPrice);
    const value = shares * currentPrice;
    return { ...stock, weight: ps.weight, currentPrice, changePct: change, allocation, shares, value };
  }).filter(Boolean) as Array<{
    symbol: string; name: string; sector: string; weight: number;
    currentPrice: number; changePct: number; allocation: number;
    shares: number; value: number; dividendYield: number; website: string;
  }>;

  // Live total portfolio value
  const totalValue = portfolioStocks.reduce((sum, s) => sum + s.value, 0);
  const totalChange = portfolioStocks.reduce((sum, s) => sum + (s.changePct * s.weight / 100), 0);
  const totalWithFees = totalValue * 1.07;

  const handleBuyAll = () => {
    if (!user?.kycStatus || user.kycStatus !== 'verified') {
      addNotification({ type: 'system', title: 'Trading Account Required', message: 'Complete KYC verification to buy stocks. Go to Trading Account.', urgent: true });
      return;
    }
    if (!activePortfolioId) {
      addNotification({ type: 'system', title: 'No Portfolio Selected', message: 'Create a portfolio in My Portfolio first.', urgent: false });
      return;
    }
    setBuying(true);
    setTimeout(() => {
      portfolioStocks.forEach(s => {
        if (s.shares > 0) {
          addHolding(activePortfolioId, { symbol: s.symbol, shares: s.shares, buyPrice: s.currentPrice, buyDate: new Date().toISOString() });
        }
      });
      addNotification({ type: 'portfolio', title: `${portfolio.name} Purchased!`, message: `Bought ${portfolioStocks.length} stocks for ₦${totalWithFees.toLocaleString('en-NG', { minimumFractionDigits: 2 })} (incl. 7% fees)`, urgent: true });
      setBuying(false);
      setBought(true);
    }, 1500);
  };

  const RADAR_DATA = [
    { subject: 'Growth', value: portfolio.type === 'highYield' ? 92 : portfolio.type === 'balanced' ? 72 : 58 },
    { subject: 'Income', value: portfolio.type === 'safe' ? 88 : portfolio.type === 'premium' ? 82 : 68 },
    { subject: 'Safety', value: portfolio.type === 'safe' ? 90 : portfolio.type === 'premium' ? 80 : portfolio.type === 'balanced' ? 65 : 42 },
    { subject: 'Value', value: portfolio.type === 'premium' ? 78 : portfolio.type === 'balanced' ? 70 : 62 },
    { subject: 'Momentum', value: portfolio.type === 'highYield' ? 88 : portfolio.type === 'balanced' ? 74 : 65 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
        style={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)' }}
      >
        {/* Detail Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
          <div>
            <h2 className="text-base font-bold text-white">{portfolio.name}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs" style={{ color: getRiskColor(portfolio.riskLevel) }}>{portfolio.riskLevel} Risk · {portfolio.stocks.length} Stocks</span>
              <span className="text-xs text-gray-600">·</span>
              <motion.span key={totalValue} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs font-bold text-yellow-400">
                Live: ₦{formatLargeNumber(totalValue)}
              </motion.span>
              <span className={`text-[10px] font-semibold ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {(['overview', 'stocks', 'performance', 'ai'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-medium capitalize rounded-t-lg transition-all ${activeTab === tab ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab === 'ai' ? 'AI Analysis' : tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Portfolio Description</h4>
                <p className="text-sm text-gray-300 leading-relaxed">{portfolio.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Return', value: `+${portfolio.totalReturn.toFixed(1)}%`, color: '#22c55e' },
                    { label: 'Annual Return', value: `${portfolio.annualReturn.toFixed(1)}%`, color: '#D4AF37' },
                    { label: 'Min Investment', value: `₦${formatLargeNumber(portfolio.minInvestment)}`, color: '#3b82f6' },
                    { label: 'No. of Stocks', value: portfolio.stocks.length.toString(), color: '#a855f7' },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-base font-bold" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
                {/* Fee disclosure */}
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
                  <div className="text-[10px] font-semibold text-yellow-400 uppercase tracking-wide mb-1.5">Fee Structure</div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Onboarding Fee</span><span className="text-yellow-300 font-semibold">2%</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 mt-0.5">
                    <span>Annual Management Fee</span><span className="text-yellow-300 font-semibold">5%</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-yellow-400 mt-1.5 pt-1.5 border-t" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
                    <span>Total Fees</span><span>7%</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Risk-Return Profile</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Radar dataKey="value" stroke={portfolio.color} fill={portfolio.color} fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'stocks' && (
            <div className="space-y-2">
              {/* Total row */}
              <div className="flex justify-between items-center px-3 py-2 rounded-xl mb-1"
                style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                <span className="text-xs font-bold text-yellow-400">Total Portfolio Value</span>
                <div className="flex items-center gap-3">
                  <motion.span key={totalValue} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-sm font-black text-yellow-400">
                    ₦{formatLargeNumber(totalValue)}
                  </motion.span>
                  <span className={`text-xs font-bold ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              {portfolioStocks.map((stock, i) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    <StockLogo symbol={stock.symbol} sector={stock.sector} website={stock.website} size={32} />
                    <div>
                      <div className="text-sm font-semibold text-white">{stock.symbol}</div>
                      <div className="text-[10px] text-gray-500">{stock.sector}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                      <div className="text-[10px] text-gray-500">Weight</div>
                      <div className="text-xs font-bold text-white">{stock.weight}%</div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-[10px] text-gray-500">Shares</div>
                      <div className="text-xs font-semibold text-white">{stock.shares.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">Price</div>
                      <motion.div key={stock.currentPrice} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-xs font-bold text-white">₦{formatPrice(stock.currentPrice)}</motion.div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">Change</div>
                      <div className={`text-xs font-bold ${stock.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-[10px] text-gray-500">Value</div>
                      <div className="text-xs font-semibold text-yellow-400">{formatLargeNumber(stock.value)}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'performance' && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-4">Annual Returns Comparison</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={PERF_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, fontSize: 12 }}
                    formatter={(v: unknown) => [`${v}%`]}
                  />
                  <Bar dataKey={portfolio.type === 'premium' ? 'premium' : portfolio.type === 'safe' ? 'safe' : portfolio.type === 'balanced' ? 'balanced' : 'highYield'}
                    fill={portfolio.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                <Brain size={20} color="#D4AF37" className="flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-yellow-400 mb-2">AI Portfolio Commentary</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{portfolio.aiCommentary}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: 'Bull Case', content: 'Nigerian economic recovery, naira stabilization, and banking sector recapitalization will drive strong earnings growth in 2026-2027.', color: '#22c55e' },
                  { title: 'Bear Case', content: 'Currency devaluation risk, inflation pressure, and global commodity price swings could compress margins in near term.', color: '#ef4444' },
                  { title: 'Key Risks', content: 'Regulatory changes, oil price volatility, political uncertainty ahead of 2027 elections, and CBN monetary policy shifts.', color: '#f59e0b' },
                  { title: 'Opportunities', content: 'Consumer spending recovery, fintech growth, agricultural expansion, and infrastructure spending create significant tailwinds.', color: '#3b82f6' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${item.color}25` }}>
                    <div className="text-xs font-bold mb-2" style={{ color: item.color }}>{item.title}</div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(212,175,55,0.12)', background: '#0D1530' }}>
          {/* Fee breakdown */}
          <div className="mb-3 p-3 rounded-xl space-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Stocks value ({portfolio.stocks.length} stocks)</span>
              <span className="text-[11px] text-gray-300">₦{formatLargeNumber(totalValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Onboarding fee (2%)</span>
              <span className="text-[11px] text-yellow-600">+₦{formatLargeNumber(totalValue * 0.02)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Annual management fee (5%)</span>
              <span className="text-[11px] text-yellow-600">+₦{formatLargeNumber(totalValue * 0.05)}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-xs font-bold text-white">Total to Pay</span>
              <motion.span key={totalWithFees} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-sm font-black text-yellow-400">
                ₦{formatLargeNumber(totalWithFees)}
              </motion.span>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleBuyAll}
              disabled={buying || bought}
              className="flex-1 py-3 rounded-xl text-sm font-black text-black transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: bought ? 'rgba(34,197,94,0.8)' : `linear-gradient(135deg, ${portfolio.color}, ${portfolio.color}CC)` }}
            >
              {buying ? (
                <><RefreshCw size={14} className="animate-spin" /> Processing...</>
              ) : bought ? (
                <><Plus size={14} /> Portfolio Bought!</>
              ) : (
                <><Plus size={14} /> Buy All Stocks · ₦{formatLargeNumber(totalWithFees)}</>
              )}
            </motion.button>
            <button onClick={onClose} className="px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Close
            </button>
          </div>
          {!user?.kycStatus || user.kycStatus !== 'verified' ? (
            <p className="text-[10px] text-gray-600 text-center mt-2">⚠ KYC verification required to purchase stocks</p>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function InvestmentPortfolios() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white">Investment Portfolios</h2>
        <p className="text-sm text-gray-400 mt-1">Curated portfolios by KB & Co's expert team — built for every risk profile</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Avg. Annual Return', value: '30.2%', color: '#22c55e' },
          { label: 'Total Portfolios', value: '4', color: '#D4AF37' },
          { label: 'Total Stocks Covered', value: '25+', color: '#3b82f6' },
          { label: 'Best Performer', value: '+1,124%', color: '#a855f7' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4 text-center">
            <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5 mb-8">
        <h3 className="text-sm font-semibold text-white mb-4">All Portfolio Returns Comparison (2021-2026)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={PERF_DATA} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, fontSize: 12 }}
              formatter={(v: unknown, name: unknown) => [`${v}%`, (name as string).charAt(0).toUpperCase() + (name as string).slice(1)]}
            />
            <Bar dataKey="premium" fill="#D4AF37" radius={[3, 3, 0, 0]} name="Premium Yield" />
            <Bar dataKey="safe" fill="#22c55e" radius={[3, 3, 0, 0]} name="Safe Yield" />
            <Bar dataKey="balanced" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Balanced Yield" />
            <Bar dataKey="highYield" fill="#ef4444" radius={[3, 3, 0, 0]} name="High Yield" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-2 justify-center">
          {[['Premium Yield', '#D4AF37'], ['Safe Yield', '#22c55e'], ['Balanced Yield', '#3b82f6'], ['High Yield', '#ef4444']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: c as string }} />
              <span className="text-[11px] text-gray-400">{l}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Portfolio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {INVESTMENT_PORTFOLIOS.map((portfolio, i) => (
          <motion.div
            key={portfolio.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
          >
            <PortfolioCard portfolio={portfolio} onClick={() => setSelectedPortfolio(portfolio)} />
          </motion.div>
        ))}
      </div>

      {/* Legal Disclaimer */}
      <div className="mt-8 p-4 rounded-xl text-xs text-gray-500 leading-relaxed" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <strong className="text-gray-400">Risk Disclaimer:</strong> KB & Co Corporate Investment Limited provides investment research and educational information only. Investments are subject to market risks. Past performance does not guarantee future returns. Always consult a financial advisor before investing.
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPortfolio && (
          <PortfolioDetail portfolio={selectedPortfolio} onClose={() => setSelectedPortfolio(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
