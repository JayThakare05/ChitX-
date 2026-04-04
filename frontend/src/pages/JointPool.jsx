import React from 'react';
import PoolFlipCard from '../components/dashboard/PoolFlipCard';

const JointPool = () => {
  // Mock data representing pools the user has already joined
  const joinedPools = [
    { id: 1, totalAmount: 1000, members: 10, status: 'JOINED' },
    { id: 2, totalAmount: 12000, members: 12, status: 'JOINED' },
  ];

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
            <PoolFlipCard key={pool.id} pool={pool} />
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
