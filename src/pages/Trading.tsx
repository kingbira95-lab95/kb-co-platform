import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { NGX_STOCKS } from '../data/stocks';
import { formatPrice, formatLargeNumber } from '../utils';
import {
  Shield, TrendingUp, TrendingDown, Search, Plus, Minus,
  CheckCircle, Clock, X, Wallet, BarChart3, RefreshCcw,
  ChevronDown, User, Camera, FileText,
} from 'lucide-react';
import StockLogo from '../components/StockLogo';
import TotalAssetsCard from '../components/TotalAssetsCard';
import { paymentsApi, usersApi, authApi } from '../services/api';
import type { TradingHolding } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// ── KYC form (real account gate) ──────────────────────────────────────────────

const KYC_STEPS = ['Personal', 'Identity', 'Address', 'Bank', 'Review'] as const;

function KYCGate({ onVerified }: { onVerified: () => void }) {
  const { user, updateUser, addNotification } = useStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', bvn: '', nin: '', address: '', city: '', state: '', bankName: '', accountNumber: '', accountName: '' });
  const [uploads, setUploads] = useState({ idFront: false, idBack: false, selfie: false, address: false });
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const pending = user?.kycStatus === 'submitted';
  const rejected = user?.kycStatus === 'rejected';

  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await usersApi.submitKYC({
        bvn: form.bvn,
        nin: form.nin,
        address: form.address || `${form.firstName} ${form.lastName}`,
        city: form.city || 'Lagos',
        state: form.state || 'Lagos',
        bank_name: form.bankName || 'GTBank',
        account_number: form.accountNumber || '0000000000',
        account_name: form.accountName || `${form.firstName} ${form.lastName}`,
        id_type: 'NIN',
        id_number: form.nin || '00000000000',
      });
      updateUser({ kycStatus: 'submitted' });
      addNotification({ type: 'system', title: 'KYC Submitted', message: 'Documents received. An admin will review and approve your account within 1-2 business days.', urgent: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Submission failed. Please try again.';
      setSubmitError(msg);
    }
    setSubmitting(false);
  };

  const checkStatus = async () => {
    setChecking(true);
    try {
      const me = await authApi.me();
      updateUser({
        kycStatus: me.kyc_status as 'pending' | 'submitted' | 'verified' | 'rejected',
      });
      if (me.kyc_status === 'verified') {
        addNotification({ type: 'system', title: 'Account Verified!', message: 'Your real trading account is now active.', urgent: true });
        onVerified();
      }
    } catch { /* ignore network errors */ }
    setChecking(false);
  };

  if (pending || rejected) {
    return (
      <div className="glass-card p-10 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: rejected ? 'rgba(239,68,68,0.1)' : 'rgba(212,175,55,0.1)' }}>
          <Clock size={28} color={rejected ? '#ef4444' : '#D4AF37'} />
        </div>
        <h3 className="text-base font-bold text-white mb-2">
          {rejected ? 'KYC Rejected' : 'Awaiting Admin Approval'}
        </h3>
        <p className="text-sm text-gray-400 mb-2">
          {rejected
            ? 'Your KYC was not approved. Please re-submit with correct information.'
            : 'Your documents have been submitted and are pending review by our compliance team. Approval typically takes 1-2 business days.'}
        </p>
        {!rejected && (
          <p className="text-xs text-gray-600 mb-6">You will receive a notification once your account is approved.</p>
        )}
        <div className="flex gap-3 justify-center mt-4">
          <button onClick={checkStatus} disabled={checking}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
            {checking ? 'Checking…' : 'Check Status'}
          </button>
          {rejected && (
            <button onClick={() => updateUser({ kycStatus: 'pending' })}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              Re-submit KYC
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="glass-card p-5 mb-4">
        <p className="text-sm text-gray-400 mb-4">To open a real trading account regulated by SEC Nigeria, you must complete identity verification.</p>
        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {KYC_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < step ? 'bg-green-500 text-white' : i === step ? 'text-black' : 'text-gray-600'}`}
                style={i === step ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)' } : i < step ? {} : { background: 'rgba(255,255,255,0.08)' }}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < KYC_STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? '#22c55e' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><User size={14} color="#D4AF37" /> Personal Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First Name" className="px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last Name" className="px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            </div>
            <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)', colorScheme: 'dark' }} />
            <input value={form.bvn} onChange={e => setForm(f => ({ ...f, bvn: e.target.value }))} placeholder="BVN (Bank Verification Number)" maxLength={11} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Camera size={14} color="#D4AF37" /> Identity Verification</h4>
            <input value={form.nin} onChange={e => setForm(f => ({ ...f, nin: e.target.value }))} placeholder="NIN (National Identity Number)" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            {(['ID Front', 'ID Back', 'Selfie with ID'] as const).map((label, i) => {
              const keys = ['idFront', 'idBack', 'selfie'] as const;
              return (
                <div key={label} onClick={() => setUploads(u => ({ ...u, [keys[i]]: true }))}
                  className="w-full py-5 rounded-xl text-sm text-center cursor-pointer"
                  style={{ background: uploads[keys[i]] ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px dashed ${uploads[keys[i]] ? '#22c55e' : 'rgba(212,175,55,0.2)'}` }}>
                  {uploads[keys[i]] ? <span className="text-green-400 font-medium">✓ {label} uploaded</span> : <span className="text-gray-500">Click to upload {label}</span>}
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><FileText size={14} color="#D4AF37" /> Address Verification</h4>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street Address" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className="px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
              <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(30,40,70,1)', border: '1px solid rgba(212,175,55,0.15)' }}>
                <option value="">Select State</option>
                {['Lagos', 'Abuja FCT', 'Kano', 'Ogun', 'Rivers', 'Kaduna', 'Delta', 'Oyo', 'Edo', 'Anambra'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div onClick={() => setUploads(u => ({ ...u, address: true }))}
              className="w-full py-5 rounded-xl text-sm text-center cursor-pointer"
              style={{ background: uploads.address ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px dashed ${uploads.address ? '#22c55e' : 'rgba(212,175,55,0.2)'}` }}>
              {uploads.address ? <span className="text-green-400 font-medium">✓ Proof of Address uploaded</span> : <span className="text-gray-500">Click to upload utility bill / bank statement</span>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Wallet size={14} color="#D4AF37" /> Bank Account Details</h4>
            <select value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(30,40,70,1)', border: '1px solid rgba(212,175,55,0.15)' }}>
              <option value="">Select Bank</option>
              {['GTBank', 'Zenith Bank', 'Access Bank', 'UBA', 'First Bank', 'Stanbic IBTC', 'Fidelity Bank', 'FCMB', 'Wema Bank', 'Polaris Bank'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="Account Number (10 digits)" maxLength={10} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            <input value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} placeholder="Account Name" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">Review & Submit</h4>
            {[
              { label: 'Personal Info', ok: !!(form.firstName && form.dob && form.bvn) },
              { label: 'Identity Documents', ok: uploads.idFront && uploads.selfie },
              { label: 'Address Proof', ok: uploads.address },
              { label: 'Bank Details', ok: !!(form.bankName && form.accountNumber) },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${r.ok ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}>{r.ok ? '✓' : '!'}</div>
                <span className={`text-sm ${r.ok ? 'text-white' : 'text-gray-500'}`}>{r.label}</span>
              </div>
            ))}
            <p className="text-xs text-gray-500 leading-relaxed">By submitting, you agree to KB & Co's Terms of Service and SEC compliance requirements. Your information is encrypted and stored securely.</p>
          </div>
        )}

        {submitError && <p className="text-xs text-red-400 mt-3 text-center">{submitError}</p>}
        <div className="flex gap-3 mt-5">
          {step > 0 && <button onClick={back} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 border border-white/10 hover:text-white transition-colors">Back</button>}
          <motion.button whileTap={{ scale: 0.97 }} onClick={step === 4 ? submit : next} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
            {step === 4 ? (submitting ? 'Submitting…' : 'Submit for Admin Review') : 'Continue →'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Buy modal ─────────────────────────────────────────────────────────────────

function BuyModal({ symbol, price, balance, onClose, onBuy }: {
  symbol: string; price: number; balance: number;
  onClose: () => void; onBuy: (shares: number) => void;
}) {
  const stock = NGX_STOCKS.find(s => s.symbol === symbol);
  const [qty, setQty] = useState(1);
  const cost = qty * price;
  const canAfford = balance >= cost;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <StockLogo symbol={symbol} sector={stock?.sector} website={stock?.website} size={36} />
            <div>
              <div className="text-base font-bold text-white">{symbol}</div>
              <div className="text-xs text-gray-500">{stock?.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-3 rounded-xl mb-4 flex justify-between" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-xs text-gray-500">Current Price</span>
          <span className="text-sm font-bold text-white">₦{formatPrice(price)}</span>
        </div>

        <div className="mb-4">
          <label className="text-[10px] text-gray-500 uppercase block mb-2">Number of Shares</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Minus size={14} />
            </button>
            <input type="number" value={qty} min={1} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-bold text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.2)' }} />
            <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Total Cost</span><span className="text-white font-bold">₦{fmt(cost)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Available Balance</span><span className={canAfford ? 'text-green-400' : 'text-red-400'}>₦{fmt(balance)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Balance After</span><span className={canAfford ? 'text-white' : 'text-red-400'}>₦{fmt(Math.max(0, balance - cost))}</span></div>
        </div>

        {!canAfford && <p className="text-xs text-red-400 text-center mb-3">Insufficient balance. Reduce quantity or top up your account.</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 border border-white/10">Cancel</button>
          <button onClick={() => canAfford && onBuy(qty)} disabled={!canAfford}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            Confirm Buy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Sell modal ────────────────────────────────────────────────────────────────

function SellModal({ holding, onClose, onSell }: {
  holding: TradingHolding; onClose: () => void; onSell: (shares: number) => void;
}) {
  const { prices } = useStore();
  const stock = NGX_STOCKS.find(s => s.symbol === holding.symbol);
  const currentPrice = prices[holding.symbol]?.price ?? holding.avgPrice;
  const [qty, setQty] = useState(1);
  const proceeds = qty * currentPrice;
  const cost = qty * holding.avgPrice;
  const pnl = proceeds - cost;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#0D1530', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <StockLogo symbol={holding.symbol} sector={stock?.sector} website={stock?.website} size={36} />
            <div>
              <div className="text-base font-bold text-white">Sell {holding.symbol}</div>
              <div className="text-xs text-gray-500">You own {holding.shares} shares</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-[10px] text-gray-500">Avg Buy Price</div>
            <div className="text-sm font-bold text-white">₦{formatPrice(holding.avgPrice)}</div>
          </div>
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-[10px] text-gray-500">Current Price</div>
            <div className="text-sm font-bold text-white">₦{formatPrice(currentPrice)}</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[10px] text-gray-500 uppercase block mb-2">Shares to Sell (max {holding.shares})</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              <Minus size={14} />
            </button>
            <input type="number" value={qty} min={1} max={holding.shares} onChange={e => setQty(Math.min(holding.shares, Math.max(1, parseInt(e.target.value) || 1)))}
              className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-bold text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(239,68,68,0.2)' }} />
            <button onClick={() => setQty(q => Math.min(holding.shares, q + 1))} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              <Plus size={14} />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map(pct => (
              <button key={pct} onClick={() => setQty(Math.max(1, Math.round(holding.shares * pct / 100)))}
                className="flex-1 py-1 rounded-lg text-[10px] font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 mb-5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between text-xs"><span className="text-gray-500">You'll Receive</span><span className="text-white font-bold">₦{fmt(proceeds)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">P&L on Sale</span><span className={pnl >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{pnl >= 0 ? '+' : ''}₦{fmt(pnl)}</span></div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 border border-white/10">Cancel</button>
          <button onClick={() => onSell(qty)}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            Confirm Sell
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Top-Up modal (demo) ───────────────────────────────────────────────────────

const TOPUP_AMOUNTS = [100_000, 250_000, 500_000, 1_000_000];

function TopUpModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (amount: number) => void }) {
  const [amount, setAmount] = useState(500_000);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">Top Up Demo Account</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Add virtual funds to continue practising. No real money involved.</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {TOPUP_AMOUNTS.map(a => (
            <button key={a} onClick={() => setAmount(a)}
              className="py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: amount === a ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${amount === a ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: amount === a ? '#D4AF37' : '#9ca3af',
              }}>
              ₦{(a / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
        <div className="mb-5">
          <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Custom Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(Math.max(1000, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.2)' }} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-gray-400 border border-white/10">Cancel</button>
          <button onClick={() => { onConfirm(amount); onClose(); }}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
            Add ₦{fmt(amount)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Deposit modal (real account) ──────────────────────────────────────────────

const DEPOSIT_AMOUNTS = [10_000, 50_000, 100_000, 500_000];

function DepositModal({ onClose, userName, userEmail }: { onClose: () => void; userName: string; userEmail: string }) {
  const [amount, setAmount] = useState(50_000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (amount < 1000) { setError('Minimum deposit is ₦1,000'); return; }
    setLoading(true);
    setError('');
    try {
      const { payment_link } = await paymentsApi.fundAccount(amount);
      window.location.href = payment_link;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Payment gateway unavailable. Please try again later.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#0D1530', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">Deposit Funds</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Funds are deposited via Flutterwave (card, bank transfer, USSD). Credited instantly after payment.</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {DEPOSIT_AMOUNTS.map(a => (
            <button key={a} onClick={() => setAmount(a)}
              className="py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: amount === a ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${amount === a ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: amount === a ? '#60a5fa' : '#9ca3af',
              }}>
              ₦{a >= 1000 ? (a / 1000).toFixed(0) + 'K' : a}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Amount (NGN)</label>
          <input type="number" value={amount} onChange={e => setAmount(Math.max(1000, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(59,130,246,0.2)' }} />
        </div>
        <div className="p-3 rounded-xl mb-4 space-y-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Depositing to</span><span className="text-white">{userName}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Email</span><span className="text-white">{userEmail}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Amount</span><span className="text-white font-bold">₦{fmt(amount)}</span></div>
        </div>
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-gray-400 border border-white/10">Cancel</button>
          <button onClick={handlePay} disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            {loading ? 'Redirecting…' : `Pay ₦${fmt(amount)}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Holdings table ────────────────────────────────────────────────────────────

function Holdings({ holdings, onSell }: { holdings: TradingHolding[]; onSell: (h: TradingHolding) => void }) {
  const { prices } = useStore();

  if (holdings.length === 0) {
    return (
      <div className="glass-card p-8 text-center mb-5">
        <BarChart3 size={32} className="mx-auto mb-3 text-gray-600" />
        <p className="text-sm text-gray-500">No holdings yet. Buy stocks from the market below to get started.</p>
      </div>
    );
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.shares * (prices[h.symbol]?.price ?? h.avgPrice), 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avgPrice, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Sector breakdown
  const sectorMap: Record<string, number> = {};
  holdings.forEach(h => {
    const stock = NGX_STOCKS.find(s => s.symbol === h.symbol);
    if (stock) {
      const val = h.shares * (prices[h.symbol]?.price ?? h.avgPrice);
      sectorMap[stock.sector] = (sectorMap[stock.sector] ?? 0) + val;
    }
  });

  return (
    <div className="mb-6">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass-card p-4">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Portfolio Value</div>
          <div className="text-lg font-bold text-white">₦{fmt(totalValue)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Total Invested</div>
          <div className="text-lg font-bold text-white">₦{fmt(totalCost)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Total P&L</div>
          <div className={`text-lg font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}₦{fmt(Math.abs(totalPnl))}
          </div>
          <div className={`text-[10px] ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Sector allocation */}
      {Object.keys(sectorMap).length > 0 && (
        <div className="glass-card p-4 mb-4">
          <div className="text-xs font-semibold text-white mb-3">Sector Allocation</div>
          <div className="space-y-2">
            {Object.entries(sectorMap).sort((a, b) => b[1] - a[1]).map(([sector, val]) => {
              const pct = (val / totalValue) * 100;
              return (
                <div key={sector}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-gray-400">{sector}</span>
                    <span className="text-gray-300">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #D4AF37, #A08020)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Holdings table */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-semibold text-white">Your Holdings</h3>
          <span className="text-[10px] text-gray-500">{holdings.length} position{holdings.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <th className="text-left px-4 py-2.5">Stock</th>
                <th className="text-right px-3 py-2.5">Shares</th>
                <th className="text-right px-3 py-2.5">Avg Price</th>
                <th className="text-right px-3 py-2.5">Current</th>
                <th className="text-right px-3 py-2.5">Value</th>
                <th className="text-right px-3 py-2.5">P&L</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => {
                const stock = NGX_STOCKS.find(s => s.symbol === h.symbol);
                const currentPrice = prices[h.symbol]?.price ?? h.avgPrice;
                const value = h.shares * currentPrice;
                const cost = h.shares * h.avgPrice;
                const pnl = value - cost;
                const pnlPct = (pnl / cost) * 100;
                return (
                  <tr key={h.symbol} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StockLogo symbol={h.symbol} sector={stock?.sector} website={stock?.website} size={24} />
                        <div>
                          <div className="font-bold text-white">{h.symbol}</div>
                          <div className="text-[10px] text-gray-500">{stock?.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-white">{h.shares.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-gray-400">₦{formatPrice(h.avgPrice)}</td>
                    <td className="px-3 py-3 text-right text-white">₦{formatPrice(currentPrice)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-white">₦{fmt(value)}</td>
                    <td className="px-3 py-3 text-right">
                      <div className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {pnl >= 0 ? '+' : ''}₦{fmt(Math.abs(pnl))}
                      </div>
                      <div className={`text-[10px] ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => onSell(h)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-all hover:bg-red-500"
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        SELL
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Stock Marketplace ─────────────────────────────────────────────────────────

const SECTORS = ['All', ...Array.from(new Set(NGX_STOCKS.map(s => s.sector))).sort()];

function StockMarketplace({ onBuy }: { onBuy: (symbol: string) => void }) {
  const { prices } = useStore();
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'marketCap'>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let list = NGX_STOCKS.filter(s => {
      const q = search.toLowerCase();
      return (s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) &&
        (sector === 'All' || s.sector === sector);
    });
    list = [...list].sort((a, b) => {
      const pa = prices[a.symbol]?.price ?? a.price;
      const pb = prices[b.symbol]?.price ?? b.price;
      const ca = prices[a.symbol]?.changePct ?? a.changePct;
      const cb = prices[b.symbol]?.changePct ?? b.changePct;
      let cmp = 0;
      if (sortBy === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
      else if (sortBy === 'price') cmp = pa - pb;
      else if (sortBy === 'change') cmp = ca - cb;
      else cmp = a.marketCap - b.marketCap;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [search, sector, sortBy, sortDir, prices]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortBtn = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button onClick={() => toggleSort(col)} className="flex items-center gap-0.5 hover:text-white transition-colors">
      {label}
      <ChevronDown size={9} className={`transition-transform ${sortBy === col && sortDir === 'asc' ? 'rotate-180' : ''} ${sortBy === col ? 'text-yellow-400' : ''}`} />
    </button>
  );

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h3 className="text-sm font-semibold text-white mb-3">Stock Market — {filtered.length} stocks</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stocks…"
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <select value={sector} onChange={e => setSector(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(30,40,70,1)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <th className="text-left px-4 py-2.5"><SortBtn col="symbol" label="Stock" /></th>
              <th className="text-left px-3 py-2.5 hidden md:table-cell">Sector</th>
              <th className="text-right px-3 py-2.5"><SortBtn col="price" label="Price" /></th>
              <th className="text-right px-3 py-2.5"><SortBtn col="change" label="Change" /></th>
              <th className="text-right px-3 py-2.5 hidden lg:table-cell"><SortBtn col="marketCap" label="Mkt Cap" /></th>
              <th className="text-right px-3 py-2.5 hidden xl:table-cell">52W Range</th>
              <th className="text-right px-3 py-2.5 hidden lg:table-cell">Div Yield</th>
              <th className="text-right px-3 py-2.5 hidden xl:table-cell">P/E</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((stock, i) => {
              const live = prices[stock.symbol];
              const price = live?.price ?? stock.price;
              const changePct = live?.changePct ?? stock.changePct;
              const changeAbs = live?.change ?? stock.change;
              const isUp = changePct >= 0;

              return (
                <motion.tr key={stock.symbol} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 20) * 0.01 }}
                  className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <StockLogo symbol={stock.symbol} sector={stock.sector} website={stock.website} size={26} />
                      <div>
                        <div className="font-bold text-white">{stock.symbol}</div>
                        <div className="text-[10px] text-gray-500 max-w-[120px] truncate hidden sm:block">{stock.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="text-[10px] text-gray-400">{stock.sector}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-bold text-white">₦{formatPrice(price)}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className={`flex items-center justify-end gap-0.5 font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isUp ? '+' : ''}{changePct.toFixed(2)}%
                    </div>
                    <div className={`text-[10px] ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {isUp ? '+' : ''}₦{Math.abs(changeAbs).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right hidden lg:table-cell text-gray-400">{formatLargeNumber(stock.marketCap)}</td>
                  <td className="px-3 py-3 text-right hidden xl:table-cell">
                    <div className="text-[10px] text-gray-500">₦{formatPrice(stock.low52w)} – ₦{formatPrice(stock.high52w)}</div>
                    {/* Mini range bar */}
                    <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{
                        marginLeft: `${Math.max(0, ((price - stock.low52w) / Math.max(0.01, stock.high52w - stock.low52w)) * 80)}%`,
                        width: '20%',
                        background: isUp ? '#22c55e' : '#ef4444',
                      }} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right hidden lg:table-cell">
                    <span className="text-yellow-400 font-semibold">{stock.dividendYield.toFixed(2)}%</span>
                  </td>
                  <td className="px-3 py-3 text-right hidden xl:table-cell text-gray-400">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) + 'x' : '—'}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => onBuy(stock.symbol)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-black transition-all hover:opacity-90 whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                      BUY
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Trading Page ─────────────────────────────────────────────────────────

export default function Trading() {
  const {
    user, demoBalance, demoHoldings, realBalance, realHoldings,
    buyStock, sellStock, topUpDemo, addNotification, prices, updateUser,
  } = useStore();

  const [mode, setMode] = useState<'demo' | 'real'>('demo');
  const [buySymbol, setBuySymbol] = useState<string | null>(null);
  const [sellHolding, setSellHolding] = useState<TradingHolding | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  // kycVerified is derived from user.kycStatus — no local state needed
  const isVerified = user?.kycStatus === 'verified';
  const balance = mode === 'demo' ? demoBalance : realBalance;

  const handleBuy = (shares: number) => {
    if (!buySymbol) return;
    const price = prices[buySymbol]?.price ?? NGX_STOCKS.find(s => s.symbol === buySymbol)?.price ?? 0;
    const ok = buyStock(mode, buySymbol, shares, price);
    if (ok) {
      addNotification({ type: 'portfolio', title: 'Buy Order Filled', message: `${shares} × ${buySymbol} @ ₦${formatPrice(price)}`, symbol: buySymbol, urgent: false });
      setBuySymbol(null);
    }
  };

  const handleSell = (shares: number) => {
    if (!sellHolding) return;
    const price = prices[sellHolding.symbol]?.price ?? sellHolding.avgPrice;
    sellStock(mode, sellHolding.symbol, shares, price);
    addNotification({ type: 'portfolio', title: 'Sell Order Filled', message: `${shares} × ${sellHolding.symbol} @ ₦${formatPrice(price)}`, symbol: sellHolding.symbol, urgent: false });
    setSellHolding(null);
  };

  const buyPrice = buySymbol ? (prices[buySymbol]?.price ?? NGX_STOCKS.find(s => s.symbol === buySymbol)?.price ?? 0) : 0;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield size={20} color="#D4AF37" />
          Trading Account
        </h2>
        <p className="text-sm text-gray-400 mt-1">Simulate with demo funds or trade with real NGN deposits</p>
      </motion.div>

      {/* Total assets summary — shared with My Portfolio & Net Worth */}
      <TotalAssetsCard />

      {/* Account type switcher */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setMode('demo')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
          style={mode === 'demo'
            ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#000' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
          <RefreshCcw size={14} />
          Demo Account
          {mode === 'demo' && <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">₦{(demoBalance / 1_000_000).toFixed(2)}M</span>}
        </button>
        <button onClick={() => setMode('real')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
          style={mode === 'real'
            ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
          <Wallet size={14} />
          Real Account
          {isVerified && <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">KYC ✓</span>}
        </button>
      </div>

      {/* ── DEMO TAB ── */}
      {mode === 'demo' && (
        <>
          {/* Balance card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500 uppercase">Demo Balance</span>
                <button onClick={() => setShowTopUp(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Plus size={10} /> Top Up
                </button>
              </div>
              <div className="text-2xl font-bold" style={{ color: '#D4AF37' }}>₦{fmt(demoBalance)}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Virtual funds — practice trading risk-free</div>
            </div>

            {(() => {
              const totalValue = demoHoldings.reduce((s, h) => s + h.shares * (prices[h.symbol]?.price ?? h.avgPrice), 0);
              const totalCost = demoHoldings.reduce((s, h) => s + h.shares * h.avgPrice, 0);
              const pnl = totalValue - totalCost;
              const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
              return (
                <>
                  <div className="glass-card p-5">
                    <div className="text-[10px] text-gray-500 uppercase mb-1">Invested Value</div>
                    <div className="text-2xl font-bold text-white">₦{fmt(totalValue)}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{demoHoldings.length} position{demoHoldings.length !== 1 ? 's' : ''} held</div>
                  </div>
                  <div className="glass-card p-5">
                    <div className="text-[10px] text-gray-500 uppercase mb-1">Unrealised P&L</div>
                    <div className={`text-2xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : '-'}₦{fmt(Math.abs(pnl))}
                    </div>
                    <div className={`text-[10px] ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="p-3 rounded-xl mb-5 flex items-center gap-2 text-xs text-gray-400" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)' }}>
            <RefreshCcw size={12} color="#D4AF37" />
            Demo mode uses simulated prices that update every 8 seconds. No real money involved.
          </div>

          <Holdings holdings={demoHoldings} onSell={h => setSellHolding(h)} />
          <StockMarketplace onBuy={sym => setBuySymbol(sym)} />
        </>
      )}

      {/* ── REAL TAB ── */}
      {mode === 'real' && (
        <>
          {!isVerified ? (
            <>
              <div className="p-4 rounded-xl mb-5 flex items-start gap-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Shield size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-400">KYC Verification Required</p>
                  <p className="text-xs text-gray-400 mt-0.5">Complete identity verification to open your real trading account and deposit funds via Flutterwave.</p>
                </div>
              </div>
              <KYCGate onVerified={() => updateUser({ kycStatus: 'verified' })} />
            </>
          ) : (
            <>
              {/* Verified header */}
              <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-green-400">KYC Verified · Real Account Active</span>
                  <span className="text-xs text-gray-500 ml-2">Account: {user?.tradingAccountId ?? 'KBC-2026-0001'}</span>
                </div>
              </div>

              {/* Balance row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 uppercase">Available Balance</span>
                    <button onClick={() => setShowDeposit(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                      style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <Plus size={10} /> Deposit
                    </button>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">₦{fmt(realBalance)}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Real NGN · Deposited via Flutterwave</div>
                </div>

                {(() => {
                  const totalValue = realHoldings.reduce((s, h) => s + h.shares * (prices[h.symbol]?.price ?? h.avgPrice), 0);
                  const totalCost = realHoldings.reduce((s, h) => s + h.shares * h.avgPrice, 0);
                  const pnl = totalValue - totalCost;
                  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
                  return (
                    <>
                      <div className="glass-card p-5">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Portfolio Value</div>
                        <div className="text-2xl font-bold text-white">₦{fmt(totalValue)}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{realHoldings.length} holdings</div>
                      </div>
                      <div className="glass-card p-5">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Total P&L</div>
                        <div className={`text-2xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : '-'}₦{fmt(Math.abs(pnl))}
                        </div>
                        <div className={`text-[10px] ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {realBalance === 0 && (
                <div className="p-4 rounded-xl mb-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p className="text-sm text-gray-400 mb-3">Your account has no funds yet. Deposit NGN to start trading real stocks.</p>
                  <button onClick={() => setShowDeposit(true)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                    Deposit Funds via Flutterwave
                  </button>
                </div>
              )}

              <Holdings holdings={realHoldings} onSell={h => setSellHolding(h)} />
              <StockMarketplace onBuy={sym => setBuySymbol(sym)} />

              <p className="text-[10px] text-gray-600 text-center mt-4">
                KB & Co Corporate Investment Limited is regulated by the Securities and Exchange Commission (SEC) Nigeria. All trades are executed through licensed stockbrokers. Prices displayed are indicative.
              </p>
            </>
          )}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {buySymbol && (
          <BuyModal
            key="buy"
            symbol={buySymbol}
            price={buyPrice}
            balance={balance}
            onClose={() => setBuySymbol(null)}
            onBuy={handleBuy}
          />
        )}
        {sellHolding && (
          <SellModal
            key="sell"
            holding={sellHolding}
            onClose={() => setSellHolding(null)}
            onSell={handleSell}
          />
        )}
        {showTopUp && (
          <TopUpModal
            key="topup"
            onClose={() => setShowTopUp(false)}
            onConfirm={topUpDemo}
          />
        )}
        {showDeposit && user && (
          <DepositModal
            key="deposit"
            onClose={() => setShowDeposit(false)}
            userName={user.name}
            userEmail={user.email}
          />
        )}
      </AnimatePresence>
    </div>
  );
}