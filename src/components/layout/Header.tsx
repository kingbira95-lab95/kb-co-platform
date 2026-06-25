import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { Bell, Menu, Search, X, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { NGX_STOCKS } from '../../data/stocks';
import { formatPrice, formatChangePct } from '../../utils';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { toggleSidebar, notifications, unreadCount, markAllAsRead, markAsRead, prices } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof NGX_STOCKS>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length >= 1) {
      const q = searchQuery.toUpperCase();
      setSearchResults(
        NGX_STOCKS.filter(s =>
          s.symbol.includes(q) || s.name.toUpperCase().includes(q)
        ).slice(0, 6)
      );
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery('');
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    portfolios: 'Investment Portfolios',
    stocks: 'Stocks',
    screener: 'Stock Screener',
    watchlist: 'Watchlist',
    'portfolio-tracker': 'My Portfolio',
    dividends: 'Dividend Center',
    news: 'Market News',
    'ai-advisor': 'AI Investment Advisor',
    calculator: 'Calculators',
    trading: 'Trading Account',
    reports: 'Research Reports',
    goals: 'Goal Planner',
    admin: 'Admin Panel',
  };

  const timeStr = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
      style={{
        background: 'rgba(10,15,30,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
      }}
    >
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-white truncate">{pageTitles[currentPage] || 'Dashboard'}</h1>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock size={10} className="text-gray-500" />
          <span className="text-[10px] text-gray-500">NGT {timeStr} · Market Open</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      {/* Search */}
      <div ref={searchRef} className="relative hidden sm:block">
        {showSearch ? (
          <motion.div
            initial={{ width: 40, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            className="relative"
          >
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search stocks..."
              className="w-full pl-8 pr-8 py-2 text-sm text-white rounded-xl outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
            />
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={12} />
            </button>

            {/* Results */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 w-full rounded-xl shadow-2xl overflow-hidden"
                  style={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', zIndex: 100 }}
                >
                  {searchResults.map(stock => {
                    const livePrice = prices[stock.symbol];
                    const isUp = (livePrice?.changePct ?? stock.changePct) >= 0;
                    return (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          onNavigate('stocks');
                          setSearchQuery('');
                          setShowSearch(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <div className="text-left">
                          <div className="text-sm font-semibold text-white">{stock.symbol}</div>
                          <div className="text-[10px] text-gray-400 truncate" style={{ maxWidth: 120 }}>{stock.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">₦{formatPrice(livePrice?.price ?? stock.price)}</div>
                          <div className={`text-[10px] flex items-center gap-0.5 justify-end ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {formatChangePct(livePrice?.changePct ?? stock.changePct)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black"
              style={{ background: '#D4AF37' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', zIndex: 100 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
                <span className="text-sm font-semibold text-white">Notifications</span>
                <button onClick={markAllAsRead} className="text-[11px]" style={{ color: '#D4AF37' }}>
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => markAsRead(n.id)}
                      className={`px-4 py-3 border-b cursor-pointer hover:bg-white/5 transition-colors ${!n.read ? 'bg-white/[0.02]' : ''}`}
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === 'dividend' ? 'bg-yellow-400' :
                          n.type === 'price' ? 'bg-blue-400' :
                          n.type === 'news' ? 'bg-purple-400' : 'bg-green-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{n.title}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{n.message}</div>
                          <div className="text-[10px] text-gray-600 mt-1">
                            {new Date(n.timestamp).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#D4AF37' }} />}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
