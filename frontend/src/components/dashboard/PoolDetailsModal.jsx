import React, { useState, useEffect } from 'react';
import { X, Shield, Zap, Users, Clock, TrendingUp, Check, Loader2, ArrowRight } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import {
  CTX_TOKEN_ADDRESS,
  CHITPOOL_ADDRESS,
  ERC20_ABI,
  CHITPOOL_ABI,
} from '../../config/contracts';
import LiveBiddingArena from './LiveBiddingArena';

const PoolDetailsModal = ({ pool, onClose, onJoined }) => {
  const totalAmount = pool.totalAmount || 0;
  const members = pool.members || 10;
  const joinedCount = pool.joinedCount || 0;
  const isPoolFull = joinedCount >= members;
  const monthlyPay = members > 0 ? (totalAmount / members) : 0;
  const fixedDeposit = monthlyPay * 2;

  const { address, isConnected } = useAccount();

  // ─── Live CTX Balance ───
  const { data: ctxBalanceRaw, refetch: refetchBalance } = useReadContract({
    address: CTX_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const ctxBalance = ctxBalanceRaw ? parseFloat(formatUnits(ctxBalanceRaw, 18)).toFixed(2) : '—';

  // ─── Flow State ───
  const [step, setStep] = useState('idle'); // idle | approving | depositing | syncing | joined
  const [error, setError] = useState(null);
  const [joinTxHash, setJoinTxHash] = useState(null);
  const [showArena, setShowArena] = useState(false);

  // ─── Check existing allowance ───
  const { data: allowance } = useReadContract({
    address: CTX_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CHITPOOL_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // ─── Step 1: Approve CTX spend ───
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    error: approveError,
  } = useWriteContract();

  const { isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  // ─── Step 2: Deposit into ChitPool ───
  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    error: depositError,
  } = useWriteContract();

  const { isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // ─── Deposit amount in wei (18 decimals) ───
  const depositAmountWei = parseUnits(String(fixedDeposit), 18);

  // ─── Check if already approved enough ───
  const isAlreadyApproved = allowance && BigInt(allowance) >= BigInt(depositAmountWei);

  // ─── Handle the full Join flow ───
  const handleJoinPool = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first.');
      return;
    }
    setError(null);

    if (isAlreadyApproved) {
      setStep('depositing');
      writeDeposit({
        address: CHITPOOL_ADDRESS,
        abi: CHITPOOL_ABI,
        functionName: 'deposit',
        args: [depositAmountWei],
      });
    } else {
      setStep('approving');
      writeApprove({
        address: CTX_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CHITPOOL_ADDRESS, depositAmountWei],
      });
    }
  };

  // ─── After Approve confirms → auto-trigger Deposit ───
  useEffect(() => {
    if (isApproveConfirmed && step === 'approving') {
      setStep('depositing');
      writeDeposit({
        address: CHITPOOL_ADDRESS,
        abi: CHITPOOL_ABI,
        functionName: 'deposit',
        args: [depositAmountWei],
      });
    }
  }, [isApproveConfirmed]);

  // ─── After Deposit confirms → sync with backend ───
  useEffect(() => {
    if (isDepositConfirmed && depositTxHash && step === 'depositing') {
      setStep('syncing');
      setJoinTxHash(depositTxHash);

      fetch('http://localhost:5000/api/pools/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: pool.id,
          walletAddress: address,
          txHash: depositTxHash,
        }),
      })
        .then(res => res.json())
        .then(() => {
          setStep('joined');
          refetchBalance();
          if (onJoined) onJoined();
        })
        .catch(() => {
          setStep('joined');
          if (onJoined) onJoined();
        });
    }
  }, [isDepositConfirmed, depositTxHash]);

  // ─── Surface errors ───
  useEffect(() => {
    if (approveError) {
      const msg = approveError.shortMessage || approveError.message || '';
      if (msg.includes('nonce') || msg.includes('underpriced')) {
        setError('Wallet Sync Error: Please Reset MetaMask (Settings > Advanced > Clear activity tab data) and refresh.');
      } else {
        setError(msg || 'Approve transaction failed.');
      }
      setStep('idle');
    }
    if (depositError) {
      const msg = depositError.shortMessage || depositError.message || '';
      if (msg.includes('nonce') || msg.includes('underpriced')) {
        setError('Wallet Sync Error: Please Reset MetaMask (Settings > Advanced > Clear activity tab data) and refresh.');
      } else {
        setError(msg || 'Deposit transaction failed.');
      }
      setStep('idle');
    }
  }, [approveError, depositError]);

  // ─── Derive userName from wallet ───
  const userName = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anonymous';

  // ─── Button rendering ───
  const renderActionButton = () => {
    if (step === 'joined') {
      return (
        <button
          onClick={() => setShowArena(true)}
          className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-sm flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors active:scale-[0.98]"
        >
          <Zap size={18} strokeWidth={3} /> Enter Bidding Arena
        </button>
      );
    }
    
    // If user hasn't joined but pool is full
    if (isPoolFull && step === 'idle') {
      return (
        <button
          disabled
          className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm flex justify-center items-center gap-2 shadow-inner cursor-not-allowed"
        >
          <Shield size={18} strokeWidth={2.5} /> Pool Full / Closed
        </button>
      );
    }

    const isLoading = step !== 'idle';
    const labelMap = {
      idle: `Deposit ${fixedDeposit.toLocaleString()} CTX to Join`,
      approving: 'Approving CTX Spend...',
      depositing: 'Depositing to ChitPool...',
      syncing: 'Syncing with Backend...',
    };

    return (
      <button
        onClick={handleJoinPool}
        disabled={isLoading || isPoolFull}
        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-black text-sm flex justify-center items-center gap-2 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]"
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} strokeWidth={2.5} />}
        {labelMap[step]}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200" onClick={() => !showArena && onClose()}>
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-800 to-teal-950 p-8 relative">
          <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <p className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest mb-1">Total Pool Output</p>
          <h2 className="text-4xl font-black text-white">{totalAmount.toLocaleString()} CTX</h2>
          <div className="flex gap-3 mt-4 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-teal-300 border border-white/10">
              {pool.status}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-teal-300 border border-white/10">
              Sepolia
            </span>
            {showArena && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse">
                ⚡ Live
              </span>
            )}
          </div>
          {/* Live wallet balance */}
          {isConnected && (
            <div className="mt-4 px-3 py-2 rounded-xl bg-white/10 border border-white/10 inline-block">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Your CTX Balance: </span>
              <span className="font-black text-white text-sm ml-1">{ctxBalance} CTX</span>
            </div>
          )}
        </div>

        {/* ─── Arena View (replaces stats when active) ─── */}
        {showArena ? (
          <div className="p-6">
            <button
              onClick={() => setShowArena(false)}
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 hover:text-slate-600 transition-colors cursor-pointer"
            >
              ← Back to Pool Details
            </button>
            <LiveBiddingArena
              poolId={pool.id}
              userName={userName}
              walletAddress={address || ""}
              totalPot={totalAmount}
              onClaimSuccess={() => {
                refetchBalance();
              }}
              onClose={() => setShowArena(false)}
            />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center"><TrendingUp size={16} /></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Pay</span>
                </div>
                <p className="text-xl font-black text-slate-800">{monthlyPay.toLocaleString()} CTX</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Users size={16} /></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Members</span>
                </div>
                <p className="text-xl font-black text-slate-800">{members}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Clock size={16} /></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                </div>
                <p className="text-xl font-black text-slate-800">{members} Months</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><Shield size={16} /></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fixed Deposit</span>
                </div>
                <p className="text-xl font-black text-slate-800">{fixedDeposit.toLocaleString()} CTX</p>
              </div>
            </div>

            {/* AI Risk Assessment Placeholder */}
            <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-indigo-500" />
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">AI Pool Risk Assessment</span>
              </div>
              <p className="text-xs text-indigo-400 font-medium">ML model analyzing member trust scores and CIBIL data to generate a pool risk rating. Coming soon.</p>
            </div>

            {/* Live Bidding Placeholder (only if not joined yet) */}
            {step !== 'joined' && (
              <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">Live Bidding Arena</span>
                </div>
                <p className="text-xs text-amber-400 font-medium">Real-time bidding rounds will activate once you deposit and join the pool.</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mx-6 mb-3 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                ⚠️ {error}
              </div>
            )}

            {/* Success Toast */}
            {step === 'joined' && joinTxHash && (
              <div className="mx-6 mb-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
                🎉 Successfully joined! Tx: {joinTxHash.slice(0, 10)}...{joinTxHash.slice(-8)}
              </div>
            )}

            {/* Action Button */}
            <div className="p-6 pt-2">
              {renderActionButton()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PoolDetailsModal;
