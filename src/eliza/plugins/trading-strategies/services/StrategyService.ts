import { StrategyConfig, StrategyType, RiskProfile, StrategyParameters, Condition, PositionSizingRule } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class StrategyService {
    private strategies: Map<string, StrategyConfig> = new Map();
    private marketplaceStrategies: Map<string, StrategyConfig> = new Map();
    private strategiesFilePath: string;
    private marketplaceFilePath: string;

    constructor() {
        this.strategiesFilePath = path.join(process.cwd(), 'data', 'strategies', 'strategies.json');
        this.marketplaceFilePath = path.join(process.cwd(), 'data', 'strategies', 'marketplace.json');
        this.ensureDirectoryExists();
        this.loadStrategies();
        this.loadMarketplace();
    }

    generateStrategy(type: StrategyType, riskProfile: RiskProfile, token: string): StrategyConfig {
        const id = this.generateId();
        const parameters = this.generateParameters(type, riskProfile, token);
        const conditions = this.generateConditions(type, riskProfile);
        const positionSizing = this.generatePositionSizing(riskProfile);

        const strategy: StrategyConfig = {
            id,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Strategy`,
            type,
            parameters,
            conditions,
            positionSizing,
            riskProfile,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.strategies.set(id, strategy);
        this.saveStrategies();

        return strategy;
    }

    private generateParameters(type: StrategyType, riskProfile: RiskProfile, token: string): StrategyParameters {
        const baseParams: StrategyParameters = {
            timeframe: '1h',
            token,
            entryAmount: this.getEntryAmount(riskProfile),
        };

        switch (type) {
            case 'momentum':
                return {
                    ...baseParams,
                    rsiPeriod: 14,
                    rsiOverbought: 70,
                    rsiOversold: 30,
                    macdFast: 12,
                    macdSlow: 26,
                    macdSignal: 9,
                };

            case 'mean-reversion':
                return {
                    ...baseParams,
                    bollingerPeriod: 20,
                    bollingerStdDev: 2,
                    meanReversionThreshold: 0.02,
                };

            case 'arbitrage':
                return {
                    ...baseParams,
                    priceDifferenceThreshold: 0.005,
                    maxSlippage: 0.01,
                };

            case 'grid':
                return {
                    ...baseParams,
                    gridLevels: 10,
                    gridSpacing: 0.01,
                    gridRange: 0.1,
                };

            case 'dca':
                return {
                    ...baseParams,
                    dcaInterval: 24, // hours
                    dcaAmount: this.getEntryAmount(riskProfile),
                    dcaPeriods: 30,
                };

            default:
                return baseParams;
        }
    }

    private generateConditions(type: StrategyType, riskProfile: RiskProfile): Condition[] {
        const conditions: Condition[] = [];

        switch (type) {
            case 'momentum':
                conditions.push(
                    {
                        type: 'entry',
                        indicator: 'rsi',
                        operator: '<',
                        value: 30,
                    },
                    {
                        type: 'exit',
                        indicator: 'rsi',
                        operator: '>',
                        value: 70,
                    }
                );
                break;

            case 'mean-reversion':
                conditions.push(
                    {
                        type: 'entry',
                        indicator: 'bollinger_lower',
                        operator: '<',
                        value: 1,
                    },
                    {
                        type: 'exit',
                        indicator: 'bollinger_upper',
                        operator: '>',
                        value: 1,
                    }
                );
                break;

            case 'arbitrage':
                conditions.push(
                    {
                        type: 'entry',
                        indicator: 'price_difference',
                        operator: '>',
                        value: 0.005,
                    }
                );
                break;

            case 'grid':
                conditions.push(
                    {
                        type: 'entry',
                        indicator: 'grid_level',
                        operator: '==',
                        value: 1,
                    }
                );
                break;

            case 'dca':
                conditions.push(
                    {
                        type: 'entry',
                        indicator: 'time_interval',
                        operator: '==',
                        value: 24,
                    }
                );
                break;
        }

        // Add risk management conditions
        if (riskProfile === 'conservative') {
            conditions.push(
                {
                    type: 'exit',
                    indicator: 'stop_loss',
                    operator: '<',
                    value: 0.95,
                }
            );
        }

        return conditions;
    }

    private generatePositionSizing(riskProfile: RiskProfile): PositionSizingRule {
        switch (riskProfile) {
            case 'conservative':
                return { type: 'percentage', value: 0.05 }; // 5% of portfolio
            case 'moderate':
                return { type: 'percentage', value: 0.10 }; // 10% of portfolio
            case 'aggressive':
                return { type: 'percentage', value: 0.20 }; // 20% of portfolio
            default:
                return { type: 'percentage', value: 0.10 };
        }
    }

    private getEntryAmount(riskProfile: RiskProfile): number {
        switch (riskProfile) {
            case 'conservative':
                return 100;
            case 'moderate':
                return 500;
            case 'aggressive':
                return 1000;
            default:
                return 500;
        }
    }

    private generateId(): string {
        return `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private ensureDirectoryExists(): void {
        const dir = path.dirname(this.strategiesFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private saveStrategies(): void {
        try {
            const strategiesArray = Array.from(this.strategies.values()).map(strategy => ({
                ...strategy,
                createdAt: strategy.createdAt.toISOString(),
                updatedAt: strategy.updatedAt.toISOString(),
            }));
            fs.writeFileSync(this.strategiesFilePath, JSON.stringify(strategiesArray, null, 2));
        } catch (error) {
            console.error('Error saving strategies:', error);
        }
    }

    private loadStrategies(): void {
        try {
            if (fs.existsSync(this.strategiesFilePath)) {
                const data = fs.readFileSync(this.strategiesFilePath, 'utf-8');
                const strategiesArray = JSON.parse(data);
                this.strategies = new Map(
                    strategiesArray.map((strategy: any) => [
                        strategy.id,
                        {
                            ...strategy,
                            createdAt: new Date(strategy.createdAt),
                            updatedAt: new Date(strategy.updatedAt),
                        }
                    ])
                );
            }
        } catch (error) {
            console.error('Error loading strategies:', error);
            this.strategies = new Map();
        }
    }

    private loadMarketplace(): void {
        try {
            if (fs.existsSync(this.marketplaceFilePath)) {
                const data = fs.readFileSync(this.marketplaceFilePath, 'utf-8');
                const strategiesArray = JSON.parse(data);
                this.marketplaceStrategies = new Map(
                    strategiesArray.map((strategy: any) => [
                        strategy.id,
                        {
                            ...strategy,
                            createdAt: new Date(strategy.createdAt),
                            updatedAt: new Date(strategy.updatedAt),
                        }
                    ])
                );
            }
        } catch (error) {
            console.error('Error loading marketplace:', error);
            this.marketplaceStrategies = new Map();
        }
    }

    private saveMarketplace(): void {
        try {
            const strategiesArray = Array.from(this.marketplaceStrategies.values()).map(strategy => ({
                ...strategy,
                createdAt: strategy.createdAt.toISOString(),
                updatedAt: strategy.updatedAt.toISOString(),
            }));
            fs.writeFileSync(this.marketplaceFilePath, JSON.stringify(strategiesArray, null, 2));
        } catch (error) {
            console.error('Error saving marketplace:', error);
        }
    }

    deleteStrategy(id: string): boolean {
        const deleted = this.strategies.delete(id);
        if (deleted) {
            this.saveStrategies();
        }
        return deleted;
    }

    getStrategy(id: string): StrategyConfig | undefined {
        return this.strategies.get(id);
    }

    listStrategies(): StrategyConfig[] {
        return Array.from(this.strategies.values());
    }

    publishStrategy(id: string): boolean {
        const strategy = this.strategies.get(id);
        if (strategy) {
            const marketplaceStrategy = {
                ...strategy,
                id: `marketplace_${strategy.id}`,
                publishedAt: new Date(),
            };
            this.marketplaceStrategies.set(marketplaceStrategy.id, marketplaceStrategy);
            this.saveMarketplace();
            return true;
        }
        return false;
    }

    browseMarketplace(): StrategyConfig[] {
        return Array.from(this.marketplaceStrategies.values());
    }

    importStrategy(marketplaceId: string): StrategyConfig | null {
        const marketplaceStrategy = this.marketplaceStrategies.get(marketplaceId);
        if (marketplaceStrategy) {
            const userStrategy = {
                ...marketplaceStrategy,
                id: this.generateId(),
                name: `${marketplaceStrategy.name} (Imported)`,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.strategies.set(userStrategy.id, userStrategy);
            this.saveStrategies();
            return userStrategy;
        }
        return null;
    }
}