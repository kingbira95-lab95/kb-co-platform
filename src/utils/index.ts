export const formatPrice = (price: number): string => {
  if (price >= 1000000000000) return (price / 1000000000000).toFixed(2) + 'T';
  if (price >= 1000000000) return (price / 1000000000).toFixed(2) + 'B';
  if (price >= 1000000) return (price / 1000000).toFixed(2) + 'M';
  if (price >= 1000) return price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(2);
};

export const formatLargeNumber = (n: number): string => {
  if (n >= 1e12) return '₦' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '₦' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '₦' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '₦' + (n / 1e3).toFixed(2) + 'K';
  return '₦' + n.toFixed(2);
};

export const formatChangePct = (pct: number): string => {
  const sign = pct >= 0 ? '+' : '';
  return sign + pct.toFixed(2);
};

export const formatMillions = (n: number): string => {
  if (n >= 1000) return (n / 1000).toFixed(2) + 'B';
  return n.toFixed(0) + 'M';
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

export const formatTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const getRiskColor = (risk: string): string => {
  switch (risk) {
    case 'Low': return '#22c55e';
    case 'Medium': return '#f59e0b';
    case 'High': return '#ef4444';
    case 'Very High': return '#dc2626';
    default: return '#9ca3af';
  }
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#D4AF37';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

export const calcPortfolioGrowth = (
  initial: number,
  monthly: number,
  annualReturn: number,
  years: number
): { year: number; value: number }[] => {
  const results = [];
  let value = initial;
  const monthlyRate = annualReturn / 100 / 12;
  for (let y = 0; y <= years; y++) {
    results.push({ year: new Date().getFullYear() + y, value: Math.round(value) });
    for (let m = 0; m < 12; m++) {
      value = value * (1 + monthlyRate) + monthly;
    }
  }
  return results;
};

export const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');
