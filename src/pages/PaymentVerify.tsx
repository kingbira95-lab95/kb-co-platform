/**
 * Handles the Flutterwave payment redirect back.
 * URL: /payment/verify?tx_ref=KBCO-xxx&transaction_id=xxx&status=successful
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, XCircle, Loader } from 'lucide-react';
import { paymentsApi } from '../services/api';
import { useStore } from '../store';

export default function PaymentVerify() {
  const { updateUser } = useStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [plan, setPlan] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tx_ref = params.get('tx_ref') ?? '';
    const transaction_id = params.get('transaction_id') ?? '';
    const flwStatus = params.get('status');

    if (flwStatus === 'cancelled') {
      setStatus('failed');
      setMessage('Payment was cancelled.');
      return;
    }
    if (!tx_ref || !transaction_id) {
      setStatus('error');
      setMessage('Missing payment reference. Please contact support.');
      return;
    }

    paymentsApi.verify(tx_ref, transaction_id)
      .then(res => {
        if (res.success) {
          if (res.plan) {
            setPlan(res.plan);
            updateUser({ plan: res.plan as 'premium' | 'elite' });
          }
          setStatus('success');
          setMessage(res.message);
          // Redirect to dashboard after 3 seconds
          setTimeout(() => { window.history.replaceState({}, '', '/'); window.dispatchEvent(new Event('kbco:payment-success')); }, 3000);
        } else {
          setStatus('failed');
          setMessage(res.message);
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed');
      });
  }, [updateUser]);

  const colors = { success: '#22c55e', failed: '#ef4444', error: '#f59e0b', loading: '#D4AF37' };
  const color = colors[status];

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1E' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-10 text-center max-w-md w-full mx-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg,#D4AF37,#A08020)' }}>
          <Crown size={24} color="#0A0F1E" />
        </div>

        {status === 'loading' && (
          <>
            <Loader size={36} color="#D4AF37" className="mx-auto my-5 animate-spin" />
            <h2 className="text-base font-bold text-white mb-2">Verifying Payment…</h2>
            <p className="text-sm text-gray-400">Please wait while we confirm your transaction.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={44} color={color} className="mx-auto my-5" />
            <h2 className="text-lg font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-sm text-gray-300 mb-4">
              Your <span className="font-bold" style={{ color: '#D4AF37' }}>{plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</span> is now active.
            </p>
            <div className="text-xs text-gray-500">Redirecting to dashboard in 3 seconds…</div>
          </>
        )}

        {(status === 'failed' || status === 'error') && (
          <>
            <XCircle size={44} color={color} className="mx-auto my-5" />
            <h2 className="text-base font-bold text-white mb-2">
              {status === 'failed' ? 'Payment Failed' : 'Verification Error'}
            </h2>
            <p className="text-sm mb-5" style={{ color }}>{message}</p>
            <button onClick={() => window.history.replaceState({}, '', '/')} className="px-6 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg,#D4AF37,#A08020)' }}>
              Back to Dashboard
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
