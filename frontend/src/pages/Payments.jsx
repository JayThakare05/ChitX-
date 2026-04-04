import React, { useState } from 'react';
import { Search, ArrowDownRight, ArrowUpRight, Copy } from 'lucide-react';

const mockTransactions = [
  { id: '1', txHash: '0x12a...7B9', type: 'CONTRIBUTION', pool: 'Stable-Yield V4', amount: 100, date: 'Oct 12, 10:24 AM', status: 'SUCCESS' },
  { id: '2', txHash: '0x45b...2C1', type: 'PAYOUT', pool: 'Stable-Yield V4', amount: 1000, date: 'Oct 14, 02:15 PM', status: 'SUCCESS' },
  { id: '3', txHash: '0x89c...9A4', type: 'CONTRIBUTION', pool: 'Elite Alpha', amount: 500, date: 'Oct 20, 09:00 AM', status: 'PENDING' },
  { id: '4', txHash: '0x32d...1E5', type: 'REFUND', pool: 'Premium Beta', amount: 200, date: 'Oct 21, 11:30 AM', status: 'SUCCESS' },
  { id: '5', txHash: '0x76f...5D2', type: 'CONTRIBUTION', pool: 'Stable-Yield V4', amount: 100, date: 'Nov 12, 10:24 AM', status: 'SUCCESS' },
  { id: '6', txHash: '0x99e...4F8', type: 'EMERGENCY_FUND', pool: 'Platform Reserve', amount: 50, date: 'Nov 15, 04:45 PM', status: 'SUCCESS' },
];

const Payments = () => {
   const [searchQuery, setSearchQuery] = useState('');

   const filteredTx = mockTransactions.filter(tx => 
     tx.pool.toLowerCase().includes(searchQuery.toLowerCase()) || 
     tx.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
     tx.type.toLowerCase().includes(searchQuery.toLowerCase())
   );

   return (
     <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex justify-between items-end flex-wrap gap-4">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Payments History</h2>
            <p className="text-slate-500 font-medium mt-2">Track your platform contributions, payouts, and on-chain logs.</p>
         </div>
       </div>

       <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
         <div className="flex items-center bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3.5 mb-6 focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-50 transition-all">
           <Search size={20} className="text-slate-400 mr-3" />
           <input 
             type="text" 
             placeholder="Search transactions by Pool, Type, or Hash..." 
             className="bg-transparent w-full outline-none font-bold text-slate-700 placeholder:text-slate-400 text-sm"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
         </div>

         <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-left border-collapse min-w-[700px]">
             <thead>
               <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-white">
                 <th className="pb-4 pt-2 px-4">Transaction</th>
                 <th className="pb-4 pt-2 px-4">Pool</th>
                 <th className="pb-4 pt-2 px-4">Amount</th>
                 <th className="pb-4 pt-2 px-4">Status</th>
                 <th className="pb-4 pt-2 px-4">Date</th>
                 <th className="pb-4 pt-2 px-4">Hash</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {filteredTx.length > 0 ? filteredTx.map((tx) => (
                 <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                   <td className="py-4 px-4 flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tx.type === 'PAYOUT' || tx.type === 'REFUND' ? 'bg-green-50 text-green-600 border-green-100/50' : 'bg-teal-50 text-teal-600 border-teal-100/50'}`}>
                       {tx.type === 'PAYOUT' || tx.type === 'REFUND' ? <ArrowDownRight size={18} strokeWidth={2.5} /> : <ArrowUpRight size={18} strokeWidth={2.5} />}
                     </div>
                     <span className="font-bold text-slate-700 text-xs tracking-wide">{tx.type}</span>
                   </td>
                   <td className="py-4 px-4 font-bold text-slate-500 text-sm">{tx.pool}</td>
                   <td className="py-4 px-4">
                     <span className={`font-black text-sm tracking-tight ${tx.type === 'PAYOUT' || tx.type === 'REFUND' ? 'text-green-600' : 'text-slate-800'}`}>
                       {tx.type === 'PAYOUT' || tx.type === 'REFUND' ? '+' : '-'}${tx.amount.toLocaleString()}
                     </span>
                   </td>
                   <td className="py-4 px-4">
                     <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${tx.status === 'SUCCESS' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                       {tx.status}
                     </span>
                   </td>
                   <td className="py-4 px-4 font-bold text-slate-400 text-xs uppercase tracking-wider">{tx.date}</td>
                   <td className="py-4 px-4">
                     <div className="flex items-center gap-2 text-slate-400 hover:text-teal-600 cursor-pointer transition-colors max-w-fit bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 group-hover:border-slate-200">
                       <span className="font-mono text-[11px] font-bold tracking-tight">{tx.txHash}</span>
                       <Copy size={12} />
                     </div>
                   </td>
                 </tr>
               )) : (
                 <tr>
                   <td colSpan="6" className="py-12 text-center">
                     <div className="flex flex-col items-center justify-center text-slate-400">
                        <Search size={40} className="mb-4 text-slate-200" strokeWidth={1} />
                        <span className="font-bold text-sm">No transactions found matching "{searchQuery}"</span>
                     </div>
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
     </div>
   );
};

export default Payments;
