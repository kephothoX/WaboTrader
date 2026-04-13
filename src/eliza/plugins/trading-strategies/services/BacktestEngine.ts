import { StrategyConfig, BacktestResult, StrategyPerformance, ExecutedTrade, ChartDataPoint } from '../types';
import * as fs from 'fs';
import * as path from 'path';

interface HistoricalDataPoint {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface CachedData {
    token: string;
    timeframe: string;
    data: HistoricalDataPoint[];
    lastUpdated: Date;
}

export class BacktestEngine {
    private cache: Map<string, CachedData> = new Map();
    private cacheDir: string;
    private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    constructor() {
        this.cacheDir = path.join(process.cwd(), 'data', 'cache', 'historical-data');
        this.ensureCacheDirectory();
        this.loadCache();
    }

    private ensureCacheDirectory(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    private loadCache(): void {
        try {
            const cacheFiles = fs.readdirSync(this.cacheDir).filter(file => file.endsWith('.json'));
            for (const file of cacheFiles) {
                const filePath = path.join(this.cacheDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const cacheKey = `${data.token}_${data.timeframe}`;
                this.cache.set(cacheKey, {
                    ...data,
                    lastUpdated: new Date(data.lastUpdated),
                    data: data.data.map((point: any) => ({
                        ...point,
                        timestamp: new Date(point.timestamp),
                    })),
                });
            }
        } catch (error) {
            console.error('Error loading cache:', error);
        }
    }

    private saveCache(): void {
        for (const [key, cachedData] of this.cache.entries()) {
            try {
                const fileName = `${key}.json`;
                const filePath = path.join(this.cacheDir, fileName);
                const dataToSave = {
                    ...cachedData,
                    lastUpdated: cachedData.lastUpdated.toISOString(),
                    data: cachedData.data.map(point => ({
                        ...point,
                        timestamp: point.timestamp.toISOString(),
                    })),
                };
                fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
            } catch (error) {
                console.error(`Error saving cache for ${key}:`, error);
            }
        }
    }

    async fetchHistoricalData(token: string, timeframe: '1h' | '4h' | '1d', days: number = 30): Promise<HistoricalDataPoint[]> {
        const cacheKey = `${token}_${timeframe}`;
        const cached = this.cache.get(cacheKey);

        // Check if cache is valid
        if (cached && (Date.now() - cached.lastUpdated.getTime()) < this.CACHE_DURATION) {
            return cached.data.slice(-days * (timeframe === '1h' ? 24 : timeframe === '4h' ? 6 : 1));
        }

        // Fetch from DexScreener API
        try {
            const data = await this.fetchFromDexScreener(token, timeframe, days);

            // Update cache
            this.cache.set(cacheKey, {
                token,
                timeframe,
                data,
                lastUpdated: new Date(),
            });
            this.saveCache();

            return data;
        } catch (error) {
            console.error('Error fetching historical data:', error);
            // Return cached data if available, even if expired
            return cached?.data || [];
        }
    }

    private async fetchFromDexScreener(token: string, timeframe: '1h' | '4h' | '1d', days: number): Promise<HistoricalDataPoint[]> {
        // This is a placeholder implementation
        // In a real implementation, you would call the DexScreener API
        // For now, we'll generate mock data

        const dataPoints: HistoricalDataPoint[] = [];
        const now = new Date();
        const intervalMs = timeframe === '1h' ? 60 * 60 * 1000 :
            timeframe === '4h' ? 4 * 60 * 60 * 1000 :
                24 * 60 * 60 * 1000;

        const points = days * (24 / (intervalMs / (60 * 60 * 1000)));

        let currentPrice = 1.0; // Starting price

        for (let i = points; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - (i * intervalMs));
            const volatility = 0.02; // 2% volatility
            const change = (Math.random() - 0.5) * 2 * volatility;
            currentPrice *= (1 + change);

            const open = currentPrice;
            const close = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
            const high = Math.max(open, close) * (1 + Math.random() * 0.005);
            const low = Math.min(open, close) * (1 - Math.random() * 0.005);
            const volume = Math.random() * 1000000;

            dataPoints.push({
                timestamp,
                open,
                high,
                low,
                close,
                volume,
            });

            currentPrice = close;
        }

        return dataPoints;
    }

    private calculateRSI(data: HistoricalDataPoint[], period: number = 14): number[] {
        const rsiValues: number[] = [];
        const gains: number[] = [];
        const losses: number[] = [];

        for (let i = 1; i < data.length; i++) {
            const change = data[i].close - data[i - 1].close;
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }

        for (let i = 0; i < data.length; i++) {
            if (i < period) {
                rsiValues.push(50); // Default value for insufficient data
                continue;
            }

            const avgGain = gains.slice(i - period + 1, i + 1).reduce((sum, gain) => sum + gain, 0) / period;
            const avgLoss = losses.slice(i - period + 1, i + 1).reduce((sum, loss) => sum + loss, 0) / period;

            if (avgLoss === 0) {
                rsiValues.push(100);
            } else {
                const rs = avgGain / avgLoss;
                const rsi = 100 - (100 / (1 + rs));
                rsiValues.push(rsi);
            }
        }

        return rsiValues;
    }

    private calculateMACD(data: HistoricalDataPoint[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
        macd: number[];
        signal: number[];
        histogram: number[];
    } {
        const closes = data.map(d => d.close);
        const fastEMA = this.calculateEMA(closes, fastPeriod);
        const slowEMA = this.calculateEMA(closes, slowPeriod);

        const macd: number[] = [];
        for (let i = 0; i < closes.length; i++) {
            if (i < slowPeriod - 1) {
                macd.push(0);
            } else {
                macd.push(fastEMA[i] - slowEMA[i]);
            }
        }

        const signal = this.calculateEMA(macd, signalPeriod);

        const histogram: number[] = [];
        for (let i = 0; i < macd.length; i++) {
            histogram.push(macd[i] - signal[i]);
        }

        return { macd, signal, histogram };
    }

    private calculateBollingerBands(data: HistoricalDataPoint[], period: number = 20, stdDev: number = 2): {
        upper: number[];
        middle: number[];
        lower: number[];
    } {
        const closes = data.map(d => d.close);
        const sma = this.calculateSMA(closes, period);

        const upper: number[] = [];
        const middle: number[] = [];
        const lower: number[] = [];

        for (let i = 0; i < closes.length; i++) {
            if (i < period - 1) {
                upper.push(closes[i]);
                middle.push(closes[i]);
                lower.push(closes[i]);
                continue;
            }

            const slice = closes.slice(i - period + 1, i + 1);
            const mean = slice.reduce((sum, val) => sum + val, 0) / period;
            const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
            const std = Math.sqrt(variance);

            upper.push(mean + stdDev * std);
            middle.push(mean);
            lower.push(mean - stdDev * std);
        }

        return { upper, middle, lower };
    }

    private calculateEMA(data: number[], period: number): number[] {
        const ema: number[] = [];
        const multiplier = 2 / (period + 1);

        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                ema.push(data[i]);
            } else {
                ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
            }
        }

        return ema;
    }

    private calculateSMA(data: number[], period: number): number[] {
        const sma: number[] = [];

        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                sma.push(data[i]);
            } else {
                const slice = data.slice(i - period + 1, i + 1);
                const average = slice.reduce((sum, val) => sum + val, 0) / period;
                sma.push(average);
            }
        }

        return sma;
    }

    async runBacktest(strategy: StrategyConfig, startDate: Date, endDate: Date): Promise<BacktestResult> {
        const historicalData = await this.fetchHistoricalData(
            strategy.parameters.token,
            strategy.parameters.timeframe || "1h",
            Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
        );

        // Filter data by date range
        const filteredData = historicalData.filter(
            point => point.timestamp >= startDate && point.timestamp <= endDate
        );

        if (filteredData.length === 0) {
            throw new Error("No historical data available for the specified period");
        }

        // Calculate technical indicators
        const indicators = this.calculateIndicators(filteredData, strategy);

        // Simulate trading
        const trades = this.simulateTrades(filteredData, indicators, strategy);

        // Calculate performance metrics
        const performance = this.calculatePerformanceMetrics(trades, filteredData);

        // Generate chart data
        const chartData = this.generateChartData(filteredData, trades);

        return {
            strategyId: strategy.id,
            period: { start: startDate, end: endDate },
            token: strategy.parameters.token,
            performance,
            trades,
            chartData,
        };
    }

    private calculateIndicators(data: HistoricalDataPoint[], strategy: StrategyConfig): any {
        const indicators: any = {};

        // Calculate indicators based on strategy conditions
        for (const condition of strategy.conditions) {
            switch (condition.indicator) {
                case "rsi":
                    indicators.rsi = this.calculateRSI(data, strategy.parameters.rsiPeriod || 14);
                    break;
                case "macd":
                    indicators.macd = this.calculateMACD(
                        data,
                        strategy.parameters.macdFast || 12,
                        strategy.parameters.macdSlow || 26,
                        strategy.parameters.macdSignal || 9
                    );
                    break;
                case "bollinger_upper":
                case "bollinger_lower":
                    indicators.bollinger = this.calculateBollingerBands(
                        data,
                        strategy.parameters.bollingerPeriod || 20,
                        strategy.parameters.bollingerStdDev || 2
                    );
                    break;
            }
        }

        return indicators;
    }

    private simulateTrades(data: HistoricalDataPoint[], indicators: any, strategy: StrategyConfig): ExecutedTrade[] {
        const trades: ExecutedTrade[] = [];
        let position: "long" | "short" | null = null;
        let entryPrice = 0;
        let positionSize = 0;

        for (let i = 0; i < data.length; i++) {
            const currentData = data[i];
            const shouldEnter = this.evaluateConditions(strategy.conditions.filter(c => c.type === "entry"), indicators, i);
            const shouldExit = this.evaluateConditions(strategy.conditions.filter(c => c.type === "exit"), indicators, i);

            // Check stop loss and take profit
            if (position && strategy.parameters.stopLoss) {
                const stopPrice = position === "long" ?
                    entryPrice * (1 - strategy.parameters.stopLoss / 100) :
                    entryPrice * (1 + strategy.parameters.stopLoss / 100);

                if ((position === "long" && currentData.low <= stopPrice) ||
                    (position === "short" && currentData.high >= stopPrice)) {
                    // Execute stop loss
                    const exitPrice = position === "long" ? stopPrice : stopPrice;
                    trades.push(this.createTrade(currentData.timestamp, "sell", strategy.parameters.token, positionSize, exitPrice, strategy.id));
                    position = null;
                    continue;
                }
            }

            if (position && strategy.parameters.takeProfit) {
                const profitPrice = position === "long" ?
                    entryPrice * (1 + strategy.parameters.takeProfit / 100) :
                    entryPrice * (1 - strategy.parameters.takeProfit / 100);

                if ((position === "long" && currentData.high >= profitPrice) ||
                    (position === "short" && currentData.low <= profitPrice)) {
                    // Execute take profit
                    const exitPrice = position === "long" ? profitPrice : profitPrice;
                    trades.push(this.createTrade(currentData.timestamp, "sell", strategy.parameters.token, positionSize, exitPrice, strategy.id));
                    position = null;
                    continue;
                }
            }

            if (!position && shouldEnter) {
                // Enter position
                positionSize = this.calculatePositionSize(strategy, currentData.close);
                entryPrice = currentData.close;
                position = "long"; // Assuming long positions for simplicity
                trades.push(this.createTrade(currentData.timestamp, "buy", strategy.parameters.token, positionSize, entryPrice, strategy.id));
            } else if (position && shouldExit) {
                // Exit position
                trades.push(this.createTrade(currentData.timestamp, "sell", strategy.parameters.token, positionSize, currentData.close, strategy.id));
                position = null;
            }
        }

        return trades;
    }

    private evaluateConditions(conditions: any[], indicators: any, index: number): boolean {
        return conditions.every(condition => {
            const value = this.getIndicatorValue(condition.indicator, indicators, index);
            switch (condition.operator) {
                case ">": return value > condition.value;
                case "<": return value < condition.value;
                case ">=": return value >= condition.value;
                case "<=": return value <= condition.value;
                case "==": return value === condition.value;
                case "!=": return value !== condition.value;
                default: return false;
            }
        });
    }

    private getIndicatorValue(indicator: string, indicators: any, index: number): number {
        switch (indicator) {
            case "rsi":
                return indicators.rsi?.[index] || 50;
            case "macd":
                return indicators.macd?.macd[index] || 0;
            case "bollinger_upper":
                return indicators.bollinger?.upper[index] || 0;
            case "bollinger_lower":
                return indicators.bollinger?.lower[index] || 0;
            default:
                return 0;
        }
    }

    private calculatePositionSize(strategy: StrategyConfig, price: number): number {
        const sizing = strategy.positionSizing;
        switch (sizing.type) {
            case "fixed":
                return sizing.value;
            case "percentage":
                // Assuming portfolio value of 10000 for simulation
                return (10000 * sizing.value / 100) / price;
            case "kelly":
                // Simplified Kelly criterion
                return sizing.value * 10000 / price;
            case "risk-based":
                // Risk 1% of portfolio per trade
                return (10000 * 0.01) / price;
            default:
                return 100;
        }
    }

    private createTrade(timestamp: Date, type: "buy" | "sell", token: string, amount: number, price: number, strategyId: string): ExecutedTrade {
        return {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp,
            type,
            token,
            amount,
            price,
            status: "completed",
            strategyId,
        };
    }

    private calculatePerformanceMetrics(trades: ExecutedTrade[], data: HistoricalDataPoint[]): StrategyPerformance {
        if (trades.length === 0) {
            return {
                totalReturn: 0,
                winRate: 0,
                maxDrawdown: 0,
                sharpeRatio: 0,
                tradeCount: 0,
                averageTradeDuration: 0,
                profitFactor: 0,
            };
        }

        let totalReturn = 0;
        let winningTrades = 0;
        let totalProfit = 0;
        let totalLoss = 0;
        const tradeDurations: number[] = [];
        let peak = 0;
        let maxDrawdown = 0;
        let runningPnL = 0;

        // Group trades into round trips
        const roundTrips: ExecutedTrade[][] = [];
        let currentRoundTrip: ExecutedTrade[] = [];

        for (const trade of trades) {
            currentRoundTrip.push(trade);
            if (trade.type === "sell") {
                roundTrips.push(currentRoundTrip);
                currentRoundTrip = [];
            }
        }

        for (const roundTrip of roundTrips) {
            if (roundTrip.length >= 2) {
                const buyTrade = roundTrip.find(t => t.type === "buy");
                const sellTrade = roundTrip.find(t => t.type === "sell");

                if (buyTrade && sellTrade) {
                    const pnl = (sellTrade.price - buyTrade.price) * buyTrade.amount;
                    runningPnL += pnl;

                    if (pnl > 0) {
                        winningTrades++;
                        totalProfit += pnl;
                    } else {
                        totalLoss += Math.abs(pnl);
                    }

                    // Calculate duration
                    const duration = sellTrade.timestamp.getTime() - buyTrade.timestamp.getTime();
                    tradeDurations.push(duration);

                    // Track drawdown
                    peak = Math.max(peak, runningPnL);
                    maxDrawdown = Math.max(maxDrawdown, peak - runningPnL);
                }
            }
        }

        const winRate = roundTrips.length > 0 ? winningTrades / roundTrips.length : 0;
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
        const averageTradeDuration = tradeDurations.length > 0 ?
            tradeDurations.reduce((sum, dur) => sum + dur, 0) / tradeDurations.length : 0;

        // Calculate Sharpe ratio (simplified, assuming 0% risk-free rate)
        const returns = roundTrips.map(rt => {
            const buy = rt.find(t => t.type === "buy");
            const sell = rt.find(t => t.type === "sell");
            return buy && sell ? ((sell.price - buy.price) / buy.price) : 0;
        });
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
        const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

        return {
            totalReturn: runningPnL,
            winRate,
            maxDrawdown,
            sharpeRatio,
            tradeCount: roundTrips.length,
            averageTradeDuration,
            profitFactor,
        };
    }

    private generateChartData(data: HistoricalDataPoint[], trades: ExecutedTrade[]): ChartDataPoint[] {
        const chartData: ChartDataPoint[] = [];

        // Add price data
        data.forEach(point => {
            chartData.push({
                timestamp: point.timestamp,
                value: point.close,
                type: "price",
            });
        });

        // Add trade markers
        trades.forEach(trade => {
            chartData.push({
                timestamp: trade.timestamp,
                value: trade.price,
                type: "trade",
            });
        });

        return chartData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    async optimizeStrategy(strategy: StrategyConfig, startDate: Date, endDate: Date, generations: number = 50): Promise<StrategyConfig> {
        // Genetic algorithm for strategy optimization
        let bestStrategy = { ...strategy };
        let bestPerformance: StrategyPerformance = { totalReturn: 0, winRate: 0, maxDrawdown: 0, sharpeRatio: 0, tradeCount: 0, averageTradeDuration: 0, profitFactor: 0 };

        // Population size
        const populationSize = 20;

        for (let gen = 0; gen < generations; gen++) {
            const population: StrategyConfig[] = [];

            // Generate population
            for (let i = 0; i < populationSize; i++) {
                const mutatedStrategy = this.mutateStrategy(bestStrategy);
                population.push(mutatedStrategy);
            }

            // Evaluate population
            for (const strat of population) {
                try {
                    const result = await this.runBacktest(strat, startDate, endDate);
                    if (result.performance.totalReturn > bestPerformance.totalReturn) {
                        bestStrategy = strat;
                        bestPerformance = result.performance;
                    }
                } catch (error) {
                    // Skip invalid strategies
                    continue;
                }
            }
        }

        return bestStrategy;
    }

    private mutateStrategy(strategy: StrategyConfig): StrategyConfig {
        const mutated = JSON.parse(JSON.stringify(strategy));

        // Randomly mutate parameters
        if (Math.random() < 0.3) {
            mutated.parameters.rsiPeriod = Math.max(5, Math.min(30, mutated.parameters.rsiPeriod + (Math.random() - 0.5) * 10));
        }
        if (Math.random() < 0.3) {
            mutated.parameters.stopLoss = Math.max(0.1, Math.min(10, mutated.parameters.stopLoss + (Math.random() - 0.5) * 2));
        }
        if (Math.random() < 0.3) {
            mutated.parameters.takeProfit = Math.max(0.1, Math.min(20, mutated.parameters.takeProfit + (Math.random() - 0.5) * 5));
        }

        return mutated;
    }
}