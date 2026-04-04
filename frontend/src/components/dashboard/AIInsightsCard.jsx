import React from 'react';
import { BrainCircuit, ChevronRight } from 'lucide-react';

const AIInsightsCard = () => {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col gap-8 w-full max-w-sm group hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center border border-teal-100/50">
           <BrainCircuit size={20} strokeWidth={2.5} />
        </div>
        <h4 className="text-lg font-black text-slate-800 tracking-tight">ChitX AI Oracle</h4>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
           <span>Reallocation Probability</span>
           <span className="text-teal-600">88%</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
           <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: '88%' }}></div>
        </div>
      </div>
      
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group-hover:bg-teal-50 transition-colors">
         <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest block mb-3">Oracle Recommendation</span>
         <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
           "Shift 15% of idle tokens to <span className="font-bold text-slate-800">Stable-Yield V4</span> to capture peak yield delta ahead of community contribution spikes."
         </p>
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BrainCircuit size={48} />
         </div>
      </div>
      
      <button className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors py-2 uppercase tracking-widest border-t border-slate-100 mt-4">
         View Full Reasoning
         <ChevronRight size={14} />
      </button>
    </div>
  );
};

export default AIInsightsCard;
