import { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { StrategyService } from '../services/StrategyService';

export const publishStrategyAction: Action = {
    name: 'PUBLISH_STRATEGY',
    description: 'Publish a strategy to the marketplace',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { strategyId?: string },
        callback: HandlerCallback
    ) => {
        try {
            const strategyService = new StrategyService();
            const result = strategyService.publishStrategy(options.strategyId || '');

            if (result) {
                callback?.({ text: 'Strategy published to marketplace successfully!' });
            } else {
                callback?.({ text: 'Strategy not found' });
            }
            return result;
        } catch (error) {
            console.error('Error publishing strategy:', error);
            callback?.({ text: `Error: ${error.message}` });
            return false;
        }
    },
    examples: [[{ user: 'Publish strategy xyz', response: 'Published!' }]],
};

export const browseMarketplaceAction: Action = {
    name: 'BROWSE_MARKETPLACE',
    description: 'Browse available strategies in the marketplace',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { filter?: string; sort?: string },
        callback: HandlerCallback
    ) => {
        try {
            const strategyService = new StrategyService();
            const strategies = strategyService.browseMarketplace();

            if (strategies.length === 0) {
                callback?.({ text: 'No strategies available in the marketplace' });
                return true;
            }

            const text = strategies.map(s => 
                `**${s.name}** (${s.type})\n  Risk: ${s.riskProfile}\n  Created: ${s.createdAt.toLocaleDateString()}`
            ).join('\n\n');

            callback?.({ text: `Marketplace Strategies:\n\n${text}`, content: { strategies } });
            return true;
        } catch (error) {
            console.error('Error browsing marketplace:', error);
            callback?.({ text: `Error: ${error.message}` });
            return false;
        }
    },
    examples: [[{ user: 'Browse marketplace', response: 'Here are the strategies!' }]],
};
