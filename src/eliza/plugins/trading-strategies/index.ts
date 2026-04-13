import { Plugin } from "@elizaos/core";
import { generateStrategyAction } from "./actions/generateStrategy";
import { backtestStrategyAction } from "./actions/backtestStrategy";
import { optimizeStrategyAction } from "./actions/optimizeStrategy";
import { activateStrategyAction, deactivateStrategyAction } from "./actions/activateStrategy";
import { getStrategyPerformanceAction } from "./actions/getStrategyPerformance";
import { publishStrategyAction, browseMarketplaceAction } from "./actions/publishStrategy";
import { strategyDataProvider } from "./providers/strategyDataProvider";
import { backtestDataProvider } from "./providers/backtestDataProvider";
import { strategyEvaluator } from "./evaluators/strategyEvaluator";

export const tradingStrategiesPlugin: Plugin = {
    name: "trading-strategies",
    description: "Advanced trading strategy generation, backtesting, optimization, and execution",
    actions: [
        generateStrategyAction,
        backtestStrategyAction,
        optimizeStrategyAction,
        activateStrategyAction,
        deactivateStrategyAction,
        getStrategyPerformanceAction,
        publishStrategyAction,
        browseMarketplaceAction,
    ],
    providers: [
        strategyDataProvider,
        backtestDataProvider,
    ],
    evaluators: [
        strategyEvaluator,
    ],
};

export default tradingStrategiesPlugin;
