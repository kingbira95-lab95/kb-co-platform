import { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calcPortfolioGrowth, formatLargeNumber } from '../utils';
import { Calculator as Calc, Target, TrendingUp } from 'lucide-react';

type CalcTab = 'compound' | 'retirement' | 'goal';

export default function Calculator() {
  const [tab, setTab] = useState<CalcTab>('compound');

  // Compound Growth
  const [compound, setCompound] = useState({ initial: 500000, monthly: 50000, annualReturn: 18, years: 10 });
  const compData = calcPortfolioGrowth(compound.initial, compound.monthly, compound.annualReturn, compound.years);
  const finalValue = compData[compData.length - 1]?.value ?? 0;
  const totalInvested = compound.initial + compound.monthly * 12 * compound.years;

  // Retirement
  const [retire, setRetire] = useState({ currentAge: 30, retirementAge: 60, monthlySavings: 50000, annualReturn: 15 });
  const yearsToRetire = Math.max(0, retire.retirementAge - retire.currentAge);
  const retireData = calcPortfolioGrowth(0, retire.monthlySavings, retire.annualReturn, yearsToRetire);
  const retireValue = retireData[retireData.length - 1]?.value ?? 0;

  // Goal
  const [goal, setGoal] = useState({ goalName: 'House', targetAmount: 50000000, years: 5, annualReturn: 15 });
  const monthlyRate = goal.annualReturn / 100 / 12;
  const months = goal.years * 12;
  const monthlyNeeded = monthlyRate > 0
    ? goal.targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1)
    : goal.targetAmount / months;
  const goalData = calcPortfolioGrowth(0, monthlyNeeded, goal.annualReturn, goal.years);

  const TABS = [
    { id: 'compound' as CalcTab, label: 'Compound Growth', icon: TrendingUp },
    { id: 'retirement' as CalcTab, label: 'Retirement Planner', icon: Calc },
    { id: 'goal' as CalcTab, label: 'Goal Planner', icon: Target },
  ];

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none";
  const inputStyle = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' };
  const labelClass = "block text-[10px] text-gray-500 uppercase mb-1.5";

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-xl font-bold text-white">Investment Calculators</h2>
        <p className="text-sm text-gray-400 mt-1">Plan your financial future with KB & Co precision tools</p>
      </motion.div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? 'text-black' : 'text-gray-400 hover:text-white'}`}
            style={tab === t.id ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Compound Growth */}
      {tab === 'compound' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Compound Growth Calculator</h3>
            <div>
              <label className={labelClass}>Initial Capital (₦)</label>
              <input type="number" value={compound.initial} onChange={e => setCompound(c => ({ ...c, initial: +e.target.value }))}
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>Monthly Contribution (₦)</label>
              <input type="number" value={compound.monthly} onChange={e => setCompound(c => ({ ...c, monthly: +e.target.value }))}
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>Annual Return ({compound.annualReturn}%)</label>
              <input type="range" min="5" max="50" step="1" value={compound.annualReturn} onChange={e => setCompound(c => ({ ...c, annualReturn: +e.target.value }))}
                className="w-full accent-yellow-400" />
              <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>5%</span><span>50%</span></div>
            </div>
            <div>
              <label className={labelClass}>Investment Period ({compound.years} years)</label>
              <input type="range" min="1" max="30" step="1" value={compound.years} onChange={e => setCompound(c => ({ ...c, years: +e.target.value }))}
                className="w-full accent-yellow-400" />
              <div className="flex justify-between text-[10px] text-gray-600 mt-0.5"><span>1yr</span><span>30yrs</span></div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="text-lg font-bold" style={{ color: '#D4AF37' }}>{formatLargeNumber(finalValue)}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Final Value</div>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="text-lg font-bold text-green-400">{formatLargeNumber(finalValue - totalInvested)}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Total Profit</div>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="text-lg font-bold text-blue-400">{formatLargeNumber(totalInvested)}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Total Invested</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Growth Projection</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={compData}>
                <defs>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickFormatter={v => formatLargeNumber(v)} />
                <Tooltip contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [formatLargeNumber(v as number), 'Portfolio Value']} />
                <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} fill="url(#compGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Retirement */}
      {tab === 'retirement' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Retirement Planner</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Current Age</label>
                <input type="number" min="18" max="65" value={retire.currentAge} onChange={e => setRetire(r => ({ ...r, currentAge: +e.target.value }))} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass}>Retirement Age</label>
                <input type="number" min="45" max="80" value={retire.retirementAge} onChange={e => setRetire(r => ({ ...r, retirementAge: +e.target.value }))} className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Monthly Savings (₦)</label>
              <input type="number" value={retire.monthlySavings} onChange={e => setRetire(r => ({ ...r, monthlySavings: +e.target.value }))} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>Expected Annual Return ({retire.annualReturn}%)</label>
              <input type="range" min="5" max="40" step="1" value={retire.annualReturn} onChange={e => setRetire(r => ({ ...r, annualReturn: +e.target.value }))} className="w-full accent-yellow-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="text-xl font-bold" style={{ color: '#D4AF37' }}>{formatLargeNumber(retireValue)}</div>
                <div className="text-[10px] text-gray-500 mt-1">Retirement Fund</div>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="text-xl font-bold text-green-400">{yearsToRetire}</div>
                <div className="text-[10px] text-gray-500 mt-1">Years to Retire</div>
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs text-gray-400">Monthly retirement income (at 4% withdrawal):</div>
              <div className="text-lg font-bold text-white mt-1">{formatLargeNumber(retireValue * 0.04 / 12)}/month</div>
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Retirement Growth Curve</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={retireData}>
                <defs>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickFormatter={v => formatLargeNumber(v)} />
                <Tooltip contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [formatLargeNumber(v as number), 'Fund Value']} />
                <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#retGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Goal Planner */}
      {tab === 'goal' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Goal Planner</h3>
            <div>
              <label className={labelClass}>Goal Type</label>
              <select value={goal.goalName} onChange={e => setGoal(g => ({ ...g, goalName: e.target.value }))} className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.07)' }}>
                {['House', 'Education', 'Retirement', 'Car Purchase', 'Business', 'Emergency Fund', 'Vacation'].map(g => (
                  <option key={g} value={g} style={{ background: '#0D1530' }}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Target Amount (₦)</label>
              <input type="number" value={goal.targetAmount} onChange={e => setGoal(g => ({ ...g, targetAmount: +e.target.value }))} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>Timeframe ({goal.years} years)</label>
              <input type="range" min="1" max="20" step="1" value={goal.years} onChange={e => setGoal(g => ({ ...g, years: +e.target.value }))} className="w-full accent-yellow-400" />
            </div>
            <div>
              <label className={labelClass}>Expected Annual Return ({goal.annualReturn}%)</label>
              <input type="range" min="5" max="40" step="1" value={goal.annualReturn} onChange={e => setGoal(g => ({ ...g, annualReturn: +e.target.value }))} className="w-full accent-yellow-400" />
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <div className="text-sm text-gray-400 mb-1">Required Monthly Investment</div>
              <div className="text-3xl font-bold" style={{ color: '#D4AF37' }}>{formatLargeNumber(monthlyNeeded)}</div>
              <div className="text-xs text-gray-500 mt-1">to reach {formatLargeNumber(goal.targetAmount)} in {goal.years} years</div>
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-1">{goal.goalName} — Savings Projection</h3>
            <p className="text-xs text-gray-500 mb-4">Target: {formatLargeNumber(goal.targetAmount)}</p>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={goalData}>
                <defs>
                  <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickFormatter={v => formatLargeNumber(v)} />
                <Tooltip contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [formatLargeNumber(v as number)]} />
                <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} fill="url(#goalGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
