'use client';

import { useState } from 'react';

interface MarketCreatorProps {
  onMarketCreated?: (marketId: string) => void;
}

const categories = [
  { value: 'sports', label: 'Sports' },
  { value: 'politics', label: 'Politics' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'technology', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

export default function MarketCreator({ onMarketCreated }: MarketCreatorProps) {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('crypto');
  const [resolutionDate, setResolutionDate] = useState('');
  const [initialLiquidity, setInitialLiquidity] = useState(1000);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [marketId, setMarketId] = useState('');

  const createMarket = async () => {
    if (!question.trim() || !resolutionDate) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/eliza/markets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          category,
          resolutionDate,
          initialLiquidity,
        }),
      });
      const data = await response.json();
      if (data.content?.market?.id) {
        setMarketId(data.content.market.id);
        setCreated(true);
        onMarketCreated?.(data.content.market.id);
      }
    } catch (error) {
      console.error('Error creating market:', error);
    }
    setCreating(false);
  };

  if (created) {
    return (
      <div className="glass-card p-6 rounded-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Market Created!</h2>
          <p className="text-gray-400 mb-4">Your market is now live</p>
          <div className="bg-gray-800 p-3 rounded-lg mb-4">
            <p className="text-xs text-gray-500">Market ID</p>
            <p className="text-white text-sm font-mono">{marketId}</p>
          </div>
          <button
            onClick={() => { setCreated(false); setQuestion(''); }}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-all"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Create Market</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will SOL reach $200 by end of 2024?"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 h-24 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          >
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Resolution Date</label>
          <input
            type="date"
            value={resolutionDate}
            onChange={(e) => setResolutionDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Initial Liquidity (USDC)</label>
          <input
            type="number"
            value={initialLiquidity}
            onChange={(e) => setInitialLiquidity(Number(e.target.value))}
            min={100}
            step={100}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />
        </div>

        <button
          onClick={createMarket}
          disabled={creating || !question.trim() || !resolutionDate}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating...' : 'Create Market'}
        </button>
      </div>
    </div>
  );
}
