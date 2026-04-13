import { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { StrategyService } from '../services/StrategyService';
import { StrategyType, RiskProfile } from '../types';

export const generateStrategyAction: Action = {
    name: 'GENERATE_STRATEGY',
    description: 'Generate a trading strategy with AI-powered parameters based on market conditions and risk profile',
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { type?: StrategyType; riskProfile?: RiskProfile; token?: string },
        callback: HandlerCallback
    ) => {
        try {
            const strategyService = new StrategyService();
            
            const type = options.type || 'momentum';
            const riskProfile = options.riskProfile || 'moderate';
            const token = options.token || 'SOL';

            const strategy = strategyService.generateStrategy(type, riskProfile, token);

            callback?.({
                text: `Strategy generated successfully!\n\n` +
                    `**Name:** ${strategy.name}\n` +
                    `**Type:** ${strategy.type}\n` +
                    `**Risk Profile:** ${strategy.riskProfile}\n` +
                    `**Token:** ${strategy.parameters.token}\n` +
                    `**Timeframe:** ${strategy.parameters.timeframe}\n\n` +
                    `**Parameters:**\n` +
                    Object.entries(strategy.parameters)
                        .filter(([key]) => key !== 'token' && key !== 'timeframe')
                        .map(([key, value]) => `  - ${key}: ${value}`)
                        .join('\n') +
                    `\n\n**Entry Conditions:**\n` +
                    strategy.conditions
                        .filter(c => c.type === 'entry')
                        .map(c => `  - ${c.indicator} ${c.operator} ${c.value}`)
                        .join('\n') +
                    `\n\n**Exit Conditions:**\n` +
                    strategy.conditions
                        .filter(c => c.type === 'exit')
                        .map(c => `  - ${c.indicator} ${c.operator} ${c.value}`)
                        .join('\n'),
                content: {
                    strategy,
                },
            });

            return true;
        } catch (error) {
            console.error('Error generating strategy:', error);
            callback?.({
                text: `Error generating strategy: ${error.message}`,
            });
            return false;
        }
    },
    examples: [
        {
            user: 'Generate a momentum strategy for SOL with aggressive risk',
            response: 'Strategy generated successfully!',
        },
    ],
};
