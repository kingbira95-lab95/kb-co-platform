import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { adminApi } from '../services/api';
import type { AdminUser, AdminKYCDetail, AdminPayment } from '../services/api';
import {
  Users, TrendingUp, DollarSign, Bell, Shield, Settings,
  CheckCircle, XCircle, RefreshCcw, Search, X, Eye,
  CreditCard, Megaphone, LayoutDashboard, UserCheck, Ban,
} from 'lucide-react';

const ADMIN_EMAIL = 'admin@kbco.invest';

function fmtNGN(n: number) { return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function Admin() {
  const { user } = useStore();
  const isAdmin = user?.email === ADMIN_EMAIL || user?.isAdmin === true;

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <Shield size={40} className="mx-auto mb-4 text-gray-600" />
        <p className="text-white text-base font-semibold">Admin Access Required</p>
        <p className="text-gray-500 text-sm mt-1">You need admin privileges to access this panel.</p>
      </div>
    );
  }

  return <AdminDashboard />;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users & KYC', icon: Users },
  { id: 'payments', label: 'Payments & Payouts', icon: CreditCard },
  { id: 'broadcast', label: 'Reports & News', icon: Megaphone },
] as const;

type TabId = typeof TABS[number]['id'];

function kycBadge(status: string) {
  const map: Record<string, string> = {
    verified: 'bg-green-400/15 text-green-400',
    submitted: 'bg-yellow-400/15 text-yellow-400',
    rejected: 'bg-red-400/15 text-red-400',
    pending: 'bg-gray-400/15 text-gray-400',
  };
  return map[status] ?? 'bg-gray-400/15 text-gray-400';
}

function payBadge(status: string) {
  const map: Record<string, string> = {
    successful: 'bg-green-400/15 text-green-400',
    pending: 'bg-yellow-400/15 text-yellow-400',
    failed: 'bg-red-400/15 text-red-400',
    refunded: 'bg-blue-400/15 text-blue-400',
  };
  return map[status] ?? 'bg-gray-400/15 text-gray-400';
}

// ── Dashboard shell ───────────────────────────────────────────────────────────

function AdminDashboard() {
  const [tab, setTab] = useState<TabId>('overview');
  const [stats, setStats] = useState({ total_users: 0, active_subscriptions: 0, kyc_pending: 0, total_stocks: 0, total_revenue_ngn: 0 });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, p] = await Promise.all([
        adminApi.stats(),
        adminApi.users({ limit: 200 }),
        adminApi.payments().catch(() => [] as AdminPayment[]),
      ]);
      setStats(s);
      setUsers(u);
      setPayments(p);
    } catch (e) {
      console.error('Admin load failed', e);
      showToast('Failed to load admin data');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: toast.startsWith('✓') ? 'rgba(34,197,94,0.92)' : toast.startsWith('✗') ? 'rgba(239,68,68,0.92)' : 'rgba(59,130,246,0.92)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings size={20} color="#D4AF37" />
            Admin Panel
          </h2>
          <p className="text-sm text-gray-400 mt-1">Full platform management — users, KYC, payments, market data</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={active
                ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#000' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
              <Icon size={13} />
              {t.label}
              {t.id === 'users' && stats.kyc_pending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  style={{ background: active ? 'rgba(0,0,0,0.25)' : 'rgba(245,158,11,0.2)', color: active ? '#000' : '#f59e0b' }}>
                  {stats.kyc_pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewTab stats={stats} payments={payments} loading={loading} showToast={showToast} onGoBroadcast={() => setTab('broadcast')} />}
      {tab === 'users' && <UsersTab users={users} setUsers={setUsers} setStats={setStats} loading={loading} showToast={showToast} />}
      {tab === 'payments' && <PaymentsTab payments={payments} setPayments={setPayments} loading={loading} showToast={showToast} />}
      {tab === 'broadcast' && <BroadcastTab showToast={showToast} />}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ stats, payments, loading, showToast, onGoBroadcast }: {
  stats: { total_users: number; active_subscriptions: number; kyc_pending: number; total_stocks: number; total_revenue_ngn: number };
  payments: AdminPayment[];
  loading: boolean;
  showToast: (m: string) => void;
  onGoBroadcast: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const { refreshed } = await adminApi.refreshStocks();
      showToast(`✓ Stock prices updated — ${refreshed} symbols refreshed from NGX`);
    } catch {
      showToast('✗ Price refresh failed. Try again shortly.');
    }
    setRefreshing(false);
  };

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.total_users.toLocaleString(), icon: Users, color: '#3b82f6' },
    { label: 'Active Subscriptions', value: stats.active_subscriptions.toString(), icon: UserCheck, color: '#a855f7' },
    { label: 'Active Stocks', value: stats.total_stocks.toString(), icon: TrendingUp, color: '#D4AF37' },
    { label: 'Revenue (NGN)', value: `₦${fmtNGN(stats.total_revenue_ngn)}`, icon: DollarSign, color: '#22c55e' },
    { label: 'KYC Pending', value: stats.kyc_pending.toString(), icon: Bell, color: stats.kyc_pending > 0 ? '#f59e0b' : '#6b7280' },
  ];

  const recentPayments = payments.slice(0, 5);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {STAT_CARDS.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <stat.icon size={14} color={stat.color} />
            </div>
            <div className="text-lg font-bold text-white">{loading ? '—' : stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Quick actions + system status */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2 mb-6">
            <button onClick={refreshPrices} disabled={refreshing}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-medium text-white transition-all disabled:opacity-50"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <span className="flex items-center gap-2"><RefreshCcw size={13} color="#D4AF37" className={refreshing ? 'animate-spin' : ''} /> Update Stock Prices (Live NGX Scrape)</span>
              <span className="text-gray-500">→</span>
            </button>
            <button onClick={onGoBroadcast}
              className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-medium text-white transition-all"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <span className="flex items-center gap-2"><Megaphone size={13} color="#60a5fa" /> Send Market Report / News to All Users</span>
              <span className="text-gray-500">→</span>
            </button>
          </div>

          <h3 className="text-sm font-semibold text-white mb-3">System Status</h3>
          <div className="space-y-2">
            {[
              { name: 'NGX Data Feed', status: 'Live' },
              { name: 'OpenRouter AI', status: 'Active' },
              { name: 'Flutterwave Payments', status: 'Active' },
              { name: 'Database (PostgreSQL)', status: 'Healthy' },
              { name: 'Email Service', status: 'Active' },
            ].map((service, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                  <span className="text-xs text-gray-300">{service.name}</span>
                </div>
                <span className="text-[10px] font-semibold text-green-400">{service.status}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent payments */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Payments</h3>
          {recentPayments.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{p.customer_email ?? p.user_id}</div>
                    <div className="text-[10px] text-gray-500">{p.payment_type ?? 'payment'} · {new Date(p.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-xs font-bold text-white">₦{fmtNGN(p.amount)}</div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${payBadge(p.status)}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="text-sm font-semibold text-white mt-5 mb-3">Subscription Plans</h3>
          <div className="space-y-2">
            {[
              { name: 'Free', price: '₦0/mo', color: '#6b7280' },
              { name: 'Premium', price: '₦2,500/mo', color: '#3b82f6' },
              { name: 'Elite', price: '₦5,000/mo', color: '#D4AF37' },
            ].map((plan, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${plan.color}25` }}>
                <span className="text-xs font-bold text-white">{plan.name}</span>
                <span className="text-xs font-bold" style={{ color: plan.color }}>{plan.price}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── Users & KYC tab ───────────────────────────────────────────────────────────

function UsersTab({ users, setUsers, setStats, loading, showToast }: {
  users: AdminUser[];
  setUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  setStats: React.Dispatch<React.SetStateAction<{ total_users: number; active_subscriptions: number; kyc_pending: number; total_stocks: number; total_revenue_ngn: number }>>;
  loading: boolean;
  showToast: (m: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [kycView, setKycView] = useState<{ user: AdminUser; detail: AdminKYCDetail | null; loading: boolean } | null>(null);

  const handleKyc = async (userId: string, decision: 'verified' | 'rejected') => {
    setActionLoading(userId + decision);
    try {
      await adminApi.kycDecision(userId, decision, decision === 'rejected' ? 'Documents do not meet requirements' : undefined);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc_status: decision } : u));
      setStats(prev => ({ ...prev, kyc_pending: Math.max(0, prev.kyc_pending - 1) }));
      showToast(decision === 'verified' ? '✓ KYC approved — trading account unlocked' : '✗ KYC rejected — user notified');
      setKycView(null);
    } catch {
      showToast('✗ Action failed. Please try again.');
    }
    setActionLoading(null);
  };

  const handlePlan = async (userId: string, plan: 'free' | 'premium' | 'elite') => {
    setActionLoading(userId + 'plan');
    try {
      await adminApi.setPlan(userId, plan);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u));
      showToast(`✓ Plan updated to ${plan}`);
    } catch {
      showToast('✗ Plan update failed');
    }
    setActionLoading(null);
  };

  const handleToggleActive = async (userId: string) => {
    setActionLoading(userId + 'active');
    try {
      const { is_active } = await adminApi.toggleActive(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active } : u));
      showToast(is_active ? '✓ User account activated' : '✗ User account suspended');
    } catch {
      showToast('✗ Action failed');
    }
    setActionLoading(null);
  };

  const viewKyc = async (u: AdminUser) => {
    setKycView({ user: u, detail: null, loading: true });
    try {
      const detail = await adminApi.kycDetail(u.id);
      setKycView({ user: u, detail, loading: false });
    } catch {
      setKycView({ user: u, detail: null, loading: false });
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchKyc = kycFilter === 'all' || u.kyc_status === kycFilter;
    return matchSearch && matchKyc;
  });

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">User Management &amp; KYC Approvals</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Approve KYC, verify subscription plans, activate or suspend accounts</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-gray-600 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <select value={kycFilter} onChange={e => setKycFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs text-white outline-none"
              style={{ background: 'rgba(30,40,70,1)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="all">All KYC</option>
              <option value="submitted">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="pending">Not Submitted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <th className="text-left px-4 py-2.5">User</th>
                <th className="text-center px-3 py-2.5">Plan</th>
                <th className="text-center px-3 py-2.5">KYC</th>
                <th className="text-center px-3 py-2.5">Account</th>
                <th className="text-right px-3 py-2.5">Joined</th>
                <th className="text-center px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500 text-xs">Loading users…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500 text-xs">No users found</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="border-b hover:bg-white/[0.02] transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.04)', background: u.kyc_status === 'submitted' ? 'rgba(245,158,11,0.03)' : undefined }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[10px] text-gray-500">{u.email}</div>
                    {u.is_admin && <span className="text-[9px] text-yellow-400 font-bold tracking-wide">ADMIN</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {u.is_admin ? (
                      <span className="text-[10px] text-gray-500 capitalize">{u.plan}</span>
                    ) : (
                      <select value={u.plan} disabled={actionLoading === u.id + 'plan'}
                        onChange={e => handlePlan(u.id, e.target.value as 'free' | 'premium' | 'elite')}
                        className="text-[10px] px-1.5 py-1 rounded-lg outline-none capitalize"
                        style={{
                          background: u.plan === 'elite' ? 'rgba(212,175,55,0.15)' : u.plan === 'premium' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)',
                          color: u.plan === 'elite' ? '#D4AF37' : u.plan === 'premium' ? '#60a5fa' : '#9ca3af',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="elite">Elite</option>
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${kycBadge(u.kyc_status)}`}>
                      {u.kyc_status === 'submitted' ? 'pending review' : u.kyc_status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-400/15 text-green-400' : 'bg-red-400/15 text-red-400'}`}>
                      {u.is_active ? 'active' : 'suspended'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-[10px] text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {(u.kyc_status === 'submitted' || u.kyc_status === 'verified' || u.kyc_status === 'rejected') && (
                        <button onClick={() => viewKyc(u)} title="View KYC details"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-gray-300 transition-all"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <Eye size={10} /> KYC
                        </button>
                      )}
                      {u.kyc_status === 'submitted' && (
                        <>
                          <button onClick={() => handleKyc(u.id, 'verified')} disabled={actionLoading === u.id + 'verified'}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white transition-all disabled:opacity-50"
                            style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}>
                            <CheckCircle size={10} color="#22c55e" />
                            {actionLoading === u.id + 'verified' ? '…' : 'Approve'}
                          </button>
                          <button onClick={() => handleKyc(u.id, 'rejected')} disabled={actionLoading === u.id + 'rejected'}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white transition-all disabled:opacity-50"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <XCircle size={10} color="#ef4444" />
                            {actionLoading === u.id + 'rejected' ? '…' : 'Reject'}
                          </button>
                        </>
                      )}
                      {!u.is_admin && (
                        <button onClick={() => handleToggleActive(u.id)} disabled={actionLoading === u.id + 'active'}
                          title={u.is_active ? 'Suspend user' : 'Activate user'}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50"
                          style={u.is_active
                            ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }
                            : { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
                          {u.is_active ? <Ban size={10} /> : <UserCheck size={10} />}
                          {actionLoading === u.id + 'active' ? '…' : u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* KYC detail modal */}
      {kycView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setKycView(null); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
            style={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">KYC Submission</h3>
                <p className="text-xs text-gray-500">{kycView.user.name} · {kycView.user.email}</p>
              </div>
              <button onClick={() => setKycView(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            {kycView.loading ? (
              <p className="text-xs text-gray-500 py-8 text-center">Loading KYC details…</p>
            ) : !kycView.detail ? (
              <p className="text-xs text-gray-500 py-8 text-center">No KYC document found for this user.</p>
            ) : (
              <>
                <div className="space-y-2 mb-5">
                  {[
                    ['BVN', kycView.detail.bvn],
                    ['NIN', kycView.detail.nin],
                    ['ID Type', kycView.detail.id_type],
                    ['ID Number', kycView.detail.id_number],
                    ['Address', kycView.detail.address],
                    ['City', kycView.detail.city],
                    ['State', kycView.detail.state],
                    ['Bank', kycView.detail.bank_name],
                    ['Account Number', kycView.detail.account_number],
                    ['Account Name', kycView.detail.account_name],
                    ['Submitted', kycView.detail.submitted_at ? new Date(kycView.detail.submitted_at).toLocaleString('en-NG') : null],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex justify-between gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-[10px] text-gray-500 uppercase flex-shrink-0">{label}</span>
                      <span className="text-xs text-white text-right break-all">{value || '—'}</span>
                    </div>
                  ))}
                </div>
                {kycView.user.kyc_status === 'submitted' && (
                  <div className="flex gap-3">
                    <button onClick={() => handleKyc(kycView.user.id, 'rejected')} disabled={actionLoading !== null}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      Reject
                    </button>
                    <button onClick={() => handleKyc(kycView.user.id, 'verified')} disabled={actionLoading !== null}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      Approve KYC
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}

// ── Payments & Payouts tab ────────────────────────────────────────────────────

function PaymentsTab({ payments, setPayments, loading, showToast }: {
  payments: AdminPayment[];
  setPayments: React.Dispatch<React.SetStateAction<AdminPayment[]>>;
  loading: boolean;
  showToast: (m: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const setStatus = async (paymentId: string, status: 'successful' | 'failed' | 'refunded') => {
    setActionLoading(paymentId + status);
    try {
      await adminApi.setPaymentStatus(paymentId, status);
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p));
      showToast(`✓ Payment marked ${status}`);
    } catch {
      showToast('✗ Update failed');
    }
    setActionLoading(null);
  };

  const filtered = statusFilter === 'all' ? payments : payments.filter(p => p.status === statusFilter);
  const totalSuccessful = payments.filter(p => p.status === 'successful').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <div className="glass-card p-4">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Verified Revenue</div>
          <div className="text-lg font-bold text-green-400">₦{fmtNGN(totalSuccessful)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Pending Verification</div>
          <div className="text-lg font-bold text-yellow-400">₦{fmtNGN(totalPending)}</div>
        </div>
        <div className="glass-card p-4 col-span-2 lg:col-span-1">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Total Transactions</div>
          <div className="text-lg font-bold text-white">{payments.length}</div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="text-sm font-semibold text-white">Payments &amp; Payouts</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Subscription payments and trading account deposits — verify or refund</p>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs text-white outline-none"
            style={{ background: 'rgba(30,40,70,1)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <th className="text-left px-4 py-2.5">Customer</th>
                <th className="text-left px-3 py-2.5 hidden md:table-cell">Reference</th>
                <th className="text-center px-3 py-2.5">Type</th>
                <th className="text-right px-3 py-2.5">Amount</th>
                <th className="text-center px-3 py-2.5">Status</th>
                <th className="text-right px-3 py-2.5 hidden lg:table-cell">Date</th>
                <th className="text-center px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500 text-xs">Loading payments…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500 text-xs">No payments found. Transactions appear here when users subscribe or fund trading accounts.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3">
                    <div className="text-white">{p.customer_email ?? '—'}</div>
                    {p.narration && <div className="text-[10px] text-gray-500 max-w-[180px] truncate">{p.narration}</div>}
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-[10px] text-gray-500 font-mono">{p.tx_ref}</td>
                  <td className="px-3 py-3 text-center text-[10px] text-gray-400 capitalize">{p.payment_type ?? 'payment'}</td>
                  <td className="px-3 py-3 text-right font-bold text-white">₦{fmtNGN(p.amount)}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${payBadge(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-3 text-right hidden lg:table-cell text-[10px] text-gray-500">
                    {new Date(p.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {p.status === 'pending' && (
                        <button onClick={() => setStatus(p.id, 'successful')} disabled={actionLoading !== null}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-white disabled:opacity-50"
                          style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}>
                          {actionLoading === p.id + 'successful' ? '…' : 'Verify'}
                        </button>
                      )}
                      {p.status === 'successful' && (
                        <button onClick={() => setStatus(p.id, 'refunded')} disabled={actionLoading !== null}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold disabled:opacity-50"
                          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                          {actionLoading === p.id + 'refunded' ? '…' : 'Refund'}
                        </button>
                      )}
                      {(p.status === 'failed' || p.status === 'refunded') && <span className="text-[10px] text-gray-600">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}

// ── Broadcast tab (market reports & news) ─────────────────────────────────────

function BroadcastTab({ showToast }: { showToast: (m: string) => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('market');
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      showToast('✗ Title and message are required');
      return;
    }
    setSending(true);
    try {
      const { sent } = await adminApi.broadcast(title.trim(), message.trim(), type);
      showToast(`✓ Sent to ${sent} user${sent !== 1 ? 's' : ''}`);
      setLastSent(`"${title.trim()}" delivered to ${sent} user${sent !== 1 ? 's' : ''}`);
      setTitle('');
      setMessage('');
    } catch {
      showToast('✗ Broadcast failed. Please try again.');
    }
    setSending(false);
  };

  const TEMPLATES = [
    { label: 'Daily Market Report', title: 'NGX Daily Market Report', message: 'The NGX All-Share Index closed today. Check the Stocks page for the latest prices, top gainers and losers.' },
    { label: 'Dividend Announcement', title: 'Dividend Announcement', message: 'A listed company has announced a dividend. Check the Dividends page for ex-dates and payment dates.' },
    { label: 'Platform Update', title: 'Platform Update', message: 'We have released new features on KB & Co. Log in to explore the improvements.' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Send Market Report / News</h3>
        <p className="text-[10px] text-gray-500 mb-4">Delivers an in-app notification to every active user on the platform.</p>

        <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Notification Type</label>
        <select value={type} onChange={e => setType(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none mb-4"
          style={{ background: 'rgba(30,40,70,1)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="market">Market Report</option>
          <option value="news">News</option>
          <option value="dividend">Dividend</option>
          <option value="system">System / Platform</option>
        </select>

        <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. NGX Daily Market Report — 7 July"
          className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none mb-4"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.15)' }} />

        <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
          placeholder="Write the report or news content users will receive…"
          className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none mb-4 resize-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.15)' }} />

        <button onClick={send} disabled={sending || !title.trim() || !message.trim()}
          className="w-full py-3 rounded-xl text-sm font-bold text-black disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
          {sending ? 'Sending…' : 'Broadcast to All Users'}
        </button>

        {lastSent && <p className="text-xs text-green-400 mt-3 text-center">✓ {lastSent}</p>}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Quick Templates</h3>
        <div className="space-y-2 mb-6">
          {TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => { setTitle(t.title); setMessage(t.message); }}
              className="w-full text-left p-3 rounded-xl transition-all hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs font-semibold text-white">{t.label}</div>
              <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{t.message}</div>
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            <span className="text-blue-400 font-semibold">Note:</span> Broadcasts appear in each user's notification bell instantly.
            Stock prices auto-update every 30 minutes from the official NGX price list and TradingView Nigeria; use "Update Stock Prices" on the Overview tab to force an immediate refresh.
          </p>
        </div>
      </motion.div>
    </div>
  );
}