import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { Shield, User, Camera, FileText, CheckCircle, Clock, Wallet } from 'lucide-react';

type KYCStep = 'start' | 'personal' | 'identity' | 'address' | 'bank' | 'review' | 'pending' | 'verified';

const KYC_STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'identity', label: 'ID Verification', icon: Camera },
  { id: 'address', label: 'Address Proof', icon: FileText },
  { id: 'bank', label: 'Bank Details', icon: Wallet },
  { id: 'review', label: 'Review', icon: CheckCircle },
];

export default function Trading() {
  const { user, updateUser, addNotification } = useStore();
  const [kycStep, setKycStep] = useState<KYCStep>((user?.kycStatus === 'verified' ? 'verified' : 'start') as KYCStep);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', bvn: '', nin: '', address: '', city: '', state: '', bankName: '', accountNumber: '', accountName: '' });
  const [fileUploads, setFileUploads] = useState({ idFront: false, idBack: false, selfie: false, addressProof: false });

  const isKYCComplete = user?.kycStatus === 'verified';

  const handleSubmitKYC = () => {
    updateUser({ kycStatus: 'submitted' });
    addNotification({ type: 'system', title: 'KYC Submitted', message: 'Your KYC documents have been submitted. Verification takes 1-2 business days.', urgent: true });
    setKycStep('pending');
  };

  const handleVerify = () => {
    updateUser({ kycStatus: 'verified', tradingAccountId: 'KBC-2026-' + Math.floor(Math.random() * 9000 + 1000) });
    addNotification({ type: 'system', title: 'Account Verified! 🎉', message: 'Your trading account is now active. You can start trading NGX stocks.', urgent: true });
    setKycStep('verified');
  };

  if (isKYCComplete || kycStep === 'verified') {
    return (
      <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield size={20} color="#D4AF37" />
            Trading Account
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage your NGX trading account and execute orders</p>
        </motion.div>

        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Account Number', value: user?.tradingAccountId ?? 'KBC-2026-001', color: '#D4AF37' },
            { label: 'Available Balance', value: '₦2,450,000.00', color: '#22c55e' },
            { label: 'Total Portfolio Value', value: '₦4,200,000.00', color: '#3b82f6' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
              <div className="text-xs text-gray-500 mb-1">{item.label}</div>
              <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Verified Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <CheckCircle size={20} className="text-green-400" />
          <div>
            <div className="text-sm font-semibold text-green-400">KYC Verified — Trading Account Active</div>
            <div className="text-xs text-gray-500 mt-0.5">You can buy and sell NGX-listed stocks through this platform</div>
          </div>
        </div>

        {/* Quick Trade */}
        <div className="glass-card p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Quick Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Stock Symbol</label>
              <input placeholder="e.g. DANGCEM" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Order Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}>
                <option style={{ background: '#0D1530' }}>Market Order</option>
                <option style={{ background: '#0D1530' }}>Limit Order</option>
                <option style={{ background: '#0D1530' }}>Stop Loss</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Quantity</label>
              <input type="number" placeholder="100" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            </div>
            <div className="flex gap-2 items-end">
              <button className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>BUY</button>
              <button className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>SELL</button>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-600 text-center">
          KB & Co Corporate Investment Limited is regulated by the Securities and Exchange Commission (SEC) Nigeria. All trades are executed through licensed stockbrokers.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[800px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield size={20} color="#D4AF37" />
          Open Trading Account
        </h2>
        <p className="text-sm text-gray-400 mt-1">Complete KYC verification to start trading NGX stocks</p>
      </motion.div>

      {kycStep === 'start' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card p-6 mb-6">
            <h3 className="text-base font-bold text-white mb-2">KYC Verification Required</h3>
            <p className="text-sm text-gray-400 mb-6">To comply with SEC and FINTRAC regulations, you must complete identity verification before trading.</p>
            <div className="space-y-3 mb-6">
              {KYC_STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>{i + 1}</div>
                  <step.icon size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-300">{step.label}</span>
                </div>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setKycStep('personal')} className="w-full py-3 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
              Start KYC Verification
            </motion.button>
          </div>
        </motion.div>
      )}

      {(kycStep === 'personal' || kycStep === 'identity' || kycStep === 'address' || kycStep === 'bank' || kycStep === 'review') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {KYC_STEPS.map((step, i) => {
              const stepOrder = ['personal', 'identity', 'address', 'bank', 'review'];
              const currentIdx = stepOrder.indexOf(kycStep);
              const isComplete = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={step.id} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isComplete ? 'bg-green-500 text-white' : isCurrent ? 'text-black' : 'text-gray-600'}`}
                    style={isCurrent ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)' } : isComplete ? {} : { background: 'rgba(255,255,255,0.08)' }}>
                    {isComplete ? '✓' : i + 1}
                  </div>
                  {i < KYC_STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: isComplete ? '#22c55e' : 'rgba(255,255,255,0.1)' }} />}
                </div>
              );
            })}
          </div>

          <div className="glass-card p-6">
            {kycStep === 'personal' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1.5">First Name</label>
                    <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Last Name</label>
                    <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Adeyemi" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1.5">BVN (Bank Verification Number)</label>
                  <input value={form.bvn} onChange={e => setForm(f => ({ ...f, bvn: e.target.value }))} placeholder="12345678901" maxLength={11} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
                </div>
              </div>
            )}

            {kycStep === 'identity' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Identity Verification</h3>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1.5">NIN (National Identity Number)</label>
                  <input value={form.nin} onChange={e => setForm(f => ({ ...f, nin: e.target.value }))} placeholder="12345678901" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
                </div>
                {(['ID Front', 'ID Back', 'Selfie with ID'] as const).map((label, i) => {
                  const keys = ['idFront', 'idBack', 'selfie'] as const;
                  return (
                    <div key={label}>
                      <label className="text-[10px] text-gray-500 uppercase block mb-1.5">{label}</label>
                      <div
                        onClick={() => setFileUploads(f => ({ ...f, [keys[i]]: true }))}
                        className="w-full px-3 py-6 rounded-xl text-sm text-center cursor-pointer transition-all hover:border-yellow-400/30"
                        style={{ background: fileUploads[keys[i]] ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px dashed ${fileUploads[keys[i]] ? '#22c55e' : 'rgba(212,175,55,0.2)'}` }}
                      >
                        {fileUploads[keys[i]] ? (
                          <span className="text-green-400 font-medium">✓ Uploaded</span>
                        ) : (
                          <span className="text-gray-500">Click to upload {label}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {kycStep === 'address' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Address Verification</h3>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Street Address</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1.5">City</label>
                    <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1.5">State</label>
                    <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}>
                      <option value="" style={{ background: '#0D1530' }}>Select State</option>
                      {['Lagos', 'Abuja FCT', 'Kano', 'Ogun', 'Rivers', 'Kaduna', 'Delta', 'Oyo', 'Edo', 'Anambra'].map(s => (
                        <option key={s} value={s} style={{ background: '#0D1530' }}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Proof of Address (Utility Bill / Bank Statement)</label>
                  <div onClick={() => setFileUploads(f => ({ ...f, addressProof: true }))}
                    className="w-full px-3 py-6 rounded-xl text-sm text-center cursor-pointer transition-all"
                    style={{ background: fileUploads.addressProof ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px dashed ${fileUploads.addressProof ? '#22c55e' : 'rgba(212,175,55,0.2)'}` }}>
                    {fileUploads.addressProof ? <span className="text-green-400 font-medium">✓ Uploaded</span> : <span className="text-gray-500">Click to upload proof of address</span>}
                  </div>
                </div>
              </div>
            )}

            {kycStep === 'bank' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Bank Account Details</h3>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Bank Name</label>
                  <select value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}>
                    <option value="" style={{ background: '#0D1530' }}>Select Bank</option>
                    {['GTBank', 'Zenith Bank', 'Access Bank', 'UBA', 'First Bank', 'Stanbic IBTC', 'Fidelity Bank', 'FCMB', 'Wema Bank', 'Polaris Bank'].map(b => (
                      <option key={b} value={b} style={{ background: '#0D1530' }}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Account Number</label>
                  <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="0123456789" maxLength={10} className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Account Name</label>
                  <input value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} placeholder="John Adeyemi" className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
                </div>
              </div>
            )}

            {kycStep === 'review' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Review & Submit</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Personal Info', done: !!(form.firstName && form.dob && form.bvn) },
                    { label: 'Identity Verification', done: fileUploads.idFront && fileUploads.selfie },
                    { label: 'Address Proof', done: fileUploads.addressProof },
                    { label: 'Bank Details', done: !!(form.bankName && form.accountNumber) },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.done ? 'bg-green-500' : 'bg-gray-700'}`}>
                        {item.done ? <span className="text-white text-xs">✓</span> : <span className="text-gray-400 text-xs">!</span>}
                      </div>
                      <span className={`text-sm ${item.done ? 'text-white' : 'text-gray-500'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl text-xs text-gray-400 leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  By submitting, you agree to KB & Co Corporate Investment's Terms of Service and Privacy Policy. Your information will be used solely for KYC compliance under SEC regulations.
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {kycStep !== 'personal' && (
                <button onClick={() => setKycStep(prev => {
                  const steps = ['personal', 'identity', 'address', 'bank', 'review'] as const;
                  const idx = steps.indexOf(prev as any);
                  return steps[Math.max(0, idx - 1)] as KYCStep;
                })} className="px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  Back
                </button>
              )}
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (kycStep === 'review') handleSubmitKYC();
                  else setKycStep(prev => {
                    const steps = ['personal', 'identity', 'address', 'bank', 'review'] as const;
                    const idx = steps.indexOf(prev as any);
                    return steps[Math.min(steps.length - 1, idx + 1)] as KYCStep;
                  });
                }}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-black"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
                {kycStep === 'review' ? 'Submit KYC' : 'Continue'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {kycStep === 'pending' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(212,175,55,0.1)' }}>
            <Clock size={28} color="#D4AF37" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">KYC Under Review</h3>
          <p className="text-sm text-gray-400 mb-6">Your documents are being verified. This usually takes 1-2 business days.</p>
          <div className="p-3 rounded-xl text-xs text-gray-500 mb-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            You'll receive an email and push notification when your account is verified.
          </div>
          <button onClick={handleVerify} className="px-6 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            Simulate Verification (Demo)
          </button>
        </motion.div>
      )}
    </div>
  );
}
