import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useStore } from '../store';
import {
  Info, CheckCircle, AlertTriangle, Landmark, ArrowRight, X,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── Types ─────────────────────────────────────────────────────────────────────
interface NTBOffering {
  instrument_id: string;
  security_type: string;
  tenor: number;
  label: string;
  description: string;
  risk: string;
  auction_date: string;
  maturity_date: string;
  stop_rate: number;
  min_investment: number;
  denominations: number[];
  amt_offered_mn: number;
  total_subscription_mn: number;
  oversubscription_ratio: number | null;
  settlement: string;
  interest_payment: string;
  issuer: string;
  guarantor: string;
  coupon_type: string;
}

interface ChartEntry { year: number; t91?: number; t182?: number; t364?: number; }
interface TrendEntry { period: string; avg_rate: number; min_rate: number; max_rate: number; }
interface BondHolding {
  id: string; instrument_id: string; tenor: number; stop_rate: number;
  auction_date: string; maturity_date: string; face_value: number;
  discount_amount: number; purchase_price: number; expected_return: number;
  status: string; purchased_at: string;
}
interface CalcResult {
  face_value: number; discount_amount: number; purchase_price: number;
  expected_return: number; interest_earned: number; effective_yield: number; annualised_rate: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const GOLD = '#D4AF37';

const TENOR_COLORS: Record<number, string> = { 91: '#22c55e', 182: '#3b82f6', 364: GOLD };

function DaysToMaturity({ maturityDate }: { maturityDate: string }) {
  const days = Math.max(0, Math.ceil(
    (new Date(maturityDate.replace(/-/g, ' ')).getTime() - Date.now()) / 86400000
  ));
  return <span className="text-xs text-gray-400">{days} days remaining</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BondMarket() {
  const { user } = useStore();
  const [offerings, setOfferings] = useState<NTBOffering[]>([]);
  const [chartData, setChartData] = useState<ChartEntry[]>([]);
  const [trendData, setTrendData] = useState<TrendEntry[]>([]);
  const [trendTenor, setTrendTenor] = useState(364);
  const [myBonds, setMyBonds] = useState<BondHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'history'>('market');

  // Purchase modal state
  const [buyOffering, setBuyOffering] = useState<NTBOffering | null>(null);
  const [faceValue, setFaceValue] = useState('');
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [buyError, setBuyError] = useState('');

  const token = localStorage.getItem('kbco_access_token');
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [off, chart] = await Promise.all([
          fetch(`${API}/bonds/offerings`).then(r => r.json()),
          fetch(`${API}/bonds/chart`).then(r => r.json()),
        ]);
        setOfferings(Array.isArray(off) ? off : []);
        setChartData(Array.isArray(chart) ? chart.filter((d: ChartEntry) => d.year >= 2010) : []);
      } catch {
        setOfferings(STATIC_OFFERINGS);
        setChartData(STATIC_CHART);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (activeTab !== 'portfolio' || !token) return;
    fetch(`${API}/bonds/my-portfolio`, { headers: authHeader })
      .then(r => r.json()).then(d => setMyBonds(Array.isArray(d) ? d : [])).catch(() => {});
  }, [activeTab, token]);

  useEffect(() => {
    fetch(`${API}/bonds/trend/${trendTenor}`)
      .then(r => r.json()).then(d => setTrendData(Array.isArray(d) ? d : [])).catch(() => {});
  }, [trendTenor]);

  // ── Calculate preview ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!buyOffering || !faceValue || +faceValue < 50000) { setCalc(null); return; }
    setCalcLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/bonds/calculate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ face_value: +faceValue, tenor: buyOffering.tenor, stop_rate: buyOffering.stop_rate }),
        });
        const data = await res.json();
        setCalc(data);
      } catch {
        // offline fallback
        const discount = +faceValue * (buyOffering.stop_rate / 100) * (buyOffering.tenor / 365);
        setCalc({ face_value: +faceValue, discount_amount: discount, purchase_price: +faceValue - discount, expected_return: +faceValue, interest_earned: discount, effective_yield: buyOffering.stop_rate, annualised_rate: buyOffering.stop_rate });
      } finally { setCalcLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [faceValue, buyOffering]);

  // ── Buy bond ────────────────────────────────────────────────────────────────
  const handleBuy = async () => {
    if (!buyOffering || !calc) return;
    if (user?.kycStatus !== 'verified') {
      setBuyError('KYC verification required. Complete your trading account setup first.');
      return;
    }
    setBuyLoading(true); setBuyError('');
    try {
      const res = await fetch(`${API}/bonds/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          instrument_id: buyOffering.instrument_id,
          tenor: buyOffering.tenor,
          stop_rate: buyOffering.stop_rate,
          maturity_date: buyOffering.maturity_date,
          auction_date: buyOffering.auction_date,
          face_value: calc.face_value,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Purchase failed'); }
      await res.json();
      setBuySuccess(true);
      // Refresh portfolio tab
      fetch(`${API}/bonds/my-portfolio`, { headers: authHeader }).then(r => r.json()).then(d => setMyBonds(Array.isArray(d) ? d : [])).catch(() => {});
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Purchase failed');
    } finally { setBuyLoading(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/10 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading bond market data…</p>
        </div>
      </div>
    );
  }

  const totalInvested = myBonds.reduce((s, b) => s + b.purchase_price, 0);
  const totalFaceValue = myBonds.reduce((s, b) => s + b.face_value, 0);
  const totalInterest = myBonds.reduce((s, b) => s + b.discount_amount, 0);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
            <Landmark size={18} color={GOLD} />
          </div>
          <h2 className="text-xl font-bold text-white">Fixed Income — NTB Market</h2>
        </div>
        <p className="text-sm text-gray-400 ml-12">Nigerian Treasury Bills (NTBs) · CBN Primary Market Auction Data · Guaranteed by FGN</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {(['market', 'portfolio', 'history'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all"
            style={activeTab === t ? { background: 'linear-gradient(135deg,#D4AF37,#A08020)', color: '#000' } : { color: '#9ca3af' }}>
            {t === 'portfolio' ? 'My Bonds' : t === 'history' ? 'Rate History' : 'Market'}
          </button>
        ))}
      </div>

      {/* ── MARKET TAB ── */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          {/* Current offerings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(offerings.length ? offerings : STATIC_OFFERINGS).map((off, i) => (
              <motion.div key={off.instrument_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="glass-card p-5 flex flex-col"
                style={{ border: `1px solid ${TENOR_COLORS[off.tenor]}25` }}>
                {/* Rate badge */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-base font-bold text-white">{off.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">FGN · CBN Guaranteed</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black" style={{ color: TENOR_COLORS[off.tenor] }}>{off.stop_rate}%</div>
                    <div className="text-[10px] text-gray-500">per annum</div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">{off.description}</p>

                <div className="space-y-2 mb-4 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Auction Date</span><span className="text-gray-300">{off.auction_date}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Maturity</span><span className="text-gray-300">{off.maturity_date}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Amount Offered</span><span className="text-gray-300">₦{(off.amt_offered_mn / 1000).toFixed(0)}B</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Oversubscription</span><span style={{ color: '#22c55e' }}>{off.oversubscription_ratio ? `${off.oversubscription_ratio}×` : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Min. Investment</span><span style={{ color: GOLD }}>₦{off.min_investment.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Interest Payment</span><span className="text-gray-300">Upfront (Discount)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Risk</span><span className="text-green-400">Very Low</span></div>
                </div>

                <div className="mt-auto flex gap-2">
                  <button onClick={() => { setBuyOffering(off); setFaceValue(''); setCalc(null); setBuySuccess(false); setBuyError(''); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black transition-all flex items-center justify-center gap-1.5"
                    style={{ background: `linear-gradient(135deg,${TENOR_COLORS[off.tenor]},${TENOR_COLORS[off.tenor]}aa)` }}>
                    <ArrowRight size={14} /> Buy Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Rate history chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Historical NTB Stop Rates (2010–2026)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Annual average stop rates from CBN primary market auctions</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#0d1526', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8 }}
                  formatter={(v: unknown, name: unknown) => [`${v}%`, name as string]} labelStyle={{ color: '#D4AF37' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="t91" name="91-Day" stroke={TENOR_COLORS[91]} dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="t182" name="182-Day" stroke={TENOR_COLORS[182]} dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="t364" name="364-Day" stroke={TENOR_COLORS[364]} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Info box */}
          <div className="glass-card p-4 flex gap-3" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
            <Info size={16} color={GOLD} className="flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-gray-400 leading-relaxed">
              <strong className="text-gray-200">How NTBs work:</strong> Nigerian Treasury Bills are short-term government securities issued by the CBN on behalf of the Federal Government. They are <strong className="text-gray-200">discount instruments</strong> — you pay less than face value today and receive full face value at maturity. Your interest (the discount) is earned upfront. NTBs are the <strong className="text-gray-200">safest investment in Nigeria</strong>, backed by the full faith of the Federal Government.
            </div>
          </div>
        </div>
      )}

      {/* ── PORTFOLIO TAB ── */}
      {activeTab === 'portfolio' && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          {myBonds.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Invested', value: fmt(totalInvested), color: GOLD },
                { label: 'Face Value at Maturity', value: fmt(totalFaceValue), color: '#3b82f6' },
                { label: 'Total Interest Earned', value: fmt(totalInterest), color: '#22c55e' },
                { label: 'Active Holdings', value: myBonds.filter(b => b.status === 'active').length.toString(), color: GOLD },
              ].map((kpi, i) => (
                <div key={i} className="glass-card p-4">
                  <div className="text-[10px] text-gray-500 mb-1">{kpi.label}</div>
                  <div className="text-base font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                </div>
              ))}
            </div>
          )}

          {myBonds.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Landmark size={36} color="#374151" className="mx-auto mb-4" />
              <p className="text-white font-semibold mb-1">No bond holdings yet</p>
              <p className="text-sm text-gray-500 mb-5">Start investing in Nigerian Treasury Bills from the Market tab.</p>
              <button onClick={() => setActiveTab('market')}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-black"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#A08020)' }}>
                Browse T-Bills
              </button>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b text-sm font-semibold text-white" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                My NTB Holdings
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <th className="text-left px-4 py-2.5">Instrument</th>
                    <th className="text-right px-3 py-2.5">Face Value</th>
                    <th className="text-right px-3 py-2.5">You Paid</th>
                    <th className="text-right px-3 py-2.5">Interest</th>
                    <th className="text-right px-3 py-2.5">Rate</th>
                    <th className="text-right px-3 py-2.5">Maturity</th>
                    <th className="text-center px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myBonds.map((b) => (
                    <tr key={b.id} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3">
                        <div className="text-xs font-semibold text-white">{b.tenor}-Day T-Bill</div>
                        <div className="text-[10px] text-gray-500">NTB · {b.auction_date}</div>
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-semibold text-white">{fmt(b.face_value)}</td>
                      <td className="px-3 py-3 text-right text-xs text-gray-300">{fmt(b.purchase_price)}</td>
                      <td className="px-3 py-3 text-right text-xs font-semibold text-green-400">+{fmt(b.discount_amount)}</td>
                      <td className="px-3 py-3 text-right text-xs" style={{ color: GOLD }}>{b.stop_rate}%</td>
                      <td className="px-3 py-3 text-right">
                        <div className="text-[10px] text-gray-300">{b.maturity_date}</div>
                        <DaysToMaturity maturityDate={b.maturity_date} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: b.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.15)', color: b.status === 'active' ? '#22c55e' : GOLD }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          <div className="flex gap-2">
            {([91, 182, 364] as const).map(t => (
              <button key={t} onClick={() => setTrendTenor(t)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
                style={trendTenor === t
                  ? { background: TENOR_COLORS[t], color: '#000' }
                  : { border: `1px solid ${TENOR_COLORS[t]}40`, color: TENOR_COLORS[t] }}>
                {t}-Day
              </button>
            ))}
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Quarterly Stop Rate Trend — {trendTenor}-Day NTB</h3>
            <p className="text-xs text-gray-500 mb-4">CBN auction data 2015–2026 · Min/Max range shown</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TENOR_COLORS[trendTenor]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={TENOR_COLORS[trendTenor]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 9 }} interval={3} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#0d1526', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8 }}
                  formatter={(v: unknown, name: unknown) => [`${v}%`, name as string]} labelStyle={{ color: '#D4AF37' }} />
                <Area type="monotone" dataKey="max_rate" name="Max Rate" stroke="transparent" fill={TENOR_COLORS[trendTenor]} fillOpacity={0.1} />
                <Area type="monotone" dataKey="avg_rate" name="Avg Rate" stroke={TENOR_COLORS[trendTenor]} fill="url(#trendGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="min_rate" name="Min Rate" stroke="transparent" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent auction table */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b text-sm font-semibold text-white" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              Recent Auctions — {trendTenor}-Day
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Auction Date', 'Maturity Date', 'Stop Rate', 'Amount Offered (₦M)', 'Total Allotted (₦M)'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <RecentAuctions tenor={trendTenor} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BUY MODAL ── */}
      <AnimatePresence>
        {buyOffering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget && !buyLoading) { setBuyOffering(null); setBuySuccess(false); } }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-card p-6 w-full max-w-md relative"
              style={{ border: `1px solid ${TENOR_COLORS[buyOffering.tenor]}30` }}>

              {!buySuccess ? (
                <>
                  <button onClick={() => setBuyOffering(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <X size={16} />
                  </button>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${TENOR_COLORS[buyOffering.tenor]}20` }}>
                      <Landmark size={18} color={TENOR_COLORS[buyOffering.tenor]} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">{buyOffering.label}</div>
                      <div className="text-xs font-bold" style={{ color: TENOR_COLORS[buyOffering.tenor] }}>{buyOffering.stop_rate}% p.a.</div>
                    </div>
                  </div>

                  {/* KYC warning */}
                  {user?.kycStatus !== 'verified' && (
                    <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <AlertTriangle size={14} color="#f59e0b" className="flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-yellow-400">KYC verification required to buy bonds. Complete your trading account first.</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1.5">Investment Amount (Face Value)</label>
                    <input type="number" value={faceValue} onChange={e => setFaceValue(e.target.value)} placeholder="e.g. 100000"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {buyOffering.denominations.map(d => (
                        <button key={d} onClick={() => setFaceValue(String(d))}
                          className="text-[10px] px-2 py-1 rounded-lg transition-all"
                          style={{ border: '1px solid rgba(255,255,255,0.1)', color: faceValue === String(d) ? '#000' : '#9ca3af', background: faceValue === String(d) ? GOLD : 'transparent' }}>
                          ₦{(d / 1000).toFixed(0)}K
                        </button>
                      ))}
                    </div>
                    {faceValue && +faceValue < 50000 && (
                      <p className="text-[10px] text-red-400 mt-1">Minimum investment is ₦50,000</p>
                    )}
                  </div>

                  {/* Calculation preview */}
                  {calcLoading && <div className="text-center text-xs text-gray-500 py-4">Calculating…</div>}
                  {calc && !calcLoading && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-4 space-y-2 mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex justify-between text-[11px]"><span className="text-gray-500">Face Value</span><span className="text-white font-semibold">{fmt(calc.face_value)}</span></div>
                      <div className="flex justify-between text-[11px]"><span className="text-gray-500">You Pay Today</span><span style={{ color: GOLD }} className="font-bold">{fmt(calc.purchase_price)}</span></div>
                      <div className="flex justify-between text-[11px]"><span className="text-gray-500">Interest (Upfront)</span><span className="text-green-400 font-bold">+{fmt(calc.discount_amount)}</span></div>
                      <div className="border-t pt-2 mt-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                      <div className="flex justify-between text-[11px]"><span className="text-gray-500">You Receive at Maturity</span><span className="text-white font-bold">{fmt(calc.expected_return)}</span></div>
                      <div className="flex justify-between text-[11px]"><span className="text-gray-500">Effective Yield</span><span style={{ color: TENOR_COLORS[buyOffering.tenor] }} className="font-bold">{calc.effective_yield.toFixed(2)}% p.a.</span></div>
                      <div className="flex justify-between text-[11px]"><span className="text-gray-500">Maturity Date</span><span className="text-gray-300">{buyOffering.maturity_date}</span></div>
                    </motion.div>
                  )}

                  {buyError && <p className="text-[11px] text-red-400 mb-3">{buyError}</p>}

                  <button onClick={handleBuy} disabled={buyLoading || !calc || +faceValue < 50000 || user?.kycStatus !== 'verified'}
                    className="w-full py-3 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg,${TENOR_COLORS[buyOffering.tenor]},${TENOR_COLORS[buyOffering.tenor]}aa)` }}>
                    {buyLoading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
                    {buyLoading ? 'Processing…' : `Invest ${calc ? fmt(calc.purchase_price) : ''}` }
                  </button>
                  <p className="text-[10px] text-gray-600 text-center mt-3">
                    Settlement T+2 · FGN / CBN Guaranteed · Investment carries sovereign risk only
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle size={44} color="#22c55e" className="mx-auto mb-4" />
                  <h3 className="text-base font-bold text-white mb-2">Investment Confirmed!</h3>
                  <p className="text-sm text-gray-400 mb-1">Your NTB purchase has been recorded.</p>
                  {calc && <p className="text-xs text-gray-500 mb-5">Interest of <span className="text-green-400 font-semibold">{fmt(calc.discount_amount)}</span> credited upfront.</p>}
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => { setBuyOffering(null); setBuySuccess(false); setActiveTab('portfolio'); }}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-black"
                      style={{ background: 'linear-gradient(135deg,#D4AF37,#A08020)' }}>
                      View My Bonds
                    </button>
                    <button onClick={() => { setBuySuccess(false); setFaceValue(''); setCalc(null); }}
                      className="px-5 py-2.5 rounded-xl text-sm text-gray-300"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      Buy More
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Recent auctions sub-component ─────────────────────────────────────────────
function RecentAuctions({ tenor }: { tenor: number }) {
  const [rows, setRows] = useState<{ auctionDate: string; maturityDate: string; stopRate: number; amtOffered: number; netValue: number }[]>([]);
  const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

  useEffect(() => {
    fetch(`${API}/bonds/history?tenor=${tenor}&from_year=2023&limit=30`)
      .then(r => r.json()).then(d => setRows(Array.isArray(d) ? d : [])).catch(() => setRows([]));
  }, [tenor]);

  return (
    <>
      {rows.map((r, i) => (
        <tr key={i} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <td className="px-4 py-2.5 text-xs text-gray-300">{r.auctionDate}</td>
          <td className="px-4 py-2.5 text-xs text-gray-300">{r.maturityDate}</td>
          <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: TENOR_COLORS[tenor] }}>{r.stopRate?.toFixed(2)}%</td>
          <td className="px-4 py-2.5 text-xs text-gray-300">{r.amtOffered?.toLocaleString()}</td>
          <td className="px-4 py-2.5 text-xs text-gray-300">{r.netValue?.toLocaleString()}</td>
        </tr>
      ))}
    </>
  );
}

// ── Static fallbacks (backend offline) ───────────────────────────────────────
const STATIC_OFFERINGS: NTBOffering[] = [
  { instrument_id: 'NTB-91-2026-06-17', security_type: 'NTB', tenor: 91, label: '91-Day T-Bill', description: 'Short-term government security. Best for liquid savings with guaranteed return above bank rates.', risk: 'Very Low', auction_date: '2026-06-17', maturity_date: 'September-17-2026', stop_rate: 16.28, min_investment: 50000, denominations: [50000, 100000, 500000, 1000000, 5000000], amt_offered_mn: 100000, total_subscription_mn: 129690.71, oversubscription_ratio: 1.30, settlement: 'T+2', interest_payment: 'Upfront (discount)', issuer: 'Federal Government of Nigeria', guarantor: 'Central Bank of Nigeria (CBN)', coupon_type: 'Discount' },
  { instrument_id: 'NTB-182-2026-06-17', security_type: 'NTB', tenor: 182, label: '182-Day T-Bill', description: 'Medium short-term government security. Ideal for 6-month cash management with competitive yield.', risk: 'Very Low', auction_date: '2026-06-17', maturity_date: 'December-17-2026', stop_rate: 16.50, min_investment: 50000, denominations: [50000, 100000, 500000, 1000000, 5000000], amt_offered_mn: 100000, total_subscription_mn: 70224.53, oversubscription_ratio: 0.70, settlement: 'T+2', interest_payment: 'Upfront (discount)', issuer: 'Federal Government of Nigeria', guarantor: 'Central Bank of Nigeria (CBN)', coupon_type: 'Discount' },
  { instrument_id: 'NTB-364-2026-06-17', security_type: 'NTB', tenor: 364, label: '364-Day T-Bill', description: 'One-year government security. Highest yield among T-Bills. Suitable as a fixed-income core holding.', risk: 'Very Low', auction_date: '2026-06-17', maturity_date: 'June-17-2027', stop_rate: 17.34, min_investment: 50000, denominations: [50000, 100000, 500000, 1000000, 5000000], amt_offered_mn: 800000, total_subscription_mn: 1663486.37, oversubscription_ratio: 2.08, settlement: 'T+2', interest_payment: 'Upfront (discount)', issuer: 'Federal Government of Nigeria', guarantor: 'Central Bank of Nigeria (CBN)', coupon_type: 'Discount' },
];

const STATIC_CHART: ChartEntry[] = [
  { year: 2010, t91: 5.1, t182: 5.5, t364: 6.2 }, { year: 2011, t91: 9.8, t182: 11.2, t364: 13.5 },
  { year: 2012, t91: 14.2, t182: 14.8, t364: 15.2 }, { year: 2013, t91: 11.5, t182: 12.1, t364: 13.0 },
  { year: 2014, t91: 10.8, t182: 11.4, t364: 12.3 }, { year: 2015, t91: 5.2, t182: 6.8, t364: 8.5 },
  { year: 2016, t91: 14.8, t182: 16.2, t364: 18.6 }, { year: 2017, t91: 13.2, t182: 14.8, t364: 16.5 },
  { year: 2018, t91: 10.9, t182: 12.5, t364: 14.2 }, { year: 2019, t91: 9.8, t182: 10.5, t364: 11.8 },
  { year: 2020, t91: 2.5, t182: 3.1, t364: 4.2 }, { year: 2021, t91: 2.8, t182: 3.5, t364: 5.1 },
  { year: 2022, t91: 5.2, t182: 6.8, t364: 8.9 }, { year: 2023, t91: 10.5, t182: 12.1, t364: 14.8 },
  { year: 2024, t91: 17.2, t182: 18.5, t364: 20.1 }, { year: 2025, t91: 16.8, t182: 17.4, t364: 18.9 },
  { year: 2026, t91: 16.28, t182: 16.5, t364: 17.34 },
];
