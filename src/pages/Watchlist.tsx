import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { NGX_STOCKS } from '../data/stocks';
import { formatPrice, formatLargeNumber, getRiskColor } from '../utils';
import { Star, X, TrendingUp, TrendingDown, Bell, Plus } from 'lucide-react';

export default function Watchlist() {
  const { items, removeFromWatchlist, addToWatchlist, prices, addNotification } = useStore();
  const watchedStocks = items.map(item => {
    const stock = NGX_STOCKS.find(s => s.symbol === item.symbol);
    return stock ? { ...stock, ...item } : null;
  }).filter(Boolean);

  const SUGGESTED = NGX_STOCKS.filter(s => !items.some(i => i.symbol === s.symbol)).slice(0, 5);

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white">My Watchlist</h2>
        <p className="text-sm text-gray-400 mt-1">{items.length} stocks · Track your favorites with price and dividend alerts</p>
      </motion.div>

      {watchedStocks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Star size={40} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-base font-semibold text-white mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-gray-500">Add stocks from the Screener or Stock pages to track them here.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          <AnimatePresence>
            {watchedStocks.map((stock: any, i: number) => {
              const live = prices[stock.symbol];
              const price = live?.price ?? stock.price;
              const pct = live?.changePct ?? stock.changePct;
              const isUp = pct >= 0;
              return (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-black flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white">{stock.symbol}</div>
                      <div className="text-[11px] text-gray-500 truncate">{stock.name}</div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-8 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Sector</div>
                      <div className="text-xs text-gray-300">{stock.sector}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Mkt Cap</div>
                      <div className="text-xs text-gray-300">{formatLargeNumber(stock.marketCap)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Div Yield</div>
                      <div className="text-xs text-yellow-400">{stock.dividendYield.toFixed(2)}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">₦{formatPrice(price)}</div>
                      <div className={`text-xs font-medium flex items-center justify-end gap-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isUp ? '+' : ''}{pct.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${getRiskColor(stock.riskLevel)}15`, color: getRiskColor(stock.riskLevel) }}>
                        {stock.riskLevel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => addNotification({ type: 'alert', title: 'Alert Set', message: `Price alert set for ${stock.symbol}`, symbol: stock.symbol })}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                    >
                      <Bell size={14} />
                    </button>
                    <button onClick={() => removeFromWatchlist(stock.symbol)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Suggested */}
      {SUGGESTED.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Suggested Stocks to Watch</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUGGESTED.map((stock, i) => {
              const live = prices[stock.symbol];
              const price = live?.price ?? stock.price;
              const pct = live?.changePct ?? stock.changePct;
              const isUp = pct >= 0;
              return (
                <motion.div key={stock.symbol} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card glass-card-hover p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-black" style={{ background: '#D4AF37' }}>
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{stock.symbol}</div>
                        <div className="text-[10px] text-gray-500">{stock.sector}</div>
                      </div>
                    </div>
                    <button onClick={() => addToWatchlist(stock.symbol)} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all" style={{ color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}>
                      <Plus size={10} />
                      Watch
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-lg font-bold text-white">₦{formatPrice(price)}</div>
                      <div className={`text-xs font-medium flex items-center gap-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isUp ? '+' : ''}{pct.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">Div Yield</div>
                      <div className="text-xs text-yellow-400 font-semibold">{stock.dividendYield.toFixed(2)}%</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
