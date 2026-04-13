'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BacktestResult {
  strategyId: string;
  period: { start: string; end: string };
  token: string;
  performance: {
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    tradeCount: number;
    profitFactor: number;
  };
  trades: { id: string; timestamp: string; type: string; token: string; amount: number; price: number; status: string }[];
  chartData: { timestamp: string; value: number; type: string }[];
}

interface BacktestResultsProps {
  strategyId?: string;
  period?: number;
  token?: string;
}

export default function BacktestResults({ strategyId = '', period = 30, token = 'SOL' }: BacktestResultsProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string>('');

  const runBacktest = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/eliza/strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'backtest',
          strategyId,
          period,
          token,
        }),
      });
      const data = await response.json();
      if (data.content?.backtest) {
        setResult(data.content.backtest);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const exportResults = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest-${result.strategyId}-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Backtest Results</h2>
        <div className="flex gap-2">
          <button
            onClick={runBacktest}
            disabled={loading || !strategyId}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all text-sm"
          >
            {loading ? 'Running...' : 'Run Backtest'}
          </button>
          {result && (
            <button
              onClick={exportResults}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all text-sm"
            >
              Export
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Total Return</p>
              <p className={`text-lg font-bold ${result.performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.performance.totalReturn.toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Win Rate</p>
              <p className="text-lg font-bold text-white">{(result.performance.winRate * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Max Drawdown</p>
              <p className="text-lg font-bold text-red-400">{result.performance.maxDrawdown.toFixed(2)}%</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Sharpe Ratio</p>
              <p className="text-lg font-bold text-white">{result.performance.sharpeRatio.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Trade Count</p>
              <p className="text-lg font-bold text-white">{result.performance.tradeCount}</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Profit Factor</p>
              <p className="text-lg font-bold text-white">{result.performance.profitFactor.toFixed(2)}</p>
            </div>
          </div>

          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.chartData.filter((d) => d.type === 'price')}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#FFF' }} />
                <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Trade History</h3>
            <div className="max-h-64 overflow-y-auto">
              {result.trades.slice(0, 20).map((trade) => (
                <div key={trade.id} className="flex justify-between items-center p-2 bg-gray-800/30 rounded-lg text-sm">
                  <span className="text-gray-400">{new Date(trade.timestamp).toLocaleString()}</span>
                  <span className={`font-semibold ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.type.toUpperCase()}
                  </span>
                  <span className="text-white">{trade.amount.toFixed(4)} @ ${trade.price.toFixed(4)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${trade.status === 'completed' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'}`}>
                    {trade.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
