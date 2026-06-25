import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, PieChart, Star, BarChart3, Search } from 'lucide-react';

const MOB_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'stocks', label: 'Stocks', icon: TrendingUp },
  { id: 'screener', label: 'Screener', icon: Search },
  { id: 'portfolios', label: 'Portfolios', icon: PieChart },
  { id: 'portfolio-tracker', label: 'My Portfolio', icon: BarChart3 },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
];

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center px-2 py-2"
      style={{
        background: 'rgba(10,15,30,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(212,175,55,0.12)',
      }}
    >
      {MOB_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="mobile-nav-item transition-all duration-200 relative"
            style={{ color: isActive ? '#D4AF37' : '#6b7280' }}
          >
            {isActive && (
              <motion.div
                layoutId="mobile-active"
                className="absolute inset-0 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.1)' }}
              />
            )}
            <Icon size={18} />
            <span className="text-[9px] font-medium mt-0.5 truncate w-full text-center">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
