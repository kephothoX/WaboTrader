import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import { BacktestEngine } from '../services/BacktestEngine';

export class BacktestDataProvider implements Provider {
    private backtestEngine: BacktestEngine;

    constructor() {
        this.backtestEngine = new BacktestEngine();
    }

    async get(runtime: IAgentRuntime, message: Memory, state: State): Promise<Partial<State>> {
        return {
            backtestEngine: this.backtestEngine,
        };
    }
}

export const backtestDataProvider = {
    name: 'backtestData',
    description: 'Provides historical data context for backtesting',
    provider: new BacktestDataProvider(),
};
