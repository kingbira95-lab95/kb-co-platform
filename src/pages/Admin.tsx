import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { adminApi } from '../services/api';
import type { AdminUser } from '../services/api';
import { Users, TrendingUp, DollarSign, Bell, Shield, Settings, CheckCircle, XCircle, RefreshCcw, Search } from 'lucide-react';

export default function Admin() {
  const { user } = useStore();

  if (user?.email !== 'admin@kbco.invest') {
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

function AdminDashboard() {
  const [stats, setStats] = useState({ total_users: 0, active_subscriptions: 0, kyc_pending: 0, total_stocks: 0, total_revenue_ngn: 0 });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([adminApi.stats(), adminApi.users({ limit: 100 })]);
      setStats(s);
      setUsers(u);
    } catch (e) {
      console.error('Admin load failed', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleKyc = async (userId: string, decision: 'verified' | 'rejected') => {
    setActionLoading(userId + decision);
    try {
      await adminApi.kycDecision(userId, decision, decision === 'rejected' ? 'Documents do not meet requirements' : undefined);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, kyc_status: decision } : u));
      setStats(prev => ({ ...prev, kyc_pending: Math.max(0, prev.kyc_pending - 1) }));
      showToast(decision === 'verified' ? '✓ KYC approved — trading account unlocked' : '✗ KYC rejected — user has been notified');
    } catch {
      showToast('Action failed. Please try again.');
    }
    setActionLoading(null);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchKyc = kycFilter === 'all' || u.kyc_status === kycFilter;
    return matchSearch && matchKyc;
  });

  const kycBadge = (status: string) => {
    const map: Record<string, string> = {
      verified: 'bg-green-400/15 text-green-400',
      submitted: 'bg-yellow-400/15 text-yellow-400',
      rejected: 'bg-red-400/15 text-red-400',
      pending: 'bg-gray-400/15 text-gray-400',
    };
    return map[status] ?? 'bg-gray-400/15 text-gray-400';
  };

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.total_users.toLocaleString(), icon: Users, color: '#3b82f6' },
    { label: 'Active Stocks', value: stats.total_stocks.toString(), icon: TrendingUp, color: '#D4AF37' },
    { label: 'Revenue (NGN)', value: stats.total_revenue_ngn > 0 ? `₦${(stats.total_revenue_ngn / 1000).toFixed(0)}K` : '₦0', icon: DollarSign, color: '#22c55e' },
    { label: 'KYC Pending', value: stats.kyc_pending.toString(), icon: Bell, color: stats.kyc_pending > 0 ? '#f59e0b' : '#6b7280' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: toast.startsWith('✓') ? 'rgba(34,197,94,0.9)' : toast.startsWith('✗') ? 'rgba(239,68,68,0.9)' : 'rgba(59,130,246,0.9)' }}>
          {toast}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings size={20} color="#D4AF37" />
            Admin Panel
          </h2>
          <p className="text-sm text-gray-400 mt-1">Platform management and analytics</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {STAT_CARDS.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <stat.icon size={14} color={stat.color} />
            </div>
            <div className="text-xl font-bold text-white">{loading ? '—' : stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* KYC Management + Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden mb-5">
        <div className="px-4 py-3 border-b flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">User Management &amp; KYC Approvals</h3>
            {stats.kyc_pending > 0 && (
              <p className="text-[10px] text-yellow-400 mt-0.5">{stats.kyc_pending} submission{stats.kyc_pending > 1 ? 's' : ''} awaiting review</p>
            )}
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
              <option value="all">All</option>
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
                <th className="text-center px-3 py-2.5">KYC Status</th>
                <th className="text-right px-3 py-2.5">Joined</th>
                <th className="text-center px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-xs">Loading users…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-xs">No users found</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="border-b hover:bg-white/[0.02] transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.04)', background: u.kyc_status === 'submitted' ? 'rgba(245,158,11,0.03)' : undefined }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[10px] text-gray-500">{u.email}</div>
                    {u.is_admin && <span className="text-[9px] text-yellow-400 font-bold tracking-wide">ADMIN</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{
                        background: u.plan === 'elite' ? 'rgba(212,175,55,0.15)' : u.plan === 'premium' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)',
                        color: u.plan === 'elite' ? '#D4AF37' : u.plan === 'premium' ? '#60a5fa' : '#9ca3af',
                      }}>{u.plan}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${kycBadge(u.kyc_status)}`}>
                      {u.kyc_status === 'submitted' ? 'Pending Review' : u.kyc_status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-[10px] text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {u.kyc_status === 'submitted' ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleKyc(u.id, 'verified')}
                          disabled={actionLoading === u.id + 'verified'}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all disabled:opacity-50"
                          style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}>
                          <CheckCircle size={10} color="#22c55e" />
                          {actionLoading === u.id + 'verified' ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleKyc(u.id, 'rejected')}
                          disabled={actionLoading === u.id + 'rejected'}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all disabled:opacity-50"
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                          <XCircle size={10} color="#ef4444" />
                          {actionLoading === u.id + 'rejected' ? '…' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* System Status + Plans */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3">
            {[
              { name: 'NGX Data Feed', status: 'Live', latency: '45ms', color: '#22c55e' },
              { name: 'OpenRouter AI', status: 'Active', latency: '120ms', color: '#22c55e' },
              { name: 'Flutterwave Payments', status: 'Active', latency: '80ms', color: '#22c55e' },
              { name: 'Push Notifications', status: 'Active', latency: '30ms', color: '#22c55e' },
              { name: 'Database (PostgreSQL)', status: 'Healthy', latency: '12ms', color: '#22c55e' },
              { name: 'Email Service', status: 'Active', latency: '95ms', color: '#22c55e' },
            ].map((service, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: service.color }} />
                  <span className="text-xs text-gray-300">{service.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500">{service.latency}</span>
                  <span className="text-[10px] font-semibold" style={{ color: service.color }}>{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Subscription Plans</h3>
          <div className="space-y-3">
            {[
              { name: 'Free', price: '₦0/mo', color: '#6b7280', features: ['Basic stock data', 'Limited watchlist'] },
              { name: 'Premium', price: '₦2,500/mo', color: '#3b82f6', features: ['Full NGX data', 'AI Advisor', 'Dividends'] },
              { name: 'Elite', price: '₦5,000/mo', color: '#D4AF37', features: ['Everything + Trading', 'SMS alerts', 'PDF reports'] },
            ].map((plan, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${plan.color}25` }}>
                <div>
                  <div className="text-xs font-bold text-white">{plan.name}</div>
                  <div className="text-[10px] text-gray-500">{plan.features.join(' · ')}</div>
                </div>
                <div className="text-xs font-bold" style={{ color: plan.color }}>{plan.price}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Quick Actions</h4>
            {['Update Stock Prices', 'Send Market Report', 'Process Dividends', 'Export User Data'].map((action, i) => (
              <button key={i}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <span>{action}</span>
                <span className="text-gray-600">→</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}