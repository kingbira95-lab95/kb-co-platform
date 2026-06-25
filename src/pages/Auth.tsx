import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { authApi, setTokens } from '../services/api';
import { Eye, EyeOff, Crown, TrendingUp, Shield, Zap, Globe } from 'lucide-react';

const FEATURES = [
  { icon: TrendingUp, text: 'Real-time NGX stock prices & analytics' },
  { icon: Shield, text: 'AI-powered portfolio risk analysis' },
  { icon: Zap, text: 'Dividend alerts & earnings notifications' },
];

export default function Auth() {
  const { login } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = isLogin
        ? await authApi.login(form.email, form.password)
        : await authApi.register(form.email, form.password, form.name);

      setTokens(res.access_token, res.refresh_token);
      login({
        id: res.user_id,
        email: res.email,
        name: res.name,
        plan: res.plan as 'free' | 'premium' | 'elite',
        kycStatus: res.kyc_status as 'pending' | 'submitted' | 'verified' | 'rejected',
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      // Graceful fallback — demo mode when backend is offline
      if (msg.includes('fetch') || msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
        login({
          id: 'offline-user',
          email: form.email,
          name: form.name || form.email.split('@')[0],
          plan: 'premium',
          kycStatus: 'verified',
          createdAt: new Date().toISOString(),
        });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { url } = await authApi.googleUrl();
      window.location.href = url;
    } catch {
      setError('Google login not configured — use email or demo account');
    }
  };

  const handleDemo = () => {
    login({
      id: 'demo-user',
      email: 'demo@kbco.invest',
      name: 'Demo Investor',
      plan: 'elite',
      kycStatus: 'verified',
      tradingAccountId: 'KBC-2026-001',
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0F1E' }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[45%]"
        style={{
          background: 'linear-gradient(135deg, #0A0F1E 0%, #0D1530 60%, #111827 100%)',
          borderRight: '1px solid rgba(212,175,55,0.12)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
            <Crown size={22} color="#0A0F1E" />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: '#D4AF37' }}>KB & Co</div>
            <div className="text-xs text-gray-400 tracking-widest uppercase">Corporate Investment Limited</div>
          </div>
        </div>

        {/* Hero Text */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white leading-tight mb-4"
          >
            Investing In<br />
            <span className="gold-text">The Future.</span>
          </motion.h2>
          <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-xs">
            Nigeria's premier wealth management platform combining institutional-grade research with AI-powered insights.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
                  <f.icon size={15} color="#D4AF37" />
                </div>
                <span className="text-gray-300 text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Listed Stocks', value: '137+' },
            { label: 'AI Reports', value: '10K+' },
            { label: 'Active Users', value: '50K+' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-3 text-center">
              <div className="text-xl font-bold" style={{ color: '#D4AF37' }}>{s.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
              <Crown size={18} color="#0A0F1E" />
            </div>
            <div>
              <div className="font-bold" style={{ color: '#D4AF37' }}>KB & Co Corporate Investment</div>
              <div className="text-[10px] text-gray-400">Investing In The Future.</div>
            </div>
          </div>

          <div className="glass-card p-8">
            {/* Tab toggle */}
            <div className="flex rounded-xl p-1 mb-8" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {['Sign In', 'Sign Up'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setIsLogin(i === 0)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isLogin === (i === 0) ? 'text-black' : 'text-gray-400'
                  }`}
                  style={isLogin === (i === 0) ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)' } : {}}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required={!isLogin}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="John Adeyemi"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="investor@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-[calc(50%+8px)] -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-black transition-all relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : isLogin ? 'Sign In to Dashboard' : 'Create Account'}
              </motion.button>
            </form>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-1"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs text-gray-600">or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <motion.button
              onClick={handleGoogleLogin}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 border transition-all hover:bg-white/5 mb-2"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Globe size={15} />
              Continue with Google
            </motion.button>

            <motion.button
              onClick={handleDemo}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-sm font-medium text-white border transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(212,175,55,0.25)' }}
            >
              Try Demo Account (Elite Access)
            </motion.button>

            <p className="text-[10px] text-gray-600 text-center mt-6 leading-relaxed">
              KB & Co Corporate Investment Limited provides investment research and educational information only. Investments are subject to market risks.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
