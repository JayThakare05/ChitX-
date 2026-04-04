import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';

import PoolFlipCard from '../components/dashboard/PoolFlipCard';

const CreatePoolModal = ({ onClose }) => {
  const [totalPool, setTotalPool] = useState(1000);
  const [members, setMembers] = useState(10);
  
  const monthlyPay = members > 0 ? (totalPool / members) : 0;
  const fixedDeposit = monthlyPay * 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[340px] bg-teal-900 rounded-3xl p-8 border border-teal-800 shadow-2xl relative shadow-teal-900/50">
        <button onClick={onClose} className="absolute top-5 right-6 text-teal-400/50 hover:text-white font-bold text-lg transition-colors">✕</button>
        
        <div className="mb-2">
          <label className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest mb-1 block cursor-pointer" htmlFor="totalPool">Total Pool Output</label>
          <div className="flex items-center text-4xl font-black text-white">
             $<input id="totalPool" type="number" value={totalPool} onChange={e => setTotalPool(Number(e.target.value) || 0)} className="bg-transparent text-white w-full outline-none font-black ml-1 border-b border-transparent focus:border-teal-500 transition-colors" />
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
             <span className="font-black text-white">${monthlyPay.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Total Months</span>
             <span className="font-black text-white">{members}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Fixed Deposit</span>
             <span className="font-black text-white">${fixedDeposit.toLocaleString()}</span>
          </div>
        </div>
        
        <button onClick={onClose} className="w-full py-3 bg-white text-teal-900 rounded-xl font-black text-sm hover:bg-slate-100 transition-colors shadow-inner flex justify-center items-center">
          Confirm & Create Pool
        </button>
      </div>
    </div>
  );
};

const MyPools = () => {
  const [isCreating, setIsCreating] = useState(false);
  

  // Mock data representing different pools
  const availablePools = [
    { id: 1, totalAmount: 1000, members: 10, status: 'OPEN' },
    { id: 2, totalAmount: 2000, members: 10, status: 'FILLING FAST' },
    { id: 3, totalAmount: 6000, members: 12, status: 'OPEN' },
    { id: 4, totalAmount: 12000, members: 12, status: 'PREMIUM' },
    { id: 5, totalAmount: 22500, members: 15, status: 'PLATINUM' },
    { id: 6, totalAmount: 40000, members: 20, status: 'ELITE' },
  ];

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
          <PoolFlipCard key={pool.id} pool={pool} />
        ))}
      </div>
      
      {isCreating && <CreatePoolModal onClose={() => setIsCreating(false)} />}
    </div>
  );
};

export default MyPools;
