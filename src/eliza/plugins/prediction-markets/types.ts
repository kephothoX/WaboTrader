// Prediction Markets Plugin Types

export interface PredictionMarket {
    id: string;
    question: string;
    category: MarketCategory;
    status: MarketStatus;
    resolutionDate: Date;
    createdAt: Date;
    yesPool: number;
    noPool: number;
    totalVolume: number;
    resolvedOutcome?: 'yes' | 'no';
    creator: string;
}

export interface MarketPosition {
    id: string;
    marketId: string;
    userId: string;
    shareType: 'yes' | 'no';
    amount: number;
    avgPrice: number;
    currentValue: number;
    unrealizedPnL: number;
    createdAt: Date;
}

export interface MarketTrade {
    id: string;
    marketId: string;
    userId: string;
    shareType: 'yes' | 'no';
    amount: number;
    price: number;
    timestamp: Date;
    type: 'buy' | 'sell';
}

export interface MarketComment {
    id: string;
    marketId: string;
    userId: string;
    content: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    timestamp: Date;
}

export interface MarketAnalytics {
    marketId: string;
    yesPrice: number;
    noPrice: number;
    impliedProbability: number;
    volumeHistory: { date: Date; volume: number }[];
    priceHistory: { date: Date; yesPrice: number; noPrice: number }[];
    uniqueTraders: number;
    totalVolume: number;
    liquidityDepth: number;
}

export interface LiquidityPosition {
    id: string;
    marketId: string;
    userId: string;
    lpTokens: number;
    yesAmount: number;
    noAmount: number;
    shareOfPool: number;
    feesEarned: number;
    createdAt: Date;
}

export type MarketCategory = 'sports' | 'politics' | 'crypto' | 'technology' | 'science' | 'entertainment' | 'other';

export type MarketStatus = 'open' | 'resolved' | 'cancelled' | 'disputed';
