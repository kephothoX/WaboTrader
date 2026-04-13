import { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { PredictionMarketService } from '../services/PredictionMarketService';
import { MarketCategory } from '../types';

export const createMarketAction: Action = {
    name: 'CREATE_MARKET',
    description: 'Create a new prediction market',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { question?: string; category?: MarketCategory; resolutionDate?: Date; initialLiquidity?: number },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const userId = message.agentId || 'unknown';
            
            const market = service.createMarket(
                options.question || 'Will something happen?',
                options.category || 'other',
                options.resolutionDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                options.initialLiquidity || 1000,
                userId
            );

            callback?.({
                text: `Market created successfully!\n\n**Question:** ${market.question}\n**Category:** ${market.category}\n**Resolution Date:** ${market.resolutionDate.toLocaleDateString()}\n**Market ID:** ${market.id}`,
                content: { market },
            });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};

export const browseMarketsAction: Action = {
    name: 'BROWSE_MARKETS',
    description: 'Browse prediction markets with filters',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { category?: MarketCategory; status?: string; sort?: string },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const markets = service.browseMarkets(
                { category: options.category as MarketCategory, status: options.status as any },
                options.sort as any
            );

            if (markets.length === 0) {
                callback?.({ text: 'No markets found' });
                return true;
            }

            const text = markets.slice(0, 10).map(m => 
                `**${m.question}**\n  Status: ${m.status} | Yes: ${m.yesPool.toFixed(2)} | No: ${m.noPool.toFixed(2)}`
            ).join('\n\n');

            callback?.({ text: `Markets:\n\n${text}`, content: { markets } });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};

export const buySharesAction: Action = {
    name: 'BUY_SHARES',
    description: 'Buy YES or NO shares in a prediction market',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { marketId?: string; shareType?: 'yes' | 'no'; amount?: number },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const userId = message.agentId || 'unknown';
            
            const result = service.buyShares(options.marketId || '', userId, options.shareType || 'yes', options.amount || 100);

            const warning = result.priceImpact > 0.05 ? `\n⚠️ **Warning:** Price impact is ${(result.priceImpact * 100).toFixed(1)}%` : '';
            callback?.({
                text: `Bought ${result.shares.toFixed(2)} shares${warning}`,
                content: result,
            });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};

export const sellSharesAction: Action = {
    name: 'SELL_SHARES',
    description: 'Sell shares in a prediction market',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { marketId?: string; shareType?: 'yes' | 'no'; shares?: number },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const userId = message.agentId || 'unknown';
            
            const result = service.sellShares(options.marketId || '', userId, options.shareType || 'yes', options.shares || 1);

            callback?.({
                text: `Sold shares for ${result.proceeds.toFixed(2)} USDC`,
                content: result,
            });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};

export const resolveMarketAction: Action = {
    name: 'RESOLVE_MARKET',
    description: 'Resolve a prediction market with outcome',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { marketId?: string; outcome?: 'yes' | 'no' },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const market = service.resolveMarket(options.marketId || '', options.outcome || 'yes', 'system');
            
            callback?.({ text: `Market resolved! Outcome: ${market.resolvedOutcome}`, content: { market } });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};

export const claimWinningsAction: Action = {
    name: 'CLAIM_WINNINGS',
    description: 'Claim winnings from a resolved market',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { marketId?: string },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const userId = message.agentId || 'unknown';
            
            const result = service.claimWinnings(options.marketId || '', userId);

            callback?.({ text: `Claimed ${result.amount.toFixed(2)} USDC in winnings!`, content: result });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};

export const provideLiquidityAction: Action = {
    name: 'PROVIDE_LIQUIDITY',
    description: 'Provide liquidity to a prediction market',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { marketId?: string; yesAmount?: number; noAmount?: number },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const userId = message.agentId || 'unknown';
            
            const result = service.provideLiquidity(options.marketId || '', userId, options.yesAmount || 100, options.noAmount || 100);

            callback?.({ text: `Provided liquidity! LP Tokens: ${result.lpTokens.toFixed(2)}`, content: result });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};

export const removeLiquidityAction: Action = {
    name: 'REMOVE_LIQUIDITY',
    description: 'Remove liquidity from a prediction market',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { lpPositionId?: string },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const result = service.removeLiquidity(options.lpPositionId || '');

            callback?.({ text: `Removed liquidity: YES ${result.yesAmount.toFixed(2)}, NO ${result.noAmount.toFixed(2)}`, content: result });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};

export const getMarketAnalyticsAction: Action = {
    name: 'GET_MARKET_ANALYTICS',
    description: 'Get analytics for a prediction market',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { marketId?: string },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const analytics = service.getAnalytics(options.marketId || '');

            if (!analytics) {
                callback?.({ text: 'Market not found' });
                return false;
            }

            callback?.({
                text: `Analytics for market:\n\nYES Price: ${(analytics.yesPrice * 100).toFixed(1)}%\nNO Price: ${(analytics.noPrice * 100).toFixed(1)}%\nImplied Probability: ${analytics.impliedProbability.toFixed(1)}%\nTotal Volume: ${analytics.totalVolume.toFixed(2)}\nUnique Traders: ${analytics.uniqueTraders}`,
                content: analytics,
            });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};

export const postCommentAction: Action = {
    name: 'POST_COMMENT',
    description: 'Post a comment on a prediction market',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        options: { marketId?: string; content?: string; sentiment?: 'bullish' | 'bearish' | 'neutral' },
        callback: HandlerCallback
    ) => {
        try {
            const service = new PredictionMarketService();
            const userId = message.agentId || 'unknown';
            
            const comment = service.postComment(options.marketId || '', userId, options.content || '', options.sentiment || 'neutral');

            callback?.({ text: 'Comment posted!', content: comment });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            callback?.({ text: `Error: ${message}` });
            return false;
        }
    },
    examples: [],
};
