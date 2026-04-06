import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { useAccount, useWriteContract, useSwitchChain, useBalance } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { parseEther } from 'viem';

import PoolFlipCard from '../components/dashboard/PoolFlipCard';
import { ConfirmModal, ResultModal, EligibilityModal } from '../components/ui/PoolModals';
import { CTX_ADDRESS, TREASURY_ADDRESS, ERC20_ABI } from '../constants';

const CreatePoolModal = ({ onClose, refreshPools, showResult }) => {
  const [monthlyPay, setMonthlyPay] = useState(100);
  const [members, setMembers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Web3 Hooks
  const { address: userWallet } = useAccount();
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { data: balanceData } = useBalance({ address: userWallet });

  // Eligibility State
  const [showEligibility, setShowEligibility] = useState(false);
  const [eligibilityChecks, setEligibilityChecks] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userWallet) return;
      try {
        const res = await fetch(`http://localhost:5000/api/auth/profile/${userWallet}`);
        const data = await res.json();
        if (res.ok) setUserProfile(data.user);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };
    fetchProfile();
  }, [userWallet]);

  const parsedMembers = members ? Number(members) : null;
  const totalPool = parsedMembers ? (monthlyPay * parsedMembers) : (monthlyPay * 10);
  const fixedDeposit = monthlyPay * 2;

  const validateEligibilityAndProceed = async () => {
    if (!userWallet) {
      return showResult(false, 'Not Connected', 'Please connect your wallet first.');
    }

    if (!userProfile) {
      return showResult(false, 'Profile Missing', 'Please complete your financial profile onboarding first.');
    }

    // Eligibility Logic (Synchronized with PoolFlipCard)
    const disposable = userProfile.income - userProfile.expenses;
    const balance = parseFloat(balanceData?.formatted || '0');
    
    const isMicroPool = monthlyPay >= 5 && monthlyPay <= 10;
    const balanceOk = balance >= fixedDeposit;
    const incomeOk = disposable >= monthlyPay;
    const trustOk = userProfile.trustScore >= 50 || (isMicroPool && balanceOk);

    const checks = [
      {
        label: 'Trust Score',
        value: `${userProfile.trustScore} / 100`,
        passed: trustOk,
        hint: trustOk ? 'Good standing' : 'Low trust score'
      },
      {
        label: 'Disposable Income',
        value: `$${disposable.toLocaleString()}/mo`,
        passed: incomeOk,
        hint: incomeOk 
          ? `You have \$${disposable.toLocaleString()} free after expenses — enough to cover the \$${monthlyPay} monthly pay.`
          : `Your disposable income (\$${disposable.toLocaleString()}) is less than the pool's monthly pay (\$${monthlyPay}).`
      },
      {
        label: 'CTX Balance',
        value: `${balance.toFixed(1)} CTX`,
        passed: balanceOk,
        hint: balanceOk 
          ? `You have ${balance.toFixed(1)} CTX — sufficient for the ${fixedDeposit} CTX fixed deposit.`
          : `You need ${fixedDeposit} CTX as a fixed deposit.`
      }
    ];

    const passedCount = checks.filter(c => c.passed).length;
    const isLowTrust = userProfile.trustScore < 50;

    // Hard requirements for high budget vs micro-pools
    if (isLowTrust && !isMicroPool) {
        setEligibilityChecks(checks);
        setShowEligibility(true);
        return;
    }
    
    if (passedCount < 2) {
      setEligibilityChecks(checks);
      setShowEligibility(true);
      return;
    }

    // If eligible, proceed to payment
    handleCreateWithPayment();
  };

  const handleCreateWithPayment = async () => {
    setIsLoading(true);
    try {
      // Step 1: Network Check
      if (chainId !== sepolia.id) {
        await switchChainAsync({ chainId: sepolia.id });
      }

      // Step 2: On-chain Payment (Fixed Deposit)
      const amountWei = parseEther(fixedDeposit.toString());
      let txHash;
      
      try {
        txHash = await writeContractAsync({
          address: CTX_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [TREASURY_ADDRESS, amountWei],
          chainId: sepolia.id,
          gas: 100000n,
        });
      } catch (err) {
        setIsLoading(false);
        return showResult(false, 'Payment Cancelled', 'You must pay the fixed deposit to host this pool.');
      }

      // Step 3: Backend Registration
      const response = await fetch('http://localhost:5000/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyPay,
          members: parsedMembers,
          status: 'OPEN',
          creatorWallet: userWallet,
          isCreatorJoining: true,
          txHash
        }),
      });

      if (response.ok) {
        refreshPools();
        onClose();
        showResult(true, 'Pool Created!', `Your pool is now live. You have been registered as the 1st member. Tx: ${txHash.slice(0, 10)}...`);
      } else {
        const data = await response.json();
        showResult(false, 'Creation Failed', data.error || 'Failed to create pool in database.');
      }
    } catch (error) {
      console.error('Error:', error);
      showResult(false, 'Error', 'Something went wrong during creation.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f3d3a]/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="w-full max-w-[420px] bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 border border-[#1aa08c]/20 shadow-2xl shadow-[#134e4a]/10 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#1aa08c]/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
          
          <button onClick={onClose} className="absolute top-8 right-8 z-50 text-[#134e4a]/40 hover:text-[#134e4a] font-bold transition-colors group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#1aa08c]/10 group-hover:scale-110 group-hover:bg-[#f4fcf9] transition-all">✕</div>
          </button>
          
          <h2 className="text-2xl font-bold text-[#134e4a] mb-8 relative z-10">Create New Pool</h2>

          <div className="mb-8 relative z-10">
            <label className="text-[11px] font-bold text-[#1aa08c] uppercase tracking-widest mb-2 block">Monthly Contribution</label>
            <div className="flex items-center text-5xl font-black text-[#134e4a]">
               <span className="text-[#134e4a]/40 mr-2">$</span>
               <input type="number" value={monthlyPay} onChange={e => setMonthlyPay(Number(e.target.value) || 0)} className="bg-transparent text-[#134e4a] w-full outline-none font-black border-b-2 border-[#1aa08c]/20 focus:border-[#1aa08c] transition-colors py-2" />
            </div>
          </div>
          
          <div className="space-y-4 bg-[#f4fcf9] rounded-2xl p-6 border border-[#1aa08c]/10 mt-6 mb-8 relative z-10">
            <div className="flex justify-between items-center">
               <span className="text-[#134e4a]/60 font-bold uppercase tracking-widest text-[10px]">No. of Members</span>
               <input type="number" placeholder="Any" value={members} onChange={e => setMembers(e.target.value)} className="bg-white text-[#134e4a] w-16 text-center rounded-lg px-2 py-1 outline-none font-bold border border-[#1aa08c]/20 focus:border-[#1aa08c] focus:ring-2 focus:ring-[#1aa08c]/10 transition-all placeholder:text-[#134e4a]/30" />
            </div>
            <div className="flex justify-between items-center text-sm">
               <span className="text-[#134e4a]/60 font-bold uppercase tracking-widest text-[10px]">Total Payout</span>
               <span className="font-black text-[#134e4a]">${totalPool.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-4 border-t border-[#1aa08c]/10">
               <span className="text-[#1aa08c] font-black uppercase tracking-widest text-[10px]">Your Commitment</span>
               <span className="font-black text-[#0d9488]">${fixedDeposit.toLocaleString()} CTX</span>
            </div>
          </div>
          
          <button 
            disabled={isLoading} 
            onClick={validateEligibilityAndProceed} 
            className="relative z-10 w-full py-4 bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#1aa08c]/20 hover:shadow-xl hover:shadow-[#1aa08c]/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Authenticate & Create'}
          </button>
          <p className="text-[9.5px] text-[#134e4a]/50 mt-4 text-center font-bold uppercase tracking-widest relative z-10 opacity-70">
            You will join as the 1st member automatically.
          </p>
        </motion.div>
      </motion.div>

      <EligibilityModal
        isOpen={showEligibility}
        onClose={() => setShowEligibility(false)}
        onProceed={handleCreateWithPayment}
        checks={eligibilityChecks}
        poolMonthlyPay={monthlyPay}
        fixedDeposit={fixedDeposit}
      />
    </>
  );

  return document.body ? createPortal(modalContent, document.body) : modalContent;
};

const MyPools = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [availablePools, setAvailablePools] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); 
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resultModal, setResultModal] = useState({ open: false, success: false, title: '', message: '', details: [] });

  const { address: userWallet } = useAccount();

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
        setResultModal({ open: true, success: true, title: 'Pool Deleted', message: data.message || 'Pool deleted. Members refunded.', details: [] });
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
           <p className="text-slate-500 font-medium mt-2">Discover or create recurring chit fund participation opportunities.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-[#1aa08c] to-[#0d9488] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-[#1aa08c]/30 hover:scale-[1.02] transition-all active:scale-95 shrink-0">
          <Plus size={18} strokeWidth={2.5} />
          Create New Offering
        </button>
      </div>
      
      {availablePools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {availablePools.map(pool => {
            const isCreator = userWallet && pool.creatorWallet?.toLowerCase() === userWallet.toLowerCase();
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
      
      <AnimatePresence>
        {isCreating && (
          <CreatePoolModal 
            refreshPools={fetchPools} 
            onClose={() => setIsCreating(false)} 
            showResult={(success, title, message) => setResultModal({ open: true, success, title, message, details: [] })}
          />
        )}
      </AnimatePresence>

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
