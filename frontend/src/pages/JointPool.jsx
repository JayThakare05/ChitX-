import React, { useState, useEffect } from 'react';
import PoolFlipCard from '../components/dashboard/PoolFlipCard';

const JointPool = () => {
  const [joinedPools, setJoinedPools] = useState([]);

  const fetchJoinedPools = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/pools');
      const data = await response.json();
      if (response.ok) {
        const userStr = localStorage.getItem('chitx_user');
        const wallet = userStr ? JSON.parse(userStr).walletAddress?.toLowerCase() : null;
        
        if (wallet) {
          const userJoined = data.pools.filter(p => p.joinedMembers && p.joinedMembers.includes(wallet));
          setJoinedPools(userJoined);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pools:', error);
    }
  };

  useEffect(() => {
    fetchJoinedPools();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">Joint Pools</h2>
           <p className="text-slate-500 font-medium mt-2">Manage and track the chit funds you are actively participating in.</p>
        </div>
      </div>
      
      {joinedPools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {joinedPools.map(pool => (
            <PoolFlipCard key={pool._id} pool={{ ...pool, id: pool._id }} onRefresh={fetchJoinedPools} />
          ))}
        </div>
      ) : (
        <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-12 text-center text-slate-400">
          <p className="font-bold">You haven't joined any pools yet.</p>
        </div>
      )}
    </div>
  );
};

export default JointPool;
