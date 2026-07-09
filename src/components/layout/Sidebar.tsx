import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import {
  LayoutDashboard, TrendingUp, BarChart3, Star, Settings,
  Calculator, Newspaper, ChevronRight, Shield, BookOpen,
  PieChart, Target, LogOut, X, Wallet, Activity, Search, Crown, Landmark, Gem
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolios', label: 'Portfolios', icon: PieChart },
  { id: 'stocks', label: 'Stocks', icon: TrendingUp },
  { id: 'screener', label: 'Screener', icon: Search },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'portfolio-tracker', label: 'My Portfolio', icon: BarChart3 },
  { id: 'net-worth', label: 'Net Worth', icon: Gem },
  { id: 'bonds', label: 'Fixed Income', icon: Landmark },
  { id: 'dividends', label: 'Dividends', icon: Wallet },
  { id: 'news', label: 'Market News', icon: Newspaper },
  { id: 'ai-advisor', label: 'AI Advisor', icon: Activity },
  { id: 'calculator', label: 'Calculators', icon: Calculator },
  { id: 'trading', label: 'Trading Account', icon: Shield },
  { id: 'reports', label: 'Research', icon: BookOpen },
  { id: 'goals', label: 'Goal Planner', icon: Target },
  { id: 'subscription', label: 'Upgrade Plan', icon: Crown },
  { id: 'admin', label: 'Admin Panel', icon: Settings },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const ADMIN_EMAIL = 'admin@kbco.invest';

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen, user, logout } = useStore();
  // Admin tab is hidden for everyone except the admin account
  const isAdmin = user?.email === ADMIN_EMAIL || user?.isAdmin === true;
  const visibleNavItems = NAV_ITEMS.filter(item => item.id !== 'admin' || isAdmin);

  const handleNav = (id: string) => {
    onNavigate(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && window.innerWidth < 768 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0A0F1E 0%, #0D1530 100%)',
          borderRight: '1px solid rgba(212,175,55,0.12)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Real KB & Co logo — place the logo PNG at public/logo.png */}
            <img
              src="/logo.png"
              alt="KB & Co"
              className="h-10 w-auto flex-shrink-0"
              style={{ filter: 'brightness(0) invert(1)' }}
              onError={e => {
                /* fallback: hide the img and show the Crown badge */
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            {/* Crown fallback — hidden when logo loads */}
            <div
              className="w-9 h-9 rounded-xl items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)', display: 'none' }}
            >
              <Crown size={18} color="#0A0F1E" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-wider truncate" style={{ color: '#D4AF37' }}>KB & Co</div>
              <div className="text-[9px] text-gray-400 tracking-widest uppercase truncate">Corporate Investment</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Plan Badge */}
        {user && (
          <div className="mx-4 mt-4 px-3 py-2 rounded-xl" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-xs font-bold text-black">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-semibold text-white truncate" style={{ maxWidth: 120 }}>{user.name}</div>
                <div className="text-[10px] capitalize" style={{ color: '#D4AF37' }}>{user.plan} Plan</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 px-2 mb-2">Main Navigation</div>
          {visibleNavItems.slice(0, 9).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNav(item.id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 text-sm font-medium group ${
                  isActive ? 'sidebar-item-active' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} className={isActive ? '' : 'group-hover:text-yellow-400 transition-colors'} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {isActive && <ChevronRight size={12} />}
              </motion.button>
            );
          })}

          <div className="text-[10px] uppercase tracking-widest text-gray-500 px-2 mb-2 mt-4">Tools & More</div>
          {visibleNavItems.slice(9).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleNav(item.id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 text-sm font-medium group ${
                  isActive ? 'sidebar-item-active' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} className={isActive ? '' : 'group-hover:text-yellow-400 transition-colors'} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.id === 'ai-advisor' && <span className="badge-premium">AI</span>}
                {isActive && <ChevronRight size={12} />}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(212,175,55,0.12)' }}>
          {/* Live data badge */}
          <div className="flex items-center gap-1.5 mb-3 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22c55e' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#22c55e' }} />
            </span>
            <span className="text-[9px] text-gray-400">
              NGX live · auto-updates every 30 min
            </span>
          </div>
          <p className="text-[9px] text-gray-600 leading-tight mb-3">
            KB & Co Corporate Investment Limited provides investment research and educational information only. Past performance does not guarantee future returns.
          </p>
          {user && (
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-xs"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}
