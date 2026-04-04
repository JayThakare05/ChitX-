import React, { useState } from 'react';
import { Layers, LogOut, ShieldAlert, Award, Clock, Users, ArrowRight, CheckCircle2, AlertCircle, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { parseEther } from 'viem';
import { ConfirmModal, ResultModal, EligibilityModal } from '../ui/PoolModals';

// CTX Token contract details (Sepolia)
const CTX_ADDRESS = '0x3F78A5476539BfBD529FfEA0e713f887141412e3';
const TREASURY_ADDRESS = '0x95e9943BB6F8B301Fa465e698a5aAc435DB48C39';
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const PoolFlipCard = ({ pool, onRefresh }) => {
  const members = pool.members || null;
  const monthlyPay = pool.monthlyPay || 0;
  const totalAmount = pool.totalAmount || (members ? (monthlyPay * members) : 'Dynamic');
  const fixedDeposit = monthlyPay * 2;
  const navigate = useNavigate();

  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [resultModal, setResultModal] = useState({ open: false, success: false, title: '', message: '', details: [] });
  const [joinStep, setJoinStep] = useState(''); // '', 'wallet', 'backend'
  const [showEligibility, setShowEligibility] = useState(false);
  const [eligibilityChecks, setEligibilityChecks] = useState([]);

  const userStr = localStorage.getItem('chitx_user');
  const userWallet = userStr ? JSON.parse(userStr).walletAddress?.toLowerCase() : null;
  const isAlreadyJoined = pool.joinedMembers && userWallet && pool.joinedMembers.includes(userWallet);

  const myContribution = pool.contributions && userWallet
    ? pool.contributions.find(c => c.walletAddress === userWallet)
    : null;
  const canLeave = isAlreadyJoined && myContribution && myContribution.monthlyPayments === 0;

  const [ctxBalance, setCtxBalance] = useState(null);

  // Wagmi hooks
  const { address: connectedAddress, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const fetchBalance = async () => {
    if (!userWallet) return;
    try {
      const res = await fetch(`http://localhost:5000/api/pools/balance/${userWallet}`);
      const data = await res.json();
      if (res.ok) setCtxBalance(data.onChainBalance);
    } catch { /* ignore */ }
  };

  const openJoinConfirm = async (e) => {
    e.stopPropagation();

    // ── Read stored user data ──────────────────────────────────
    const userData = userStr ? JSON.parse(userStr) : {};
    const trustScore       = Number(userData.trustScore   ?? 0);
    const income           = Number(userData.income        ?? 0);
    const expenses         = Number(userData.expenses      ?? 0);
    const disposable       = income - expenses;

    // ── Fetch live CTX balance ────────────────────────────────
    let balance = 0;
    try {
      const res  = await fetch(`http://localhost:5000/api/pools/balance/${userWallet}`);
      const data = await res.json();
      if (res.ok) {
        balance = parseFloat(data.onChainBalance) || 0;
        setCtxBalance(balance);
      }
    } catch { /* network error — leave balance at 0 */ }

    // ── Build checks ──────────────────────────────────────────
    const isMicroPool  = monthlyPay >= 5 && monthlyPay <= 10;
    const isLowTrust   = trustScore < 50;

    const incomeOk     = disposable >= monthlyPay;
    const balanceOk    = balance    >= fixedDeposit;
    
    // Low trust users can join micro-pools IF balance is OK.
    // For larger pools, low trust is a hard fail for that check.
    const trustPassed  = trustScore >= 50 || (isMicroPool && balanceOk);
    
    let trustHint = '';
    if (trustScore >= 50) {
      trustHint = 'Score is above the minimum threshold of 50.';
    } else if (isMicroPool) {
      trustHint = balanceOk 
        ? `Low-Trust Exception: You can join this micro-pool because your balance is sufficient.`
        : `Your score is ${trustScore}. For micro-pools, a sufficient CTX balance is compulsory.`;
    } else {
      trustHint = `Your score is ${trustScore}. Pools above $10 require a minimum trust score of 50.`;
    }

    const checks = [
      {
        label:  'Trust Score',
        value:  `${trustScore} / 100`,
        passed: trustPassed,
        hint:   trustHint,
        isHardRequirement: isLowTrust && !isMicroPool, // Tag for modal
      },
      {
        label:  'Disposable Income',
        value:  `$${disposable.toLocaleString()} / mo`,
        passed: incomeOk,
        hint:   incomeOk
          ? `You have \$${disposable.toLocaleString()} free after expenses — enough to cover the \$${monthlyPay} monthly pay.`
          : `Your disposable income (\$${disposable.toLocaleString()}) is less than the pool's monthly pay (\$${monthlyPay}). Reduce expenses or choose a smaller pool.`,
      },
      {
        label:  'CTX Balance',
        value:  `${balance.toFixed(1)} CTX`,
        passed: balanceOk,
        hint:   balanceOk
          ? `You have ${balance.toFixed(1)} CTX — sufficient for the ${fixedDeposit} CTX fixed deposit.`
          : `You need ${fixedDeposit} CTX as a fixed deposit but only have ${balance.toFixed(1)} CTX. Earn more CTX first.`,
        isHardRequirement: isLowTrust && isMicroPool, // Compulsory for micro-pools if low trust
      },
    ];

    setEligibilityChecks(checks);
    setShowEligibility(true);
  };

  // Called when user clicks "Proceed to Pay" from the eligibility modal
  const proceedAfterEligibility = () => {
    setShowEligibility(false);
    setShowJoinConfirm(true);
  };

  const showResult = (success, title, message, details = []) => {
    setResultModal({ open: true, success, title, message, details });
  };

  const handleJoin = async () => {
    if (!userWallet) return showResult(false, 'Not Logged In', 'Please login first to join pools.');
    setShowJoinConfirm(false);
    setIsJoining(true);
    setJoinStep('wallet');

    try {
      // Step 0: Ensure we are on the Sepolia network
      if (chainId !== sepolia.id) {
        try {
          await switchChainAsync({ chainId: sepolia.id });
        } catch (switchErr) {
          showResult(false, 'Network Switch Failed', 'Please switch your wallet to Sepolia to continue.');
          setIsJoining(false);
          setJoinStep('');
          return;
        }
      }

      // Step 1: On-chain CTX transfer via MetaMask
      const amountWei = parseEther(fixedDeposit.toString());
      
      let txHash;
      try {
        txHash = await writeContractAsync({
          address: CTX_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [TREASURY_ADDRESS, amountWei],
          chainId: sepolia.id,
          gas: 100000n, // Bypass bugged RPC gas estimation
        });
      } catch (walletErr) {
        // User rejected or MetaMask error
        const msg = walletErr?.shortMessage || walletErr?.message || 'MetaMask transaction rejected.';
        showResult(false, 'Transaction Cancelled', msg);
        setIsJoining(false);
        setJoinStep('');
        return;
      }

      // Step 2: Register join in backend
      setJoinStep('backend');
      const res = await fetch(`http://localhost:5000/api/pools/${pool.id || pool._id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: userWallet, txHash })
      });
      const data = await res.json();
      
      if (!res.ok) {
        showResult(false, 'Cannot Join Pool', data.error || 'Failed to join pool.');
      } else {
        const stored = JSON.parse(localStorage.getItem('chitx_user') || '{}');
        stored.airdropAmount = data.remainingBalance || data.onChainBalance;
        localStorage.setItem('chitx_user', JSON.stringify(stored));
        showResult(true, 'Pool Joined!', data.message || 'Successfully joined the pool!', [
          { label: 'Deducted', value: `${fixedDeposit} CTX` },
          { label: 'Tx Hash', value: txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-6)}` : 'Confirmed' },
          { label: 'Remaining Balance', value: `${data.remainingBalance || data.onChainBalance || '—'} CTX` }
        ]);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showResult(false, 'Error', err?.message || 'Could not complete the transaction.');
    } finally {
      setIsJoining(false);
      setJoinStep('');
    }
  };

  const handleLeave = async () => {
    setShowLeaveConfirm(false);
    setIsLeaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/pools/${pool.id || pool._id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: userWallet })
      });
      const data = await res.json();
      if (!res.ok) {
        showResult(false, 'Cannot Leave', data.error || 'Failed to leave pool.');
      } else {
        const stored = JSON.parse(localStorage.getItem('chitx_user') || '{}');
        stored.airdropAmount = data.newBalance;
        localStorage.setItem('chitx_user', JSON.stringify(stored));
        showResult(true, 'Pool Left Successfully', data.message || 'Refund processed.', [
          { label: 'Refunded', value: `${data.refunded || fixedDeposit} CTX` },
          { label: 'New Balance', value: `${data.newBalance || '—'} CTX` }
        ]);
        if (onRefresh) onRefresh();
      }
    } catch {
      showResult(false, 'Connection Error', 'Could not reach the server. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  // Progress bar
  const joinedCount = pool.joinedMembers ? pool.joinedMembers.length : 0;
  const targetMembers = members || 15;
  const fillPercent = Math.min(100, Math.round((joinedCount / targetMembers) * 100));

  // Joining state text
  const getJoinButtonText = () => {
    if (!isJoining) return `Join Pool (${fixedDeposit} CTX)`;
    if (joinStep === 'wallet') return 'Confirm in MetaMask...';
    if (joinStep === 'backend') return 'Registering...';
    return 'Processing...';
  };

  return (
    <>
      <div className="w-full h-[22rem] bg-transparent cursor-pointer group [perspective:1000px]">
        <div className="relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-sm hover:shadow-md rounded-3xl">
          
          {/* Front Side */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-3xl p-7 border border-slate-100 flex flex-col justify-between [backface-visibility:hidden]">
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50">
                <Layers size={24} />
              </div>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                isAlreadyJoined 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-teal-50 text-teal-700 border-teal-100'
              }`}>
                {isAlreadyJoined ? 'JOINED' : (pool.status || 'AVAILABLE')}
              </span>
            </div>
            
            <div>
              <h4 className="text-3xl font-black text-slate-800 tracking-tight">${monthlyPay.toLocaleString()} <span className="text-sm font-bold text-slate-400">/ mo</span></h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-teal-400"></span>
                {members ? `${members} Members • ${members} Months` : 'Dynamic Pool'}
              </p>
            </div>

            {/* Pool fill progress */}
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                <span>{joinedCount} joined</span>
                <span>{members ? `${members} slots` : 'open'}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${fillPercent}%` }}></div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <span className="flex-1 h-px bg-slate-100"></span>
              <span className="text-[10px] uppercase tracking-widest font-bold">Hover to flip</span>
              <span className="flex-1 h-px bg-slate-100"></span>
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 w-full h-full bg-teal-900 rounded-3xl p-7 border border-teal-800 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] text-white shadow-xl shadow-teal-900/20">
            <div>
              <h4 className="text-[10px] font-extrabold text-teal-400/80 uppercase tracking-widest mb-1">Total Pool Output</h4>
              <div className="text-3xl font-black text-white">{members ? `$${totalAmount.toLocaleString()}` : 'Dynamic'}</div>
            </div>
            
            <div className="space-y-2.5 bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Monthly Pay</span>
                <span className="font-black text-white">${monthlyPay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Members</span>
                <span className="font-black text-white">{members || 'Any'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-teal-400 font-bold uppercase tracking-widest text-[10px]">Fixed Deposit</span>
                <span className="font-black text-white">{fixedDeposit} CTX</span>
              </div>
              {isAlreadyJoined && myContribution && (
                <div className="flex justify-between items-center text-sm border-t border-white/10 pt-2.5">
                  <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Your Contribution</span>
                  <span className="font-black text-emerald-300">{myContribution.totalContributed} CTX</span>
                </div>
              )}
              {pool.poolTreasury > 0 && (
                <div className="flex justify-between items-center text-sm border-t border-white/10 pt-2.5">
                  <span className="text-amber-400 font-bold uppercase tracking-widest text-[10px]">Pool Treasury</span>
                  <span className="font-black text-amber-300">{pool.poolTreasury} CTX</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {!isAlreadyJoined ? (
                <button onClick={openJoinConfirm} disabled={isJoining} className="w-full py-2.5 bg-white text-teal-900 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors shadow-inner flex justify-center items-center disabled:opacity-70">
                  {getJoinButtonText()}
                </button>
              ) : canLeave ? (
                <>
                  <button onClick={() => navigate(`/pool-simulator?poolId=${pool._id}`)} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex justify-center items-center gap-1.5 transition-colors hover:bg-indigo-700">
                    <BrainCircuit size={14} /> Simulate
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setShowLeaveConfirm(true); }} disabled={isLeaving} className="flex-1 py-2.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl font-bold text-sm hover:bg-red-500/30 transition-colors flex justify-center items-center gap-1.5 disabled:opacity-80">
                    <LogOut size={14} />
                    {isLeaving ? '...' : 'Leave'}
                  </button>
                </>
              ) : (
                <button onClick={() => navigate(`/pool-simulator?poolId=${pool._id}`)} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-indigo-700">
                  <BrainCircuit size={16} /> Simulate AI Process
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <EligibilityModal
        isOpen={showEligibility}
        onClose={() => setShowEligibility(false)}
        onProceed={proceedAfterEligibility}
        checks={eligibilityChecks}
        poolMonthlyPay={monthlyPay}
        fixedDeposit={fixedDeposit}
      />

      {/* ===== MODALS ===== */}
      <ConfirmModal
        isOpen={showJoinConfirm}
        onClose={() => setShowJoinConfirm(false)}
        onConfirm={handleJoin}
        isLoading={isJoining}
        variant="join"
        title="Join This Pool?"
        description="MetaMask will prompt you to transfer CTX tokens as a fixed deposit. You can leave and get a full refund only before making your first monthly payment."
        details={[
          { label: 'Monthly Pay', value: `$${monthlyPay.toLocaleString()}` },
          { label: 'Fixed Deposit', value: `${fixedDeposit} CTX` },
          { label: 'Your CTX Balance', value: ctxBalance !== null ? `${ctxBalance} CTX` : 'Loading...' },
          { label: 'Pool Type', value: members ? `${members} Members` : 'Dynamic' },
        ]}
        confirmText="Approve in MetaMask"
      />

      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={handleLeave}
        isLoading={isLeaving}
        variant="leave"
        title="Leave This Pool?"
        description="Your fixed deposit will be refunded to your wallet since you haven't made any monthly payments yet."
        details={[
          { label: 'Refund Amount', value: `${myContribution?.fixedDeposit || fixedDeposit} CTX` },
        ]}
        confirmText="Leave & Refund"
      />

      <ResultModal
        isOpen={resultModal.open}
        onClose={() => { setResultModal(prev => ({ ...prev, open: false })); }}
        success={resultModal.success}
        title={resultModal.title}
        message={resultModal.message}
        details={resultModal.details}
      />
    </>
  );
};

export default PoolFlipCard;
