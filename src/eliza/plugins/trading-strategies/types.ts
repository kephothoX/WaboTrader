// Trading Strategies Plugin Types

export interface StrategyConfig {
    id: string;
    name: string;
    type: StrategyType;
    parameters: StrategyParameters;
    conditions: Condition[];
    positionSizing: PositionSizingRule;
    riskProfile: RiskProfile;
    createdAt: Date;
    updatedAt: Date;
}

export interface StrategyParameters {
    timeframe: Timeframe;
    token: string;
    entryAmount: number;
    maxTrades?: number;
    stopLoss?: number;
    takeProfit?: number;
    // Additional parameters based on strategy type
    [key: string]: any;
}

export interface Condition {
    type: 'entry' | 'exit';
    indicator: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number;
    timeframe?: Timeframe;
}

export interface PositionSizingRule {
    type: 'fixed' | 'percentage' | 'kelly' | 'risk-based';
    value: number; // Amount, percentage, or multiplier
}

export interface BacktestResult {
    strategyId: string;
    period: {
        start: Date;
        end: Date;
    };
    token: string;
    performance: StrategyPerformance;
    trades: ExecutedTrade[];
    chartData: ChartDataPoint[];
}

export interface StrategyPerformance {
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    tradeCount: number;
    averageTradeDuration: number;
    profitFactor: number;
}

export interface ExecutedTrade {
    id: string;
    timestamp: Date;
    type: 'buy' | 'sell';
    token: string;
    amount: number;
    price: number;
    status: 'pending' | 'completed' | 'failed';
    strategyId: string;
    pnl?: number;
}

export interface OptimizationResult {
    strategyId: string;
    target: 'return' | 'winRate' | 'sharpe' | 'drawdown';
    bestParameters: StrategyParameters;
    topCombinations: StrategyParameters[];
    executionTime: number;
}

export interface ChartDataPoint {
    timestamp: Date;
    value: number;
    type: 'price' | 'pnl' | 'equity';
}

export type StrategyType = 'momentum' | 'mean-reversion' | 'arbitrage' | 'grid' | 'dca';

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export type Timeframe = '1h' | '4h' | '1d';