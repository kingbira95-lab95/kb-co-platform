import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useStore } from '../store';
import { NGX_STOCKS } from '../data/stocks';
import { formatPrice, formatLargeNumber, getRiskColor } from '../utils';
import { Star, X, TrendingUp, TrendingDown, Bell, Plus, ArrowUp, ArrowDown, Check } from 'lucide-react';
import StockLogo from '../components/StockLogo';

const PCT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Watchlist() {
  const { items, removeFromWatchlist, addToWatchlist, prices, setWatchlistAlert } = useStore();
  const [openAlertSymbol, setOpenAlertSymbol] = useState<string | null>(null);
  const [draftUp, setDraftUp] = useState<number | null>(null);
  const [draftDown, setDraftDown] = useState<number | null>(null);

  const watchedStocks = items
    .map(item => {
      const stock = NGX_STOCKS.find(s => s.symbol === item.symbol);
      return stock ? { ...stock, ...item } : null;
    })
    .filter(Boolean) as (typeof NGX_STOCKS[0] & typeof items[0])[];

  const SUGGESTED = NGX_STOCKS.filter(s => !items.some(i => i.symbol === s.symbol)).slice(0, 5);

  const openAlertPanel = (symbol: string, alertUp?: number, alertDown?: number) => {
    if (openAlertSymbol === symbol) {
      setOpenAlertSymbol(null);
      return;
    }
    setDraftUp(alertUp ?? null);
    setDraftDown(alertDown ?? null);
    setOpenAlertSymbol(symbol);
  };

  const handleSave = (symbol: string) => {
    setWatchlistAlert(symbol, draftUp ?? undefined, draftDown ?? undefined);
    setOpenAlertSymbol(null);
  };

  const handleClear = (symbol: string) => {
    setWatchlistAlert(symbol, undefined, undefined);
    setOpenAlertSymbol(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white">My Watchlist</h2>
        <p className="text-sm text-gray-400 mt-1">
          {items.length} stocks · Track your favorites with price and dividend alerts
        </p>
      </motion.div>

      {watchedStocks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Star size={40} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-base font-semibold text-white mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-gray-500">Add stocks from the Screener or Stock pages to track them here.</p>
        </div>
      ) : (
        <div className="space-y-1 mb-8">
          <AnimatePresence>
            {watchedStocks.map((stock, i) => {
              const live = prices[stock.symbol];
              const price = live?.price ?? stock.price;
              const pct = live?.changePct ?? stock.changePct;
              const isUp = pct >= 0;
              const hasAlert = !!(stock.alertUp || stock.alertDown);
              const isAlertOpen = openAlertSymbol === stock.symbol;

              return (
                <div key={stock.symbol}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 flex items-center justify-between gap-3"
                    style={{ borderRadius: isAlertOpen ? '12px 12px 0 0' : undefined }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <StockLogo symbol={stock.symbol} sector={stock.sector} website={stock.website} size={36} />
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
                      {/* Alert badge summary */}
                      {hasAlert && (
                        <div className="hidden sm:flex items-center gap-1 text-[10px]">
                          {stock.alertUp && (
                            <span className="px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                              ↑{stock.alertUp}%
                            </span>
                          )}
                          {stock.alertDown && (
                            <span className="px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                              ↓{stock.alertDown}%
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => openAlertPanel(stock.symbol, stock.alertUp, stock.alertDown)}
                        title="Set price alert"
                        className="p-1.5 rounded-lg transition-colors"
                        style={hasAlert || isAlertOpen
                          ? { color: '#D4AF37', background: 'rgba(212,175,55,0.12)' }
                          : { color: '#6b7280' }}
                      >
                        <Bell size={14} />
                      </button>
                      <button
                        onClick={() => removeFromWatchlist(stock.symbol)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>

                  {/* Alert config panel */}
                  <AnimatePresence>
                    {isAlertOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          overflow: 'hidden',
                          background: 'rgba(13,21,48,0.95)',
                          border: '1px solid rgba(212,175,55,0.2)',
                          borderTop: '1px solid rgba(212,175,55,0.1)',
                          borderRadius: '0 0 12px 12px',
                          marginBottom: 4,
                        }}
                      >
                        <div className="p-4">
                          <p className="text-[11px] text-gray-500 mb-4">
                            Alert fires once when price moves from ₦{formatPrice(prices[stock.symbol]?.price ?? stock.price)} by the selected %.
                          </p>

                          {/* Goes Up selector */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2.5">
                              <ArrowUp size={13} className="text-green-400" />
                              <span className="text-xs font-semibold text-white">Alert if price goes UP</span>
                              {draftUp && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                                  +{draftUp}%
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {PCT_OPTIONS.map(p => (
                                <button
                                  key={p}
                                  onClick={() => setDraftUp(draftUp === p ? null : p)}
                                  className="w-10 h-8 rounded-lg text-xs font-medium transition-all"
                                  style={{
                                    background: draftUp === p ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${draftUp === p ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                    color: draftUp === p ? '#22c55e' : '#9ca3af',
                                  }}
                                >
                                  {p}%
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Goes Down selector */}
                          <div className="mb-5">
                            <div className="flex items-center gap-2 mb-2.5">
                              <ArrowDown size={13} className="text-red-400" />
                              <span className="text-xs font-semibold text-white">Alert if price goes DOWN</span>
                              {draftDown && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                                  -{draftDown}%
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {PCT_OPTIONS.map(p => (
                                <button
                                  key={p}
                                  onClick={() => setDraftDown(draftDown === p ? null : p)}
                                  className="w-10 h-8 rounded-lg text-xs font-medium transition-all"
                                  style={{
                                    background: draftDown === p ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${draftDown === p ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                    color: draftDown === p ? '#ef4444' : '#9ca3af',
                                  }}
                                >
                                  {p}%
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(stock.symbol)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-black transition-all"
                              style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}
                            >
                              <Check size={12} />
                              Save Alert
                            </button>
                            {hasAlert && (
                              <button
                                onClick={() => handleClear(stock.symbol)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                              >
                                Remove Alert
                              </button>
                            )}
                            <button
                              onClick={() => setOpenAlertSymbol(null)}
                              className="ml-auto px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card glass-card-hover p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <StockLogo symbol={stock.symbol} sector={stock.sector} website={stock.website} size={28} />
                      <div>
                        <div className="text-xs font-bold text-white">{stock.symbol}</div>
                        <div className="text-[10px] text-gray-500">{stock.sector}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addToWatchlist(stock.symbol)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all"
                      style={{ color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
                    >
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