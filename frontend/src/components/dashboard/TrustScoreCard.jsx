import React from 'react';

const TrustScoreCard = ({ score }) => {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 1000) * circumference;

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-between group hover:shadow-md transition-shadow relative overflow-hidden h-[300px] w-[300px]">
      <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest absolute top-8 left-8">Trust Score</h3>
      <div className="relative mt-12">
        <svg className="w-48 h-48 -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="#0d9488"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-slate-800">{score}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">MAX 1000</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-1">
          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: `${(score/1000) * 100}%` }}></div>
          </div>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Growth +12%</span>
      </div>
    </div>
  );
};

export default TrustScoreCard;
