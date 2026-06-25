import { motion } from 'framer-motion';
import { useStore } from '../store';
import { NGX_STOCKS } from '../data/stocks';
import { Users, TrendingUp, DollarSign, Bell, Shield, Settings } from 'lucide-react';

export default function Admin() {
  const { user } = useStore();

  if (user?.email !== 'admin@kbco.invest' && user?.email !== 'demo@kbco.invest') {
    return (
      <div className="p-6 text-center">
        <Shield size={40} className="mx-auto mb-4 text-gray-600" />
        <p className="text-white text-base font-semibold">Admin Access Required</p>
        <p className="text-gray-500 text-sm mt-1">You need admin privileges to access this panel.</p>
      </div>
    );
  }

  const ADMIN_STATS = [
    { label: 'Total Users', value: '50,247', change: '+12.3%', icon: Users, color: '#3b82f6' },
    { label: 'Active Stocks', value: NGX_STOCKS.length.toString(), change: '+2', icon: TrendingUp, color: '#D4AF37' },
    { label: 'Monthly Revenue', value: '₦8.4M', change: '+18.5%', icon: DollarSign, color: '#22c55e' },
    { label: 'Notifications Sent', value: '124K', change: '+5.2%', icon: Bell, color: '#a855f7' },
  ];

  const RECENT_USERS = [
    { name: 'Adaeze Okafor', email: 'adaeze@mail.com', plan: 'Elite', status: 'verified', joined: '2026-06-20' },
    { name: 'Chukwuemeka Nwosu', email: 'emeka@gmail.com', plan: 'Premium', status: 'pending', joined: '2026-06-19' },
    { name: 'Fatima Ibrahim', email: 'fatima@yahoo.com', plan: 'Free', status: 'verified', joined: '2026-06-18' },
    { name: 'Oluwaseun Adeleke', email: 'seun@corp.ng', plan: 'Elite', status: 'verified', joined: '2026-06-17' },
    { name: 'Ngozi Anyanwu', email: 'ngozi@invest.ng', plan: 'Premium', status: 'submitted', joined: '2026-06-16' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings size={20} color="#D4AF37" />
          Admin Panel
        </h2>
        <p className="text-sm text-gray-400 mt-1">Platform management and analytics</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {ADMIN_STATS.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <stat.icon size={14} color={stat.color} />
            </div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-green-400 mt-0.5">{stat.change} this month</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Users Table */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold text-white">Recent Users</h3>
            <span className="text-[10px] text-gray-500">50,247 total</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <th className="text-left px-4 py-2">User</th>
                <th className="text-center px-3 py-2">Plan</th>
                <th className="text-center px-3 py-2">KYC</th>
                <th className="text-right px-3 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_USERS.map((u, i) => (
                <tr key={i} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-2.5">
                    <div className="text-xs font-semibold text-white">{u.name}</div>
                    <div className="text-[10px] text-gray-500">{u.email}</div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                      background: u.plan === 'Elite' ? 'rgba(212,175,55,0.15)' : u.plan === 'Premium' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.08)',
                      color: u.plan === 'Elite' ? '#D4AF37' : u.plan === 'Premium' ? '#60a5fa' : '#9ca3af'
                    }}>{u.plan}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.status === 'verified' ? 'bg-green-400/15 text-green-400' : u.status === 'submitted' ? 'bg-yellow-400/15 text-yellow-400' : 'bg-red-400/15 text-red-400'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[10px] text-gray-500">{new Date(u.joined).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* System Status */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3">
            {[
              { name: 'NGX Data Feed', status: 'Live', latency: '45ms', color: '#22c55e' },
              { name: 'OpenRouter AI', status: 'Active', latency: '120ms', color: '#22c55e' },
              { name: 'Paystack Payments', status: 'Active', latency: '80ms', color: '#22c55e' },
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

          <div className="mt-5 space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Quick Actions</h4>
            {['Update Stock Prices', 'Send Market Report', 'Process Dividends', 'Export User Data'].map((action, i) => (
              <button key={i} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-all" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <span>{action}</span>
                <span className="text-gray-600">→</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Subscription Plans */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5 mt-5">
        <h3 className="text-sm font-semibold text-white mb-4">Subscription Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Free', price: '₦0/mo', users: '32,150', features: ['Basic stock data', 'Limited watchlist', 'Market news'], color: '#6b7280' },
            { name: 'Premium', price: '₦2,500/mo', users: '14,820', features: ['Full stock analysis', 'AI Advisor', 'Dividend alerts', 'Portfolio tracker'], color: '#3b82f6' },
            { name: 'Elite', price: '₦5,000/mo', users: '3,277', features: ['Everything in Premium', 'Trading account', 'SMS alerts', 'Priority support', 'PDF reports', 'Excel exports'], color: '#D4AF37' },
          ].map((plan, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${plan.color}30` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold text-white">{plan.name}</div>
                <div className="text-sm font-bold" style={{ color: plan.color }}>{plan.price}</div>
              </div>
              <div className="text-lg font-bold text-white mb-3">{plan.users} <span className="text-xs text-gray-500 font-normal">users</span></div>
              <ul className="space-y-1.5">
                {plan.features.map((f, j) => (
                  <li key={j} className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <span style={{ color: plan.color }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
