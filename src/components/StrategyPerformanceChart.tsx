'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PerformanceData {
  timestamp: string;
  pnl: number;
  type?: 'trade';
}

interface StrategyPerformanceChartProps {
  data: PerformanceData[];
  initialCapital?: number;
}

export default function StrategyPerformanceChart({ data, initialCapital = 10000 }: StrategyPerformanceChartProps) {
  const chartData = data.map((d, i) => ({
    ...d,
    cumulative: i === 0 ? initialCapital + d.pnl : data.slice(0, i + 1).reduce((sum, d) => sum + d.pnl, initialCapital),
  }));

  return (
    <div className="glass-card p-4 rounded-xl">
      <h3 className="text-lg font-semibold text-white mb-4">Performance Chart</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fill: '#9CA3AF', fontSize: 11 }} 
              tickFormatter={(v) => new Date(v).toLocaleDateString()} 
            />
            <YAxis 
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(v) => `$${v.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFF' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'PnL']}
            />
            <ReferenceLine y={initialCapital} stroke="#6B7280" strokeDasharray="5 5" />
            <Line 
              type="monotone" 
              dataKey="cumulative" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={chartData.some(d => d.type === 'trade')}
              activeDot={{ r: 6, fill: '#A78BFA' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-purple-500"></div>
          <span className="text-gray-400">Cumulative PnL</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-gray-400">Trade</span>
        </div>
      </div>
    </div>
  );
}
