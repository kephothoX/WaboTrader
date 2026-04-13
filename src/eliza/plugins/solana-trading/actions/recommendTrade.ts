/**
 * RECOMMEND_TRADE Action — Generates buy/sell/hold recommendation with entry/exit points
 */
import { getSolanaService } from "../services/solanaService";

export const recommendTrade = {
  name: "RECOMMEND_TRADE",
  description: "Generate a buy/sell/hold recommendation for a Solana token with entry/exit points",
  similes: ["recommend", "should I buy", "should I sell", "trade recommendation", "what should I do"],
  examples: [
    [
      { name: "{{user}}", content: { text: "Recommend a trade on SOL" } },
      { name: "WaboTrader", content: { text: "Let me analyze SOL and generate a recommendation..." } },
    ],
    [
      { name: "{{user}}", content: { text: "Should I buy BONK?" } },
      { name: "WaboTrader", content: { text: "I'll run a full analysis and give you my recommendation..." } },
    ],
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return (
      text.includes("recommend") ||
      text.includes("should i buy") ||
      text.includes("should i sell") ||
      text.includes("trade") ||
      text.includes("what should")
    );
  },
  handler: async (_runtime: any, message: any) => {
    const text = message.content?.text || "";
    const tokenMatch = text.match(/(?:recommend|buy|sell|trade)\s+(?:a\s+trade\s+on\s+)?(\S+)/i);
    const token = tokenMatch?.[1] || "SOL";

    try {
      const service = getSolanaService();

      // First analyze the token
      const analysis = await service.analyzeToken(token);
      // Then generate recommendation
      const rec = service.generateRecommendation(analysis);

      const actionEmoji = rec.action === "BUY" ? "🟢" : rec.action === "SELL" ? "🔴" : "🟡";
      const confEmoji = rec.confidence === "HIGH" ? "⭐⭐⭐" : rec.confidence === "MEDIUM" ? "⭐⭐" : "⭐";

      let responseText = `${actionEmoji} **Trade Recommendation: ${analysis.symbol}**

**Action:** ${rec.action} | **Confidence:** ${rec.confidence} ${confEmoji}

📊 **Technical Indicators:**
  • RSI: ${rec.technicalIndicators.rsi} ${rec.technicalIndicators.rsi! < 35 ? "(Oversold)" : rec.technicalIndicators.rsi! > 65 ? "(Overbought)" : "(Neutral)"}
  • MACD: ${rec.technicalIndicators.macdSignal}
  • Volume: ${rec.technicalIndicators.volumeTrend}
  • Price Action: ${rec.technicalIndicators.priceAction}

💡 **Reasoning:**
${rec.reasoning.map((r: string) => `  • ${r}`).join("\n")}`;

      if (rec.action === "BUY" && rec.entryPrice) {
        responseText += `

🎯 **Trade Plan:**
  • Entry: $${rec.entryPrice.toFixed(rec.entryPrice < 1 ? 6 : 2)}
  • Take Profit: $${rec.exitPrice?.toFixed(rec.exitPrice < 1 ? 6 : 2)} (+15%)
  • Stop Loss: $${rec.stopLoss?.toFixed(rec.stopLoss! < 1 ? 6 : 2)} (-8%)
  • Position Size: ${rec.positionSizePct}% of portfolio`;
      }

      responseText += `

**Next Steps:** ${rec.action === "BUY" ? 'Say `execute trade` to proceed with a swap.' : rec.action === "SELL" ? "Consider reducing your position." : "Monitor for clearer entry signals."}`;

      return {
        success: true,
        text: responseText,
        data: { analysis, recommendation: rec },
      };
    } catch (error: any) {
      return {
        success: false,
        text: `❌ Failed to generate recommendation for ${token}: ${error.message}`,
      };
    }
  },
};
