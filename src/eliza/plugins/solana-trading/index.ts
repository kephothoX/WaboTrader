/**
 * WaboTrader Solana Trading Plugin — ElizaOS Plugin Definition
 * Aggregates all actions, providers, evaluators, and services
 */

import { analyzeTrade } from "./actions/analyzeTrade";
import { recommendTrade } from "./actions/recommendTrade";
import { executeTrade } from "./actions/executeTrade";
import { getWalletBalance } from "./actions/getWalletBalance";
import { getPortfolioAnalytics } from "./actions/getPortfolioAnalytics";
import { analyzeOnChain } from "./actions/analyzeOnChain";
import { moltbookInteract } from "./actions/moltbookInteract";
import { marketOverview } from "./actions/marketOverview";
import { analyzeStablecoin } from "./actions/analyzeStablecoin";
import { proactiveRecommendations } from "./actions/proactiveRecommendations";
import { perpsAnalytics } from "./actions/perpsAnalytics";
import { analyzePerpsProtocol } from "./actions/analyzePerpsProtocol";
import { recommendPerpsTrade } from "./actions/recommendPerpsTrade";
import { sendAssets } from "./actions/sendAssets";
import { executePerpTrade } from "./actions/executePerpTrade";
import { tradingAdvisor } from "./actions/tradingAdvisor";
import { marketDataProvider } from "./providers/marketDataProvider";
import { walletProvider } from "./providers/walletProvider";
import { perplexityProvider } from "./providers/perplexityProvider";
import { portfolioProvider } from "./providers/portfolioProvider";
import { perpDataProvider } from "./providers/perpDataProvider";
import { tradeEvaluator } from "./evaluators/tradeEvaluator";

export const solanaTradingPlugin = {
  name: "wabotrader-solana-trading",
  description:
    "Solana trading plugin for WaboTrader — provides token analysis, trade recommendations, swap execution via Jupiter Aggregator, and comprehensive perpetuals market analytics",

  actions: [
    analyzeTrade, 
    recommendTrade, 
    executeTrade, 
    getWalletBalance, 
    getPortfolioAnalytics, 
    analyzeOnChain, 
    moltbookInteract, 
    marketOverview, 
    analyzeStablecoin, 
    proactiveRecommendations, 
    perpsAnalytics, 
    analyzePerpsProtocol, 
    recommendPerpsTrade,
    sendAssets,
    executePerpTrade,
    tradingAdvisor
  ],

  providers: [marketDataProvider, walletProvider, perplexityProvider, portfolioProvider, perpDataProvider],

  evaluators: [tradeEvaluator],

  init: async () => {
    console.log("🚀 WaboTrader Solana Trading Plugin initialized");
    console.log("   Actions: ANALYZE_TRADE, RECOMMEND_TRADE, EXECUTE_TRADE, GET_WALLET_BALANCE, GET_PORTFOLIO_ANALYTICS, ANALYZE_ON_CHAIN, MOLTBOOK_INTERACT, MARKET_OVERVIEW, ANALYZE_STABLECOIN, PROACTIVE_RECOMMENDATIONS, PERPS_ANALYTICS, ANALYZE_PERPS_PROTOCOL, RECOMMEND_PERPS_TRADE, SEND_ASSETS, EXECUTE_PERP_TRADE, TRADING_ADVISOR");
    console.log("   Providers: SOLANA_MARKET_DATA, WALLET_STATE, PERPLEXITY_RESEARCH, PORTFOLIO_PROVIDER, PERPS_MARKET_DATA");
  },
};

export default solanaTradingPlugin;
