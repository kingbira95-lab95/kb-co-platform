import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { paymentsApi } from '../services/api';
import { Crown, Zap, Shield, Check, Loader } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    color: '#6b7280',
    icon: Shield,
    features: [
      'Basic NGX stock data',
      '5-stock watchlist',
      'Market news',
      'Basic calculators',
    ],
    disabled: ['AI Advisor', 'Portfolio tracker', 'PDF/Excel export', 'Trading account', 'SMS alerts'],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthly: 2500,
    annual: 25000,
    color: '#3b82f6',
    icon: Zap,
    popular: false,
    features: [
      'Full NGX data (137+ stocks)',
      'Unlimited watchlist',
      'AI Advisor chat',
      'Portfolio tracker',
      'Dividend alerts',
      'Excel export',
      'Price alerts (email)',
    ],
    disabled: ['Trading account', 'SMS alerts', 'PDF reports', 'Priority support'],
  },
  {
    id: 'elite',
    name: 'Elite',
    monthly: 5000,
    annual: 50000,
    color: '#D4AF37',
    icon: Crown,
    popular: true,
    features: [
      'Everything in Premium',
      'Trading account (KYC)',
      'PDF portfolio reports',
      'SMS price alerts',
      'Priority support',
      'Research reports',
      'Admin dashboard access',
    ],
    disabled: [],
  },
];

export default function Subscription() {
  const { user } = useStore();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return;
    if (!user) return;
    setLoading(planId);
    setError('');
    try {
      const res = await paymentsApi.initiate(planId, billing);
      // Redirect to Flutterwave payment page
      window.location.href = res.payment_link;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment initiation failed';
      if (msg.includes('fetch') || msg.includes('NetworkError')) {
        setError('Backend server is not running. Start kb-co-backend first, then configure your Flutterwave keys.');
      } else {
        setError(msg);
      }
      setLoading(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-gray-400 text-sm">Unlock Nigeria's most powerful investment intelligence platform</p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-1 mt-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {(['monthly', 'annual'] as const).map(cycle => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              className="px-5 py-2 text-sm font-medium rounded-lg transition-all"
              style={billing === cycle ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#000' } : { color: '#9ca3af' }}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Annual (2 months free)'}
            </button>
          ))}
        </div>
      </motion.div>

      {error && (
        <div className="mb-6 text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-4 py-3 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          const price = billing === 'monthly' ? plan.monthly : plan.annual;
          const isCurrent = user?.plan === plan.id;
          const isPopular = plan.popular;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex flex-col relative"
              style={isPopular ? { border: `1px solid ${plan.color}40`, boxShadow: `0 0 40px ${plan.color}15` } : {}}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold text-black rounded-full" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
                  MOST POPULAR
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}20` }}>
                  <Icon size={18} color={plan.color} />
                </div>
                <div>
                  <div className="text-base font-bold text-white">{plan.name}</div>
                  {isCurrent && <div className="text-[10px] font-semibold" style={{ color: plan.color }}>CURRENT PLAN</div>}
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-white">
                  {price === 0 ? 'Free' : `₦${price.toLocaleString()}`}
                </span>
                {price > 0 && <span className="text-gray-500 text-sm ml-1">/{billing === 'monthly' ? 'mo' : 'yr'}</span>}
                {billing === 'annual' && price > 0 && (
                  <div className="text-xs text-green-400 mt-1">Save ₦{(plan.monthly * 2).toLocaleString()} vs monthly</div>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-gray-300">
                    <Check size={12} color={plan.color} className="flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.disabled.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-gray-600 line-through">
                    <div className="w-3 h-3 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || plan.id === 'free' || loading === plan.id}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-default flex items-center justify-center gap-2"
                style={isPopular && !isCurrent
                  ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#000' }
                  : { border: `1px solid ${plan.color}40`, color: plan.color, background: `${plan.color}10` }
                }
              >
                {loading === plan.id && <Loader size={14} className="animate-spin" />}
                {isCurrent ? 'Current Plan' : plan.id === 'free' ? 'Free Forever' : loading === plan.id ? 'Redirecting…' : 'Upgrade Now'}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-xs text-gray-600 space-y-1">
        <div>All payments processed securely via Flutterwave · NGN only · Cancel anytime</div>
        <div>© 2026 KB & Co Corporate Investment Limited — Investing In The Future.</div>
      </div>
    </div>
  );
}
