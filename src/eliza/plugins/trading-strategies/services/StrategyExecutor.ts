import { StrategyConfig, ExecutedTrade, StrategyPerformance } from '../types';
import * as fs from 'fs';
import * as path from 'path';

interface StrategyState {
    strategyId: string;
    status: 'active' | 'paused' | 'inactive';
    lastSignal?: string;
    lastCheck: Date;
    tradesToday: number;
}

export class StrategyExecutor {
    private activeStrategies: Map<string, StrategyState> = new Map();
    private performanceData: Map<string, StrategyPerformance> = new Map();
    private executedTrades: ExecutedTrade[] = [];
    private stateFilePath: string;
    private performanceFilePath: string;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private readonly MAX_CONCURRENT_STRATEGIES = 5;
    private readonly MAX_TRADES_PER_HOUR = 10;
    private readonly MONITOR_INTERVAL_MS = 10000; // 10 seconds

    constructor() {
        this.stateFilePath = path.join(process.cwd(), 'data', 'strategies', 'executor-state.json');
        this.performanceFilePath = path.join(process.cwd(), 'data', 'strategies', 'performance.json');
        this.ensureDirectoryExists();
        this.loadState();
    }

    private ensureDirectoryExists(): void {
        const dir = path.dirname(this.stateFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    async activateStrategy(strategy: StrategyConfig): Promise<{ success: boolean; message: string }> {
        if (this.activeStrategies.size >= this.MAX_CONCURRENT_STRATEGIES) {
            return { success: false, message: `Maximum ${this.MAX_CONCURRENT_STRATEGIES} concurrent strategies reached` };
        }

        const state: StrategyState = {
            strategyId: strategy.id,
            status: 'active',
            lastCheck: new Date(),
            tradesToday: 0,
        };

        this.activeStrategies.set(strategy.id, state);
        this.saveState();
        
        if (!this.monitoringInterval) {
            this.startMonitoring();
        }

        return { success: true, message: `Strategy ${strategy.name} activated successfully` };
    }

    async deactivateStrategy(strategyId: string): Promise<{ success: boolean; message: string }> {
        const state = this.activeStrategies.get(strategyId);
        if (!state) {
            return { success: false, message: 'Strategy not found or not active' };
        }

        state.status = 'inactive';
        this.activeStrategies.delete(strategyId);
        this.saveState();

        if (this.activeStrategies.size === 0 && this.monitoringInterval) {
            this.stopMonitoring();
        }

        return { success: true, message: 'Strategy deactivated successfully' };
    }

    async pauseStrategy(strategyId: string): Promise<{ success: boolean; message: string }> {
        const state = this.activeStrategies.get(strategyId);
        if (!state) {
            return { success: false, message: 'Strategy not found' };
        }

        state.status = 'paused';
        this.saveState();

        return { success: true, message: 'Strategy paused successfully' };
    }

    async resumeStrategy(strategyId: string): Promise<{ success: boolean; message: string }> {
        const state = this.activeStrategies.get(strategyId);
        if (!state) {
            return { success: false, message: 'Strategy not found' };
        }

        state.status = 'active';
        this.saveState();

        return { success: true, message: 'Strategy resumed successfully' };
    }

    private startMonitoring(): void {
        this.monitoringInterval = setInterval(async () => {
            await this.checkStrategies();
        }, this.MONITOR_INTERVAL_MS);
    }

    private stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    private async checkStrategies(): Promise<void> {
        for (const [strategyId, state] of this.activeStrategies.entries()) {
            if (state.status !== 'active') continue;

            try {
                state.lastCheck = new Date();
                // Generate signals would be called here
                // This is a placeholder for the actual signal generation logic
            } catch (error) {
                console.error(`Error checking strategy ${strategyId}:`, error);
            }
        }
    }

    generateSignals(strategy: StrategyConfig, marketData: any): { signal: 'buy' | 'sell' | 'hold'; confidence: number; reason: string } {
        // Simplified signal generation
        // In a real implementation, this would evaluate conditions against real-time data
        const conditions = strategy.conditions;
        
        if (conditions.length === 0) {
            return { signal: 'hold', confidence: 0, reason: 'No conditions defined' };
        }

        // Check entry conditions
        const entryConditions = conditions.filter(c => c.type === 'entry');
        const exitConditions = conditions.filter(c => c.type === 'exit');

        // This is a placeholder - real implementation would check actual market data
        return { signal: 'hold', confidence: 0, reason: 'Awaiting market conditions' };
    }

    private async executeTrade(strategyId: string, signal: 'buy' | 'sell', amount: number, token: string): Promise<ExecutedTrade | null> {
        const state = this.activeStrategies.get(strategyId);
        if (!state || state.status !== 'active') {
            return null;
        }

        // Check rate limiting
        if (state.tradesToday >= this.MAX_TRADES_PER_HOUR) {
            console.log(`Rate limit reached for strategy ${strategyId}`);
            return null;
        }

        // Placeholder for actual trade execution via SolanaService
        const trade: ExecutedTrade = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            type: signal,
            token,
            amount,
            price: 0, // Would be fetched from Jupiter
            status: 'pending',
            strategyId,
        };

        this.executedTrades.push(trade);
        state.tradesToday++;

        // Record trade for performance tracking
        this.recordTrade(trade);

        return trade;
    }

    recordTrade(trade: ExecutedTrade): void {
        if (trade.status === 'completed') {
            // Update performance metrics
            const strategyId = trade.strategyId;
            let performance = this.performanceData.get(strategyId);

            if (!performance) {
                performance = {
                    totalReturn: 0,
                    winRate: 0,
                    maxDrawdown: 0,
                    sharpeRatio: 0,
                    tradeCount: 0,
                    averageTradeDuration: 0,
                    profitFactor: 0,
                };
            }

            performance.tradeCount++;
            if (trade.pnl !== undefined) {
                performance.totalReturn += trade.pnl;
            }

            this.performanceData.set(strategyId, performance);
            this.savePerformance();
        }
    }

    getPerformance(strategyId: string): StrategyPerformance | null {
        return this.performanceData.get(strategyId) || null;
    }

    getActiveStrategies(): StrategyState[] {
        return Array.from(this.activeStrategies.values());
    }

    getExecutedTrades(strategyId?: string): ExecutedTrade[] {
        if (strategyId) {
            return this.executedTrades.filter(t => t.strategyId === strategyId);
        }
        return this.executedTrades;
    }

    private saveState(): void {
        try {
            const states = Array.from(this.activeStrategies.entries()).map(([id, state]) => ({
                ...state,
                lastCheck: state.lastCheck.toISOString(),
            }));
            fs.writeFileSync(this.stateFilePath, JSON.stringify(states, null, 2));
        } catch (error) {
            console.error('Error saving executor state:', error);
        }
    }

    private loadState(): void {
        try {
            if (fs.existsSync(this.stateFilePath)) {
                const data = fs.readFileSync(this.stateFilePath, 'utf-8');
                const states = JSON.parse(data);
                this.activeStrategies = new Map(
                    states.map((state: any) => [
                        state.strategyId,
                        {
                            ...state,
                            lastCheck: new Date(state.lastCheck),
                        },
                    ])
                );
            }
        } catch (error) {
            console.error('Error loading executor state:', error);
            this.activeStrategies = new Map();
        }

        try {
            if (fs.existsSync(this.performanceFilePath)) {
                const data = fs.readFileSync(this.performanceFilePath, 'utf-8');
                const performances = JSON.parse(data);
                this.performanceData = new Map(
                    Object.entries(performances).map(([id, perf]) => [id, perf as StrategyPerformance])
                );
            }
        } catch (error) {
            console.error('Error loading performance data:', error);
            this.performanceData = new Map();
        }
    }

    private savePerformance(): void {
        try {
            const performances: Record<string, StrategyPerformance> = {};
            for (const [id, perf] of this.performanceData.entries()) {
                performances[id] = perf;
            }
            fs.writeFileSync(this.performanceFilePath, JSON.stringify(performances, null, 2));
        } catch (error) {
            console.error('Error saving performance:', error);
        }
    }

    // Simulation mode support
    private simulationMode = false;

    setSimulationMode(enabled: boolean): void {
        this.simulationMode = enabled;
    }

    isSimulationMode(): boolean {
        return this.simulationMode;
    }
}
