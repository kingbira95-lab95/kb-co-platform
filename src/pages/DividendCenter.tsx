import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NGX_STOCKS, getTopDividendStocks } from '../data/stocks';
import { UPCOMING_DIVIDENDS } from '../data/news';
import { formatLargeNumber } from '../utils';
import { Wallet, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export default function DividendCenter() {
  const topDiv = getTopDividendStocks(10);
  const totalAnnualIncome = 285000;

  const divChartData = topDiv.map(s => ({
    symbol: s.symbol,
    yield: s.dividendYield,
    amount: s.dividendPerShare,
  }));

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet size={20} color="#D4AF37" />
          Dividend Center
        </h2>
        <p className="text-sm text-gray-400 mt-1">Track dividends, yields, and upcoming payments from NGX stocks</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Est. Annual Dividend Income', value: formatLargeNumber(totalAnnualIncome), icon: DollarSign, color: '#D4AF37' },
          { label: 'Avg Portfolio Yield', value: '7.2%', icon: TrendingUp, color: '#22c55e' },
          { label: 'Upcoming Dividends', value: UPCOMING_DIVIDENDS.length.toString(), icon: Calendar, color: '#3b82f6' },
          { label: 'Highest Yielder', value: `${topDiv[0]?.dividendYield.toFixed(2)}%`, icon: Wallet, color: '#a855f7' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500">{kpi.label}</span>
              <kpi.icon size={14} color={kpi.color} />
            </div>
            <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        {/* Yield Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top 10 NGX Dividend Yields</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={divChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="symbol" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} width={80} />
              <Tooltip contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [`${(v as number).toFixed(2)}%`, 'Dividend Yield']} />
              <Bar dataKey="yield" fill="#D4AF37" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Upcoming Dividends */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Upcoming Ex-Dividend Dates</h3>
          <div className="space-y-3">
            {UPCOMING_DIVIDENDS.map((div, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-black" style={{ background: '#D4AF37' }}>
                    {div.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{div.symbol}</div>
                    <div className="text-[10px] text-gray-500">{div.name}</div>
                  </div>
                </div>
                <div className="text-center hidden sm:block">
                  <div className="text-[10px] text-gray-500">Ex-Date</div>
                  <div className="text-xs text-gray-300">{new Date(div.exDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div className="text-center hidden sm:block">
                  <div className="text-[10px] text-gray-500">Pay Date</div>
                  <div className="text-xs text-gray-300">{new Date(div.payDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: '#D4AF37' }}>₦{div.amount.toFixed(2)}</div>
                  <div className="text-[10px] text-gray-500">{div.yield.toFixed(2)}% yield</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Full Dividend Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-semibold text-white">All NGX Dividend-Paying Stocks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-right px-3 py-3">Div/Share</th>
                <th className="text-right px-3 py-3">Yield</th>
                <th className="text-right px-3 py-3 hidden md:table-cell">Last Year</th>
                <th className="text-right px-3 py-3 hidden lg:table-cell">5yr Growth</th>
                <th className="text-right px-3 py-3">Consistency</th>
              </tr>
            </thead>
            <tbody>
              {NGX_STOCKS.filter(s => s.dividendPerShare > 0).sort((a, b) => b.dividendYield - a.dividendYield).map((stock) => {
                const years = stock.dividendHistory.length;
                const lastDiv = stock.dividendHistory[stock.dividendHistory.length - 1];
                const firstDiv = stock.dividendHistory[0];
                const divGrowth = firstDiv ? ((lastDiv?.dividend ?? 0) - firstDiv.dividend) / firstDiv.dividend * 100 : 0;
                const consistency = Math.min(100, years * 18);
                return (
                  <tr key={stock.symbol} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold text-black" style={{ background: '#D4AF37' }}>{stock.symbol.slice(0, 2)}</div>
                        <div>
                          <div className="text-xs font-bold text-white">{stock.symbol}</div>
                          <div className="text-[10px] text-gray-500">{stock.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-semibold" style={{ color: '#D4AF37' }}>₦{stock.dividendPerShare.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-green-400">{stock.dividendYield.toFixed(2)}%</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-400 hidden md:table-cell">₦{(lastDiv?.dividend ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-xs hidden lg:table-cell" style={{ color: divGrowth >= 0 ? '#22c55e' : '#ef4444' }}>
                      {divGrowth >= 0 ? '+' : ''}{divGrowth.toFixed(1)}%
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${consistency}%`, background: consistency > 70 ? '#22c55e' : consistency > 40 ? '#D4AF37' : '#ef4444' }} />
                        </div>
                        <span className="text-[10px] text-gray-500">{years}yr</span>
                      </div>
                    </td>
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
