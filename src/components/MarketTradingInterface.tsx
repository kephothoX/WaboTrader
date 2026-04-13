'use client';

import { useState, useEffect } from 'react';

interface Market {
  id: string;
  question: string;
  yesPool: number;
  noPool: number;
  status: string;
}

interface Position {
  id: string;
  shareType: 'yes' | 'no';
  amount: number;
  avgPrice: number;
  currentValue: number;
  unrealizedPnL: number;
}

interface MarketTradingInterfaceProps {
  marketId: string;
}

export default function MarketTradingInterface({ marketId }: MarketTradingInterfaceProps) {
  const [market, setMarket] = useState<Market | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [shareType, setShareType] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState(100);
  const [trading, setTrading] = useState(false);
  const [warning, setWarning] = useState('');

  useEffect(() => {
    if (marketId) loadMarket();
  }, [marketId]);

  const loadMarket = async () => {
    try {
      const response = await fetch(`/api/eliza/markets/create?status=open`);
      const data = await response.json();
      const markets = data.content?.markets || data.markets || [];
      const m = markets.find((x: Market) => x.id === marketId);
      if (m) setMarket(m);
      
      const posResponse = await fetch(`/api/eliza/markets/trade?marketId=${marketId}`);
      const posData = await posResponse.json();
      if (posData.position) setPositions([posData.position]);
    } catch (error) {
      console.error('Error loading market:', error);
    }
    setLoading(false);
  };

  const calculatePrice = () => {
    if (!market) return 50;
    const total = market.yesPool + market.noPool;
    return total > 0 ? (shareType === 'yes' ? market.yesPool / total : market.noPool / total) * 100 : 50;
  };

  const price = calculatePrice();
  const shares = amount / (price / 100);
  const priceImpact = Math.abs(price - 50) / 50 * 100;

  useEffect(() => {
    setWarning(priceImpact > 5 ? `⚠️ High price impact: ${priceImpact.toFixed(1)}%` : '');
  }, [priceImpact]);

  const executeTrade = async () => {
    setTrading(true);
    try {
      await fetch('/api/eliza/markets/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: tradeType,
          marketId,
          shareType,
          amount: tradeType === 'buy' ? amount : undefined,
          shares: tradeType === 'sell' ? shares : undefined,
        }),
      });
      loadMarket();
    } catch (error) {
      console.error('Error executing trade:', error);
    }
    setTrading(false);
  };

  if (loading) return <div className="glass-card p-6 rounded-xl"><p className="text-gray-400">Loading...</p></div>;
  if (!market) return <div className="glass-card p-6 rounded-xl"><p className="text-gray-400">Market not found</p></div>;

  const userPosition = positions.find(p => p.shareType === shareType);

  return (
    <div className="glass-card p-6 rounded-xl">
      <h3 className="text-lg font-bold text-white mb-2">{market.question}</h3>
      <p className="text-sm text-gray-400 mb-4">Status: {market.status}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-green-900/30 rounded-lg">
          <p className="text-xs text-gray-400">YES Price</p>
          <p className="text-xl font-bold text-green-400">{price.toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-red-900/30 rounded-lg">
          <p className="text-xs text-gray-400">NO Price</p>
          <p className="text-xl font-bold text-red-400">{(100 - price).toFixed(1)}%</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTradeType('buy')}
          className={`flex-1 py-2 rounded-lg font-semibold ${tradeType === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          BUY
        </button>
        <button
          onClick={() => setTradeType('sell')}
          className={`flex-1 py-2 rounded-lg font-semibold ${tradeType === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          SELL
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShareType('yes')}
          className={`flex-1 py-2 rounded-lg font-semibold ${shareType === 'yes' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          YES
        </button>
        <button
          onClick={() => setShareType('no')}
          className={`flex-1 py-2 rounded-lg font-semibold ${shareType === 'no' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          NO
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          {tradeType === 'buy' ? 'Amount (USDC)' : 'Shares'}
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
      </div>

      {warning && (
        <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-sm">
          {warning}
        </div>
      )}

      <div className="p-3 bg-gray-800/50 rounded-lg mb-4 text-sm">
        <p className="text-gray-400">You will receive: <span className="text-white">{shares.toFixed(4)} shares</span></p>
      </div>

      {userPosition && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-400">Your Position:</p>
          <p className="text-white">{userPosition.amount.toFixed(4)} {userPosition.shareType.toUpperCase()} @ ${userPosition.avgPrice.toFixed(4)}</p>
          <p className={`text-sm ${userPosition.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            PnL: ${userPosition.unrealizedPnL.toFixed(2)}
          </p>
        </div>
      )}

      <button
        onClick={executeTrade}
        disabled={trading}
        className={`w-full py-3 rounded-lg font-semibold transition-all ${
          tradeType === 'buy' 
            ? 'bg-green-600 hover:bg-green-500 text-white' 
            : 'bg-red-600 hover:bg-red-500 text-white'
        }`}
      >
        {trading ? 'Processing...' : `${tradeType.toUpperCase()} ${shareType.toUpperCase()}`}
      </button>
    </div>
  );
}
