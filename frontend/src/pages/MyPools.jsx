import React, { useState, useEffect } from 'react';
import { Layers, Plus } from 'lucide-react';

import PoolFlipCard from '../components/dashboard/PoolFlipCard';

const CreatePoolModal = ({ onClose, onSuccess }) => {
  const [totalPool, setTotalPool] = useState(1000);
  const [members, setMembers] = useState(10);
  
  const monthlyPay = members > 0 ? (totalPool / members) : 0;
  const fixedDeposit = monthlyPay * 2;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch('http://localhost:5000/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalPot: totalPool,
          dummyMembers: members
        })
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[340px] bg-teal-900 rounded-3xl p-8 border border-teal-800 shadow-2xl relative shadow-teal-900/50">
        <button onClick={onClose} className="absolute top-5 right-6 text-teal-400/50 hover:text-white font-bold text-lg transition-colors">✕</button>
        
        <div className="mb-2">
          <label className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest mb-1 block cursor-pointer" htmlFor="totalPool">Total Pool Output</label>
          <div className="flex items-center text-4xl font-black text-white">
             <input id="totalPool" type="number" value={totalPool} onChange={e => setTotalPool(Number(e.target.value) || 0)} className="bg-transparent text-white w-full outline-none font-black min-w-[150px] mr-2 border-b border-white/20 hover:border-white/50 focus:border-teal-400 transition-colors" />
             CTX
          </div>
        </div>
        
        <div className="space-y-4 bg-white/5 rounded-2xl p-4 border border-white/10 mt-6 mb-8">
          <div className="flex justify-between items-center text-sm">
             <label className="text-teal-400 font-bold uppercase tracking-widest text-[10px] cursor-pointer" htmlFor="members">No. of Members</label>
             <div className="flex items-center text-white font-black text-right">
                <input id="members" type="number" value={members} onChange={e => setMembers(Number(e.target.value) || 0)} className="bg-transparent text-white w-10 text-right outline-none font-black border-b border-white/20 focus:border-white transition-colors" />
             </div>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Monthly Pay</span>
             <span className="font-black text-white">{monthlyPay.toLocaleString()} CTX</span>
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
        
        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3 bg-white text-teal-900 rounded-xl font-black text-sm hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-inner flex justify-center items-center">
          {isSubmitting ? 'Creating...' : 'Confirm & Create Pool'}
        </button>
      </div>
    </div>
  );
};

const MyPools = () => {
  const [isCreating, setIsCreating] = useState(false);
  

  const [availablePools, setAvailablePools] = useState([]);

  // Group logic into fetch function to easily pass it around
  const fetchPools = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/pools');
      const data = await res.json();
      const formattedPools = data.map(p => ({
        id: p._id,
        totalAmount: p.totalPot || 0,
        members: p.durationMonths || 10,
        joinedCount: Array.isArray(p.members) ? p.members.length : 0,
        status: p.status ? (p.status === 'pending' ? 'OPEN' : p.status.toUpperCase()) : 'OPEN'
      }))
      // Filter out ghost pools with 0 totalPot
      .filter(p => p.totalAmount > 0);
      setAvailablePools(formattedPools);
    } catch (err) {
      console.error('Failed to fetch pools:', err);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">Pool Offerings</h2>
           <p className="text-slate-500 font-medium mt-2">Discover and manage your monthly recurring chit fund participation.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-teal-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-teal-950 transition-colors shadow-md shadow-teal-900/20 active:scale-95 shrink-0">
          <Plus size={18} strokeWidth={2.5} />
          Create Pool
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {availablePools.map(pool => (
          <PoolFlipCard key={pool.id} pool={pool} onRefresh={fetchPools} />
        ))}
      </div>
      
      {isCreating && <CreatePoolModal onClose={() => setIsCreating(false)} onSuccess={fetchPools} />}
    </div>
  );
};

export default MyPools;
