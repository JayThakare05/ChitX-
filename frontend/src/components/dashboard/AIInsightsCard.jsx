import React, { useState, useEffect, useCallback } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp, RefreshCw, Sparkles, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

const CATEGORY_CONFIG = {
  risk:        { border: 'border-red-500/30',     bg: 'bg-red-500/8',     badge: 'bg-red-500/15 text-red-400',     dot: 'bg-red-400' },
  opportunity: { border: 'border-emerald-500/25', bg: 'bg-emerald-500/6', badge: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  action:      { border: 'border-amber-500/25',   bg: 'bg-amber-500/6',   badge: 'bg-amber-500/15 text-amber-400',  dot: 'bg-amber-400' },
};

const CategoryIcon = ({ category }) => {
  if (category === 'risk')        return <AlertTriangle className="w-3.5 h-3.5" />;
  if (category === 'opportunity') return <TrendingUp className="w-3.5 h-3.5" />;
  return <Zap className="w-3.5 h-3.5" />;
};

const SkeletonPulse = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className="rounded-2xl border border-slate-100 p-4 space-y-2">
        <div className="h-3 bg-slate-100 rounded-full w-2/3" />
        <div className="h-3 bg-slate-100 rounded-full w-full" />
        <div className="h-3 bg-slate-100 rounded-full w-4/5" />
        <div className="flex justify-between mt-2">
          <div className="h-2 bg-slate-100 rounded-full w-1/4" />
          <div className="h-2 bg-slate-100 rounded-full w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

const AIInsightsCard = () => {
  const [insights, setInsights]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [expanded, setExpanded]         = useState(null); // index of expanded insight
  const [lastFetched, setLastFetched]   = useState(null);
  const [poolsJoined, setPoolsJoined]   = useState(0);

  // Read user from localStorage
  const userData    = JSON.parse(localStorage.getItem('chitx_user') || '{}');
  const trustScore  = Number(userData.trustScore   || 0);
  const income      = Number(userData.income        || 0);
  const expenses    = Number(userData.expenses      || 0);
  const employment  = userData.employment           || 'Salaried';
  const ctxBalance  = Number(userData.airdropAmount || 0);
  const walletAddr  = userData.walletAddress        || '';
  const name        = userData.name                 || 'Member';
  const hasBankStmt = Boolean(userData.hasBankStatement);

  // Fetch how many pools this user has joined
  const fetchPoolCount = useCallback(async () => {
    if (!walletAddr) return;
    try {
      const res  = await fetch('http://localhost:5000/api/pools');
      const data = await res.json();
      if (res.ok && data.pools) {
        const w = walletAddr.toLowerCase();
        const count = data.pools.filter(p => p.joinedMembers?.includes(w)).length;
        setPoolsJoined(count);
      }
    } catch { /* ignore */ }
  }, [walletAddr]);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/ai/oracle-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trustScore,
          income,
          expenses,
          employment,
          ctxBalance,
          poolsJoined,
          hasBankStatement: hasBankStmt,
          walletAddress: walletAddr,
          name,
        }),
      });
      const data = await res.json();
      if (data.insights && data.insights.length > 0) {
        setInsights(data.insights);
        setLastFetched(new Date());
      } else {
        setError('No insights returned.');
      }
    } catch (e) {
      setError('AI service unavailable. Check that the AI service is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }, [trustScore, income, expenses, employment, ctxBalance, poolsJoined, hasBankStmt, walletAddr, name]);

  useEffect(() => {
    fetchPoolCount().then(fetchInsights);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Average confidence
  const avgConfidence = insights.length
    ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length)
    : 0;

  const topCategory = insights[0]?.category || 'action';
  const accent = CATEGORY_CONFIG[topCategory] || CATEGORY_CONFIG.action;

  return (
    <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm flex flex-col gap-6 w-full max-w-sm group hover:shadow-md transition-shadow">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-100/50">
            <BrainCircuit size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-800 tracking-tight leading-none">ChitX AI Oracle</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Powered by Groq</p>
          </div>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          title="Refresh insights"
          className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all disabled:opacity-40"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Confidence bar — shown when insights loaded */}
      {insights.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            <span>Oracle Confidence</span>
            <span className="text-teal-600">{avgConfidence}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-1000"
              style={{ width: `${avgConfidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Context pills */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">
          Score {trustScore}/100
        </span>
        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">
          {ctxBalance} CTX
        </span>
        {poolsJoined > 0 && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
            {poolsJoined} Pool{poolsJoined > 1 ? 's' : ''} Active
          </span>
        )}
        {hasBankStmt && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            ✓ Bank Verified
          </span>
        )}
      </div>

      {/* Main content */}
      {loading ? (
        <SkeletonPulse />
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-500 font-medium text-center">
          {error}
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-center">
          <Sparkles className="w-8 h-8 text-teal-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-slate-400">No insights yet</p>
          <button onClick={fetchInsights} className="mt-3 text-xs font-black text-teal-600 uppercase tracking-widest hover:underline">
            Generate Now
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {insights.map((insight, i) => {
            const cfg = CATEGORY_CONFIG[insight.category] || CATEGORY_CONFIG.action;
            const isOpen = expanded === i;
            return (
              <div key={i} className={`rounded-2xl border ${cfg.border} ${cfg.bg} transition-all duration-200`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left p-3.5 flex items-start gap-3"
                >
                  <span className="text-xl leading-none mt-0.5 shrink-0">{insight.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-black text-slate-700 leading-tight">{insight.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md flex items-center gap-1 ${cfg.badge}`}>
                          <CategoryIcon category={insight.category} />
                          {insight.category}
                        </span>
                        {isOpen ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                      </div>
                    </div>
                    {/* Preview line */}
                    {!isOpen && (
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-1 font-medium">
                        {insight.insight}
                      </p>
                    )}
                  </div>
                </button>

                {/* Expanded view */}
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-0 space-y-2.5">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {insight.insight}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          Confidence
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-20 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${insight.confidence}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-teal-600">{insight.confidence}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          {lastFetched
            ? `Updated ${lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Not yet fetched'}
        </span>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-1.5 text-[9px] font-black text-teal-600 uppercase tracking-widest hover:text-teal-800 transition-colors disabled:opacity-40"
        >
          <Sparkles size={11} />
          Refresh Oracle
        </button>
      </div>
    </div>
  );
};

export default AIInsightsCard;
