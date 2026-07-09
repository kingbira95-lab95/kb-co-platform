import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, PiggyBank, Landmark, Building2, CreditCard,
  Target, Crown, Lock, Plus, Trash2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useStore } from '../store';

const GOLD = '#D4AF37';
const fmt = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 });

const CATEGORIES = ['Cash', 'Real Estate', 'Crypto', 'Vehicle', 'Savings', 'Business', 'Other'];
const LIAB_CATEGORIES = ['Loan', 'Mortgage', 'Credit Card', 'Other'];

interface NetWorthProps {
  onNavigate?: (page: string) => void;
}

export default function NetWorth({ onNavigate }: NetWorthProps) {
  // Subscribe to inputs so derived values stay reactive to price/holding changes
  const realBalance = useStore(s => s.realBalance);
  useStore(s => s.realHoldings);
  useStore(s => s.portfolios);
  useStore(s => s.prices);
  const manualAssets = useStore(s => s.manualAssets);
  const liabilities = useStore(s => s.liabilities);
  const netWorthGoal = useStore(s => s.netWorthGoal);
  const user = useStore(s => s.user);

  const getTradingValue = useStore(s => s.getTradingValue);
  const getPortfoliosValue = useStore(s => s.getPortfoliosValue);
  const getManualAssetsTotal = useStore(s => s.getManualAssetsTotal);
  const getLiabilitiesTotal = useStore(s => s.getLiabilitiesTotal);
  const getTotalAssets = useStore(s => s.getTotalAssets);
  const getNetWorth = useStore(s => s.getNetWorth);
  const addManualAsset = useStore(s => s.addManualAsset);
  const removeManualAsset = useStore(s => s.removeManualAsset);
  const addLiability = useStore(s => s.addLiability);
  const removeLiability = useStore(s => s.removeLiability);
  const setNetWorthGoal = useStore(s => s.setNetWorthGoal);

  const isPremium = user?.plan === 'premium' || user?.plan === 'elite';

  const tradingValue = getTradingValue('real');
  const portfoliosValue = getPortfoliosValue();
  const otherAssets = getManualAssetsTotal();
  const totalLiabilities = getLiabilitiesTotal();
  const totalAssets = getTotalAssets();
  const netWorth = getNetWorth();

  const breakdown = useMemo(() => [
    { label: 'Trading Cash', value: realBalance, color: '#22c55e', icon: Wallet },
    { label: 'Stocks (Trading)', value: tradingValue, color: '#3b82f6', icon: TrendingUp },
    { label: 'Investment Portfolios', value: portfoliosValue, color: GOLD, icon: PiggyBank },
    { label: 'Other Assets', value: otherAssets, color: '#a855f7', icon: Building2 },
  ], [realBalance, tradingValue, portfoliosValue, otherAssets]);

  const goalPct = netWorthGoal > 0 ? Math.min(100, (netWorth / netWorthGoal) * 100) : 0;

  // ── Add-item form state ──────────────────────────────────────────────────────
  const [assetForm, setAssetForm] = useState({ label: '', value: '', category: 'Cash' });
  const [liabForm, setLiabForm] = useState({ label: '', value: '', category: 'Loan' });
  const [goalInput, setGoalInput] = useState(netWorthGoal ? String(netWorthGoal) : '');

  const submitAsset = () => {
    const v = parseFloat(assetForm.value);
    if (!assetForm.label.trim() || isNaN(v) || v <= 0) return;
    addManualAsset({ label: assetForm.label.trim(), value: v, category: assetForm.category });
    setAssetForm({ label: '', value: '', category: 'Cash' });
  };
  const submitLiability = () => {
    const v = parseFloat(liabForm.value);
    if (!liabForm.label.trim() || isNaN(v) || v <= 0) return;
    addLiability({ label: liabForm.label.trim(), value: v, category: liabForm.category });
    setLiabForm({ label: '', value: '', category: 'Loan' });
  };

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 20,
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 4px 60px' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">Net Worth</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}55` }}>
            <Crown size={11} className="inline -mt-0.5 mr-1" />PREMIUM
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">Your complete financial picture — investments, cash, assets and liabilities in one place.</p>
      </div>

      {/* Hero net worth card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...card, background: `linear-gradient(135deg, rgba(212,175,55,0.10), rgba(10,15,30,0.4))`, padding: 28, marginBottom: 20 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Total Net Worth</p>
            <div className="text-4xl md:text-5xl font-extrabold text-white tabular-nums">{fmt(netWorth)}</div>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-green-400">
                <ArrowUpRight size={15} /> Assets {fmt(totalAssets)}
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <ArrowDownRight size={15} /> Liabilities {fmt(totalLiabilities)}
              </span>
            </div>
          </div>
          {/* Goal ring */}
          <div className="text-right">
            {netWorthGoal > 0 ? (
              <>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1 justify-end"><Target size={12} /> Goal {fmt(netWorthGoal)}</p>
                <div className="w-52 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ width: `${goalPct}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, #f5d97a)` }} />
                </div>
                <p className="text-xs text-gray-300 mt-1">{goalPct.toFixed(1)}% of goal reached</p>
              </>
            ) : (
              <p className="text-xs text-gray-500">Set a net worth goal below ↓</p>
            )}
          </div>
        </div>

        {/* Allocation bar */}
        <div className="mt-6">
          <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {breakdown.filter(b => b.value > 0).map(b => (
              <div key={b.label} title={`${b.label}: ${fmt(b.value)}`}
                style={{ width: `${totalAssets > 0 ? (b.value / totalAssets) * 100 : 0}%`, background: b.color }} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Asset breakdown tiles */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {breakdown.map((b, i) => {
          const Icon = b.icon;
          const pct = totalAssets > 0 ? (b.value / totalAssets) * 100 : 0;
          return (
            <motion.div key={b.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={card}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${b.color}22`, color: b.color }}>
                  <Icon size={17} />
                </div>
                <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-400">{b.label}</p>
              <p className="text-lg font-bold text-white tabular-nums">{fmt(b.value)}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Premium management area */}
      <div className="relative">
        {!isPremium && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
            style={{ background: 'rgba(10,15,30,0.72)', backdropFilter: 'blur(3px)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-center px-6">
              <Lock size={26} className="mx-auto mb-2" style={{ color: GOLD }} />
              <p className="text-white font-semibold">Unlock full Net Worth management</p>
              <p className="text-sm text-gray-400 mt-1 mb-4 max-w-xs mx-auto">
                Track other assets & liabilities, set wealth goals, and get a complete financial picture with Premium.
              </p>
              <button onClick={() => onNavigate?.('subscription')}
                className="px-5 py-2 rounded-xl font-semibold text-black"
                style={{ background: `linear-gradient(90deg, ${GOLD}, #f5d97a)` }}>
                <Crown size={15} className="inline -mt-0.5 mr-1" /> Upgrade to Premium
              </button>
            </div>
          </div>
        )}

        <div className={`grid gap-5 ${!isPremium ? 'pointer-events-none select-none' : ''}`} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Goal setter + Assets */}
          <div style={card}>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><Target size={15} style={{ color: GOLD }} /> Net Worth Goal</h3>
            <div className="flex gap-2 mb-5">
              <input value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="e.g. 50000000" inputMode="numeric"
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-500/50" />
              <button onClick={() => setNetWorthGoal(parseFloat(goalInput) || 0)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-black" style={{ background: GOLD }}>Set</button>
            </div>

            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><Building2 size={15} style={{ color: '#a855f7' }} /> Other Assets</h3>
            <div className="space-y-2 mb-3">
              {manualAssets.length === 0 && <p className="text-xs text-gray-500">No other assets added yet.</p>}
              {manualAssets.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{a.label}</p>
                    <p className="text-[10px] text-gray-500">{a.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-green-400 tabular-nums">{fmt(a.value)}</span>
                    <button onClick={() => removeManualAsset(a.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input value={assetForm.label} onChange={e => setAssetForm(f => ({ ...f, label: e.target.value }))} placeholder="Asset name"
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
              <select value={assetForm.category} onChange={e => setAssetForm(f => ({ ...f, category: e.target.value }))}
                className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-200 outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={assetForm.value} onChange={e => setAssetForm(f => ({ ...f, value: e.target.value }))} placeholder="Value ₦" inputMode="numeric"
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
              <button onClick={submitAsset} className="px-3 rounded-lg text-sm font-semibold text-white flex items-center gap-1" style={{ background: '#a855f7' }}><Plus size={14} /> Add</button>
            </div>
          </div>

          {/* Liabilities */}
          <div style={card}>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><CreditCard size={15} style={{ color: '#ef4444' }} /> Liabilities</h3>
            <div className="space-y-2 mb-3">
              {liabilities.length === 0 && <p className="text-xs text-gray-500">No liabilities added yet.</p>}
              {liabilities.map(l => (
                <div key={l.id} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{l.label}</p>
                    <p className="text-[10px] text-gray-500">{l.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-red-400 tabular-nums">−{fmt(l.value)}</span>
                    <button onClick={() => removeLiability(l.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input value={liabForm.label} onChange={e => setLiabForm(f => ({ ...f, label: e.target.value }))} placeholder="Liability name"
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" />
              <select value={liabForm.category} onChange={e => setLiabForm(f => ({ ...f, category: e.target.value }))}
                className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-200 outline-none">
                {LIAB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={liabForm.value} onChange={e => setLiabForm(f => ({ ...f, value: e.target.value }))} placeholder="Amount ₦" inputMode="numeric"
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" />
              <button onClick={submitLiability} className="px-3 rounded-lg text-sm font-semibold text-white flex items-center gap-1" style={{ background: '#ef4444' }}><Plus size={14} /> Add</button>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-gray-400 flex items-center gap-2"><Landmark size={15} /> Net Worth</span>
              <span className="text-lg font-bold text-white tabular-nums">{fmt(netWorth)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
