import React from 'react';
import { Droplets, Zap, Clock } from 'lucide-react';

const PoolCard = ({ icon: Icon, title, assets, contribution, secondaryLabel, secondaryValue, status }) => {
  const isZap = Icon === Zap;
  
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6 min-w-[320px] group hover:border-teal-100 transition-all">
      <div className="flex justify-between items-center">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center border",
          isZap ? "bg-purple-50 text-purple-600 border-purple-100/50" : "bg-teal-50 text-teal-600 border-teal-100/50"
        )}>
           <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className={cn(
           "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
           status === 'ACTIVE' ? "bg-teal-50 text-teal-700 border-teal-100" : "bg-orange-50 text-orange-700 border-orange-100"
        )}>
          {status}
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-black text-slate-800 tracking-tight">{title}</h4>
        <p className="text-[10px] font-bold text-slate-400 italic tracking-widest uppercase mt-0.5">{assets}</p>
      </div>
      
      <div className="flex gap-12">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Contribution</span>
          <span className="text-sm font-black text-slate-700 tracking-tight">${contribution}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{secondaryLabel}</span>
          <span className={cn(
            "text-sm font-black tracking-tight",
            secondaryValue === 'High' ? "text-orange-600" : "text-slate-700"
          )}>{secondaryValue}</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to avoid repetition
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export default PoolCard;
