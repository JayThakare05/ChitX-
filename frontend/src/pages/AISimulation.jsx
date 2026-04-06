import React, { useState } from 'react';
import { ArrowRight, Trophy, Lock } from 'lucide-react';
import usersData from '../data.json';

// Calculate base mock score (out of 100 max roughly)
const calculateMockScore = (user) => {
  const incomeScore = Math.min((user.income / 150000) * 40, 40); // Max 40 pts from income
  const creditScore = Math.min((user.credit_score / 850) * 40, 40); // Max 40 pts from credit
  const defaultPenalty = user.defaults * 15; // Heavy penalty
  
  const rawScore = incomeScore + creditScore - defaultPenalty;
  return Math.max(Math.min(rawScore + 20, 99.9), 10.1); // Normalize
};

// Seed initial state
const initialState = usersData.map((u, i) => ({
  ...u,
  score: calculateMockScore(u),
  winMonth: null, // the exact month they won
  cycle1Win: false,
  cycle2Win: false
}));

const AISimulation = () => {
  const [currentMonth, setCurrentMonth] = useState(1);
  const [poolA, setPoolA] = useState(initialState.slice(0, 12));
  const [poolB, setPoolB] = useState(initialState.slice(12, 24));

  const handleAdvance = () => {
    if (currentMonth >= 24) return;
    
    const nextMonth = currentMonth + 1;
    const isCycle1 = nextMonth <= 12;

    const findWinner = (pool) => {
      // Filter out users who have already won in the current cycle
      const eligibles = pool.filter(u => isCycle1 ? !u.cycle1Win : !u.cycle2Win);
      if(eligibles.length === 0) return null; // Edge case
      
      // Sort descending by score
      const sorted = [...eligibles].sort((a,b) => b.score - a.score);
      return sorted[0]; // Winner is the top scorer
    };

    const updatePool = (pool, winner) => {
      if(!winner) return pool;
      return pool.map(u => {
        if(u.id === winner.id) {
          return {
            ...u,
            winMonth: nextMonth,
            cycle1Win: isCycle1 ? true : u.cycle1Win,
            cycle2Win: !isCycle1 ? true : u.cycle2Win
          }
        }
        return u;
      });
    };

    setPoolA(prev => updatePool(prev, findWinner(prev)));
    setPoolB(prev => updatePool(prev, findWinner(prev)));
    setCurrentMonth(nextMonth);
  };

  const renderPool = (name, pool) => {
    const isCycle1 = currentMonth <= 12;

    // Separate into pending vs locked
    const locked = pool.filter(u => isCycle1 ? u.cycle1Win : u.cycle2Win);
    const pending = pool.filter(u => isCycle1 ? !u.cycle1Win : !u.cycle2Win);

    // Sort pending by score descending
    pending.sort((a,b) => b.score - a.score);
    // Sort locked by win month
    locked.sort((a,b) => a.winMonth - b.winMonth);

    // Identify current winner to highlight
    const combined = [...pool];
    
    let currentWinnerId = null;
    
    if (currentMonth === 1) {
       if(pending.length > 0) currentWinnerId = pending[0].id; 
    } else {
       const currWinner = locked.find(u => u.winMonth === currentMonth);
       if(currWinner) currentWinnerId = currWinner.id;
    }

    const renderCard = (u, isActuallyLocked) => {
      const isWinnerNow = u.id === currentWinnerId;
      const shouldGrayOut = isActuallyLocked && !isWinnerNow;
      
      return (
        <div 
          key={u.id} 
          className={`relative p-4 rounded-2xl flex items-center justify-between border transition-all duration-300 ${
            isWinnerNow 
              ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500 ring-offset-2 scale-[1.02] z-10' 
              : shouldGrayOut 
                ? 'bg-slate-50 border-slate-200 opacity-60 grayscale-[50%]' 
                : 'bg-white border-slate-100 shadow-sm'
          }`}
        >
          {isWinnerNow && (
             <div className="absolute -top-3 -right-2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Trophy size={10} /> {currentMonth === 1 ? 'Projected #1 Position' : 'Payout Deployed'}
             </div>
          )}
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${isWinnerNow ? 'bg-emerald-200 text-emerald-800' : shouldGrayOut ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-700'}`}>
              {u.id.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <p className={`font-bold font-mono tracking-tight ${shouldGrayOut ? 'text-slate-500' : 'text-slate-800'}`}>{u.id}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">CIBIL: {u.credit_score} • Defaults: {u.defaults}</p>
            </div>
          </div>
          <div className="text-right">
             <p className={`text-lg font-black ${isWinnerNow ? 'text-emerald-600' : shouldGrayOut ? 'text-slate-400' : 'text-indigo-600'}`}>
                {u.score.toFixed(1)}%
             </p>
             {shouldGrayOut && (
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-end gap-1 mt-1">
                   <Lock size={10}/> Locked (M{u.winMonth})
                </p>
             )}
          </div>
        </div>
      );
    }

    const displayList = [];
    if(currentWinnerId) {
       const cwRecord = combined.find(c => c.id === currentWinnerId);
       if(cwRecord) displayList.push(renderCard(cwRecord, isCycle1 ? cwRecord.cycle1Win : cwRecord.cycle2Win));
    }
    
    pending.forEach(u => {
      if(u.id !== currentWinnerId) displayList.push(renderCard(u, false));
    });
    
    locked.forEach(u => {
       if(u.id !== currentWinnerId) displayList.push(renderCard(u, true));
    });

    return (
      <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
        <div className="bg-slate-900 p-6 text-white">
           <h3 className="text-xl font-black">{name}</h3>
           <p className="text-slate-400 text-sm mt-1">12 Members • Priority Resolution</p>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-slate-50/50 min-h-[500px] max-h-[800px] custom-scrollbar">
           {displayList}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">24-Month Protocol Simulation</h1>
          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold">CYCLE {currentMonth <= 12 ? 1 : 2}</span>
            Visualizing AI resolution and round completion over 24 months.
          </p>
        </div>
        <div className="flex items-center gap-8">
            <div className="text-center">
               <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Timeline</p>
               <p className="text-3xl font-black text-indigo-600">M{currentMonth}<span className="text-slate-300 text-lg">/24</span></p>
            </div>
            <button 
              onClick={handleAdvance}
              disabled={currentMonth >= 24}
              className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 hover:from-slate-700 hover:to-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
            Advance to Month {currentMonth + 1} <ArrowRight size={20} strokeWidth={3} />
            </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 pb-12">
        {renderPool('Alpha Pool', poolA)}
        {renderPool('Beta Pool', poolB)}
      </div>
    </div>
  );
};

export default AISimulation;
