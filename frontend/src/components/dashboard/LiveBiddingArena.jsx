import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Zap, Send, Trophy, Users, TrendingDown, Activity, Clock, Crown, PartyPopper, Gift } from 'lucide-react';

const LiveBiddingArena = ({ poolId, userName, walletAddress, totalPot, onClaimSuccess, onClose }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [totalDuration, setTotalDuration] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Auction result state
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [auctionResult, setAuctionResult] = useState(null);
  
  // Web3 Payout State
  const [payoutStatus, setPayoutStatus] = useState('processing');
  const [payoutTxHash, setPayoutTxHash] = useState(null);

  // ─── Connect to Socket.io ───
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-pool', { poolId, userName });
    });

    // Receive current auction state on join
    socket.on('auction-state', (state) => {
      if (state.timerRunning) {
        setTimerRunning(true);
        setTimeRemaining(state.timeRemaining);
      }
      if (state.auctionEnded) {
        setAuctionEnded(true);
      }
    });

    // ─── Timer Updates ───
    socket.on('timer-update', ({ timeRemaining: tr, totalDuration: td }) => {
      setTimeRemaining(tr);
      setTotalDuration(td);
      setTimerRunning(true);
    });

    // ─── AI Resolution Ended ───
    socket.on('ai-round-resolved', (result) => {
      setAuctionEnded(true);
      setTimerRunning(false);
      setTimeRemaining(0);
      setAuctionResult(result);
    });

    // ─── AI Autonomous Payout Complete ───
    socket.on('payout-complete', ({ txHash }) => {
      setPayoutStatus('completed');
      setPayoutTxHash(txHash);
      if (onClaimSuccess) onClaimSuccess();
    });

    // Room count updates
    socket.on('room-update', ({ onlineCount: count }) => {
      setOnlineCount(count);
    });

    // Error handling
    socket.on('bid-error', ({ message }) => {
      alert(message);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [poolId, userName]);

  const formatTime = (s) => {
    if (s === null || s === undefined) return '--:--';
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerPercent = totalDuration > 0 && timeRemaining !== null
    ? ((totalDuration - timeRemaining) / totalDuration) * 100
    : 0;

  const isWinner = auctionResult?.winner?.walletAddress && walletAddress 
    ? auctionResult.winner.walletAddress.toLowerCase() === walletAddress.toLowerCase() 
    : false;

  // ─── AI RESOLUTION AUCTION ENDED ───
  if (auctionEnded && auctionResult) {
    return (
      <div className="space-y-4">
        {/* Grand Winner Banner */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl p-6 text-center relative overflow-hidden shadow-xl shadow-purple-500/30">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Crown size={200} />
          </div>
          <div className="relative z-10">
            <div className="text-4xl mb-2">🤖</div>
            <h3 className="text-2xl font-black text-white mb-1">AI Resolution Complete</h3>
            <p className="text-purple-100 text-xs font-bold uppercase tracking-widest">Calculated by Risk Matrix</p>
          </div>
        </div>

        {/* Winner Card */}
        {auctionResult.winner ? (
          <div className="bg-white rounded-2xl border-2 border-purple-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Trophy size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest">Rank #1 Winner</p>
                <p className="text-lg font-black text-slate-800">{auctionResult.winner.userName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AI Priority Score</p>
                <p className="text-xl font-black text-purple-600">{Number(auctionResult.winner.priorityScore || auctionResult.winner.priority_pct || 0).toFixed(1)}%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Payout</p>
                <p className="text-xl font-black text-emerald-600">{auctionResult.finalPayoutAmount} CTX</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Activity size={12}/> AI Leaderboard
              </p>
              <div className="space-y-2">
                {auctionResult.rankedMembers.slice(0, 3).map((member, i) => (
                  <div key={i} className={`flex justify-between items-center p-2 rounded-lg ${i === 0 ? 'bg-purple-100/50' : 'bg-white'}`}>
                     <div className="flex items-center gap-2">
                       <span className="font-bold text-slate-400">#{i+1}</span>
                       <span className="font-bold text-sm text-slate-700">{member.userName}</span>
                     </div>
                     <span className="font-black text-xs text-purple-600">{Number(member.priorityScore || member.priority_pct || 0).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* If current user is the winner */}
            {isWinner ? (
              <div className="space-y-3">
                <button 
                  disabled
                  className={`w-full py-4 text-white rounded-2xl font-black text-lg flex justify-center items-center gap-2 shadow-2xl transition-all ${
                    payoutStatus === 'completed' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/40' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/40 animate-pulse'
                  }`}
                >
                  <Gift size={24} /> 
                  {payoutStatus === 'completed' ? "Funds Received!" : `AI Distributing Funds...`}
                </button>
                {payoutTxHash && <p className="text-center text-[10px] text-emerald-600 font-bold">Transaction Confirmed: {payoutTxHash.slice(0,10)}...</p>}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                <p className="text-xs font-bold text-slate-500">You placed lower in the Risk Matrix. Better luck next time! 🍀</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-sm font-bold text-slate-500">No members analyzed.</p>
          </div>
        )}

        {/* Final Stats */}
        <div className="flex justify-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
            <Users size={12} className="text-slate-500" />
            <span className="text-[11px] font-bold text-slate-600">{onlineCount} participated</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE AI ANALYSIS UI ───
  return (
    <div className="space-y-4">
      {/* Countdown Timer */}
      {timerRunning && timeRemaining !== null ? (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10" />
          <div className="relative z-10">
            <p className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest mb-1">
              <Activity size={12} className="inline mr-1 -mt-0.5" /> Matrix Analysis Progress
            </p>
            <p className={`text-4xl font-black tabular-nums tracking-tight ${timeRemaining <= 10 ? 'text-purple-300 animate-pulse' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </p>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-purple-400 to-indigo-400`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Waiting for pool to fill / timer to start */
        <div className="bg-slate-100 rounded-2xl p-4 text-center border border-slate-200">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
            <Clock size={12} className="inline mr-1 -mt-0.5" /> Waiting for Resolution
          </p>
          <p className="text-xs font-medium text-slate-400">Pool must be full for the AI engine to start</p>
        </div>
      )}

      {/* Arena Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-black text-purple-600 uppercase tracking-widest">AI Engine Active</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
            <Users size={12} className="text-slate-500" />
            <span className="text-[11px] font-bold text-slate-600">{onlineCount} online</span>
          </div>
        </div>
      </div>

      {/* Loading AI State */}
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
          <Activity size={32} className="text-purple-600 animate-pulse" />
        </div>
        <h4 className="text-lg font-black text-slate-800 mb-2">Analyzing Participants...</h4>
        <p className="text-sm font-bold text-slate-500 max-w-xs">
          The AI Model is crunching financial data to safely determine the optimal payout priority.
        </p>
        <div className="w-full max-w-xs mt-6 space-y-2">
           <div className="h-2 w-full bg-slate-200 rounded-full animate-pulse"></div>
           <div className="h-2 w-3/4 bg-slate-200 rounded-full animate-pulse mx-auto"></div>
           <div className="h-2 w-5/6 bg-slate-200 rounded-full animate-pulse mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default LiveBiddingArena;
