import React, { useState, useEffect } from 'react';
import { Layers, Users, Wallet, Clock, TrendingUp, ChevronRight, Sparkles, Star } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

// ── Radial fill gauge ──────────────────────────────────────────────────────
const FillGauge = ({ percent, size = 80 }) => {
  const data = [{ value: percent }];
  return (
    <div style={{ width: size, height: size }} className="relative shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#f1f5f9' }}
            dataKey="value"
            angleAxisId={0}
            fill="#0d9488"
            cornerRadius={8}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-xs font-black text-teal-700 leading-none">{Math.round(percent)}%</span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">full</span>
      </div>
    </div>
  );
};

// ── Single active pool card ─────────────────────────────────────────────────
const ActivePoolCard = ({ pool }) => {
  const joined  = pool.joinedMembers?.length ?? 0;
  const slots   = pool.members ?? 20;
  const percent = Math.min(100, Math.round((joined / slots) * 100));
  const treasury = pool.poolTreasury ?? 0;
  const myContrib = pool._myContrib;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex gap-5 items-start hover:shadow-md hover:border-teal-100 transition-all group min-w-[320px]">
      {/* Gauge */}
      <FillGauge percent={percent} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
              ACTIVE
            </span>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Pool #{pool._id?.slice(-4).toUpperCase()}
          </span>
        </div>

        <h4 className="text-xl font-black text-slate-800 tracking-tight mt-1">
          ${(pool.monthlyPay ?? 0).toLocaleString()}
          <span className="text-xs font-bold text-slate-400 ml-1">/ mo</span>
        </h4>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Members</p>
            <p className="text-sm font-black text-slate-700 flex items-center gap-1">
              <Users size={11} className="text-teal-500" />
              {joined}/{slots}
            </p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Treasury</p>
            <p className="text-sm font-black text-slate-700 flex items-center gap-1">
              <Wallet size={11} className="text-amber-500" />
              {treasury} CTX
            </p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">My Deposit</p>
            <p className="text-sm font-black text-teal-700 flex items-center gap-1">
              <TrendingUp size={11} />
              {myContrib?.fixedDeposit ?? 0} CTX
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            <span>Pool Fill Progress</span>
            <span>{percent}%</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Match score badge ──────────────────────────────────────────────────────
const MatchBadge = ({ score }) => {
  const color = score >= 85 ? 'emerald' : score >= 65 ? 'teal' : 'amber';
  const map   = { emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200', teal: 'bg-teal-50 text-teal-700 border-teal-100', amber: 'bg-amber-50 text-amber-700 border-amber-200' };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border flex items-center gap-1 ${map[color]}`}>
      <Star size={9} fill="currentColor" />
      {score}% match
    </span>
  );
};

// ── Single recommended pool card ───────────────────────────────────────────
const RecommendedPoolCard = ({ pool, matchScore, matchReason }) => {
  const joined  = pool.joinedMembers?.length ?? 0;
  const slots   = pool.members ?? 20;
  const spotsLeft = Math.max(0, slots - joined);
  const deposit = (pool.monthlyPay ?? 0) * 2;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md hover:border-emerald-100 transition-all group min-w-[280px]">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100/50 text-teal-600">
          <Layers size={18} />
        </div>
        <MatchBadge score={matchScore} />
      </div>

      <div>
        <h4 className="text-lg font-black text-slate-800 tracking-tight">
          ${(pool.monthlyPay ?? 0).toLocaleString()}
          <span className="text-xs font-bold text-slate-400 ml-1">/ mo</span>
        </h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          {slots} Member Pool • {slots} Months
        </p>
      </div>

      {/* Why recommended */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1 flex items-center gap-1">
          <Sparkles size={9} /> Why This Pool
        </p>
        <p className="text-xs text-emerald-800/70 font-medium leading-relaxed">{matchReason}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Fixed Deposit</p>
          <p className="text-sm font-black text-slate-700">{deposit} CTX</p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Spots Left</p>
          <p className={`text-sm font-black ${spotsLeft <= 2 ? 'text-red-500' : 'text-slate-700'}`}>
            {spotsLeft} {spotsLeft <= 2 ? '🔥' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Main Section ────────────────────────────────────────────────────────────
const ActivePoolsSection = () => {
  const [allPools,      setAllPools]      = useState([]);
  const [activePools,   setActivePools]   = useState([]);
  const [recommended,   setRecommended]   = useState([]);
  const [loading,       setLoading]       = useState(true);

  const userData   = JSON.parse(localStorage.getItem('chitx_user') || '{}');
  const wallet     = userData.walletAddress?.toLowerCase();
  const trustScore = Number(userData.trustScore   || 0);
  const income     = Number(userData.income        || 0);
  const expenses   = Number(userData.expenses      || 0);
  const ctxBalance = Number(userData.airdropAmount || 0);
  const disposable = income - expenses;

  useEffect(() => {
    if (!wallet) { setLoading(false); return; }
    fetch('http://localhost:5000/api/pools')
      .then(r => r.json())
      .then(data => {
        const pools = data.pools ?? [];
        setAllPools(pools);

        // ── Active (joined) pools ──
        const joined = pools
          .filter(p => p.joinedMembers?.includes(wallet))
          .map(p => ({
            ...p,
            _myContrib: p.contributions?.find(c => c.walletAddress === wallet),
          }));
        setActivePools(joined);

        // ── Recommended pools ──
        const unjoinedOpen = pools.filter(
          p =>
            !p.joinedMembers?.includes(wallet) &&
            p.status !== 'CLOSED' &&
            // Not full
            (p.members ? (p.joinedMembers?.length ?? 0) < p.members : true)
        );

        const scored = unjoinedOpen.map(p => {
          const mp      = p.monthlyPay ?? 0;
          const deposit = mp * 2;
          const slots   = p.members ?? 20;
          const joined  = p.joinedMembers?.length ?? 0;
          const spotsLeft = Math.max(0, slots - joined);

          // Eligibility
          const trustOk   = trustScore >= 50;
          const incomeOk  = disposable >= mp;
          const balanceOk = ctxBalance >= deposit;

          const passedChecks = [trustOk, incomeOk, balanceOk].filter(Boolean).length;
          if (passedChecks < 2) return null;

          // Match score (0-100)
          // Ideal: monthly pay uses 15-30% of disposable income → sweet spot
          const budgetRatio  = disposable > 0 ? (mp / disposable) : 1;
          const budgetScore  = budgetRatio >= 0.1 && budgetRatio <= 0.35
            ? 100 - Math.abs(budgetRatio - 0.22) * 200
            : Math.max(0, 100 - Math.abs(budgetRatio - 0.22) * 300);

          // Urgency boost: almost full pools score higher
          const fillPct     = slots > 0 ? (joined / slots) : 0;
          const urgency     = fillPct >= 0.7 ? 15 : fillPct >= 0.4 ? 8 : 0;

          // Trust alignment: higher trust → more comfortable with bigger pools
          const trustBonus  = trustScore >= 80 ? 10 : trustScore >= 65 ? 5 : 0;

          const matchScore  = Math.min(99, Math.round(budgetScore * 0.7 + urgency + trustBonus + 20));

          // Reason
          let reason = '';
          if (budgetRatio <= 0.2)
            reason = `At $${mp}/mo, this pool uses only ${Math.round(budgetRatio * 100)}% of your $${disposable.toLocaleString()} disposable income — very comfortable.`;
          else if (budgetRatio <= 0.35)
            reason = `Monthly pay is well within your budget. Great savings vehicle with ${spotsLeft} spots left.`;
          else
            reason = `Your $${disposable.toLocaleString()} disposable income covers this pool. Join before it fills up.`;

          return { pool: p, matchScore, matchReason: reason };
        })
        .filter(Boolean)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4);

        setRecommended(scored);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wallet, trustScore, income, expenses, ctxBalance]);

  return (
    <div className="space-y-10">

      {/* ── Row 1: Your Active Pools ── */}
      <div>
        <div className="flex justify-between items-end mb-5">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Your Active Pools</h3>
            <p className="text-slate-400 font-medium text-sm mt-0.5">
              {activePools.length > 0
                ? `You're participating in ${activePools.length} pool${activePools.length > 1 ? 's' : ''}`
                : 'You haven\'t joined any pools yet.'}
            </p>
          </div>
          {activePools.length > 0 && (
            <button className="text-xs font-black text-teal-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              View All <ChevronRight size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex gap-5 overflow-x-auto pb-2">
            {[1, 2].map(i => (
              <div key={i} className="min-w-[320px] h-40 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : activePools.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center">
            <Layers size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-400 text-sm">No active pools</p>
            <p className="text-xs text-slate-300 mt-1">Join a pool below to start your chit fund journey.</p>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-2 custom-scrollbar">
            {activePools.map(p => <ActivePoolCard key={p._id} pool={p} />)}
          </div>
        )}
      </div>

      {/* ── Row 2: Recommended to Join ── */}
      <div>
        <div className="flex justify-between items-end mb-5">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Recommended to Join
              <span className="text-xs font-black bg-teal-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">AI Matched</span>
            </h3>
            <p className="text-slate-400 font-medium text-sm mt-0.5">
              Pools matched to your trust score, budget, and financial profile
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-5 overflow-x-auto pb-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="min-w-[280px] h-52 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : recommended.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center">
            {trustScore < 50 ? (
              <>
                <p className="font-bold text-slate-500 text-sm">Trust score too low to join pools</p>
                <p className="text-xs text-slate-400 mt-1">
                  Your score is {trustScore}/100. Minimum required is 50. Improve your financial profile to unlock pools.
                </p>
              </>
            ) : (
              <>
                <Sparkles size={28} className="text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-400 text-sm">No eligible pools available right now</p>
                <p className="text-xs text-slate-300 mt-1">Check back once new pools are created.</p>
              </>
            )}
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-2 custom-scrollbar">
            {recommended.map(({ pool, matchScore, matchReason }) => (
              <RecommendedPoolCard
                key={pool._id}
                pool={pool}
                matchScore={matchScore}
                matchReason={matchReason}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivePoolsSection;
