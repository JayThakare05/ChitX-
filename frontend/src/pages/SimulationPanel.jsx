import React, { useState, useEffect } from 'react';
import { PlayCircle, ShieldCheck, DivideCircle, Trophy, Users, AlertTriangle, Wand2, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const SimulationPanel = () => {
  const [pools, setPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isBifurcating, setIsBifurcating] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [searchParams] = useSearchParams();
  const poolIdParam = searchParams.get('poolId');

  const fetchDynamicPools = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/pools');
      const data = await res.json();
      if (res.ok) {
        setPools(data.pools);
        if (poolIdParam) {
           const p = data.pools.find(x => x._id === poolIdParam);
           if (p) setSelectedPool(p);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDynamicPools();
  }, [poolIdParam]);

  const handleBifurcateTest = async () => {
    setIsBifurcating(true);
    // User's exact example
    const testUsers = [
      { walletAddress: 'Member A', monthlyContribution: 500, trustScore: 60 },
      { walletAddress: 'Member B', monthlyContribution: 1000, trustScore: 30 },
      { walletAddress: 'Member C', monthlyContribution: 500, trustScore: 80 },
      { walletAddress: 'Member D', monthlyContribution: 1500, trustScore: 50 },
      { walletAddress: 'Member E', monthlyContribution: 1000, trustScore: 70 }
    ];

    try {
      const res = await fetch('http://localhost:5000/api/pools/bifurcate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usersList: testUsers, baseDuration: 5 })
      });
      if (res.ok) {
        fetchDynamicPools();
      }
    } catch (e) {
      console.error(e);
    }
    setIsBifurcating(false);
  };

  const handleSimulate = async () => {
    if (!selectedPool) return;
    setIsSimulating(true);
    try {
      const res = await fetch(`http://localhost:5000/api/pools/${selectedPool._id}/simulate-month`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setSimulationResult(data);
        fetchDynamicPools(); // Refresh pool state
        // Re-select updated pool
        const updatedPools = await (await fetch('http://localhost:5000/api/pools')).json();
        const updated = updatedPools.pools.find(p => p._id === selectedPool._id);
        setSelectedPool(updated);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSimulating(false);
  };

  const handleFillSynthetic = async () => {
    if (!selectedPool) return;
    setIsFilling(true);
    try {
      const res = await fetch(`http://localhost:5000/api/pools/${selectedPool._id}/fill-synthetic`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchDynamicPools();
        const updatedPools = await (await fetch('http://localhost:5000/api/pools')).json();
        const updated = updatedPools.pools.find(p => p._id === selectedPool._id);
        setSelectedPool(updated);
      }
    } catch (e) {
      console.error(e);
    }
    setIsFilling(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">AI Dynamic Pool Simulator</h2>
        <p className="text-slate-500 font-medium mt-2">Test the bifurcation constraints and priority score simulation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col - Bifurcation */}
        <div className="col-span-1 border border-slate-200 bg-white rounded-3xl p-6 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                 <DivideCircle size={20} />
              </div>
              <h3 className="font-bold text-slate-800">1. Queue Bifurcation</h3>
           </div>
           
           <p className="text-sm text-slate-500 mb-6">
             Simulate 5 users (A,B,C,D,E) with differing amounts entering the mega-queue.
             The engine will group them and assign target amounts based on a 5-month duration.
           </p>

           <button 
             onClick={handleBifurcateTest} 
             disabled={isBifurcating}
             className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"
           >
             {isBifurcating ? 'Bifurcating...' : 'Trigger A-E Group Test'}
           </button>

           <div className="mt-8 space-y-3">
             <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">All Available Pools</h4>
             {pools.length === 0 ? (
               <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-sm text-slate-400">No pools available.</div>
             ) : (
               pools.map(p => (
                 <div 
                   key={p._id} 
                   onClick={() => {setSelectedPool(p); setSimulationResult(null); }}
                   className={`p-4 rounded-xl border cursor-pointer transition-all ${
                     selectedPool?._id === p._id ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-teal-300'
                   }`}
                 >
                   <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-slate-700">Pool {p._id.slice(-4)}</span>
                      <span className="text-[10px] uppercase font-black bg-slate-100 text-slate-500 px-2 py-1 rounded">{p.status}</span>
                   </div>
                   <div className="text-xs text-slate-500 flex justify-between">
                     <span>{p.contributions.length} Members</span>
                     <span>Mth Col: ${p.totalMonthlyCollection.toLocaleString()}</span>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>

        {/* Right Col - Simulation */}
        <div className="col-span-1 lg:col-span-2 border border-slate-200 bg-slate-900 rounded-3xl p-8 shadow-xl text-white">
           {!selectedPool ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
               <ShieldCheck size={48} className="opacity-20" />
               <p>Select a dynamic pool from the left to start simulation.</p>
             </div>
           ) : (
             <div>
                <div className="flex justify-between items-start mb-8">
                   <div>
                     <h3 className="text-2xl font-black mb-1">Month {selectedPool.simulationMonth} / 5</h3>
                     <p className="text-sm text-slate-400">Current Pool Balance: <span className="text-teal-400 font-bold">${selectedPool.currentBalance.toLocaleString()}</span></p>
                   </div>
                   <button 
                     onClick={handleSimulate}
                     disabled={isSimulating || selectedPool.status === 'CLOSED'}
                     className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                   >
                     <PlayCircle size={20} /> Simulate Next Month
                   </button>
                </div>

                {simulationResult && (
                  <div className="mb-8 p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl animate-in zoom-in-95 duration-300">
                    <h4 className="text-sm font-bold text-teal-400 flex items-center gap-2 mb-2"><Trophy size={16} /> Month {simulationResult.month} Winners</h4>
                     {simulationResult.winners.length > 0 ? (
                      <div className="space-y-4">
                        {simulationResult.winners.map((w, i) => (
                           <div key={i} className="flex flex-col text-sm bg-black/20 p-3 rounded-xl border border-teal-500/10">
                             <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                               <span className="font-bold flex items-center gap-2"><Trophy size={14} className="text-emerald-400"/> {w.walletAddress}</span>
                               <span>Target Won <span className="text-teal-300 font-black">${w.targetAmount}</span></span>
                             </div>
                             <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 text-slate-400 italic text-xs flex gap-2">
                               <div className="mt-0.5"><ShieldAlert size={14} className="text-indigo-400"/></div>
                               <p>{w.aiReasoning || `Priority Score allowed payout based on AI metric analysis. Trust: ${w.trustScore}%`}</p>
                             </div>
                           </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No members eligible (Total Target Amount for unpaid members &gt; Available Balance).</p>
                    )}
                    {simulationResult.cycleReset && (
                      <p className="mt-2 text-xs text-amber-400 font-bold flex items-center gap-1"><AlertTriangle size={12}/> Cycle Reset: Everyone has won once.</p>
                    )}
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                   <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                     <Users size={14} /> Pool Standings ({selectedPool.contributions.length}/{selectedPool.members || 15} Capacity)
                   </h4>
                   
                   {selectedPool.contributions.length < (selectedPool.members || 15) && (
                      <div className="mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex flex-col items-center text-center">
                         <Wand2 size={24} className="text-indigo-400 mb-2"/>
                         <p className="text-sm font-bold text-indigo-100 mb-1">Pool is not full</p>
                         <p className="text-xs text-indigo-300 mb-4">Simulations are more accurate with a full pool mimicking varying AI Priority Scores and constraints.</p>
                         <button 
                           onClick={handleFillSynthetic}
                           disabled={isFilling}
                           className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                         >
                           {isFilling ? 'Synthesizing...' : 'Auto-fill with Synthetic Users'}
                         </button>
                      </div>
                   )}

                   <div className="space-y-3">
                     {[...selectedPool.contributions].sort((a,b) => b.trustScoreAtJoin - a.trustScoreAtJoin).map((mem, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${mem.hasBeenPaid ? 'border-emerald-500/20 bg-emerald-500/5 opacity-50' : 'border-white/10 bg-black/20'}`}>
                           <div>
                             <p className="font-bold text-sm tracking-wide flex items-center gap-2">
                               {mem.walletAddress}
                               {mem.hasBeenPaid && <span className="text-[9px] uppercase tracking-wider bg-emerald-500 text-slate-900 px-1.5 py-0.5 rounded font-black rounded-sm">Paid M{mem.payoutMonth}</span>}
                             </p>
                             <p className="text-xs text-slate-400 mt-1">Trust Score: {mem.trustScoreAtJoin}% • Input: ${mem.monthlyContribution}/mo</p>
                           </div>
                           <div className="text-right">
                             <p className="text-xs uppercase text-slate-500 font-bold mb-0.5">Target</p>
                             <p className={`font-black tracking-tight ${mem.hasBeenPaid ? 'text-emerald-400 line-through' : 'text-white'}`}>${mem.targetAmount.toLocaleString()}</p>
                           </div>
                        </div>
                     ))}
                   </div>
                </div>

             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default SimulationPanel;
