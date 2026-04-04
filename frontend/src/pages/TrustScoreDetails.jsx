import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ShieldCheck, TrendingUp, TrendingDown, Briefcase, Banknote,
  FileText, Activity, CheckCircle2, AlertCircle, XCircle,
  ArrowRight, Wallet, CreditCard, RefreshCw, Info, Zap
} from 'lucide-react';

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
    <div className="bg-slate-900 border border-slate-700/60 p-4 rounded-2xl shadow-2xl min-w-[160px]">
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">{label}</p>
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

  const color = full ? '#0d9488' : zero ? '#ef4444' : '#f59e0b';
  const bg    = full ? 'bg-teal-50 border-teal-100' : zero ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100';
  const iconBg= full ? 'bg-teal-100 text-teal-600' : zero ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600';
  const StatusIcon = full ? CheckCircle2 : zero ? XCircle : AlertCircle;
  const statusColor= full ? 'text-teal-500' : zero ? 'text-red-400' : 'text-amber-500';

  return (
    <div className={`${bg} border rounded-2xl p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} shrink-0`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <StatusIcon size={16} className={`${statusColor} shrink-0 mt-0.5`} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{factor.label}</p>
        <p className="text-xl font-black text-slate-800">{factor.earned}<span className="text-xs font-bold text-slate-400">/{factor.points} pts</span></p>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[11px] text-slate-500 leading-snug font-medium">{factor.hint}</p>
    </div>
  );
};

const ScoreGauge = ({ score, tier }) => {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
      <svg className="-rotate-90" width={200} height={200}>
        {/* Track */}
        <circle cx={100} cy={100} r={radius} stroke="#1e293b" strokeWidth={12} fill="transparent" />
        {/* Fill */}
        <circle
          cx={100} cy={100} r={radius}
          stroke={tier.color}
          strokeWidth={12}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white tracking-tighter leading-none">{score}</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
        <span className={`text-xs font-black uppercase tracking-widest mt-2 px-3 py-1 rounded-full border ${tier.bg} ${tier.border} ${tier.text}`}>
          {tier.label}
        </span>
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
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">

      {/* ── Page Header ── */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Trust Score Diagnostics</h2>
          <p className="text-slate-500 font-medium mt-2">
            A transparent breakdown of how your <span className="text-teal-600 font-bold">{score}/100</span> trust score is calculated — powered by your real financial profile and transaction history.
          </p>
        </div>
      </div>

      {/* ── Row 1: Score + Profile ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Score Gauge */}
        <div className="col-span-1 bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-sm flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-52 h-24 blur-3xl rounded-full" style={{ backgroundColor: tier.color, opacity: 0.08 }} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Current Trust Score</p>
          <ScoreGauge score={score} tier={tier} />
          <div className="relative z-10 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score Composition</p>
            <p className="text-xs text-slate-400 mt-1">{earnedTotal} / {maxTotal} factor points earned</p>
          </div>
          <ShieldCheck size={160} className="absolute -bottom-8 -right-8 opacity-[0.03] text-white rotate-12" />
        </div>

        {/* Financial Profile */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Financial Profile Snapshot</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Monthly Income',    value: `₹${income.toLocaleString()}`,      icon: Banknote,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Monthly Expenses',  value: `₹${expenses.toLocaleString()}`,    icon: CreditCard, color: 'text-red-500',     bg: 'bg-red-50 border-red-100' },
              { label: 'Disposable Income', value: `₹${disposable.toLocaleString()}`,  icon: Wallet,    color: disposable >= 0 ? 'text-teal-600' : 'text-red-500', bg: disposable >= 0 ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100' },
              { label: 'Employment', value: empType, icon: Briefcase, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-100' },
              { label: 'On-Chain Txns',     value: transactions.length,                icon: Activity,  color: 'text-slate-700',   bg: 'bg-slate-50 border-slate-100' },
              { label: 'Bank Statement',    value: hasBankStatement ? 'Linked ✓' : 'Not Linked', icon: FileText, color: hasBankStatement ? 'text-teal-600' : 'text-amber-600', bg: hasBankStatement ? 'bg-teal-50 border-teal-100' : 'bg-amber-50 border-amber-100' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={`${item.bg} border rounded-2xl p-4 flex flex-col gap-2`}>
                  <Icon size={16} className={`${item.color} opacity-70`} />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className={`text-base font-black ${item.color}`}>{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 2: Score Factors ── */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">Score Factor Breakdown</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">How each dimension contributes to your {score}/100 score</p>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-2 text-center">
            <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Factors Maxed</p>
            <p className="text-xl font-black text-teal-700">{factors.filter(f => f.earned === f.points).length}/{factors.length}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {factors.map((f, i) => <FactorCard key={i} factor={f} />)}
        </div>
      </div>

      {/* ── Row 3: 3-Month Transaction Activity Chart ── */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800">3-Month Transaction Activity</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">CTX in-flows vs out-flows across your last 3 calendar months</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
              <div className="w-3 h-3 rounded-sm bg-teal-500" />
              Credit (In)
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500">
              <div className="w-3 h-3 rounded-sm bg-red-400" />
              Debit (Out)
            </div>
          </div>
        </div>

        {loadingTx ? (
          <div className="h-60 bg-slate-50 rounded-2xl animate-pulse" />
        ) : transactions.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center gap-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Activity size={36} className="text-slate-200" strokeWidth={1.5} />
            <p className="font-bold text-slate-400 text-sm">No transaction history yet</p>
            <p className="text-xs text-slate-300">Join a pool to start building your activity graph</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                  tickFormatter={v => `${v}`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="credit" name="Credit" fill="#0d9488" radius={[6, 6, 0, 0]} />
                <Bar dataKey="debit"  name="Debit"  fill="#f87171" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary pills */}
        {transactions.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
            {[
              { label: 'Total In',    value: `+${Math.round(totalCredit)} CTX`, color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-100' },
              { label: 'Total Out',   value: `-${Math.round(totalDebit)} CTX`,  color: 'text-red-500',    bg: 'bg-red-50 border-red-100' },
              { label: 'Net Flow',    value: `${netFlow >= 0 ? '+' : ''}${Math.round(netFlow)} CTX`, color: netFlow >= 0 ? 'text-teal-600' : 'text-red-500', bg: netFlow >= 0 ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100' },
              { label: 'Total Events',value: `${transactions.length} txns`,     color: 'text-slate-700',  bg: 'bg-slate-50 border-slate-100' },
            ].map((p, i) => (
              <div key={i} className={`${p.bg} border rounded-xl px-4 py-2`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{p.label}</p>
                <p className={`text-sm font-black ${p.color}`}>{p.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Row 4: AI Explanation ── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700/50 shadow-sm relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-64 h-32 blur-3xl rounded-full" style={{ backgroundColor: tier.color, opacity: 0.06 }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tier.bg} ${tier.border}`}>
              <Zap size={18} className={tier.text} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Score Explanation</p>
              <p className="text-white font-black text-base">Why is your score {score}/100?</p>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm font-medium">{explanation}</p>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-full mb-1">Next Steps to Improve</p>
            {!hasBankStatement && (
              <button className="flex items-center gap-2 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl hover:bg-amber-500/15 transition-all">
                <FileText size={13} /> Link Bank Statement +15 pts
              </button>
            )}
            {disposable < 0 && (
              <button className="flex items-center gap-2 text-xs font-black text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/15 transition-all">
                <TrendingDown size={13} /> Reduce Monthly Expenses
              </button>
            )}
            {transactions.filter(t => t.type === 'MONTHLY_PAYMENT').length === 0 && (
              <button className="flex items-center gap-2 text-xs font-black text-teal-400 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-xl hover:bg-teal-500/15 transition-all">
                <Activity size={13} /> Make Your First Pool Payment
              </button>
            )}
            {score >= 80 && (
              <div className="flex items-center gap-2 text-xs font-black text-teal-400 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-xl">
                <ShieldCheck size={13} /> Score Optimized — Keep it up!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 5: Recent Transaction Log ── */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800">Recent On-Chain Activity</h3>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg">
              Last {Math.min(transactions.length, 8)} of {transactions.length}
            </span>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 8).map((tx, i) => {
              const isCredit = tx.direction === 'CREDIT';
              const d = new Date(tx.createdAt);
              const dateStr = `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
              return (
                <div key={tx._id || i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${isCredit ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100'}`}>
                    {isCredit ? <TrendingUp size={15} className="text-teal-600" /> : <TrendingDown size={15} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{tx.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dateStr}</p>
                  </div>
                  <span className={`text-sm font-black ${isCredit ? 'text-teal-600' : 'text-red-500'}`}>
                    {isCredit ? '+' : '-'}{tx.amount} CTX
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default TrustScoreDetails;
