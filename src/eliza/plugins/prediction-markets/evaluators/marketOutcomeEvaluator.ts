import { Evaluator, IAgentRuntime, Memory, State } from '@elizaos/core';
import { PredictionMarketService } from '../services/PredictionMarketService';

export const marketOutcomeEvaluator: Evaluator = {
    name: 'MARKET_OUTCOME_EVALUATOR',
    description: 'Evaluates market outcomes and resolution accuracy',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        const service = new PredictionMarketService();
        const markets = service.browseMarkets({ status: 'resolved' });
        
        const resolvedCount = markets.length;
        const totalVolume = markets.reduce((sum, m) => sum + m.totalVolume, 0);

        return {
            success: true,
            score: resolvedCount > 0 ? totalVolume / resolvedCount : 0,
        };
    },
    examples: [],
};
