'use client';

import { useState, useEffect } from 'react';

interface Strategy {
  id: string;
  name: string;
  type: string;
  riskProfile: string;
  status: 'active' | 'paused' | 'inactive';
  performance?: {
    totalReturn: number;
    winRate: number;
    tradeCount: number;
  };
}

export default function StrategyDashboard() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const response = await fetch('/api/eliza/strategy/manage');
      const data = await response.json();
      if (data.strategies) {
        setStrategies(data.strategies.map((s: any) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          riskProfile: s.riskProfile,
          status: 'inactive',
        })));
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
    }
    setLoading(false);
  };

  const activateStrategy = async (id: string) => {
    try {
      await fetch('/api/eliza/strategy/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', strategyId: id }),
      });
      setStrategies(strategies.map(s => s.id === id ? { ...s, status: 'active' } : s));
    } catch (error) {
      console.error('Error activating strategy:', error);
    }
  };

  const deactivateStrategy = async (id: string) => {
    try {
      await fetch('/api/eliza/strategy/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate', strategyId: id }),
      });
      setStrategies(strategies.map(s => s.id === id ? { ...s, status: 'inactive' } : s));
    } catch (error) {
      console.error('Error deactivating strategy:', error);
    }
  };

  const deleteStrategy = (id: string) => {
    setStrategies(strategies.filter(s => s.id !== id));
  };

  if (loading) {
    return <div className="glass-card p-6 rounded-xl"><p className="text-gray-400">Loading...</p></div>;
  }

  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Strategy Dashboard</h2>

      {strategies.length === 0 ? (
        <p className="text-gray-400">No strategies yet. Generate one to get started!</p>
      ) : (
        <div className="space-y-3">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div>
                <h3 className="font-semibold text-white">{strategy.name}</h3>
                <p className="text-sm text-gray-400">Type: {strategy.type} | Risk: {strategy.riskProfile}</p>
                {strategy.performance && (
                  <p className="text-sm text-gray-400">
                    Return: <span className={strategy.performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {strategy.performance.totalReturn.toFixed(2)}%
                    </span> | 
                    Win Rate: {strategy.performance.winRate.toFixed(1)}%
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  strategy.status === 'active' ? 'bg-green-900 text-green-200' :
                  strategy.status === 'paused' ? 'bg-yellow-900 text-yellow-200' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {strategy.status.toUpperCase()}
                </span>
                
                {strategy.status === 'active' ? (
                  <button
                    onClick={() => deactivateStrategy(strategy.id)}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm transition-all"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => activateStrategy(strategy.id)}
                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-sm transition-all"
                  >
                    Activate
                  </button>
                )}
                
                <button
                  onClick={() => deleteStrategy(strategy.id)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-lg text-sm transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
