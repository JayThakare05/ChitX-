import React from 'react';
import { Droplets, Zap, Clock, ChevronRight } from 'lucide-react';
import BalanceCard from '../components/dashboard/BalanceCard';
import TrustScoreCard from '../components/dashboard/TrustScoreCard';
import APYCard from '../components/dashboard/APYCard';
import PoolCard from '../components/dashboard/PoolCard';
import AIInsightsCard from '../components/dashboard/AIInsightsCard';
import TreasuryUtilization from '../components/dashboard/TreasuryUtilization';
import TransactionTable from '../components/dashboard/TransactionTable';

const Dashboard = () => {
  const treasuryData = [
    { name: 'Yield Optimized', value: 64, percent: 64, color: '#0d9488' },
    { name: 'Liquidity Reserve', value: 36, percent: 36, color: '#38bdf8' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Top Row: Key Metrics */}
      <div className="flex flex-wrap gap-8">
        <BalanceCard 
          balance="1,284,502.42" 
          address="0x71...592a" 
          riskStatus="ZK-OPTIMIZED" 
        />
        <TrustScoreCard score={942} />
        <APYCard apy={12.4} />
      </div>

      {/* Middle Row: Active Pools & AI Oracle */}
      <div className="flex flex-wrap lg:flex-nowrap gap-12 items-start">
        <div className="flex-1 space-y-8 min-w-0">
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Active Liquidity Pools</h3>
            <button className="text-xs font-black text-teal-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              View All Protocols
              <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="flex gap-8 overflow-x-auto pb-4 custom-scrollbar">
            <PoolCard 
              icon={Droplets} 
              title="Stable-Yield V4" 
              assets="USDC / USDT / DAI" 
              contribution="45,000" 
              secondaryLabel="Payout Date" 
              secondaryValue="Oct 24" 
              status="ACTIVE" 
            />
            <PoolCard 
              icon={Zap} 
              title="Leveraged Alpha" 
              assets="WBTC / ETH / SOL" 
              contribution="12,400" 
              secondaryLabel="Risk Level" 
              secondaryValue="High" 
              status="PENDING" 
            />
            <PoolCard 
              icon={Clock} 
              title="Time-Locked Beta" 
              assets="ETH / ARB / OP" 
              contribution="8,200" 
              secondaryLabel="Release" 
              secondaryValue="Nov 12" 
              status="ACTIVE" 
            />
          </div>
        </div>
        
        <div className="shrink-0">
          <AIInsightsCard />
        </div>
      </div>

      {/* Bottom Row: Treasury & Governance */}
      <div className="flex flex-wrap lg:flex-nowrap gap-12 items-start pb-12">
        <div className="shrink-0 w-full lg:w-[400px]">
          <TreasuryUtilization total="4.2M" data={treasuryData} />
        </div>
        <div className="flex-1 min-w-0">
          <TransactionTable />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
