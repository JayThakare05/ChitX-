import React, { useState } from 'react';
import { Layers, Trash2, Loader2 } from 'lucide-react';
import PoolDetailsModal from './PoolDetailsModal';

const PoolFlipCard = ({ pool, onRefresh }) => {
  const [showDetails, setShowDetails] = useState(false);
  const totalAmount = pool.totalAmount || 0;
  const members = pool.members || 0;
  const joinedCount = pool.joinedCount || 0;
  const monthlyPay = members > 0 ? (totalAmount / members) : 0;
  const fixedDeposit = monthlyPay * 2;
  const fillPercent = members > 0 ? Math.min(100, Math.round((joinedCount / members) * 100)) : 0;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this pool?")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/pools/${pool.id}`, { method: 'DELETE' });
      if (res.ok && onRefresh) {
        onRefresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to delete');
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="w-full h-80 bg-transparent cursor-pointer group [perspective:1000px]">
        <div className="relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-sm hover:shadow-md rounded-3xl">
          
          {/* Front Side */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-3xl p-8 border border-slate-100 flex flex-col justify-between [backface-visibility:hidden]">
            <div className="flex justify-between items-start">
               <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50">
                 <Layers size={24} />
               </div>
               <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100">
                 {pool.status || 'AVAILABLE'}
               </span>
            </div>
            
            <div>
              <h4 className="text-3xl font-black text-slate-800 tracking-tight">{monthlyPay.toLocaleString()} CTX <span className="text-sm font-bold text-slate-400">/ mo</span></h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-teal-400"></span>
                {members} Members • {members} Months
              </p>
            </div>
            
            {/* Live Member Fill Bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{joinedCount}/{members} joined</span>
                <span className="text-[10px] font-bold text-teal-600">{fillPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-700"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 w-full h-full bg-teal-900 rounded-3xl p-8 border border-teal-800 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] text-white shadow-xl shadow-teal-900/20">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[10px] font-extrabold text-teal-400/80 uppercase tracking-widest mb-1">Total Pool Output</h4>
                <div className="text-4xl font-black text-white">{totalAmount.toLocaleString()} CTX</div>
              </div>
              <button 
                 onClick={handleDelete}
                 disabled={isDeleting}
                 className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 disabled:opacity-50"
                 title="Delete Pool"
              >
                 {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
            
            <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Monthly Pay</span>
                 <span className="font-black text-white">{monthlyPay.toLocaleString()} CTX</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Members</span>
                 <span className="font-black text-white">{members}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Total Months</span>
                 <span className="font-black text-white">{members}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Fixed Deposit</span>
                 <span className="font-black text-white">{fixedDeposit.toLocaleString()} CTX</span>
              </div>
            </div>
            
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetails(true); }}
              className="w-full py-2 bg-white text-teal-900 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors shadow-inner flex justify-center items-center gap-2"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <PoolDetailsModal
          pool={pool}
          onClose={() => setShowDetails(false)}
          onJoined={() => { if (onRefresh) onRefresh(); }}
        />
      )}
    </>
  );
};

export default PoolFlipCard;
