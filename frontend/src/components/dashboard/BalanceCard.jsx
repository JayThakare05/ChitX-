import React from 'react';
import { Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BalanceCard = ({ balance, address, riskStatus }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex-1 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">CTX Balance</h3>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-black text-slate-800 tracking-tight">{balance}</span>
             <span className="text-lg font-bold text-teal-600">CTX</span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/payments')} 
          title="View Payments & Transactions"
          className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:bg-teal-50 hover:text-teal-500 transition-all cursor-pointer border border-transparent hover:border-teal-100"
        >
          <Wallet size={48} strokeWidth={1.5} />
        </button>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Wallet Address</span>
          <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2">
            <span className="text-xs font-mono text-slate-600 font-medium">{address}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Risk Status</span>
          <div className="bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100/50 flex items-center gap-2">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">{riskStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
