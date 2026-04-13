import { Plugin } from "@elizaos/core";
import {
    createMarketAction,
    browseMarketsAction,
    buySharesAction,
    sellSharesAction,
    resolveMarketAction,
    claimWinningsAction,
    provideLiquidityAction,
    removeLiquidityAction,
    getMarketAnalyticsAction,
    postCommentAction,
} from "./actions/marketActions";
import { predictionMarketProvider } from "./providers/predictionMarketProvider";
import { marketSentimentProvider } from "./providers/marketSentimentProvider";
import { marketOutcomeEvaluator } from "./evaluators/marketOutcomeEvaluator";

export const predictionMarketsPlugin: Plugin = {
    name: "prediction-markets",
    description: "Prediction markets for forecasting events with trading, resolution, and analytics",
    actions: [
        createMarketAction,
        browseMarketsAction,
        buySharesAction,
        sellSharesAction,
        resolveMarketAction,
        claimWinningsAction,
        provideLiquidityAction,
        removeLiquidityAction,
        getMarketAnalyticsAction,
        postCommentAction,
    ],
    providers: [
        predictionMarketProvider,
        marketSentimentProvider,
    ],
    evaluators: [
        marketOutcomeEvaluator,
    ],
};

export default predictionMarketsPlugin;
