export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap: number;
  high52w: number;
  low52w: number;
  peRatio: number;
  pegRatio: number;
  eps: number;
  dividendYield: number;
  dividendPerShare: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  investmentHorizon: string;
  description: string;
  website: string;
  ceo: string;
  employees: number;
  founded: number;
  buyScore: number;
  valueScore: number;
  growthScore: number;
  momentumScore: number;
  kbRating: number;
  priceHistory: PriceHistory[];
  dividendHistory: DividendHistory[];
  financials: Financials;
  logo?: string;
}

export interface PriceHistory {
  year: number;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface DividendHistory {
  year: number;
  dividend: number;
  yield: number;
  exDate: string;
  payDate: string;
}

export interface Financials {
  revenue: number[];
  netIncome: number[];
  eps: number[];
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  operatingCashFlow: number;
  freeCashFlow: number;
  grossMargin: number;
  netMargin: number;
  roe: number;
  roa: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  years: number[];
}

export interface Portfolio {
  id: string;
  name: string;
  type: 'premium' | 'safe' | 'balanced' | 'highYield';
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  stocks: PortfolioStock[];
  totalReturn: number;
  annualReturn: number;
  minInvestment: number;
  aiCommentary: string;
  color: string;
  icon: string;
  fees?: { onboarding: number; management: number; total: number };
}

export interface PortfolioStock {
  symbol: string;
  name: string;
  weight: number;
  shares?: number;
  buyPrice?: number;
  currentPrice?: number;
}

export interface UserPortfolio {
  id: string;
  userId: string;
  name: string;
  holdings: Holding[];
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  symbol: string;
  shares: number;
  buyPrice: number;
  buyDate: string;
  currentPrice?: number;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: string;
  priceAlert?: number;
  gainAlert?: number;
  alertUp?: number;        // 1–10% gain threshold
  alertDown?: number;      // 1–10% drop threshold
  alertBasePrice?: number; // price at time alert was set
}

export interface Dividend {
  symbol: string;
  name: string;
  exDate: string;
  payDate: string;
  amount: number;
  yield: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  symbols?: string[];
  category: 'earnings' | 'dividend' | 'market' | 'company' | 'economy';
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface Notification {
  id: string;
  type: 'price' | 'dividend' | 'news' | 'portfolio' | 'alert' | 'system' | 'market';
  title: string;
  message: string;
  symbol?: string;
  timestamp: string;
  read: boolean;
  urgent?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'premium' | 'elite';
  kycStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  tradingAccountId?: string;
  createdAt: string;
}

export interface TradingAccount {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  status: 'pending' | 'active' | 'suspended';
  kycStatus: 'pending' | 'submitted' | 'verified';
  broker: string;
}

export interface TradingHolding {
  symbol: string;
  shares: number;
  avgPrice: number;
  buyDate: string;
}

export interface MarketSummary {
  index: string;
  value: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap: number;
  advances: number;
  declines: number;
  unchanged: number;
}

export interface ScreenerFilter {
  sector?: string;
  minDividendYield?: number;
  maxDividendYield?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  riskLevel?: string;
  minPrice?: number;
  maxPrice?: number;
  minPE?: number;
  maxPE?: number;
}
