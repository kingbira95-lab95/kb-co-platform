import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store';
import { NGX_STOCKS } from './data/stocks';
import { subscribeToPriceStream } from './services/api';
import { useLiveMarket } from './hooks/useLiveMarket';
import './index.css';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import Ticker from './components/common/Ticker';
import NotificationToasts from './components/common/NotificationToast';

// Pages
import Auth from './pages/Auth';
import OAuthCallback from './pages/OAuthCallback';
import PaymentVerify from './pages/PaymentVerify';
import Dashboard from './pages/Dashboard';
import InvestmentPortfolios from './pages/InvestmentPortfolios';
import Stocks from './pages/Stocks';
import StockProfile from './pages/StockProfile';
import Screener from './pages/Screener';
import Watchlist from './pages/Watchlist';
import PortfolioTracker from './pages/PortfolioTracker';
import DividendCenter from './pages/DividendCenter';
import News from './pages/News';
import AIAdvisor from './pages/AIAdvisor';
import Calculator from './pages/Calculator';
import Trading from './pages/Trading';
import Admin from './pages/Admin';
import Subscription from './pages/Subscription';
import BondMarket from './pages/BondMarket';

// Research Reports inline
function ResearchReports() {
  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">AI Research Reports</h2>
        <p className="text-sm text-gray-400 mt-1">Institutional-quality equity research powered by KB & Co AI</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NGX_STOCKS.slice(0, 9).map((stock, i) => (
          <motion.div key={stock.symbol} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="glass-card glass-card-hover p-5 cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
                {stock.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{stock.symbol}</div>
                <div className="text-[10px] text-gray-500">{stock.sector}</div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { label: 'Bull Case', text: 'Strong fundamentals, market leader position', color: '#22c55e' },
                { label: 'Bear Case', text: 'FX headwinds and rising input costs', color: '#ef4444' },
                { label: 'Key Risks', text: 'Regulatory changes, inflation pressure', color: '#f59e0b' },
                { label: 'Opportunity', text: 'Consumer spending recovery and expansion', color: '#3b82f6' },
              ].map((section, j) => (
                <div key={j} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: section.color }} />
                  <span className="text-[11px] text-gray-400"><span className="font-medium" style={{ color: section.color }}>{section.label}:</span> {section.text}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: stock.kbRating >= 75 ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.15)', color: stock.kbRating >= 75 ? '#22c55e' : '#D4AF37' }}>
                {stock.kbRating >= 75 ? 'BUY' : 'HOLD'}
              </span>
              <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>KB Score: {stock.kbRating}/100</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, sidebarOpen, simulateLiveUpdate, updatePrice } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('');

  // Fetch live NGX prices from backend (TradingView data, cached 24 h)
  useLiveMarket();

  // Live prices: try SSE from backend first, fallback to client simulation
  useEffect(() => {
    if (!isAuthenticated) return;

    let sseUnsub: (() => void) | null = null;
    let simInterval: ReturnType<typeof setInterval> | null = null;

    const unsubSse = subscribeToPriceStream((prices) => {
      prices.forEach(({ symbol, price, change, change_pct }) => {
        updatePrice(symbol, price, change, change_pct);
      });
      // Once SSE works, cancel the simulation
      if (simInterval) {
        clearInterval(simInterval);
        simInterval = null;
      }
    });

    sseUnsub = unsubSse;

    // Start simulation as fallback; SSE connection will cancel it when it fires
    simInterval = setInterval(() => {
      simulateLiveUpdate();
    }, 8000);

    return () => {
      sseUnsub?.();
      if (simInterval) clearInterval(simInterval);
    };
  }, [isAuthenticated, simulateLiveUpdate, updatePrice]);

  const navigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle OAuth and payment callbacks before auth gate
  const path = window.location.pathname;
  if (path === '/auth/google/callback') return <OAuthCallback />;
  if (path === '/payment/verify') return <PaymentVerify />;

  if (!isAuthenticated) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'portfolios': return <InvestmentPortfolios />;
      case 'stocks': return <Stocks onNavigateToProfile={(sym) => { setSelectedSymbol(sym); navigate('stock-profile'); }} />;
      case 'stock-profile': return <StockProfile symbol={selectedSymbol} onBack={() => navigate('stocks')} />;
      case 'screener': return <Screener />;
      case 'watchlist': return <Watchlist />;
      case 'portfolio-tracker': return <PortfolioTracker />;
      case 'dividends': return <DividendCenter />;
      case 'news': return <News />;
      case 'ai-advisor': return <AIAdvisor />;
      case 'calculator': return <Calculator />;
      case 'goals': return <Calculator />;
      case 'trading': return <Trading />;
      case 'reports': return <ResearchReports />;
      case 'bonds': return <BondMarket />;
      case 'subscription': return <Subscription />;
      case 'admin': return <Admin />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0F1E' }}>
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={navigate} />

      {/* Main Content — offset by sidebar */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{
          marginLeft: sidebarOpen ? '256px' : '0',
          transition: 'margin-left 0.3s ease',
          minWidth: 0,
        }}
      >
        {/* Top Header */}
        <Header currentPage={currentPage} onNavigate={navigate} />

        {/* Live Price Ticker */}
        <Ticker />

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Legal Footer */}
        <div
          className="hidden md:block px-6 py-3 text-[10px] text-gray-700 text-center border-t"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          © 2026 KB & Co Corporate Investment Limited · "Investing In The Future." · Investment research and educational content only. Past performance does not guarantee future returns.
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav currentPage={currentPage} onNavigate={navigate} />

      {/* Live Notification Toasts */}
      <NotificationToasts />
    </div>
  );
}
