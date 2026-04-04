import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TreasuryUtilization = ({ total, data }) => {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-between group hover:shadow-md transition-shadow relative overflow-hidden h-[400px] w-full max-w-sm">
      <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest absolute top-8 left-8">Treasury Utilization</h3>
      
      <div className="w-full h-48 relative mt-12">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800">${total}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">TOTAL VALUE</span>
        </div>
      </div>
      
      <div className="w-full space-y-3 mt-6">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center bg-slate-50/50 p-2 rounded-xl group-hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{item.name}</span>
            </div>
            <span className="text-xs font-black text-slate-700">{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreasuryUtilization;
