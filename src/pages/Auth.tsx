import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { authApi, setTokens } from '../services/api';
import { Eye, EyeOff, TrendingUp, Shield, Zap, Crown } from 'lucide-react';

const FEATURES = [
  { icon: TrendingUp, text: 'Real-time NGX stock prices & analytics' },
  { icon: Shield, text: 'AI-powered portfolio risk analysis' },
  { icon: Zap, text: 'Dividend alerts & earnings notifications' },
];

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Auth() {
  const { login } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null); // null = checking
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // Check if Google OAuth is configured on the backend
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/auth/google/url`)
      .then(r => setGoogleAvailable(r.ok))
      .catch(() => setGoogleAvailable(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic client-side validation
    if (!isLogin && form.name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      setLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = isLogin
        ? await authApi.login(form.email, form.password)
        : await authApi.register(form.email, form.password, form.name);

      setTokens(res.access_token, res.refresh_token);
      if (!isLogin) setSuccess('Account created! Signing you in…');
      login({
        id: res.user_id,
        email: res.email,
        name: res.name,
        plan: res.plan as 'free' | 'premium' | 'elite',
        kycStatus: res.kyc_status as 'pending' | 'submitted' | 'verified' | 'rejected',
        tradingAccountId: res.trading_account_id ?? undefined,
        isAdmin: res.is_admin ?? false,
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Authentication failed';

      // Network / backend offline → allow demo fallback
      if (raw.includes('fetch') || raw.includes('NetworkError') || raw.includes('Failed to fetch') || raw.includes('ERR_')) {
        login({
          id: 'offline-user',
          email: form.email,
          name: form.name || form.email.split('@')[0],
          plan: 'premium',
          kycStatus: 'verified',
          createdAt: new Date().toISOString(),
        });
        return;
      }

      // Map common backend errors to friendly messages
      if (raw.includes('already registered') || raw.includes('already exists')) {
        setError('An account with this email already exists. Sign in instead.');
      } else if (raw.includes('Invalid credentials') || raw.includes('Incorrect') || raw === '401') {
        setError('Incorrect email or password. Please try again.');
      } else if (raw.includes('not found') || raw.includes('404')) {
        setError('No account found with this email. Sign up to create one.');
      } else {
        setError(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { url } = await authApi.googleUrl();
      window.location.href = url;
    } catch {
      setError('Google Sign-In is not available right now. Please use email sign-in.');
      setGoogleLoading(false);
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

  const switchMode = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError('');
    setSuccess('');
    setForm(f => ({ ...f, password: '' }));
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
          <img
            src="/logo.png"
            alt="KB & Co"
            className="h-14 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
            onError={e => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fb) fb.style.display = 'flex';
            }}
          />
          {/* Crown fallback — hidden when logo loads */}
          <div style={{ display: 'none' }} className="items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
              <Crown size={22} color="#0A0F1E" />
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: '#D4AF37' }}>KB & Co</div>
              <div className="text-xs text-gray-400 tracking-widest uppercase">Corporate Investment Limited</div>
            </div>
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
            <img
              src="/logo.png"
              alt="KB & Co"
              className="h-10 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
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
                  onClick={() => switchMode(i === 0)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isLogin === (i === 0) ? 'text-black' : 'text-gray-400 hover:text-white'
                  }`}
                  style={isLogin === (i === 0) ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)' } : {}}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="investor@example.com"
                  autoComplete="email"
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
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-[calc(50%+10px)] -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5 flex items-start gap-2"
                  >
                    <span className="mt-0.5">⚠</span>
                    <span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2.5"
                  >
                    ✓ {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-black transition-all relative overflow-hidden disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                    {isLogin ? 'Signing in…' : 'Creating account…'}
                  </span>
                ) : isLogin ? 'Sign In to Dashboard' : 'Create Account'}
              </motion.button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs text-gray-600">or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Google button — only shown when backend has it configured */}
            {googleAvailable !== false && (
              <motion.button
                onClick={handleGoogleLogin}
                disabled={googleLoading || googleAvailable === null}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 border transition-all hover:bg-white/5 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {googleAvailable === null ? 'Checking Google Sign-In…' : 'Continue with Google'}
              </motion.button>
            )}

            <motion.button
              onClick={handleDemo}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}
            >
              Try Demo Account (Elite Access)
            </motion.button>

            <p className="text-[10px] text-gray-600 text-center mt-6 leading-relaxed">
              KB & Co Corporate Investment Limited provides investment research and educational information only.
              Investments are subject to market risks.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}