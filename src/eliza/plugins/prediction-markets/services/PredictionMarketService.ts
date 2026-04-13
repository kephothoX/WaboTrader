import { PredictionMarket, MarketPosition, MarketTrade, MarketComment, MarketAnalytics, LiquidityPosition, MarketCategory, MarketStatus } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class PredictionMarketService {
    private markets: Map<string, PredictionMarket> = new Map();
    private positions: Map<string, MarketPosition> = new Map();
    private trades: Map<string, MarketTrade> = new Map();
    private comments: Map<string, MarketComment> = new Map();
    private liquidityPositions: Map<string, LiquidityPosition> = new Map();

    private marketsFilePath: string;
    private positionsFilePath: string;
    private commentsFilePath: string;
    private liquidityFilePath: string;

    private simulationMode = false;

    constructor() {
        this.marketsFilePath = path.join(process.cwd(), 'data', 'prediction-markets', 'markets.json');
        this.positionsFilePath = path.join(process.cwd(), 'data', 'prediction-markets', 'positions.json');
        this.commentsFilePath = path.join(process.cwd(), 'data', 'prediction-markets', 'comments.json');
        this.liquidityFilePath = path.join(process.cwd(), 'data', 'prediction-markets', 'liquidity.json');
        this.ensureDirectories();
        this.loadData();
    }

    private ensureDirectories(): void {
        const dirs = [
            path.dirname(this.marketsFilePath),
            path.dirname(this.positionsFilePath),
            path.dirname(this.commentsFilePath),
            path.dirname(this.liquidityFilePath),
        ];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    private loadData(): void {
        try {
            if (fs.existsSync(this.marketsFilePath)) {
                const data = JSON.parse(fs.readFileSync(this.marketsFilePath, 'utf-8'));
                this.markets = new Map(data.map((m: any) => [
                    m.id,
                    { ...m, resolutionDate: new Date(m.resolutionDate), createdAt: new Date(m.createdAt) }
                ]));
            }
        } catch (e) {
            console.error('Error loading markets:', e);
        }
    }

    private saveMarkets(): void {
        try {
            fs.writeFileSync(this.marketsFilePath, JSON.stringify(Array.from(this.markets.values()), null, 2));
        } catch (e) {
            console.error('Error saving markets:', e);
        }
    }

    createMarket(question: string, category: MarketCategory, resolutionDate: Date, initialLiquidity: number, creator: string): PredictionMarket {
        const market: PredictionMarket = {
            id: `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            question,
            category,
            status: 'open',
            resolutionDate,
            createdAt: new Date(),
            yesPool: initialLiquidity,
            noPool: initialLiquidity,
            totalVolume: 0,
            creator,
        };
        
        this.markets.set(market.id, market);
        this.saveMarkets();
        
        return market;
    }

    browseMarkets(filter?: { category?: MarketCategory; status?: MarketStatus }, sort?: 'liquidity' | 'volume' | 'trending'): PredictionMarket[] {
        let result = Array.from(this.markets.values());
        
        if (filter?.category) {
            result = result.filter(m => m.category === filter.category);
        }
        if (filter?.status) {
            result = result.filter(m => m.status === filter.status);
        }
        
        switch (sort) {
            case 'liquidity':
                result.sort((a, b) => (a.yesPool + a.noPool) - (b.yesPool + b.noPool));
                break;
            case 'volume':
                result.sort((a, b) => b.totalVolume - a.totalVolume);
                break;
            case 'trending':
                result.sort((a, b) => b.totalVolume - a.totalVolume);
                break;
        }
        
        return result;
    }

    getMarket(marketId: string): PredictionMarket | undefined {
        return this.markets.get(marketId);
    }

    searchMarkets(keyword: string): PredictionMarket[] {
        const lower = keyword.toLowerCase();
        return Array.from(this.markets.values()).filter(m => 
            m.question.toLowerCase().includes(lower)
        );
    }

    private calculatePrice(market: PredictionMarket, shareType: 'yes' | 'no'): number {
        const total = market.yesPool + market.noPool;
        if (total === 0) return 0.5;
        return shareType === 'yes' ? market.yesPool / total : market.noPool / total;
    }

    private calculatePriceImpact(market: PredictionMarket, shareType: 'yes' | 'no', amount: number): number {
        const currentPrice = this.calculatePrice(market, shareType);
        const newPool = shareType === 'yes' ? market.yesPool + amount : market.noPool + amount;
        const otherPool = shareType === 'yes' ? market.noPool : market.yesPool;
        const newPrice = newPool / (newPool + otherPool);
        return Math.abs(newPrice - currentPrice) / currentPrice;
    }

    buyShares(marketId: string, userId: string, shareType: 'yes' | 'no', amount: number): { shares: number; priceImpact: number; blinkUrl?: string } {
        const market = this.markets.get(marketId);
        if (!market || market.status !== 'open') {
            throw new Error('Market not found or not open');
        }

        const currentPrice = this.calculatePrice(market, shareType);
        const shares = amount / currentPrice;
        const priceImpact = this.calculatePriceImpact(market, shareType, amount);

        const trade: MarketTrade = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            marketId,
            userId,
            shareType,
            amount: shares,
            price: currentPrice,
            timestamp: new Date(),
            type: 'buy',
        };
        this.trades.set(trade.id, trade);

        if (shareType === 'yes') {
            market.yesPool += amount;
        } else {
            market.noPool += amount;
        }
        market.totalVolume += amount;
        this.saveMarkets();

        const positionKey = `${marketId}_${userId}_${shareType}`;
        const existing = this.positions.get(positionKey);
        if (existing) {
            existing.amount += shares;
            existing.avgPrice = (existing.avgPrice * existing.amount + currentPrice * shares) / (existing.amount + shares);
            existing.currentValue = existing.amount * this.calculatePrice(market, shareType);
        } else {
            const position: MarketPosition = {
                id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                marketId,
                userId,
                shareType,
                amount: shares,
                avgPrice: currentPrice,
                currentValue: amount,
                unrealizedPnL: 0,
                createdAt: new Date(),
            };
            this.positions.set(positionKey, position);
        }

        this.savePositions();
        
        return { shares, priceImpact };
    }

    sellShares(marketId: string, userId: string, shareType: 'yes' | 'no', shares: number): { proceeds: number; priceImpact: number } {
        const market = this.markets.get(marketId);
        if (!market) {
            throw new Error('Market not found');
        }

        const positionKey = `${marketId}_${userId}_${shareType}`;
        const position = this.positions.get(positionKey);
        if (!position || position.amount < shares) {
            throw new Error('Insufficient shares');
        }

        const currentPrice = this.calculatePrice(market, shareType);
        const proceeds = shares * currentPrice;
        const priceImpact = this.calculatePriceImpact(market, shareType, proceeds);

        const trade: MarketTrade = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            marketId,
            userId,
            shareType,
            amount: shares,
            price: currentPrice,
            timestamp: new Date(),
            type: 'sell',
        };
        this.trades.set(trade.id, trade);

        if (shareType === 'yes') {
            market.yesPool -= proceeds;
        } else {
            market.noPool -= proceeds;
        }
        market.totalVolume += proceeds;
        this.saveMarkets();

        position.amount -= shares;
        if (position.amount === 0) {
            this.positions.delete(positionKey);
        }
        this.savePositions();

        return { proceeds, priceImpact };
    }

    getPositions(userId: string): MarketPosition[] {
        return Array.from(this.positions.values()).filter(p => p.userId === userId);
    }

    getPosition(marketId: string, userId: string): MarketPosition | undefined {
        return Array.from(this.positions.values()).find(p => p.marketId === marketId && p.userId === userId);
    }

    recordTrade(trade: MarketTrade): void {
        this.trades.set(trade.id, trade);
    }

    resolveMarket(marketId: string, outcome: 'yes' | 'no', resolver: string): PredictionMarket {
        const market = this.markets.get(marketId);
        if (!market) {
            throw new Error('Market not found');
        }
        if (market.status !== 'open') {
            throw new Error('Market already resolved');
        }

        market.status = 'resolved';
        market.resolvedOutcome = outcome;
        this.saveMarkets();

        this.settlePositions(marketId, outcome);
        
        return market;
    }

    private settlePositions(marketId: string, outcome: 'yes' | 'no'): void {
        const market = this.markets.get(marketId);
        if (!market) return;

        for (const [key, position] of this.positions.entries()) {
            if (position.marketId !== marketId) continue;
            
            const won = position.shareType === outcome;
            const settlementPrice = outcome === 'yes' ? 1 : 1;
            position.currentValue = position.amount * settlementPrice;
            position.unrealizedPnL = won 
                ? position.amount * (settlementPrice - position.avgPrice)
                : -position.amount * position.avgPrice;
        }
        this.savePositions();
    }

    claimWinnings(marketId: string, userId: string): { amount: number } {
        const position = Array.from(this.positions.values()).find(p => p.marketId === marketId && p.userId === userId);
        if (!position || position.unrealizedPnL <= 0) {
            throw new Error('No winnings to claim');
        }

        const amount = position.unrealizedPnL;
        position.unrealizedPnL = 0;
        this.savePositions();

        return { amount };
    }

    provideLiquidity(marketId: string, userId: string, yesAmount: number, noAmount: number): { lpTokens: number; blinkUrl?: string } {
        const market = this.markets.get(marketId);
        if (!market) {
            throw new Error('Market not found');
        }

        const totalValue = yesAmount + noAmount;
        const totalPool = market.yesPool + market.noPool;
        const lpTokens = totalValue > 0 ? (totalValue / totalPool) * 1000 : 1000;

        const position: LiquidityPosition = {
            id: `lp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            marketId,
            userId,
            lpTokens,
            yesAmount,
            noAmount,
            shareOfPool: lpTokens / 1000,
            feesEarned: 0,
            createdAt: new Date(),
        };
        this.liquidityPositions.set(position.id, position);

        market.yesPool += yesAmount;
        market.noPool += noAmount;
        this.saveMarkets();
        this.saveLiquidity();

        return { lpTokens };
    }

    removeLiquidity(lpPositionId: string): { yesAmount: number; noAmount: number } {
        const position = this.liquidityPositions.get(lpPositionId);
        if (!position) {
            throw new Error('Liquidity position not found');
        }

        const market = this.markets.get(position.marketId);
        if (!market) {
            throw new Error('Market not found');
        }

        const yesAmount = position.yesAmount * (1 - 0.01);
        const noAmount = position.noAmount * (1 - 0.01);

        market.yesPool -= yesAmount;
        market.noPool -= noAmount;
        this.saveMarkets();

        this.liquidityPositions.delete(lpPositionId);
        this.saveLiquidity();

        return { yesAmount, noAmount };
    }

    getAnalytics(marketId: string): MarketAnalytics | null {
        const market = this.markets.get(marketId);
        if (!market) return null;

        const yesPrice = this.calculatePrice(market, 'yes');
        const noPrice = this.calculatePrice(market, 'no');
        const trades = Array.from(this.trades.values()).filter(t => t.marketId === marketId);
        const uniqueUsers = new Set(trades.map(t => t.userId));

        return {
            marketId,
            yesPrice,
            noPrice,
            impliedProbability: yesPrice * 100,
            volumeHistory: [],
            priceHistory: [],
            uniqueTraders: uniqueUsers.size,
            totalVolume: market.totalVolume,
            liquidityDepth: market.yesPool + market.noPool,
        };
    }

    postComment(marketId: string, userId: string, content: string, sentiment: 'bullish' | 'bearish' | 'neutral'): MarketComment {
        if (content.length > 500) {
            throw new Error('Comment must be 500 characters or less');
        }

        const comment: MarketComment = {
            id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            marketId,
            userId,
            content,
            sentiment,
            timestamp: new Date(),
        };
        this.comments.set(comment.id, comment);
        this.saveComments();

        return comment;
    }

    getComments(marketId: string): MarketComment[] {
        return Array.from(this.comments.values())
            .filter(c => c.marketId === marketId)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    analyzeSentiment(marketId: string): { score: number; bullish: number; bearish: number; neutral: number } {
        const comments = this.getComments(marketId);
        const scores = { bullish: 0, bearish: 0, neutral: 0 };
        
        comments.forEach(c => scores[c.sentiment]++);
        
        const total = comments.length || 1;
        const score = (scores.bullish - scores.bearish) / total;
        
        return {
            score,
            bullish: scores.bullish,
            bearish: scores.bearish,
            neutral: scores.neutral,
        };
    }

    setSimulationMode(enabled: boolean): void {
        this.simulationMode = enabled;
    }

    isSimulationMode(): boolean {
        return this.simulationMode;
    }

    private savePositions(): void {
        try {
            fs.writeFileSync(this.positionsFilePath, JSON.stringify(Array.from(this.positions.values()), null, 2));
        } catch (e) {
            console.error('Error saving positions:', e);
        }
    }

    private saveComments(): void {
        try {
            fs.writeFileSync(this.commentsFilePath, JSON.stringify(Array.from(this.comments.values()), null, 2));
        } catch (e) {
            console.error('Error saving comments:', e);
        }
    }

    private saveLiquidity(): void {
        try {
            fs.writeFileSync(this.liquidityFilePath, JSON.stringify(Array.from(this.liquidityPositions.values()), null, 2));
        } catch (e) {
            console.error('Error saving liquidity:', e);
        }
    }
}
