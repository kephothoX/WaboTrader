import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import { PredictionMarketService } from '../services/PredictionMarketService';

export class PredictionMarketProvider implements Provider {
    private service: PredictionMarketService;

    constructor() {
        this.service = new PredictionMarketService();
    }

    async get(runtime: IAgentRuntime, message: Memory, state: State): Promise<Partial<State>> {
        try {
            const markets = this.service.browseMarkets();
            return {
                markets: markets.map(m => ({
                    id: m.id,
                    question: m.question,
                    category: m.category,
                    status: m.status,
                    yesPool: m.yesPool,
                    noPool: m.noPool,
                })),
            };
        } catch (error) {
            console.error('Error in predictionMarketProvider:', error);
            return {};
        }
    }
}

export const predictionMarketProvider = {
    name: 'predictionMarket',
    description: 'Provides context about active markets and user positions',
    provider: new PredictionMarketProvider(),
};
