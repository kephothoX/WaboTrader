'use client';

import { useState, useEffect } from 'react';

interface Market {
  id: string;
  question: string;
  category: string;
  status: string;
  yesPool: number;
  noPool: number;
  totalVolume: number;
  resolutionDate: string;
}

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'sports', label: 'Sports' },
  { value: 'politics', label: 'Politics' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'technology', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'entertainment', label: 'Entertainment' },
];

const sortOptions = [
  { value: 'trending', label: 'Trending' },
  { value: 'volume', label: 'Volume' },
  { value: 'liquidity', label: 'Liquidity' },
];

export default function MarketDiscovery() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('trending');

  useEffect(() => {
    loadMarkets();
  }, [category, sortBy]);

  const loadMarkets = async () => {
    try {
      const params = new URLSearchParams({ sort: sortBy });
      if (category) params.append('category', category);
      const response = await fetch(`/api/eliza/markets/create?${params}`);
      const data = await response.json();
      if (data.content?.markets) {
        setMarkets(data.content.markets);
      } else if (data.markets) {
        setMarkets(data.markets);
      }
    } catch (error) {
      console.error('Error loading markets:', error);
    }
    setLoading(false);
  };

  const calculateYesPrice = (market: Market) => {
    const total = market.yesPool + market.noPool;
    return total > 0 ? (market.yesPool / total) * 100 : 50;
  };

  const filteredMarkets = markets.filter(m => 
    m.question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Market Discovery</h2>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          {sortOptions.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading markets...</p>
      ) : filteredMarkets.length === 0 ? (
        <p className="text-gray-400">No markets found</p>
      ) : (
        <div className="space-y-3">
          {filteredMarkets.map((market) => {
            const yesPrice = calculateYesPrice(market);
            return (
              <div key={market.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white flex-1">{market.question}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ml-2 ${
                    market.status === 'open' ? 'bg-green-900 text-green-200' :
                    market.status === 'resolved' ? 'bg-blue-900 text-blue-200' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {market.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-400 mb-2">
                  <span>Category: {market.category}</span>
                  <span>Volume: ${market.totalVolume.toFixed(0)}</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <span className="text-xs text-gray-500">YES</span>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${yesPrice}%` }}></div>
                    </div>
                    <span className="text-sm text-green-400">{yesPrice.toFixed(1)}%</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500">NO</span>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${100 - yesPrice}%` }}></div>
                    </div>
                    <span className="text-sm text-red-400">{(100 - yesPrice).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
