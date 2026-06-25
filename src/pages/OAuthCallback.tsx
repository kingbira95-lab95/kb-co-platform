/**
 * Handles Google OAuth redirect back to the app.
 * URL: /auth/google/callback?code=xxx
 * Extracts the code, exchanges it for tokens, logs the user in.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, XCircle } from 'lucide-react';
import { authApi, setTokens } from '../services/api';
import { useStore } from '../store';

export default function OAuthCallback() {
  const { login } = useStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) { setStatus('error'); setError('No authorization code received from Google.'); return; }

    authApi.googleCallback(code)
      .then(res => {
        setTokens(res.access_token, res.refresh_token);
        login({
          id: res.user_id,
          email: res.email,
          name: res.name,
          plan: res.plan as 'free' | 'premium' | 'elite',
          kycStatus: res.kyc_status as 'pending' | 'submitted' | 'verified' | 'rejected',
          createdAt: new Date().toISOString(),
        });
        setStatus('success');
        // Navigate to dashboard by replacing the URL so back-button works
        window.history.replaceState({}, '', '/');
      })
      .catch(err => {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Google login failed');
      });
  }, [login]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1E' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 text-center max-w-sm w-full mx-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg,#D4AF37,#A08020)' }}>
          <Crown size={24} color="#0A0F1E" />
        </div>
        <div className="text-base font-bold text-white mb-1">KB & Co</div>

        {status === 'loading' && (
          <>
            <div className="w-8 h-8 border-2 border-white/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto my-6" />
            <p className="text-sm text-gray-400">Completing Google sign-in…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={36} color="#22c55e" className="mx-auto my-5" />
            <p className="text-sm text-gray-300">Signed in successfully. Redirecting…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={36} color="#ef4444" className="mx-auto my-5" />
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <button onClick={() => window.location.href = '/'} className="text-xs px-4 py-2 rounded-lg text-black font-semibold" style={{ background: 'linear-gradient(135deg,#D4AF37,#A08020)' }}>
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
