import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import { PredictionMarketService } from '../services/PredictionMarketService';

export class MarketSentimentProvider implements Provider {
    private service: PredictionMarketService;

    constructor() {
        this.service = new PredictionMarketService();
    }

    async get(runtime: IAgentRuntime, message: Memory, state: State): Promise<Partial<State>> {
        const marketId = state?.marketId as string;
        if (!marketId) return {};

        try {
            const sentiment = this.service.analyzeSentiment(marketId);
            return { sentiment };
        } catch (error) {
            console.error('Error in marketSentimentProvider:', error);
            return {};
        }
    }
}

export const marketSentimentProvider = {
    name: 'marketSentiment',
    description: 'Provides sentiment analysis context for markets',
    provider: new MarketSentimentProvider(),
};
