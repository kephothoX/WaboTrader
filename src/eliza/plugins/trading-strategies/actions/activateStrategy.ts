import { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { StrategyService } from '../services/StrategyService';
import { StrategyExecutor } from '../services/StrategyExecutor';
import { StrategyConfig } from '../types';

export const activateStrategyAction: Action = {
    name: 'ACTIVATE_STRATEGY',
    description: 'Activate a trading strategy for real-time execution',
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
            const executor = new StrategyExecutor();

            const strategy = options.strategyId 
                ? strategyService.getStrategy(options.strategyId)
                : null;

            if (!strategy) {
                callback?.({ text: 'Strategy not found' });
                return false;
            }

            const result = await executor.activateStrategy(strategy);
            callback?.({ text: result.message, content: result });
            return result.success;
        } catch (error) {
            console.error('Error activating strategy:', error);
            callback?.({ text: `Error: ${error.message}` });
            return false;
        }
    },
    examples: [[{ user: 'Activate strategy xyz', response: 'Activated!' }]],
};

export const deactivateStrategyAction: Action = {
    name: 'DEACTIVATE_STRATEGY',
    description: 'Deactivate a trading strategy',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { strategyId?: string },
        callback: HandlerCallback
    ) => {
        try {
            const executor = new StrategyExecutor();
            const result = await executor.deactivateStrategy(options.strategyId || '');
            callback?.({ text: result.message, content: result });
            return result.success;
        } catch (error) {
            console.error('Error deactivating strategy:', error);
            callback?.({ text: `Error: ${error.message}` });
            return false;
        }
    },
    examples: [[{ user: 'Deactivate strategy xyz', response: 'Deactivated!' }]],
};
