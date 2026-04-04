import React, { useState, useEffect } from 'react';
import BalanceCard from '../components/dashboard/BalanceCard';
import TrustScoreCard from '../components/dashboard/TrustScoreCard';
import APYCard from '../components/dashboard/APYCard';
import AIInsightsCard from '../components/dashboard/AIInsightsCard';
import ActivePoolsSection from '../components/dashboard/ActivePoolsSection';
import RecentTransactionsWidget from '../components/dashboard/RecentTransactionsWidget';

const Dashboard = () => {
  // Read user session from localStorage
  const userData = JSON.parse(localStorage.getItem('chitx_user') || '{}');
  const trustScore = userData.trustScore || 0;
  const ctxBalance = userData.airdropAmount || (trustScore * 10);
  const walletAddress = userData.walletAddress || '0x0000...0000';
  const shortWallet = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '—';

  const [realBalance, setRealBalance] = useState(ctxBalance);

  useEffect(() => {
    if (!walletAddress || walletAddress === '0x0000...0000') return;
    
    // Fetch live on-chain balance when dashboard loads
    const fetchLiveBalance = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/pools/balance/${walletAddress}`);
        if (res.ok) {
          const data = await res.json();
          // Update state and local storage with fresh balance
          const displayBal = parseFloat(data.onChainBalance).toFixed(1);
          setRealBalance(displayBal);
          
          if (userData && userData.walletAddress) {
            userData.airdropAmount = displayBal;
            localStorage.setItem('chitx_user', JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.error('Failed to fetch real-time balance', err);
      }
    };
    
    fetchLiveBalance();
  }, [walletAddress]);

  const treasuryData = [
    { name: 'Yield Optimized', value: 64, percent: 64, color: '#0d9488' },
    { name: 'Liquidity Reserve', value: 36, percent: 36, color: '#38bdf8' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Top Row: Key Metrics */}
      <div className="flex flex-wrap gap-8">
        <BalanceCard 
          balance={Number(realBalance).toLocaleString()} 
          address={shortWallet} 
          riskStatus="ZK-OPTIMIZED" 
        />
        <TrustScoreCard score={trustScore} />
        <APYCard apy={12.4} />
      </div>

      {/* Middle Row: Active Pools & AI Oracle */}
      <div className="flex flex-wrap lg:flex-nowrap gap-12 items-start">
        <div className="flex-1 min-w-0">
          <ActivePoolsSection />
        </div>
        <div className="shrink-0">
          <AIInsightsCard />
        </div>
      </div>

      {/* Bottom Row: Recent Transactions */}
      <div className="pb-12">
        <RecentTransactionsWidget />
      </div>
    </div>
  );
};

export default Dashboard;
