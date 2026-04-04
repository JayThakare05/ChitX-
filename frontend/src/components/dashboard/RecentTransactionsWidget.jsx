import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, Receipt, ChevronRight, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TX_CONFIG = {
  POOL_JOIN:       { label: 'Pool Join',       icon: ArrowUpRight,  color: 'text-red-500',   bg: 'bg-red-50 border-red-100',   badge: 'bg-red-50 text-red-600 border-red-100' },
  POOL_LEAVE:      { label: 'Pool Refund',      icon: ArrowDownLeft, color: 'text-emerald-500',bg: 'bg-emerald-50 border-emerald-100', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  MONTHLY_PAYMENT: { label: 'Monthly Payment',  icon: ArrowUpRight,  color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100',  badge: 'bg-amber-50 text-amber-600 border-amber-100' },
  CHIT_JACKPOT:    { label: 'Chit Jackpot 🎉',  icon: ArrowDownLeft, color: 'text-teal-500',  bg: 'bg-teal-50 border-teal-100',    badge: 'bg-teal-50 text-teal-600 border-teal-100' },
  REFUND:          { label: 'Refund',            icon: ArrowDownLeft, color: 'text-emerald-500',bg: 'bg-emerald-50 border-emerald-100', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  AIRDROP:         { label: 'CTX Airdrop',       icon: ArrowDownLeft, color: 'text-teal-500',  bg: 'bg-teal-50 border-teal-100',    badge: 'bg-teal-50 text-teal-600 border-teal-100' },
};

const formatDate = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffH  = Math.floor(diffMs / 36e5);
  if (diffH < 1)  return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)  return `${diffD}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const RecentTransactionsWidget = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const navigate = useNavigate();

  const userData   = JSON.parse(localStorage.getItem('chitx_user') || '{}');
  const wallet     = userData.walletAddress?.toLowerCase();

  const fetchTx = useCallback(async () => {
    if (!wallet) { setLoading(false); return; }
    try {
      const res  = await fetch(`http://localhost:5000/api/transactions/${wallet}?limit=4`);
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions ?? []);
        setStats(data.stats ?? null);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [wallet]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center border border-teal-100/50">
            <Receipt size={18} />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-800 tracking-tight">Recent Transactions</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Last 4 activity events</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="flex items-center gap-1 text-[10px] font-black text-teal-600 uppercase tracking-widest hover:gap-2 transition-all"
        >
          View All <ChevronRight size={12} />
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Out', value: `${stats.totalDebits} CTX`, color: 'text-red-500' },
            { label: 'Total In',  value: `${stats.totalCredits} CTX`, color: 'text-emerald-500' },
            { label: 'Net Flow',  value: `${stats.netFlow >= 0 ? '+' : ''}${stats.netFlow} CTX`, color: stats.netFlow >= 0 ? 'text-teal-600' : 'text-red-500' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
              <p className={`text-xs font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-8 text-center">
          <Layers size={28} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No transactions yet</p>
          <p className="text-xs text-slate-300 mt-1">Join a pool to see your activity here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((tx) => {
            const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.POOL_JOIN;
            const Icon = cfg.icon;
            const isCredit = tx.direction === 'CREDIT';
            return (
              <div key={tx._id} className={`flex items-center gap-3 p-3 rounded-2xl border ${cfg.bg}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.badge} border`}>
                  <Icon size={15} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-700 truncate">{tx.description}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isCredit ? '+' : '-'}{tx.amount} CTX
                  </p>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentTransactionsWidget;
