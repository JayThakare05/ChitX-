import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';

import PoolFlipCard from '../components/dashboard/PoolFlipCard';

const CreatePoolModal = ({ onClose, refreshPools }) => {
  const [monthlyPay, setMonthlyPay] = useState(100);
  const [members, setMembers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const parsedMembers = members ? Number(members) : null;
  const totalPool = parsedMembers ? (monthlyPay * parsedMembers) : 'Dynamic';
  const fixedDeposit = monthlyPay * 2;

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('chitx_user');
      const userWallet = userStr ? JSON.parse(userStr).walletAddress?.toLowerCase() : null;

      const response = await fetch('http://localhost:5000/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyPay,
          members: parsedMembers,
          status: 'OPEN',
          creatorWallet: userWallet
        }),
      });

      if (response.ok) {
        refreshPools();
        onClose();
      } else {
        console.error('Failed to create pool');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[340px] bg-teal-900 rounded-3xl p-8 border border-teal-800 shadow-2xl relative shadow-teal-900/50">
        <button onClick={onClose} className="absolute top-5 right-6 text-teal-400/50 hover:text-white font-bold text-lg transition-colors">✕</button>
        
        <div className="mb-2">
          <label className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest mb-1 block cursor-pointer" htmlFor="monthlyPay">Monthly Pay</label>
          <div className="flex items-center text-4xl font-black text-white">
             $<input id="monthlyPay" type="number" value={monthlyPay} onChange={e => setMonthlyPay(Number(e.target.value) || 0)} className="bg-transparent text-white w-full outline-none font-black ml-1 border-b border-transparent focus:border-teal-500 transition-colors" />
          </div>
        </div>
        
        <div className="space-y-4 bg-white/5 rounded-2xl p-4 border border-white/10 mt-6 mb-8">
          <div className="flex justify-between items-center text-sm">
             <label className="text-teal-400 font-bold uppercase tracking-widest text-[10px] cursor-pointer" htmlFor="members">No. of Members</label>
             <div className="flex items-center text-white font-black text-right">
                <input id="members" type="number" placeholder="Any" value={members} onChange={e => setMembers(e.target.value)} className="bg-transparent text-white w-16 text-right outline-none font-black border-b border-white/20 focus:border-white transition-colors placeholder:text-teal-700" />
             </div>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Total Pool Output</span>
             <span className="font-black text-white">{parsedMembers ? `$${totalPool.toLocaleString()}` : 'Dynamic'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Total Months</span>
             <span className="font-black text-white">{parsedMembers ? parsedMembers : 'Dynamic'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Fixed Deposit</span>
             <span className="font-black text-white">${fixedDeposit.toLocaleString()}</span>
          </div>
        </div>
        
        <button disabled={isLoading} onClick={handleCreate} className="w-full py-3 bg-white text-teal-900 rounded-xl font-black text-sm hover:bg-slate-100 transition-colors shadow-inner flex justify-center items-center">
          {isLoading ? 'Creating...' : 'Confirm & Create Pool'}
        </button>
      </div>
    </div>
  );
};
import { ConfirmModal, ResultModal } from '../components/ui/PoolModals';

const MyPools = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [availablePools, setAvailablePools] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // poolId to delete
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resultModal, setResultModal] = useState({ open: false, success: false, title: '', message: '', details: [] });

  const userStr = localStorage.getItem('chitx_user');
  const userWallet = userStr ? JSON.parse(userStr).walletAddress?.toLowerCase() : null;

  const fetchPools = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/pools');
      const data = await response.json();
      if (response.ok) {
        setAvailablePools(data.pools);
      }
    } catch (error) {
      console.error('Failed to fetch pools:', error);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget || !userWallet) return;
    setDeleteLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/pools/${deleteTarget}`, {
         method: 'DELETE',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ walletAddress: userWallet })
      });
      const data = await response.json();
      setDeleteTarget(null);
      if (response.ok) {
        setResultModal({ open: true, success: true, title: 'Pool Deleted', message: data.message || 'Pool deleted. All members have been refunded.', details: [] });
        fetchPools();
      } else {
        setResultModal({ open: true, success: false, title: 'Delete Failed', message: data.error || 'Failed to delete pool.', details: [] });
      }
    } catch (error) {
      setDeleteTarget(null);
      setResultModal({ open: true, success: false, title: 'Connection Error', message: 'Could not reach server.', details: [] });
    } finally {
      setDeleteLoading(false);
    }
  };

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
      
      {availablePools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {availablePools.map(pool => {
            const isCreator = userWallet && pool.creatorWallet === userWallet;
            return (
              <div key={pool._id} className="relative group">
                <PoolFlipCard pool={{...pool, id: pool._id }} onRefresh={fetchPools} />
                {isCreator && (
                  <button 
                    onClick={() => setDeleteTarget(pool._id)} 
                    className="absolute -top-3 -right-3 z-10 p-2 bg-red-100 text-red-600 rounded-full shadow hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                    title="Delete Pool"
                  >
                     <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-12 text-center text-slate-400">
           <p className="font-bold">No pools available. Create one to get started!</p>
        </div>
      )}
      
      {isCreating && <CreatePoolModal refreshPools={fetchPools} onClose={() => setIsCreating(false)} />}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        variant="delete"
        title="Delete This Pool?"
        description="This will permanently remove the pool. All joined members will have their fixed deposits automatically refunded."
        confirmText="Delete Pool"
      />

      {/* Result Modal */}
      <ResultModal
        isOpen={resultModal.open}
        onClose={() => setResultModal(prev => ({ ...prev, open: false }))}
        success={resultModal.success}
        title={resultModal.title}
        message={resultModal.message}
        details={resultModal.details}
      />
    </div>
  );
};

export default MyPools;
