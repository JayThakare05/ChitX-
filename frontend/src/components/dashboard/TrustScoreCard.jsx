import React from 'react';

const TrustScoreCard = ({ score }) => {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score tier
  const getColor = (s) => {
    if (s >= 75) return '#0d9488'; // teal — excellent
    if (s >= 50) return '#f59e0b'; // amber — good
    return '#ef4444'; // red — needs improvement
  };

  const strokeColor = getColor(score);

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
            stroke={strokeColor}
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
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">/ 100</span>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-1">
          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: strokeColor }}></div>
          </div>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            {score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Building'}
          </span>
      </div>
    </div>
  );
};

export default TrustScoreCard;
