import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, TrendingUp, Info } from 'lucide-react';

const scoreHistory = [
  { month: 'Jan', score: 300, event: 'KYC Verified' },
  { month: 'Feb', score: 320, event: null },
  { month: 'Mar', score: 450, event: 'Joined 1st Pool' },
  { month: 'Apr', score: 500, event: null },
  { month: 'May', score: 480, event: 'Payment Delayed (+2d)' },
  { month: 'Jun', score: 600, event: 'Pool Completed safely' },
  { month: 'Jul', score: 750, event: 'Joined Elite Pool' },
  { month: 'Aug', score: 820, event: null },
  { month: 'Sep', score: 890, event: 'Took Payout' },
  { month: 'Oct', score: 942, event: 'Flawless cycle' }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl min-w-[150px]">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{label} · Registration</p>
        <p className="text-3xl font-black text-white">{data.score}</p>
        {data.event && (
          <div className="bg-teal-900/50 text-teal-400 text-[10px] font-bold px-2 py-1.5 rounded-lg mt-3 border border-teal-800/50">
            {data.event}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const TrustScoreDetails = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">Trust Score Diagnostics</h2>
           <p className="text-slate-500 font-medium mt-2">A transparent timeline showing exactly how and why your on-chain trust fluctuates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="col-span-1 md:col-span-1 bg-teal-900 rounded-3xl p-8 border border-teal-800 shadow-sm flex flex-col justify-between text-white relative overflow-hidden h-48">
            <h4 className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest relative z-10">Current Rank</h4>
            <div className="relative z-10">
               <div className="text-6xl font-black tracking-tighter">942</div>
               <span className="text-sm font-bold text-teal-400 mt-1 block">Upper 5% Globally</span>
            </div>
            <ShieldCheck size={160} className="absolute -bottom-8 -right-8 text-white opacity-[0.03] rotate-12" />
         </div>

         <div className="col-span-1 md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center h-48 relative overflow-hidden group">
            <div className="flex-1">
               <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Historical Trajectory</h4>
               <div className="flex items-end gap-6">
                 <div>
                    <span className="text-4xl font-black text-slate-800 tracking-tighter">+214%</span>
                    <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mt-1">Since Joining</span>
                 </div>
                 <div className="bg-teal-50 text-teal-700 border border-teal-200/50 px-3 py-1.5 rounded-xl flex items-center gap-2 mb-1">
                   <TrendingUp size={16} strokeWidth={3} />
                   <span className="font-bold text-xs uppercase tracking-widest">Excellent Velocity</span>
                 </div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl p-8 pt-12 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10 px-4">
           <h3 className="text-lg font-black text-slate-800">Score Lifecycle Graph</h3>
           <button className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-widest flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-slate-300">
             <Info size={14} />
             How is this calculated?
           </button>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scoreHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} 
                dy={10} 
              />
              <YAxis 
                domain={[0, 1000]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#0d9488" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorScore)" 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#0d9488' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TrustScoreDetails;
