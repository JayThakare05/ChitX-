import React from 'react';
import { ArrowUpRight, Share2, Clipboard, Filter, Download } from 'lucide-react';

const transactions = [
  { id: 1, type: 'Stake LP-Token #402', status: 'CONFIRMED', amount: '12,500.00 DAI', date: 'Today, 10:24 AM' },
  { id: 2, type: 'DAO Proposal #88 Vote', status: 'EXECUTED', amount: '1.00 GOV', date: 'Yesterday, 11:00 PM' },
  { id: 3, type: 'Protocol Migration', status: 'CONFIRMED', amount: '0.00 ETH', date: 'Oct 20, 2023' },
];

const TransactionTable = () => {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col gap-8 flex-1 group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Recent Governance Actions</h3>
        <div className="flex gap-2 text-slate-400">
           <button className="p-2 hover:bg-slate-50 hover:text-slate-800 rounded-lg transition-colors"><Filter size={18} /></button>
           <button className="p-2 hover:bg-slate-50 hover:text-slate-800 rounded-lg transition-colors"><Download size={18} /></button>
        </div>
      </div>
      
      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest border-b border-slate-50">
            <th className="text-left py-4 pb-6">Transaction</th>
            <th className="text-left py-4 pb-6">Status</th>
            <th className="text-left py-4 pb-6">Amount</th>
            <th className="text-left py-4 pb-6">Date</th>
            <th className="py-4 pb-6"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {transactions.map((tx) => (
            <tr key={tx.id} className="group/row hover:bg-slate-50/50 transition-colors">
              <td className="py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <ArrowUpRight size={14} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{tx.type}</span>
                </div>
              </td>
              <td className="py-5">
                <div className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight w-fit",
                  tx.status === 'CONFIRMED' ? "bg-teal-50 text-teal-700" : "bg-blue-50 text-blue-700"
                )}>
                  {tx.status}
                </div>
              </td>
              <td className="py-5 text-sm font-black text-slate-800 tracking-tight">{tx.amount}</td>
              <td className="py-5 text-sm font-medium text-slate-400">{tx.date}</td>
              <td className="py-5 text-right px-4">
                 <button className="p-2 text-slate-300 hover:text-slate-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all opacity-0 group-hover/row:opacity-100"><Clipboard size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export default TransactionTable;
