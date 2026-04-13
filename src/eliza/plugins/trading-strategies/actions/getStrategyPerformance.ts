import { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { StrategyExecutor } from '../services/StrategyExecutor';

export const getStrategyPerformanceAction: Action = {
    name: 'GET_STRATEGY_PERFORMANCE',
    description: 'Get performance metrics for a strategy',
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
            const performance = executor.getPerformance(options.strategyId || '');

            if (!performance) {
                callback?.({ text: 'No performance data found for this strategy' });
                return false;
            }

            callback?.({
                text: `Strategy Performance:\n\n` +
                    `  - Total Return: ${performance.totalReturn.toFixed(2)}%\n` +
                    `  - Win Rate: ${(performance.winRate * 100).toFixed(1)}%\n` +
                    `  - Max Drawdown: ${performance.maxDrawdown.toFixed(2)}%\n` +
                    `  - Sharpe Ratio: ${performance.sharpeRatio.toFixed(2)}\n` +
                    `  - Trade Count: ${performance.tradeCount}\n` +
                    `  - Average Trade Duration: ${(performance.averageTradeDuration / 3600000).toFixed(1)} hours`,
                content: { performance },
            });

            return true;
        } catch (error) {
            console.error('Error getting performance:', error);
            callback?.({ text: `Error: ${error.message}` });
            return false;
        }
    },
    examples: [[{ user: 'Get performance for strategy xyz', response: 'Here are the metrics!' }]],
};
