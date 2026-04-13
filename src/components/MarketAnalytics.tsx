'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Analytics {
  yesPrice: number;
  noPrice: number;
  impliedProbability: number;
  totalVolume: number;
  uniqueTraders: number;
  liquidityDepth: number;
}

interface MarketAnalyticsProps {
  marketId: string;
}

export default function MarketAnalytics({ marketId }: MarketAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (marketId) loadAnalytics();
  }, [marketId]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/eliza/markets/analytics?marketId=${marketId}&type=analytics`);
      const data = await response.json();
      if (data.content) {
        setAnalytics(data.content);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  if (loading) return <div className="glass-card p-6 rounded-xl"><p className="text-gray-400">Loading analytics...</p></div>;
  if (!analytics) return <div className="glass-card p-6 rounded-xl"><p className="text-gray-400">No analytics available</p></div>;

  const volumeData = [
    { name: 'Day 1', volume: analytics.totalVolume * 0.1 },
    { name: 'Day 2', volume: analytics.totalVolume * 0.15 },
    { name: 'Day 3', volume: analytics.totalVolume * 0.2 },
    { name: 'Day 4', volume: analytics.totalVolume * 0.25 },
    { name: 'Day 5', volume: analytics.totalVolume * 0.3 },
  ];

  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Market Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400">YES Price</p>
          <p className="text-lg font-bold text-green-400">{(analytics.yesPrice * 100).toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400">NO Price</p>
          <p className="text-lg font-bold text-red-400">{(analytics.noPrice * 100).toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400">Implied Probability</p>
          <p className="text-lg font-bold text-white">{analytics.impliedProbability.toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400">Unique Traders</p>
          <p className="text-lg font-bold text-white">{analytics.uniqueTraders}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Volume History</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="volume" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-4 bg-gray-800/50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Total Volume</p>
            <p className="text-xl font-bold text-white">${analytics.totalVolume.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Liquidity Depth</p>
            <p className="text-xl font-bold text-white">${analytics.liquidityDepth.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
