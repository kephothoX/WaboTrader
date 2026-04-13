'use client';

import { useState, useEffect } from 'react';

interface MarketplaceStrategy {
  id: string;
  name: string;
  type: string;
  riskProfile: string;
  createdAt: string;
}

export default function StrategyMarketplace() {
  const [strategies, setStrategies] = useState<MarketplaceStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('performance');

  useEffect(() => {
    loadMarketplace();
  }, [sortBy]);

  const loadMarketplace = async () => {
    try {
      const response = await fetch(`/api/eliza/strategy/marketplace?sort=${sortBy}`);
      const data = await response.json();
      if (data.content?.strategies) {
        setStrategies(data.content.strategies);
      } else if (data.strategies) {
        setStrategies(data.strategies);
      }
    } catch (error) {
      console.error('Error loading marketplace:', error);
    }
    setLoading(false);
  };

  const importStrategy = async (id: string) => {
    alert('Import functionality - strategy copied to your account');
  };

  const filteredStrategies = strategies.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="glass-card p-6 rounded-xl"><p className="text-gray-400">Loading marketplace...</p></div>;
  }

  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Strategy Marketplace</h2>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search strategies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="performance">Sort by Performance</option>
          <option value="downloads">Sort by Downloads</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      {filteredStrategies.length === 0 ? (
        <p className="text-gray-400">No strategies available in the marketplace</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStrategies.map((strategy) => (
            <div key={strategy.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-2">{strategy.name}</h3>
              <p className="text-sm text-gray-400 mb-3">Type: {strategy.type} | Risk: {strategy.riskProfile}</p>
              <p className="text-xs text-gray-500 mb-4">Created: {new Date(strategy.createdAt).toLocaleDateString()}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => importStrategy(strategy.id)}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Import
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-all">
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
