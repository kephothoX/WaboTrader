import { Evaluator, IAgentRuntime, Memory, State } from '@elizaos/core';
import { StrategyExecutor } from '../services/StrategyExecutor';

export const strategyEvaluator: Evaluator = {
    name: 'STRATEGY_EVALUATOR',
    description: 'Evaluates strategy outcomes and performance',
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        const executor = new StrategyExecutor();
        const trades = executor.getExecutedTrades();

        if (trades.length === 0) {
            return { success: true, score: 0 };
        }

        const completedTrades = trades.filter(t => t.status === 'completed');
        const winningTrades = completedTrades.filter(t => (t.pnl || 0) > 0);
        const winRate = completedTrades.length > 0 ? winningTrades.length / completedTrades.length : 0;

        return {
            success: winRate > 0.5,
            score: winRate,
        };
    },
    examples: [],
};
