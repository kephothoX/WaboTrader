/**
 * TRADING_ADVISOR Action — Comprehensive market analysis and predictive strategy
 */
import { getSolanaService } from "../services/solanaService";
import { searchPerplexity } from "../providers/perplexityProvider";
import { perpDataProvider } from "../providers/perpDataProvider";

export const tradingAdvisor = {
  name: "TRADING_ADVISOR",
  description: "Act as a professional crypto trading advisor. Provide deep cross-market analysis and predictive strategies including spot and perps.",
  similes: ["market advisor", "trading strategy", "predict market", "crypto advice", "should I buy now", "market prediction"],
  examples: [
    [
      { name: "{{user}}", content: { text: "Give me a deep market strategy for today" } },
      { name: "WaboTrader", content: { text: "Synthesizing cross-market data from Jupiter, Drift, and Mango to build your custom strategy..." } },
    ],
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return (
      text.includes("advise") ||
      text.includes("advisor") ||
      text.includes("strategy") ||
      text.includes("predict") ||
      (text.includes("market") && text.includes("overview"))
    );
  },
  handler: async (_runtime: any, message: any) => {
    const service = getSolanaService();
    
    try {
      // Fetch data from multiple sources as per user request
      const movers = await service.getPositiveMovers(3);
      const solPrice = await service.getSOLPrice();
      const performance = service.getAgentPerformance();
      
      // Dynamic Research for Kana Labs
      const perpContext = await perpDataProvider.get();
      let kanaResearch = "";
      const isKanaTarget = (message.content?.text || "").toLowerCase().includes("kana") || 
                          (perpContext.data.kana && perpContext.data.kana.requiresDeepResearch);

      if (isKanaTarget && process.env.PERPLEXITY_API_KEY) {
          kanaResearch = await searchPerplexity("Current liquidity depth, major trading pairs, and recent market sentiment for Kana Labs protocol on Solana. Focus on 24h trends.");
      }
      
      let report = `🧠 **Wabo AI Strategy Advisor Report**\n`;
      report += `🕒 ${new Date().toLocaleString()}\n\n`;
      
      report += `📊 **Market Context:**\n`;
      report += `• **SOL Price**: $${solPrice.toFixed(2)}\n`;
      report += `• **Momentum**: ${movers.length > 0 ? "Strong (High Breakout Volume)" : "Neutral"}\n`;
      report += `• **Protocol Health**: Active data from Jupiter, Drift, and Mango.\n\n`;
      
      report += `🚀 **Top Spot Alpha (Movers):**\n`;
      movers.forEach(m => {
          report += `• **${m.symbol}**: $${m.price.toFixed(4)} (+${m.priceChange24h.toFixed(1)}%). Risk: ${m.riskScore}/10\n`;
      });
      report += `\n⛓️ **On-Chain Strategy:**\n`;
      if (movers.length > 0) {
          report += `• **Aggressive**: Scalp entry on ${movers[0].symbol}.\n`;
          report += `• **Hedged**: Consider 2x Long on ${movers[0].symbol} with a 1x SHORT on SOL for delta neutrality.\n`;
      } else {
          report += `• **Defensive**: Staking SOL / USDC LP suggested.\n`;
      }
      
      report += `\n🛡️ **Risk & Autonomy Update:**\n`;
      report += `• **Current Win Rate**: ${(performance.winRate * 100).toFixed(0)}%\n`;
      report += `• **Risk Cap**: Autonomous leverage currently capped at **3.0x**.\n`;
      report += `• **Transfer Policy**: All autonomous payments require batch-approval via Telegram.\n\n`;
      
      if (kanaResearch) {
          report += `🌐 **Deep Research: Kana Labs (Live Sentiment)**\n`;
          report += `${kanaResearch}\n\n`;
      }

      report += `💡 **Pro Tip**: Use \`/long\` or \`/short\` to execute these strategies directly.`;

      return {
        success: true,
        text: report,
        data: { movers, solPrice, performance }
      };

    } catch (e: any) {
      return {
        success: false,
        text: `❌ Strategic analysis failed: ${e.message}`
      };
    }
  },
};
