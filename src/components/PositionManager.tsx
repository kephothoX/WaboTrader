'use client';

import { useState, useEffect } from 'react';

interface Position {
  id: string;
  marketId: string;
  shareType: 'yes' | 'no';
  amount: number;
  avgPrice: number;
  currentValue: number;
  unrealizedPnL: number;
}

interface Market {
  id: string;
  question: string;
}

export default function PositionManager() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [markets, setMarkets] = useState<Map<string, Market>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const response = await fetch('/api/eliza/markets/trade');
      const data = await response.json();
      if (data.positions) {
        setPositions(data.positions);
        
        const marketsResponse = await fetch('/api/eliza/markets/create?status=open');
        const marketsData = await marketsResponse.json();
        const marketsList = marketsData.content?.markets || marketsData.markets || [];
        const marketsMap = new Map<string, Market>();
        marketsList.forEach((m: Market) => marketsMap.set(m.id, m));
        setMarkets(marketsMap);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }
    setLoading(false);
  };

  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);

  const sellPosition = async (positionId: string, percent: number) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    const sharesToSell = position.amount * (percent / 100);
    try {
      await fetch('/api/eliza/markets/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sell',
          marketId: position.marketId,
          shareType: position.shareType,
          shares: sharesToSell,
        }),
      });
      loadPositions();
    } catch (error) {
      console.error('Error selling position:', error);
    }
  };

  if (loading) return <div className="glass-card p-6 rounded-xl"><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Position Manager</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-400">Total Portfolio Value</p>
          <p className="text-2xl font-bold text-white">${totalValue.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-400">Unrealized PnL</p>
          <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${totalPnL.toFixed(2)}
          </p>
        </div>
      </div>

      {positions.length === 0 ? (
        <p className="text-gray-400">No open positions</p>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => {
            const market = markets.get(position.marketId);
            return (
              <div key={position.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{market?.question || 'Unknown Market'}</h3>
                    <p className="text-sm text-gray-400">
                      {position.amount.toFixed(4)} {position.shareType.toUpperCase()} @ ${position.avgPrice.toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">${position.currentValue.toFixed(2)}</p>
                    <p className={`text-sm ${position.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => sellPosition(position.id, 25)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Sell 25%
                  </button>
                  <button
                    onClick={() => sellPosition(position.id, 50)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Sell 50%
                  </button>
                  <button
                    onClick={() => sellPosition(position.id, 100)}
                    className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Sell All
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
