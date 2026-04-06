import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ShieldCheck, TrendingUp, TrendingDown, Briefcase, Banknote,
  FileText, Activity, CheckCircle2, AlertCircle, XCircle,
  ArrowRight, Wallet, CreditCard, RefreshCw, Info, Zap, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getTier = (score) => {
  if (score >= 80) return { label: 'Excellent', color: '#0d9488', bg: 'bg-teal-500/15', border: 'border-teal-500/30', text: 'text-teal-400' };
  if (score >= 60) return { label: 'Good',      color: '#f59e0b', bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400' };
  if (score >= 40) return { label: 'Fair',      color: '#f97316', bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400' };
  return             { label: 'Building',   color: '#ef4444', bg: 'bg-red-500/15',    border: 'border-red-500/30',    text: 'text-red-400'    };
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Group transactions into last N calendar months
function buildMonthlyChart(transactions, numMonths = 3) {
  const now = new Date();
  const months = [];
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
      debit: 0,
      credit: 0,
      count: 0,
    });
  }
  const map = Object.fromEntries(months.map(m => [m.key, m]));

  transactions.forEach(tx => {
    const d = new Date(tx.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map[key]) return;
    map[key].count += 1;
    if (tx.direction === 'DEBIT')  map[key].debit  += tx.amount;
    if (tx.direction === 'CREDIT') map[key].credit += tx.amount;
  });

  return months.map(m => ({
    ...m,
    debit:  Math.round(m.debit  * 10) / 10,
    credit: Math.round(m.credit * 10) / 10,
  }));
}

// Compute score factor breakdown from user data + transactions
function computeFactors(user, transactions) {
  const score      = Number(user.trustScore   || 0);
  const income     = Number(user.income       || 0);
  const expenses   = Number(user.expenses     || 0);
  const employment = user.employment || 'Student';
  const hasBankStatement = user.hasBankStatement || false;

  const disposable = income - expenses;
  const ratio      = income > 0 ? disposable / income : 0;

  // Pool payments on time (MONTHLY_PAYMENT with status SUCCESS)
  const poolPayments = transactions.filter(t => t.type === 'MONTHLY_PAYMENT');
  const onTime       = poolPayments.filter(t => t.status === 'SUCCESS').length;

  // Activity: # of transactions
  const activityCount = transactions.length;

  const factors = [
    {
      icon: ShieldCheck,
      label: 'Identity & KYC',
      points: 15,
      earned: score > 0 ? 15 : 0,
      passed: score > 0,
      hint: score > 0
        ? 'Your wallet is KYC-linked and identity is verified on-chain.'
        : 'Complete KYC to unlock trust score calculation.',
    },
    {
      icon: Briefcase,
      label: 'Employment Type',
      points: 20,
      earned: employment === 'Salaried' ? 20 : employment === 'Business' ? 14 : 8,
      passed: true,
      hint:
        employment === 'Salaried' ? `Salaried employment is the highest-trust category (+20 pts).`
        : employment === 'Business' ? `Self-employed / Business type earns moderate trust (+14 pts).`
        : `Student status earns base trust (+8 pts). Improve by gaining employment.`,
    },
    {
      icon: Banknote,
      label: 'Income-to-Expense Ratio',
      points: 25,
      earned: ratio >= 0.5 ? 25 : ratio >= 0.3 ? 18 : ratio >= 0 ? 10 : 0,
      passed: disposable > 0,
      hint:
        ratio >= 0.5 ? `You save ${Math.round(ratio * 100)}% of income — excellent financial discipline.`
        : ratio >= 0.3 ? `You save ${Math.round(ratio * 100)}% of income — good, but room to improve.`
        : disposable >= 0 ? `Tight budget (${Math.round(ratio * 100)}% savings ratio). Reduce expenses to boost score.`
        : `Expenses exceed income — this significantly lowers your trust score.`,
    },
    {
      icon: FileText,
      label: 'Bank Statement Linked',
      points: 15,
      earned: hasBankStatement ? 15 : 0,
      passed: hasBankStatement,
      hint: hasBankStatement
        ? 'Bank statement verified — adds strong financial credibility.'
        : 'Link your bank statement to gain +15 trust points.',
    },
    {
      icon: Activity,
      label: 'Transaction Activity',
      points: 15,
      earned: activityCount >= 5 ? 15 : activityCount >= 2 ? 10 : activityCount >= 1 ? 6 : 0,
      passed: activityCount >= 1,
      hint:
        activityCount >= 5 ? `${activityCount} on-chain actions recorded — high activity score.`
        : activityCount >= 2 ? `${activityCount} transactions recorded — growing activity.`
        : activityCount >= 1 ? `${activityCount} transaction recorded. More activity improves your score.`
        : 'No transactions yet. Join a pool to start building your track record.',
    },
    {
      icon: CheckCircle2,
      label: 'Payment Consistency',
      points: 10,
      earned: onTime >= 3 ? 10 : onTime >= 1 ? 6 : 0,
      passed: onTime >= 1,
      hint:
        onTime >= 3 ? `${onTime} on-time pool payments — perfect consistency.`
        : onTime >= 1 ? `${onTime} pool payment(s) made on time. Keep it up!`
        : 'No pool payments yet. Making regular payments builds consistency score.',
    },
  ];

  return factors;
}

// Generate an AI-style plain-english explanation
function generateExplanation(user, transactions, factors) {
  const score      = Number(user.trustScore || 0);
  const tier       = getTier(score);
  const income     = Number(user.income   || 0);
  const expenses   = Number(user.expenses || 0);
  const disposable = income - expenses;
  const ratio      = income > 0 ? (disposable / income) : 0;
  const empType    = user.employment || 'Student';
  const hasBankStatement = user.hasBankStatement || false;
  const poolJoins  = transactions.filter(t => t.type === 'POOL_JOIN').length;
  const payments   = transactions.filter(t => t.type === 'MONTHLY_PAYMENT' && t.status === 'SUCCESS').length;

  const failedFactors = factors.filter(f => !f.passed || f.earned < f.points);
  const passedCount   = factors.filter(f => f.earned === f.points).length;

  let summary = `Your trust score of ${score}/100 places you in the "${tier.label}" tier. `;

  if (score >= 80) {
    summary += `This is an excellent score — you demonstrate strong financial discipline and on-chain reliability. `;
  } else if (score >= 60) {
    summary += `This is a good score. You have solid fundamentals, with a few areas to strengthen. `;
  } else {
    summary += `Your score is in the building phase. The factors below show clear paths to improvement. `;
  }

  if (empType === 'Salaried') {
    summary += `Your salaried employment provides the highest trust multiplier, contributing 20 points to your score. `;
  } else if (empType === 'Business') {
    summary += `Self-employment contributes 14 points — consider linking your bank statements to compensate for lower employment stability signals. `;
  }

  if (ratio >= 0.4) {
    summary += `Your income-to-expense ratio of ${Math.round(ratio * 100)}% is strong, showing financial discipline. `;
  } else if (disposable < 0) {
    summary += `⚠️ Your expenses currently exceed income (₹${Math.abs(disposable).toLocaleString()}/mo deficit). This is the biggest drag on your score. `;
  } else {
    summary += `Your disposable income is ₹${disposable.toLocaleString()}/mo. Increasing savings will improve your ratio score. `;
  }

  if (!hasBankStatement) {
    summary += `You haven't linked a bank statement yet — doing so would add +15 points immediately. `;
  }

  if (poolJoins > 0) {
    summary += `You've joined ${poolJoins} pool${poolJoins > 1 ? 's' : ''} on ChitX, demonstrating platform participation. `;
  }

  if (payments > 0) {
    summary += `${payments} on-time monthly payment${payments > 1 ? 's' : ''} recorded — payment consistency is a strong trust signal. `;
  }

  if (failedFactors.length > 0) {
    const top = failedFactors.slice(0, 2).map(f => f.label.toLowerCase()).join(' and ');
    summary += `Focus on improving your ${top} to see the most impact on your score.`;
  } else {
    summary += `All factors are performing well — continue your current habits to maintain your excellent rating.`;
  }

  return summary;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#134e4a] border border-[#1aa08c]/20 p-4 rounded-2xl shadow-2xl min-w-[160px] backdrop-blur-xl">
      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 items-center mb-1.5">
          <span className="text-xs font-bold" style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-black text-sm">{p.value} CTX</span>
        </div>
      ))}
    </div>
  );
};

const FactorCard = ({ factor }) => {
  const Icon = factor.icon;
  const pct  = Math.round((factor.earned / factor.points) * 100);
  const full = factor.earned === factor.points;
  const zero = factor.earned === 0;

  const color = full ? '#1aa08c' : zero ? '#rose-500' : '#f59e0b';
  const bg    = full ? 'bg-white border-[#1aa08c]/20' : zero ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200';
  const iconBg= full ? 'bg-[#f4fcf9] text-[#1aa08c]' : zero ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-600';
  const StatusIcon = full ? CheckCircle2 : zero ? XCircle : AlertCircle;
  const statusColor= full ? 'text-[#1aa08c]' : zero ? 'text-rose-400' : 'text-amber-500';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`${bg} border rounded-[2rem] p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl hover:shadow-[#134e4a]/5 transition-all group`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${iconBg} shrink-0 border border-white shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <StatusIcon size={18} className={`${statusColor} shrink-0 mt-0.5`} />
      </div>
      <div>
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#134e4a]/60 mb-1 whitespace-nowrap">{factor.label}</p>
        <p className="text-3xl font-black text-[#134e4a]">{factor.earned}<span className="text-sm font-bold text-[#134e4a]/40 ml-1">/{factor.points} pts</span></p>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <p className="text-[11px] text-[#134e4a]/50 leading-relaxed font-bold">{factor.hint}</p>
    </motion.div>
  );
};

const ScoreGauge = ({ score, tier }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const displayScore = Math.round(score);
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto mt-6" style={{ width: 240, height: 240 }}>
      {/* Background Glow Layer (Reduced) */}
      <div className="absolute inset-6 rounded-full blur-lg opacity-[0.05] pointer-events-none" style={{ backgroundColor: tier.color }} />
      
      <svg className="-rotate-90 drop-shadow-[0_0_6px_rgba(26,160,140,0.05)]" width={240} height={240}>
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#1aa08c" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track (The underlying circle) */}
        <circle 
          cx={120} cy={120} r={radius} 
          stroke="#f4fcf9" 
          strokeWidth={14} 
          fill="transparent" 
        />

        {/* Fill (The progress bar) */}
        <motion.circle
          cx={120} cy={120} r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={14}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* Inner Glass Layer (Reduced Blur) */}
        <circle cx={120} cy={120} r={radius - 20} fill="white" fillOpacity="0.3" className="backdrop-blur-[2px]" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <div className="flex flex-col items-center text-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl font-black text-[#134e4a] tracking-tighter leading-none"
          >
            {displayScore}
          </motion.span>
          <span className="text-[12px] font-black text-[#134e4a]/20 uppercase tracking-[0.4em] mt-2 mb-4">/ 100</span>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`px-4 py-2 rounded-full border border-[#134e4a]/5 bg-white shadow-lg shadow-[#134e4a]/5 flex items-center gap-2.5 ${tier.text}`}
          >
            <div className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm" style={{ backgroundColor: tier.color }} />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">{tier.label} Tier</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const TrustScoreDetails = () => {
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [showExplainer, setShowExplainer] = useState(false);

  const userData = useMemo(() => JSON.parse(localStorage.getItem('chitx_user') || '{}'), []);
  const wallet   = userData.walletAddress?.toLowerCase();
  const score    = Number(userData.trustScore || 0);
  const tier     = getTier(score);

  const income     = Number(userData.income   || 0);
  const expenses   = Number(userData.expenses || 0);
  const disposable = income - expenses;
  const empType    = userData.employment || 'Student';
  const hasBankStatement = userData.hasBankStatement || false;

  useEffect(() => {
    if (!wallet) { setLoadingTx(false); return; }
    fetch(`http://localhost:5000/api/transactions/${wallet}?limit=200`)
      .then(r => r.json())
      .then(data => setTransactions(data.transactions ?? []))
      .catch(() => {})
      .finally(() => setLoadingTx(false));
  }, [wallet]);

  const monthlyChart = useMemo(() => buildMonthlyChart(transactions, 3), [transactions]);
  const factors      = useMemo(() => computeFactors(userData, transactions), [userData, transactions]);
  const explanation  = useMemo(() => generateExplanation(userData, transactions, factors), [userData, transactions, factors]);

  const earnedTotal = factors.reduce((s, f) => s + f.earned, 0);
  const maxTotal    = factors.reduce((s, f) => s + f.points, 0);

  const totalCredit = transactions.filter(t => t.direction === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const totalDebit  = transactions.filter(t => t.direction === 'DEBIT' ).reduce((s, t) => s + t.amount, 0);
  const netFlow     = totalCredit - totalDebit;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 animate-in fade-in duration-700 pb-20"
    >

      {/* ── Page Header ── */}
      <div className="flex justify-between items-end flex-wrap gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#134e4a] tracking-tight leading-tight">Trust Score Diagnostics</h2>
          <p className="text-[#134e4a]/50 font-medium text-lg mt-2 font-black">
            AI-powered breakdown of your <span className="text-[#1aa08c]">{score}/100</span> credibility score.
          </p>
        </div>
      </div>

      {/* ── Row 1: Score + Profile ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Score Gauge */}
        <div className="col-span-1 bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-xl shadow-[#134e4a]/5 flex flex-col items-center justify-center gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f4fcf9]/50 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
          <p className="text-[11px] font-black text-[#134e4a]/30 uppercase tracking-[0.3em] relative z-10">Real-Time Reliability Index</p>
          <ScoreGauge score={score} tier={tier} />
          <div className="relative z-10 text-center">
            <p className="text-[10px] font-black text-[#134e4a]/20 uppercase tracking-[0.2em] mb-2">Diagnostic Integrity</p>
            <p className="text-sm text-[#134e4a]/60 font-bold">{earnedTotal} / {maxTotal} total diagnostic points earned</p>
          </div>
          <ShieldCheck size={180} className="absolute -bottom-8 -right-8 opacity-[0.02] text-[#134e4a] rotate-12 transition-transform group-hover:scale-110 duration-1000" />
        </div>

        {/* Financial Profile */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-xl shadow-[#134e4a]/5">
          <p className="text-[11px] font-black text-[#134e4a]/30 uppercase tracking-[0.3em] mb-8">On-Chain Financial ID Snapshot</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { label: 'Monthly Income',    value: `₹${income.toLocaleString()}`,      icon: Banknote,  color: 'text-emerald-500', bg: 'bg-[#f4fcf9] border-emerald-100' },
              { label: 'Monthly Expenses',  value: `₹${expenses.toLocaleString()}`,    icon: CreditCard, color: 'text-rose-500',     bg: 'bg-rose-50 border-rose-100' },
              { label: 'Disposable Income', value: `₹${disposable.toLocaleString()}`,  icon: Wallet,    color: disposable >= 0 ? 'text-[#1aa08c]' : 'text-rose-500', bg: 'bg-white border-slate-100' },
              { label: 'Employment', value: empType, icon: Briefcase, color: 'text-[#134e4a]', bg: 'bg-white border-slate-100' },
              { label: 'Network Activity',  value: `${transactions.length} Events`,    icon: Activity,  color: 'text-[#134e4a]',   bg: 'bg-white border-slate-100' },
              { label: 'Verify Source',    value: hasBankStatement ? 'Statement ✓' : 'Link Bank', icon: FileText, color: hasBankStatement ? 'text-[#1aa08c]' : 'text-amber-500', bg: hasBankStatement ? 'bg-[#f4fcf9] border-[#1aa08c]/20' : 'bg-amber-50 border-amber-100' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={`${item.bg} border rounded-3xl p-6 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all group`}>
                  <div className="flex items-center justify-between">
                    <Icon size={20} className={`${item.color} opacity-80 group-hover:scale-110 transition-transform`} />
                    <ChevronRight size={14} className="text-slate-200" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#134e4a]/30 mb-1">{item.label}</p>
                    <p className={`text-lg font-black ${item.color} tracking-tight`}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 2: Score Factors ── */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-xl shadow-[#134e4a]/5">
        <div className="flex flex-wrap justify-between items-center mb-10 gap-6">
          <div>
            <h3 className="text-2xl font-black text-[#134e4a] tracking-tight">Factor Breakdown</h3>
            <p className="text-sm text-[#134e4a]/40 mt-1 font-bold">Six key dimensions evaluated by AI on-chain diagnostics.</p>
          </div>
          <div className="bg-[#f4fcf9] border-2 border-[#1aa08c]/20 rounded-3xl px-8 py-4 text-center shadow-sm">
            <p className="text-[11px] font-black text-[#1aa08c] uppercase tracking-[0.2em] mb-1 leading-none">Diagnostic Success</p>
            <p className="text-4xl font-black text-[#134e4a] tracking-tighter">{factors.filter(f => f.earned === f.points).length}<span className="text-base text-[#134e4a]/20 ml-1">/ {factors.length}</span></p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {factors.map((f, i) => <FactorCard key={i} factor={f} />)}
        </div>
      </div>

      {/* ── Row 3: 3-Month Transaction Activity Chart ── */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-xl shadow-[#134e4a]/5 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f4fcf9] rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none opacity-50" />
        
        <div className="flex flex-wrap justify-between items-center mb-10 gap-6 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-[#134e4a] tracking-tight">On-Chain Activity Engine</h3>
            <p className="text-sm text-[#134e4a]/40 mt-1 font-bold">In-flows vs. Out-flows across the previous 3 solar cycles.</p>
          </div>
          <div className="flex gap-4 p-2 bg-[#f4fcf9] rounded-2xl border border-[#1aa08c]/10">
            <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-500 bg-white shadow-sm rounded-xl">
              <div className="w-3.5 h-3.5 rounded-md bg-[#1aa08c]" />
              Volume In
            </div>
            <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-[#134e4a]/30">
              <div className="w-3.5 h-3.5 rounded-md bg-rose-400" />
              Volume Out
            </div>
          </div>
        </div>

        <div className="relative z-10">
          {loadingTx ? (
            <div className="h-80 bg-slate-50 rounded-[2.5rem] animate-pulse" />
          ) : transactions.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-100">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <Activity size={32} className="text-[#134e4a]/10" strokeWidth={2} />
              </div>
              <div className="text-center">
                <p className="font-black text-[#134e4a]/60 text-lg">Activity Engine Idle</p>
                <p className="text-[#134e4a]/30 font-bold text-xs uppercase tracking-widest mt-1">Initialize pool participation to activate data visualization.</p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChart} margin={{ top: 10, right: 20, left: 0, bottom: 20 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                  <XAxis
                    dataKey="label"
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#134e4a', opacity: 0.7, fontSize: 14, fontWeight: 900, textAnchor: 'middle' }}
                    dy={20}
                  />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#134e4a', opacity: 0.6, fontSize: 13, fontWeight: 900 }}
                    tickFormatter={v => `${v}`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f4fcf9' }} />
                  <Bar dataKey="credit" name="Credit" fill="#1aa08c" radius={[12, 12, 4, 4]} />
                  <Bar dataKey="debit"  name="Debit"  fill="#fb7185" radius={[12, 12, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Summary pills */}
        {transactions.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-10 pt-10 border-t border-slate-50 relative z-10">
            {[
              { label: 'Aggregate In',    value: `+${Math.round(totalCredit)} CTX`, color: 'text-emerald-500',   bg: 'bg-[#f4fcf9] border-emerald-100' },
              { label: 'Aggregate Out',   value: `-${Math.round(totalDebit)} CTX`,  color: 'text-rose-500',    bg: 'bg-rose-50 border-rose-100' },
              { label: 'Net Efficiency',    value: `${netFlow >= 0 ? '+' : ''}${Math.round(netFlow)} CTX`, color: netFlow >= 0 ? 'text-[#1aa08c]' : 'text-rose-500', bg: 'bg-white border-slate-100' },
              { label: 'Diagnostic Source',value: `${transactions.length} Verified Events`,     color: 'text-[#134e4a]',  bg: 'bg-white border-slate-100' },
            ].map((p, i) => (
              <div key={i} className={`${p.bg} border rounded-2xl px-6 py-4 shadow-sm group hover:scale-105 transition-transform cursor-default`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#134e4a]/20 mb-2">{p.label}</p>
                <p className={`text-lg font-black ${p.color} tracking-tight`}>{p.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Row 4: AI Explanation ── */}
      <div className="bg-gradient-to-br from-[#134e4a] to-[#0d9488] rounded-[2.5rem] p-10 border border-[#1aa08c]/20 shadow-2xl shadow-[#1aa08c]/20 relative overflow-hidden group">
        {/* Animated Background Pulse */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,#1aa08c,transparent)] opacity-20 pointer-events-none" />
        <div className="absolute top-0 left-0 w-80 h-40 blur-3xl rounded-full translate-x-[-20%] translate-y-[-20%]" style={{ backgroundColor: '#1aa08c', opacity: 0.15 }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 bg-white/10 border-white/20 shadow-lg backdrop-blur-xl group-hover:rotate-12 transition-transform duration-500`}>
              <Zap size={24} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[12px] font-black text-white/60 uppercase tracking-[0.4em] mb-1">Proprietary AI Synthesis</p>
              <p className="text-white font-black text-3xl tracking-tight">Trust Intelligence Output</p>
            </div>
          </div>
          <p className="text-white/80 leading-relaxed text-lg font-black max-w-4xl">{explanation}</p>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-4 mt-10 pt-10 border-t border-white/10">
            <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] w-full mb-2">Architectural Enhancements Required</p>
            {!hasBankStatement && (
              <button className="flex items-center gap-3 text-xs font-black text-white bg-[#1aa08c] px-6 py-3.5 rounded-2xl hover:bg-white hover:text-[#134e4a] hover:shadow-xl transition-all active:scale-95 group/btn">
                <FileText size={16} strokeWidth={3} /> Link External Banking Account <span className="ml-1 opacity-50">+15 PTS</span>
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            )}
            {disposable < 0 && (
              <button className="flex items-center gap-3 text-xs font-black text-white bg-rose-500/20 border border-rose-500/30 px-6 py-3.5 rounded-2xl hover:bg-rose-500 hover:border-transparent transition-all active:scale-95">
                <TrendingDown size={16} strokeWidth={3} /> Optimize Burn Rate (Expenses)
              </button>
            )}
            {transactions.filter(t => t.type === 'MONTHLY_PAYMENT').length === 0 && (
              <button className="flex items-center gap-3 text-xs font-black text-white bg-white/10 border border-white/20 px-6 py-3.5 rounded-2xl hover:bg-white hover:text-[#134e4a] transition-all active:scale-95">
                <Activity size={16} strokeWidth={3} /> Execute First Pool Payment Cycle
              </button>
            )}
            {score >= 80 && (
              <div className="flex items-center gap-3 text-xs font-black text-[#1aa08c] bg-white px-6 py-3.5 rounded-2xl shadow-xl">
                <ShieldCheck size={16} strokeWidth={3} /> Integrity Optimized — Performance Grade: A+
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 5: Recent Transaction Log ── */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-xl shadow-[#134e4a]/5">
          <div className="flex flex-wrap justify-between items-center mb-10 gap-6">
            <h3 className="text-3xl font-black text-[#134e4a] tracking-tight">Recent Diagnostic Events</h3>
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-[#134e4a]/50 bg-[#f4fcf9] border border-[#1aa08c]/10 px-6 py-3 rounded-2xl">
              Chronological Audit Log (Last {Math.min(transactions.length, 8)})
            </span>
          </div>
          <div className="space-y-4">
            {transactions.slice(0, 8).map((tx, idx) => {
              const isCredit = tx.direction === 'CREDIT';
              const d = new Date(tx.createdAt);
              const dateStr = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
              return (
                <motion.div 
                  key={tx._id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-6 p-6 rounded-3xl hover:bg-[#f4fcf9]/50 transition-all group border border-slate-50 hover:border-[#1aa08c]/10 hover:shadow-lg hover:shadow-[#134e4a]/5"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 bg-white transition-transform group-hover:scale-110 ${isCredit ? 'border-[#1aa08c]/20' : 'border-rose-100'}`}>
                    {isCredit ? <TrendingUp size={20} className="text-[#1aa08c]" strokeWidth={2.5} /> : <TrendingDown size={20} className="text-rose-500" strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-[#134e4a] truncate">{tx.description}</p>
                    <p className="text-[10px] font-black text-[#134e4a]/20 uppercase tracking-[0.2em] mt-1">{dateStr}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black ${isCredit ? 'text-[#1aa08c]' : 'text-rose-500'} tracking-tighter`}>
                      {isCredit ? '+' : '-'}{tx.amount} <span className="text-[10px] opacity-30 text-[#134e4a]">CTX</span>
                    </span>
                    <p className="text-[9px] font-black text-[#1aa08c] uppercase tracking-widest mt-1">Verified Audit ✓</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default TrustScoreDetails;
