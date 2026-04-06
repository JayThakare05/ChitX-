import React, { useState, useEffect, useCallback } from 'react';
import { Search, ArrowDownLeft, ArrowUpRight, Copy, CheckCheck, TrendingUp, TrendingDown, Wallet, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TX_CONFIG = {
  POOL_JOIN:       { label: 'Pool Join',       icon: ArrowUpRight,  badgeCls: 'bg-red-50 text-red-600 border-red-500/20',       rowCls: 'hover:bg-red-50/20' },
  POOL_LEAVE:      { label: 'Pool Refund',      icon: ArrowDownLeft, badgeCls: 'bg-emerald-50 text-emerald-600 border-emerald-500/20', rowCls: 'hover:bg-emerald-50/20' },
  MONTHLY_PAYMENT: { label: 'Monthly Payment',  icon: ArrowUpRight,  badgeCls: 'bg-amber-50 text-amber-600 border-amber-500/20',    rowCls: 'hover:bg-amber-50/20' },
  CHIT_JACKPOT:    { label: 'Chit Jackpot 🎉',  icon: ArrowDownLeft, badgeCls: 'bg-[#f4fcf9] text-[#1aa08c] border-[#1aa08c]/20',       rowCls: 'hover:bg-[#1aa08c]/5' },
  REFUND:          { label: 'Refund',            icon: ArrowDownLeft, badgeCls: 'bg-emerald-50 text-emerald-600 border-emerald-100', rowCls: 'hover:bg-emerald-50/20' },
  AIRDROP:         { label: 'CTX Airdrop',       icon: ArrowDownLeft, badgeCls: 'bg-[#f4fcf9] text-[#1aa08c] border-[#1aa08c]/20',       rowCls: 'hover:bg-[#1aa08c]/5' },
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
    <button 
      onClick={handleCopy} 
      className="group flex items-center gap-1.5 text-[#134e4a]/40 hover:text-[#1aa08c] transition-all font-mono text-[11px] font-bold bg-white px-2.5 py-1.5 rounded-xl border border-slate-100 hover:border-[#1aa08c]/30 hover:shadow-sm"
    >
      {short}
      <div className="text-[#1aa08c]/40 group-hover:text-[#1aa08c] transition-colors">
        {copied ? <CheckCheck size={12} strokeWidth={3} /> : <Copy size={12} strokeWidth={3} />}
      </div>
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-10"
    >
      <div className="flex justify-between items-start flex-wrap gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#134e4a] tracking-tight leading-tight">Transaction History</h2>
          <p className="text-[#134e4a]/50 font-medium text-base mt-2">Every CTX movement • real-time on-chain ledger.</p>
        </div>
        <button 
          onClick={fetchTx} 
          className="flex items-center gap-2 text-[10px] font-black text-[#1aa08c] bg-white border-2 border-[#1aa08c]/10 px-5 py-2.5 rounded-2xl hover:bg-[#f4fcf9] hover:border-[#1aa08c]/20 transition-all shadow-sm active:scale-95 group uppercase tracking-widest"
        >
          <RefreshCw size={14} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-500" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Events',  value: stats.totalTransactions, icon: Wallet, color: 'text-[#134e4a]', accent: 'bg-[#1aa08c]/5', iconColor: 'text-[#1aa08c]' },
            { label: 'Total Out',     value: `${stats.totalDebits} CTX`, icon: TrendingDown, color: 'text-red-500', accent: 'bg-red-50', iconColor: 'text-red-500' },
            { label: 'Total In',      value: `${stats.totalCredits} CTX`, icon: TrendingUp, color: 'text-emerald-500', accent: 'bg-[#f4fcf9]', iconColor: 'text-emerald-500' },
            { label: 'Net Flow',      value: `${stats.netFlow >= 0 ? '+' : ''}${stats.netFlow} CTX`, icon: stats.netFlow >= 0 ? TrendingUp : TrendingDown, color: stats.netFlow >= 0 ? 'text-[#1aa08c]' : 'text-red-500', accent: stats.netFlow >= 0 ? 'bg-[#f4fcf9]/50' : 'bg-red-50/50', iconColor: stats.netFlow >= 0 ? 'text-[#1aa08c]' : 'text-red-500' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border-2 border-slate-50 rounded-[2rem] p-6 flex flex-col justify-between h-40 shadow-sm hover:shadow-xl hover:shadow-[#134e4a]/5 transition-all group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${s.accent} rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
                <div className={`w-12 h-12 rounded-xl border border-slate-100 flex items-center justify-center bg-white shadow-sm mb-auto`}>
                  <Icon size={20} strokeWidth={2.5} className={s.iconColor} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#134e4a]/30 mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Filters + table */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-[#134e4a]/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f4fcf9]/50 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
        
        {/* Search + type filter */}
        <div className="flex flex-wrap gap-5 mb-10 relative z-10">
          <div className="flex-1 min-w-[280px] flex items-center bg-[#f4fcf9]/50 border-2 border-[#1aa08c]/5 rounded-[1.5rem] px-5 py-4 focus-within:border-[#1aa08c] focus-within:bg-white focus-within:ring-8 focus-within:ring-[#1aa08c]/5 transition-all group">
            <Search size={18} strokeWidth={2.5} className="text-[#134e4a]/30 group-focus-within:text-[#1aa08c] mr-4 shrink-0 transition-colors" />
            <input
              type="text"
              placeholder="Search by description or hash..."
              className="bg-transparent w-full outline-none font-bold text-[#134e4a] placeholder:text-[#134e4a]/50 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {types.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                  typeFilter === t
                    ? 'bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white border-transparent shadow-lg shadow-[#1aa08c]/20'
                    : 'bg-[#f4fcf9]/50 text-[#134e4a]/60 border-transparent hover:bg-white hover:border-[#1aa08c]/10'
                }`}
              >
                {t === 'ALL' ? 'All' : TX_CONFIG[t]?.label ?? t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-[#f4fcf9] rounded-3xl animate-pulse" />)}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center"
            >
              <div className="w-20 h-20 bg-[#f4fcf9] rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-[#1aa08c]/30" strokeWidth={1.5} />
              </div>
              <p className="font-black text-[#134e4a]/60 text-lg tracking-tight">
                {transactions.length === 0 ? 'No transactions yet.' : `No findings for "${searchQuery}"`}
              </p>
              <p className="text-[#134e4a]/40 font-bold text-[11px] uppercase tracking-widest mt-2">
                Join a pool to begin your track record.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none] relative z-10"
            >
              <table className="w-full text-left border-separate border-spacing-y-4 min-w-[800px]">
                <thead>
                  <tr className="text-[10px] font-black text-[#134e4a]/60 uppercase tracking-[0.2em]">
                    <th className="px-6 py-2">Transaction Type</th>
                    <th className="px-6 py-2">Details</th>
                    <th className="px-6 py-2">Volume</th>
                    <th className="px-6 py-2">Status</th>
                    <th className="px-6 py-2">Timestamp</th>
                    <th className="px-6 py-2">On-Chain ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx, idx) => {
                    const cfg     = TX_CONFIG[tx.type] ?? TX_CONFIG.POOL_JOIN;
                    const Icon    = cfg.icon;
                    const isCredit = tx.direction === 'CREDIT';
                    return (
                      <motion.tr 
                        key={tx._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`group cursor-default`}
                      >
                        <td className="py-5 px-6 bg-white border-y border-l border-slate-50 first:rounded-l-3xl group-hover:bg-[#f4fcf9]/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${cfg.badgeCls} bg-white`}>
                              <Icon size={16} strokeWidth={3} />
                            </div>
                            <span className="text-[11px] font-black text-[#134e4a] uppercase tracking-wider">
                              {cfg.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 px-6 bg-white border-y border-slate-50 group-hover:bg-[#f4fcf9]/50 transition-colors font-bold text-[#134e4a]/70 text-sm">
                          {tx.description}
                        </td>
                        <td className="py-5 px-6 bg-white border-y border-slate-50 group-hover:bg-[#f4fcf9]/50 transition-colors">
                          <span className={`font-black text-lg tracking-tight ${isCredit ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isCredit ? '+' : '-'}{tx.amount} <span className="text-[10px] uppercase font-black opacity-50">CTX</span>
                          </span>
                        </td>
                        <td className="py-5 px-6 bg-white border-y border-slate-50 group-hover:bg-[#f4fcf9]/50 transition-colors">
                          <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border-2 shadow-sm ${
                            tx.status === 'SUCCESS' ? 'bg-[#f4fcf9] text-[#1aa08c] border-[#1aa08c]/20' :
                            tx.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-500/10' :
                            'bg-red-50 text-red-500 border-red-500/10'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-5 px-6 bg-white border-y border-slate-50 group-hover:bg-[#f4fcf9]/50 transition-colors text-[11px] text-[#134e4a]/40 font-black uppercase tracking-wider">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="py-5 px-6 bg-white border-y border-r border-slate-50 last:rounded-r-3xl group-hover:bg-[#f4fcf9]/50 transition-colors">
                          <CopyHash hash={tx.txHash} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Payments;
