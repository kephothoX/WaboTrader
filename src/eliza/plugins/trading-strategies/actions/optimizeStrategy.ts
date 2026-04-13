import { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { BacktestEngine } from '../services/BacktestEngine';
import { StrategyService } from '../services/StrategyService';

export const optimizeStrategyAction: Action = {
    name: 'OPTIMIZE_STRATEGY',
    description: 'Optimize strategy parameters using genetic algorithms',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { strategyId?: string; target?: 'return' | 'winRate' | 'sharpe' | 'drawdown'; period?: number },
        callback: HandlerCallback
    ) => {
        try {
            const strategyService = new StrategyService();
            const backtestEngine = new BacktestEngine();

            const strategy = options.strategyId 
                ? strategyService.getStrategy(options.strategyId)
                : null;

            if (!strategy) {
                callback?.({ text: 'Strategy not found' });
                return false;
            }

            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (options.period || 30) * 24 * 60 * 60 * 1000);

            const optimizedStrategy = await backtestEngine.optimizeStrategy(strategy, startDate, endDate);

            callback?.({
                text: `Strategy optimized successfully!\n\n` +
                    `**Original Parameters:**\n` +
                    Object.entries(strategy.parameters).map(([k, v]) => `  - ${k}: ${v}`).join('\n') +
                    `\n\n**Optimized Parameters:**\n` +
                    Object.entries(optimizedStrategy.parameters).map(([k, v]) => `  - ${k}: ${v}`).join('\n'),
                content: { strategy: optimizedStrategy },
            });

            return true;
        } catch (error) {
            console.error('Error optimizing strategy:', error);
            callback?.({ text: `Error: ${error.message}` });
            return false;
        }
    },
    examples: [[{ user: 'Optimize strategy xyz', response: 'Optimized!' }]],
};
