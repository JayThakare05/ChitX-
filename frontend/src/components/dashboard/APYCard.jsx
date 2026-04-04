import React from 'react';

const APYCard = ({ apy }) => {
  return (
    <div className="bg-teal-900 rounded-3xl p-8 border border-teal-800 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow relative overflow-hidden h-[300px] w-[300px]">
      <h3 className="text-[10px] font-extrabold text-teal-400/80 uppercase tracking-widest">Staking APY</h3>
      <div className="flex flex-col items-start gap-1">
        <span className="text-4xl font-black text-white">{apy}%</span>
      </div>

      <div className="flex items-end gap-1.5 h-16 w-full">
        {[40, 60, 30, 80, 50, 90, 70, 45, 85].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-teal-100/20 rounded-t-sm hover:bg-teal-100 transition-colors cursor-pointer"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      <div className="absolute top-0 right-0 p-8">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/5">
          <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
        </div>
      </div>
    </div>
  );
};

export default APYCard;
