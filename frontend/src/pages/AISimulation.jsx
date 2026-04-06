import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Trophy, Lock, Play, Pause, 
  RotateCcw, Timer, Zap, Target, TrendingUp,
  CircleDot, ChevronRight, Activity, ShieldCheck, 
  Cpu, LayoutDashboard, Fingerprint, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
const getInitialState = () => usersData.map((u, i) => ({
  ...u,
  score: calculateMockScore(u),
  winMonth: null, // the exact month they won
  cycle1Win: false,
  cycle2Win: false
}));

const AISimulation = () => {
  const [currentMonth, setCurrentMonth] = useState(1);
  const [poolA, setPoolA] = useState([]);
  const [poolB, setPoolB] = useState([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);
  const timerRef = useRef(null);

  // Initialize
  useEffect(() => {
    const data = getInitialState();
    setPoolA(data.slice(0, 12));
    setPoolB(data.slice(12, 24));
  }, []);

  // Handle month advance logic
  const handleAdvance = () => {
    if (currentMonth >= 24) {
      setIsAutoPlaying(false);
      return;
    }

    const nextMonth = currentMonth + 1;
    const isCycle1 = nextMonth <= 12;

    const findWinner = (pool) => {
      const eligibles = pool.filter(u => isCycle1 ? !u.cycle1Win : !u.cycle2Win);
      if (eligibles.length === 0) return null;
      const sorted = [...eligibles].sort((a, b) => b.score - a.score);
      return sorted[0];
    };

    const updatePool = (pool, winner) => {
      if (!winner) return pool;
      return pool.map(u => {
        if (u.id === winner.id) {
          return {
            ...u,
            winMonth: nextMonth,
            cycle1Win: isCycle1 ? true : u.cycle1Win,
            cycle2Win: !isCycle1 ? true : u.cycle2Win
          };
        }
        return u;
      });
    };

    const winnerA = findWinner(poolA);
    const winnerB = findWinner(poolB);

    setPoolA(prev => updatePool(prev, winnerA));
    setPoolB(prev => updatePool(prev, winnerB));
    setCurrentMonth(nextMonth);
    setTimeLeft(3); // Reset timer on advance
  };

  const handleReset = () => {
    setIsAutoPlaying(false);
    setCurrentMonth(1);
    const data = getInitialState();
    setPoolA(data.slice(0, 12));
    setPoolB(data.slice(12, 24));
    setTimeLeft(3);
  };

  // Auto-play timer effect
  useEffect(() => {
    if (isAutoPlaying && currentMonth < 24) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAdvance();
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isAutoPlaying, currentMonth]);

  const renderPool = (name, pool) => {
    const isCycle1 = currentMonth <= 12;

    const locked = pool.filter(u => isCycle1 ? u.cycle1Win : u.cycle2Win).sort((a,b) => a.winMonth - b.winMonth);
    const pending = pool.filter(u => isCycle1 ? !u.cycle1Win : !u.cycle2Win).sort((a,b) => b.score - a.score);

    let currentWinnerId = null;
    if (currentMonth === 1) {
       if(pending.length > 0) currentWinnerId = pending[0].id; 
    } else {
       const currWinner = locked.find(u => u.winMonth === currentMonth);
       if(currWinner) currentWinnerId = currWinner.id;
    }

    const displayList = [];
    if(currentWinnerId) {
       const cw = pool.find(u => u.id === currentWinnerId);
       if(cw) displayList.push({ ...cw, isCurrentWinner: true, isActuallyLocked: isCycle1 ? cw.cycle1Win : cw.cycle2Win });
    }
    
    pending.forEach(u => {
      if(u.id !== currentWinnerId) displayList.push({ ...u, isCurrentWinner: false, isActuallyLocked: false });
    });
    
    locked.forEach(u => {
       if(u.id !== currentWinnerId) displayList.push({ ...u, isCurrentWinner: false, isActuallyLocked: true });
    });

    return (
      <div className="flex-1 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-[#134e4a]/5 overflow-hidden flex flex-col h-[750px] transition-all">
        {/* Pool Header */}
        <div className="bg-gradient-to-br from-[#134e4a] via-[#1aa08c] to-[#0d9488] p-8 text-white relative group">
           <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-[1rem] bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-xl">
                 <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <div>
                 <h3 className="text-2xl font-bold tracking-tight leading-none mb-1">{name}</h3>
                 <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">AI-MANAGED PAYOUT GROUP</p>
              </div>
           </div>
        </div>

        {/* Table Header Row */}
        <div className="bg-slate-50/50 border-b border-slate-100 flex items-center px-10 py-4">
           <div className="flex-1 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Member</div>
           <div className="w-48 text-[11px] font-bold text-slate-400 text-center uppercase tracking-[0.2em]">Credit Info</div>
           <div className="w-32 text-[11px] font-bold text-slate-400 text-right uppercase tracking-[0.2em]">Priority</div>
        </div>
        
        {/* Compact Table Body */}
        <div className="flex-1 overflow-y-auto bg-transparent custom-scrollbar">
           <AnimatePresence mode="popLayout" initial={false}>
             {displayList.map((u, idx) => (
                <motion.div 
                  layout
                  key={u.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={`relative flex items-center px-10 py-5 border-b border-slate-100/30 transition-all duration-300 group ${
                    u.isCurrentWinner 
                      ? 'bg-emerald-50/60 border-emerald-100/50 z-10' 
                      : u.isActuallyLocked 
                        ? 'opacity-25 grayscale' 
                        : 'hover:bg-slate-50/40'
                  }`}
                >
                  {/* Status Indicator Left */}
                  {u.isCurrentWinner && (
                    <motion.div 
                      layoutId="active-selection-bar"
                      className="absolute left-0 top-3 bottom-3 w-1 bg-[#1aa08c] rounded-r-full shadow-[0_0_12px_#1aa08c]"
                    />
                  )}
                  
                  {/* Member ID Column */}
                  <div className="flex-1 flex items-center gap-4 overflow-hidden">
                    <p className={`font-semibold text-lg tracking-tight truncate ${u.isCurrentWinner ? 'text-[#134e4a]' : u.isActuallyLocked ? 'text-slate-400' : 'text-[#134e4a]'}`}>
                      {u.id}
                    </p>
                    {u.isCurrentWinner && (
                      <div className="bg-[#1aa08c] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap shadow-lg shadow-[#1aa08c]/20">
                         <Coins size={10} fill="currentColor" /> {currentMonth === 1 ? 'NEXT IN LINE' : 'RECEIVING PAYOUT'}
                      </div>
                    )}
                  </div>

                  {/* Credit Info Column (Compact Metrics) */}
                  <div className="w-48 flex items-center justify-center gap-6">
                    <div className="text-center">
                       <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5 leading-none">CIBIL</p>
                       <p className={`text-[15px] font-bold ${u.isCurrentWinner ? 'text-[#1aa08c]' : 'text-slate-600'}`}>{u.credit_score}</p>
                    </div>
                    <div className="w-px h-5 bg-slate-100" />
                    <div className="text-center">
                       <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Defaults</p>
                       <p className={`text-[15px] font-bold ${u.defaults > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{u.defaults}</p>
                    </div>
                  </div>
                  
                  {/* Priority Score Column */}
                  <div className="w-32 text-right">
                     <p className={`text-2xl font-bold tracking-tighter ${u.isActuallyLocked ? 'text-slate-200' : 'text-[#1aa08c]'}`}>
                        {u.score.toFixed(1)}<span className="text-xs opacity-40 ml-0.5">%</span>
                     </p>
                     {u.isActuallyLocked && !u.isCurrentWinner && (
                       <div className="flex items-center justify-end gap-1.5 text-[9px] font-semibold text-slate-300 uppercase tracking-widest mt-0.5">
                          <Lock size={10} strokeWidth={3} /> Month {u.winMonth}
                       </div>
                     )}
                  </div>
                </motion.div>
             ))}
           </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-10 max-w-7xl mx-auto pb-24 px-4 font-['Outfit',_sans-serif]"
    >
      {/* ── Minimalist Dashboard Header ── */}
      <div className="bg-white/80 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/80 shadow-2xl shadow-[#134e4a]/5 flex flex-col lg:flex-row justify-between items-center gap-10 relative overflow-hidden">
        <div className="space-y-4 text-center lg:text-left relative z-10">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-1 opacity-60">
             <div className="w-2 h-2 rounded-full bg-[#1aa08c] animate-pulse" />
             <p className="text-[11px] font-semibold text-[#134e4a] uppercase tracking-[0.4em]">AI-Powered Simulation</p>
          </div>
          <h1 className="text-6xl font-bold text-[#134e4a] tracking-tight leading-none mb-4">24-Month Simulation</h1>
          <div className="flex flex-wrap justify-center lg:justify-start items-center gap-5 pt-1">
             <div className="bg-[#134e4a] text-white px-5 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl">
                {currentMonth <= 12 ? 'Year 1' : 'Year 2'}
             </div>
             <p className="text-slate-400 font-semibold text-[13px] uppercase tracking-[0.1em] flex items-center gap-2">
                <Activity size={18} className="text-[#1aa08c] opacity-60" />
                24 MEMBERS • 2 POOLS
             </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 relative z-10">
            {/* Flat Timeline Progress */}
            <div className="flex items-center gap-8 bg-slate-50/50 border border-slate-100 px-10 py-6 rounded-[2.5rem] shadow-inner">
               <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em] mb-1">Month</p>
                  <p className="text-6xl font-extrabold text-[#134e4a] tracking-tighter leading-none">
                     <span className="text-[#1aa08c]">M{currentMonth}</span>
                     <span className="text-slate-200 text-3xl ml-1">/24</span>
                  </p>
               </div>
               
               {isAutoPlaying && (
                 <div className="flex flex-col items-center gap-3 pl-8 border-l border-slate-100">
                    <p className="text-[10px] font-bold text-[#1aa08c] uppercase tracking-widest leading-none">NEXT DRAW IN</p>
                    <div className="flex gap-2">
                       {[1, 2, 3].map(i => (
                          <motion.div 
                            key={i} 
                            animate={{ 
                              scale: timeLeft >= i ? [1, 1.25, 1] : 1,
                              opacity: timeLeft >= i ? 1 : 0.1,
                              backgroundColor: timeLeft >= i ? '#1aa08c' : '#cbd5e1'
                            }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(26,160,140,0.3)]" 
                          />
                       ))}
                    </div>
                 </div>
               )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
               <button 
                 onClick={handleReset}
                 title="Reset Simulation"
                 className="p-5 border border-slate-100 text-[#134e4a]/20 hover:bg-white hover:text-[#134e4a] rounded-[2rem] transition-all hover:shadow-xl active:scale-95"
               >
                 <RotateCcw size={28} strokeWidth={2.5} />
               </button>
               
               <button 
                 onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                 disabled={currentMonth >= 24}
                 className={`flex items-center gap-4 px-12 py-5 rounded-[2rem] font-bold text-xs uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 disabled:opacity-40 ${
                   isAutoPlaying 
                     ? 'bg-slate-900 text-white' 
                     : 'bg-gradient-to-br from-[#1aa08c] to-[#0d9488] text-white shadow-[#1aa08c]/20 hover:shadow-[#1aa08c]/40'
                 }`}
               >
                 {isAutoPlaying ? (
                    <><Pause size={20} strokeWidth={3} /> Pause</>
                 ) : (
                    <><Play size={20} fill="currentColor" strokeWidth={0} /> {currentMonth === 1 ? 'Start Simulation' : 'Resume'}</>
                 )}
               </button>
            </div>
        </div>
      </div>

      {/* ── Compact Table Grids ── */}
      <div className="flex flex-col xl:flex-row gap-10">
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex-1"
        >
          {renderPool('Pool A', poolA)}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 30 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1"
        >
          {renderPool('Pool B', poolB)}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AISimulation;
