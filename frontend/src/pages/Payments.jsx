import React, { useState, useEffect, useCallback } from 'react';
import { Search, ArrowDownLeft, ArrowUpRight, Copy, CheckCheck, TrendingUp, TrendingDown, Wallet, RefreshCw } from 'lucide-react';

const TX_CONFIG = {
  POOL_JOIN:       { label: 'Pool Join',       icon: ArrowUpRight,  badgeCls: 'bg-red-50 text-red-600 border-red-100',       rowCls: 'hover:bg-red-50/30' },
  POOL_LEAVE:      { label: 'Pool Refund',      icon: ArrowDownLeft, badgeCls: 'bg-emerald-50 text-emerald-600 border-emerald-100', rowCls: 'hover:bg-emerald-50/30' },
  MONTHLY_PAYMENT: { label: 'Monthly Payment',  icon: ArrowUpRight,  badgeCls: 'bg-amber-50 text-amber-600 border-amber-100',    rowCls: 'hover:bg-amber-50/30' },
  CHIT_JACKPOT:    { label: 'Chit Jackpot 🎉',  icon: ArrowDownLeft, badgeCls: 'bg-teal-50 text-teal-600 border-teal-100',       rowCls: 'hover:bg-teal-50/30' },
  REFUND:          { label: 'Refund',            icon: ArrowDownLeft, badgeCls: 'bg-emerald-50 text-emerald-600 border-emerald-100', rowCls: 'hover:bg-emerald-50/30' },
  AIRDROP:         { label: 'CTX Airdrop',       icon: ArrowDownLeft, badgeCls: 'bg-teal-50 text-teal-600 border-teal-100',       rowCls: 'hover:bg-teal-50/30' },
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CopyHash = ({ hash }) => {
  const [copied, setCopied] = useState(false);
  if (!hash) return <span className="text-slate-300 text-xs font-mono">—</span>;
  const short = `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5 text-slate-400 hover:text-teal-600 transition-colors font-mono text-[11px] font-bold bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 hover:border-slate-200">
      {short}
      {copied ? <CheckCheck size={11} className="text-teal-500" /> : <Copy size={11} />}
    </button>
  );
};

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [typeFilter,   setTypeFilter]   = useState('ALL');

  const userData = JSON.parse(localStorage.getItem('chitx_user') || '{}');
  const wallet   = userData.walletAddress?.toLowerCase();

  const fetchTx = useCallback(async () => {
    if (!wallet) { setLoading(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`http://localhost:5000/api/transactions/${wallet}?limit=100`);
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions ?? []);
        setStats(data.stats ?? null);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [wallet]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const types = ['ALL', ...Object.keys(TX_CONFIG)];

  const filtered = transactions.filter(tx => {
    const matchSearch =
      tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.txHash?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'ALL' || tx.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Transaction History</h2>
          <p className="text-slate-500 font-medium mt-2">Every CTX movement — pool joins, refunds, jackpots, and more.</p>
        </div>
        <button onClick={fetchTx} className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest border border-slate-200 px-3 py-2 rounded-xl hover:border-slate-300 transition-all">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Events',  value: stats.totalTransactions, icon: Wallet, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-100', iconColor: 'text-slate-400' },
            { label: 'Total Out',     value: `${stats.totalDebits} CTX`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50 border-red-100', iconColor: 'text-red-400' },
            { label: 'Total In',      value: `${stats.totalCredits} CTX`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', iconColor: 'text-emerald-400' },
            { label: 'Net Flow',      value: `${stats.netFlow >= 0 ? '+' : ''}${stats.netFlow} CTX`, icon: stats.netFlow >= 0 ? TrendingUp : TrendingDown, color: stats.netFlow >= 0 ? 'text-teal-600' : 'text-red-600', bg: stats.netFlow >= 0 ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100', iconColor: stats.netFlow >= 0 ? 'text-teal-400' : 'text-red-400' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`${s.bg} border rounded-2xl p-5 flex items-center gap-4`}>
                <div className={`w-10 h-10 rounded-xl ${s.bg} border flex items-center justify-center`}>
                  <Icon size={18} className={s.iconColor} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                  <p className={`text-lg font-black mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters + table */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        {/* Search + type filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[220px] flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
            <Search size={16} className="text-slate-400 mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search by description or hash..."
              className="bg-transparent w-full outline-none font-bold text-slate-700 placeholder:text-slate-400 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {types.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border transition-all ${
                  typeFilter === t
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {t === 'ALL' ? 'All' : TX_CONFIG[t]?.label ?? t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Search size={40} className="mx-auto mb-4 text-slate-200" strokeWidth={1} />
            <p className="font-bold text-slate-400 text-sm">
              {transactions.length === 0 ? 'No transactions recorded yet.' : `No results for "${searchQuery}"`}
            </p>
            {transactions.length === 0 && (
              <p className="text-xs text-slate-300 mt-1">Join or leave a pool to create your first transaction.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <th className="pb-4 pt-2 px-4">Type</th>
                  <th className="pb-4 pt-2 px-4">Description</th>
                  <th className="pb-4 pt-2 px-4">Amount</th>
                  <th className="pb-4 pt-2 px-4">Status</th>
                  <th className="pb-4 pt-2 px-4">Date</th>
                  <th className="pb-4 pt-2 px-4">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(tx => {
                  const cfg     = TX_CONFIG[tx.type] ?? TX_CONFIG.POOL_JOIN;
                  const Icon    = cfg.icon;
                  const isCredit = tx.direction === 'CREDIT';
                  return (
                    <tr key={tx._id} className={`transition-colors ${cfg.rowCls}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cfg.badgeCls}`}>
                            <Icon size={15} strokeWidth={2.5} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${cfg.badgeCls}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-600 text-sm max-w-[220px] truncate">
                        {tx.description}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-black text-base tracking-tight ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}{tx.amount} CTX
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                          tx.status === 'SUCCESS' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                          tx.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400 font-bold whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <CopyHash hash={tx.txHash} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
