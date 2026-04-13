import { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { BacktestEngine } from '../services/BacktestEngine';
import { StrategyService } from '../services/StrategyService';

export const backtestStrategyAction: Action = {
    name: 'BACKTEST_STRATEGY',
    description: 'Run a backtest on a strategy using historical data',
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { strategyId?: string; period?: number; token?: string },
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

            const result = await backtestEngine.runBacktest(strategy, startDate, endDate);

            callback?.({
                text: `Backtest completed for ${strategy.name}\n\n` +
                    `**Period:** ${result.period.start.toLocaleDateString()} - ${result.period.end.toLocaleDateString()}\n` +
                    `**Token:** ${result.token}\n\n` +
                    `**Performance Metrics:**\n` +
                    `  - Total Return: ${result.performance.totalReturn.toFixed(2)}%\n` +
                    `  - Win Rate: ${(result.performance.winRate * 100).toFixed(1)}%\n` +
                    `  - Max Drawdown: ${result.performance.maxDrawdown.toFixed(2)}%\n` +
                    `  - Sharpe Ratio: ${result.performance.sharpeRatio.toFixed(2)}\n` +
                    `  - Trade Count: ${result.performance.tradeCount}\n` +
                    `  - Profit Factor: ${result.performance.profitFactor.toFixed(2)}`,
                content: {
                    backtest: result,
                },
            });

            return true;
        } catch (error) {
            console.error('Error running backtest:', error);
            callback?.({
                text: `Error running backtest: ${error.message}`,
            });
            return false;
        }
    },
    examples: [
        {
            user: 'Backtest strategy xyz for 30 days',
            response: 'Backtest completed!',
        },
    ],
};
