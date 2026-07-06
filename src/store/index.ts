import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Holding, WatchlistItem, Notification, UserPortfolio } from '../types';
import { NGX_STOCKS } from '../data/stocks';
import { clearTokens } from '../services/api';

interface StockState {
  prices: Record<string, { price: number; change: number; changePct: number }>;
  lastUpdated: string;
  updatePrice: (symbol: string, price: number, change: number, changePct: number) => void;
  simulateLiveUpdate: () => void;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

interface PortfolioState {
  portfolios: UserPortfolio[];
  activePortfolioId: string | null;
  addHolding: (portfolioId: string, holding: Holding) => void;
  removeHolding: (portfolioId: string, symbol: string) => void;
  createPortfolio: (name: string) => void;
  setActivePortfolio: (id: string) => void;
  getPortfolioValue: (portfolioId: string) => number;
}

interface WatchlistState {
  items: WatchlistItem[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  setWatchlistAlert: (symbol: string, alertUp?: number, alertDown?: number) => void;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

interface UIState {
  sidebarOpen: boolean;
  activeTab: string;
  theme: 'dark';
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
}

type AppStore = StockState & AuthState & PortfolioState & WatchlistState & NotificationState & UIState;

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Stock State
      prices: Object.fromEntries(
        NGX_STOCKS.map(s => [s.symbol, { price: s.price, change: s.change, changePct: s.changePct }])
      ),
      lastUpdated: new Date().toISOString(),
      updatePrice: (symbol, price, change, changePct) =>
        set(state => ({
          prices: { ...state.prices, [symbol]: { price, change, changePct } },
          lastUpdated: new Date().toISOString(),
        })),
      simulateLiveUpdate: () => {
        const { prices, addNotification, items } = get();
        const updated = { ...prices };
        const symbols = Object.keys(updated);
        const toUpdate = symbols.sort(() => Math.random() - 0.5).slice(0, 5);
        let bigMover: string | null = null;
        let bigMovePct = 0;
        toUpdate.forEach(symbol => {
          const current = updated[symbol];
          const movePct = (Math.random() - 0.48) * 2.5;
          const newPrice = Math.max(0.5, current.price * (1 + movePct / 100));
          const change = newPrice - current.price;
          updated[symbol] = {
            price: Math.round(newPrice * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePct: Math.round(movePct * 100) / 100,
          };
          if (Math.abs(movePct) > Math.abs(bigMovePct)) {
            bigMovePct = movePct;
            bigMover = symbol;
          }
        });
        set({ prices: updated, lastUpdated: new Date().toISOString() });

        // Check watchlist percentage alerts
        const triggeredUp: string[] = [];
        const triggeredDown: string[] = [];
        for (const item of items) {
          if (!item.alertBasePrice || (!item.alertUp && !item.alertDown)) continue;
          const currentPrice = updated[item.symbol]?.price;
          if (!currentPrice) continue;
          const changePct = ((currentPrice - item.alertBasePrice) / item.alertBasePrice) * 100;
          const stock = NGX_STOCKS.find(s => s.symbol === item.symbol);
          if (item.alertUp && changePct >= item.alertUp) {
            triggeredUp.push(item.symbol);
            addNotification({
              type: 'alert',
              title: `${item.symbol} Alert: Up ${item.alertUp}%!`,
              message: `${stock?.name ?? item.symbol} rose ${changePct.toFixed(1)}% to ₦${currentPrice.toFixed(2)}`,
              symbol: item.symbol,
              urgent: true,
            });
          }
          if (item.alertDown && changePct <= -item.alertDown) {
            triggeredDown.push(item.symbol);
            addNotification({
              type: 'alert',
              title: `${item.symbol} Alert: Down ${item.alertDown}%!`,
              message: `${stock?.name ?? item.symbol} fell ${Math.abs(changePct).toFixed(1)}% to ₦${currentPrice.toFixed(2)}`,
              symbol: item.symbol,
              urgent: true,
            });
          }
        }
        if (triggeredUp.length > 0 || triggeredDown.length > 0) {
          set(state => ({
            items: state.items.map(item => {
              const up = triggeredUp.includes(item.symbol);
              const down = triggeredDown.includes(item.symbol);
              if (!up && !down) return item;
              const next = { ...item };
              if (up) next.alertUp = undefined;
              if (down) next.alertDown = undefined;
              if (!next.alertUp && !next.alertDown) next.alertBasePrice = undefined;
              return next;
            }),
          }));
        }

        if (bigMover && Math.abs(bigMovePct) > 1.5) {
          const stock = NGX_STOCKS.find(s => s.symbol === bigMover);
          if (stock) {
            addNotification({
              type: 'price',
              title: `${bigMover} Price Alert`,
              message: `${stock.name} ${bigMovePct > 0 ? '▲' : '▼'} ${Math.abs(bigMovePct).toFixed(2)}% to ₦${updated[bigMover].price.toFixed(2)}`,
              symbol: bigMover,
              urgent: Math.abs(bigMovePct) > 2,
            });
          }
        }
      },

      // Auth State
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => { clearTokens(); set({ user: null, isAuthenticated: false }); },
      updateUser: (updates) => set(state => ({ user: state.user ? { ...state.user, ...updates } : null })),

      // Portfolio State
      portfolios: [{
        id: 'default',
        userId: 'guest',
        name: 'My Portfolio',
        holdings: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      activePortfolioId: 'default',
      addHolding: (portfolioId, holding) =>
        set(state => ({
          portfolios: state.portfolios.map(p =>
            p.id === portfolioId
              ? { ...p, holdings: [...p.holdings.filter(h => h.symbol !== holding.symbol), holding], updatedAt: new Date().toISOString() }
              : p
          ),
        })),
      removeHolding: (portfolioId, symbol) =>
        set(state => ({
          portfolios: state.portfolios.map(p =>
            p.id === portfolioId
              ? { ...p, holdings: p.holdings.filter(h => h.symbol !== symbol), updatedAt: new Date().toISOString() }
              : p
          ),
        })),
      createPortfolio: (name) => {
        const id = `portfolio-${Date.now()}`;
        set(state => ({
          portfolios: [...state.portfolios, {
            id,
            userId: state.user?.id || 'guest',
            name,
            holdings: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
          activePortfolioId: id,
        }));
      },
      setActivePortfolio: (id) => set({ activePortfolioId: id }),
      getPortfolioValue: (portfolioId) => {
        const { portfolios, prices } = get();
        const portfolio = portfolios.find(p => p.id === portfolioId);
        if (!portfolio) return 0;
        return portfolio.holdings.reduce((total, h) => {
          const current = prices[h.symbol]?.price ?? h.buyPrice;
          return total + current * h.shares;
        }, 0);
      },

      // Watchlist State
      items: [],
      addToWatchlist: (symbol) =>
        set(state => ({
          items: state.items.some(i => i.symbol === symbol)
            ? state.items
            : [...state.items, { symbol, addedAt: new Date().toISOString() }],
        })),
      removeFromWatchlist: (symbol) =>
        set(state => ({ items: state.items.filter(i => i.symbol !== symbol) })),
      isInWatchlist: (symbol) => get().items.some(i => i.symbol === symbol),
      setWatchlistAlert: (symbol, alertUp, alertDown) => {
        const basePrice = get().prices[symbol]?.price;
        set(state => ({
          items: state.items.map(item =>
            item.symbol === symbol
              ? { ...item, alertUp, alertDown, alertBasePrice: (alertUp || alertDown) ? basePrice : undefined }
              : item
          ),
        }));
      },

      // Notification State
      notifications: [
        {
          id: '1',
          type: 'dividend',
          title: 'Dividend Alert: DANGCEM',
          message: 'Dangote Cement declared ₦26.00 interim dividend. Ex-date: July 10, 2026',
          symbol: 'DANGCEM',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          urgent: true,
        },
        {
          id: '2',
          type: 'market',
          title: 'Market Update',
          message: 'NGX ASI gained 1.2% today. Banking stocks led the rally.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: false,
        },
        {
          id: '3',
          type: 'news',
          title: 'BUA Foods Q1 Earnings Beat',
          message: 'BUA Foods reports record ₦385B revenue, up 42% YoY.',
          symbol: 'BUAFOODS',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          read: true,
        },
      ],
      unreadCount: 2,
      addNotification: (n) => {
        const notification: Notification = {
          ...n,
          id: `notif-${Date.now()}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        set(state => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }));
      },
      markAsRead: (id) =>
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      markAllAsRead: () =>
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      clearNotification: (id) =>
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        })),

      // UI State
      sidebarOpen: true,
      activeTab: 'dashboard',
      theme: 'dark',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'kb-co-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        portfolios: state.portfolios,
        activePortfolioId: state.activePortfolioId,
        items: state.items,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
