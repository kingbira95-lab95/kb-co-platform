import { motion } from 'framer-motion';
import StockLogo from '../components/StockLogo';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useStore } from '../store';
import { NGX_STOCKS, getTopGainers, getTopLosers } from '../data/stocks';
import { MARKET_NEWS, UPCOMING_DIVIDENDS } from '../data/news';
import { formatPrice, formatLargeNumber, formatChangePct, formatTimeAgo } from '../utils';
import { TrendingUp, TrendingDown, Wallet, BarChart3, Bell, ArrowRight, Star } from 'lucide-react';

const PORTFOLIO_HISTORY = [
  { month: 'Jan', value: 2800000 },
  { month: 'Feb', value: 3100000 },
  { month: 'Mar', value: 2950000 },
  { month: 'Apr', value: 3400000 },
  { month: 'May', value: 3750000 },
  { month: 'Jun', value: 4200000 },
];

const ALLOCATION = [
  { name: 'Banking', value: 35, color: '#D4AF37' },
  { name: 'Consumer', value: 25, color: '#22c55e' },
  { name: 'Telecoms', value: 20, color: '#3b82f6' },
  { name: 'Agric', value: 12, color: '#a855f7' },
  { name: 'Others', value: 8, color: '#f59e0b' },
];

const CARD_ANIM = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, type: 'spring' as const, stiffness: 200 } }),
};

export default function Dashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { user, prices, portfolios, activePortfolioId, addToWatchlist } = useStore();
  const gainers = getTopGainers(5);
  const losers = getTopLosers(5);

  const portfolioValue = portfolios.find(p => p.id === activePortfolioId)?.holdings.reduce((sum, h) => {
    return sum + (prices[h.symbol]?.price ?? h.buyPrice) * h.shares;
  }, 0) ?? 4200000;

  const totalInvested = 3100000;
  const totalGain = portfolioValue - totalInvested;
  const gainPct = ((portfolioValue - totalInvested) / totalInvested) * 100;
  const dividendIncome = 285000;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-bold text-white">
          Welcome back, <span className="gold-text">{user?.name?.split(' ')[0] ?? 'Investor'}</span> 👋
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">Here's your market overview for {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Portfolio Value',
            value: formatLargeNumber(portfolioValue),
            sub: `${gainPct > 0 ? '+' : ''}${gainPct.toFixed(2)}% all time`,
            icon: BarChart3,
            color: '#D4AF37',
            positive: true,
          },
          {
            label: 'Total Gain/Loss',
            value: formatLargeNumber(totalGain),
            sub: `From ₦${formatLargeNumber(totalInvested)} invested`,
            icon: TrendingUp,
            color: '#22c55e',
            positive: totalGain > 0,
          },
          {
            label: 'Dividend Income',
            value: formatLargeNumber(dividendIncome),
            sub: 'Annual est. income',
            icon: Wallet,
            color: '#a855f7',
            positive: true,
          },
          {
            label: 'Market Cap (NGX)',
            value: '₦62.4T',
            sub: '+1.2% today',
            icon: Bell,
            color: '#3b82f6',
            positive: true,
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={CARD_ANIM}
            initial="hidden"
            animate="show"
            className="glass-card glass-card-hover p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-gray-400 leading-tight">{card.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${card.color}18` }}>
                <card.icon size={15} color={card.color} />
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1">{card.value}</div>
            <div className={`text-xs ${card.positive ? 'text-green-400' : 'text-red-400'}`}>{card.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Portfolio Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 xl:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Portfolio Performance</h3>
              <p className="text-xs text-gray-500 mt-0.5">6-month growth track</p>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-sm font-semibold">
              <TrendingUp size={14} />
              +35.2%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PORTFOLIO_HISTORY}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#D4AF37' }}
                formatter={(v: unknown) => [`₦${((v as number)/1000000).toFixed(2)}M`, 'Portfolio Value']}
              />
              <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} fill="url(#portfolioGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Allocation Pie */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Sector Allocation</h3>
          <p className="text-xs text-gray-500 mb-4">Portfolio diversification</p>
          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie data={ALLOCATION} cx={80} cy={80} innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {ALLOCATION.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2 mt-2">
            {ALLOCATION.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Gainers / Losers + News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Top Gainers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Top Gainers</h3>
            <TrendingUp size={14} className="text-green-400" />
          </div>
          <div className="space-y-3">
            {gainers.map((stock) => {
              const live = prices[stock.symbol];
              const pct = live?.changePct ?? stock.changePct;
              return (
                <div key={stock.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StockLogo symbol={stock.symbol} sector={stock.sector} size={28} />
                    <div>
                      <div className="text-xs font-semibold text-white">{stock.symbol}</div>
                      <div className="text-[10px] text-gray-500 truncate" style={{ maxWidth: 90 }}>{stock.sector}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white">₦{formatPrice(live?.price ?? stock.price)}</div>
                    <div className="text-[10px] text-green-400">+{pct.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Losers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Top Losers</h3>
            <TrendingDown size={14} className="text-red-400" />
          </div>
          <div className="space-y-3">
            {losers.map((stock) => {
              const live = prices[stock.symbol];
              const pct = live?.changePct ?? stock.changePct;
              return (
                <div key={stock.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StockLogo symbol={stock.symbol} sector={stock.sector} size={28} />
                    <div>
                      <div className="text-xs font-semibold text-white">{stock.symbol}</div>
                      <div className="text-[10px] text-gray-500 truncate" style={{ maxWidth: 90 }}>{stock.sector}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white">₦{formatPrice(live?.price ?? stock.price)}</div>
                    <div className="text-[10px] text-red-400">{formatChangePct(pct)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming Dividends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Upcoming Dividends</h3>
            <Wallet size={14} className="text-yellow-400" />
          </div>
          <div className="space-y-3">
            {UPCOMING_DIVIDENDS.slice(0, 5).map((div, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">{div.symbol}</div>
                  <div className="text-[10px] text-gray-500">Ex: {new Date(div.exDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold" style={{ color: '#D4AF37' }}>₦{div.amount.toFixed(2)}</div>
                  <div className="text-[10px] text-gray-500">{div.yield.toFixed(2)}% yield</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Market News */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Latest Market News</h3>
          <button
            onClick={() => onNavigate('news')}
            className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: '#D4AF37' }}
          >
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MARKET_NEWS.slice(0, 6).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 + i * 0.05 }}
              className="p-3 rounded-xl transition-all hover:bg-white/5 cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  item.sentiment === 'positive' ? 'bg-green-400/15 text-green-400' :
                  item.sentiment === 'negative' ? 'bg-red-400/15 text-red-400' :
                  'bg-gray-600/30 text-gray-400'
                }`}>
                  {item.category}
                </span>
                <span className="text-[10px] text-gray-600">{formatTimeAgo(item.publishedAt)}</span>
              </div>
              <p className="text-xs text-gray-300 font-medium leading-relaxed line-clamp-2">{item.title}</p>
              <p className="text-[10px] text-gray-500 mt-1">{item.source}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Watchlist Quick View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="glass-card p-5 mt-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Quick Watchlist</h3>
          <button onClick={() => onNavigate('watchlist')} className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#D4AF37' }}>
            Manage <ArrowRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <th className="text-left pb-2 pr-4">Symbol</th>
                <th className="text-right pb-2 pr-4">Price</th>
                <th className="text-right pb-2 pr-4">Change</th>
                <th className="text-right pb-2 pr-4">Mkt Cap</th>
                <th className="text-right pb-2">Div Yield</th>
              </tr>
            </thead>
            <tbody>
              {NGX_STOCKS.slice(0, 8).map((stock) => {
                const live = prices[stock.symbol];
                const price = live?.price ?? stock.price;
                const pct = live?.changePct ?? stock.changePct;
                const isUp = pct >= 0;
                return (
                  <tr
                    key={stock.symbol}
                    className="border-b hover:bg-white/[0.02] transition-colors cursor-pointer"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => addToWatchlist(stock.symbol)} className="text-gray-600 hover:text-yellow-400 transition-colors">
                          <Star size={12} />
                        </button>
                        <div>
                          <div className="font-semibold text-white text-xs">{stock.symbol}</div>
                          <div className="text-[10px] text-gray-500 truncate" style={{ maxWidth: 100 }}>{stock.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-xs text-white font-medium">₦{formatPrice(price)}</td>
                    <td className={`py-2.5 pr-4 text-right text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {isUp ? '+' : ''}{pct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 pr-4 text-right text-xs text-gray-400">{formatLargeNumber(stock.marketCap)}</td>
                    <td className="py-2.5 text-right text-xs text-yellow-400">{stock.dividendYield.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
