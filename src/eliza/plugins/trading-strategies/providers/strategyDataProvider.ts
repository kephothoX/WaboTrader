import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import { StrategyService } from '../services/StrategyService';
import { StrategyExecutor } from '../services/StrategyExecutor';

export class StrategyDataProvider implements Provider {
    private strategyService: StrategyService;
    private executor: StrategyExecutor;

    constructor() {
        this.strategyService = new StrategyService();
        this.executor = new StrategyExecutor();
    }

    async get(runtime: IAgentRuntime, message: Memory, state: State): Promise<Partial<State>> {
        try {
            const strategies = this.strategyService.listStrategies();
            const activeStrategies = this.executor.getActiveStrategies();

            return {
                strategies: strategies.map(s => ({
                    id: s.id,
                    name: s.name,
                    type: s.type,
                    riskProfile: s.riskProfile,
                    status: activeStrategies.find(a => a.strategyId === s.id)?.status || 'inactive',
                })),
                activeStrategyCount: activeStrategies.length,
            };
        } catch (error) {
            console.error('Error in strategyDataProvider:', error);
            return {};
        }
    }
}

export const strategyDataProvider = {
    name: 'strategyData',
    description: 'Provides context about active strategies and their states',
    provider: new StrategyDataProvider(),
};
