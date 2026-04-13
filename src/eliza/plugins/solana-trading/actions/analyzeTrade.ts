/**
 * ANALYZE_TRADE Action — Analyzes a Solana token's market data and risk profile
 */
import { getSolanaService, type TokenAnalysis } from "../services/solanaService";

export const analyzeTrade = {
  name: "ANALYZE_TRADE",
  description: "Analyze a Solana token for price, volume, liquidity, and risk assessment",
  similes: ["analyze token", "check token", "token analysis", "look up token", "research token"],
  examples: [
    [
      { name: "{{user}}", content: { text: "Analyze SOL" } },
      { name: "WaboTrader", content: { text: "Running full analysis on SOL..." } },
    ],
    [
      { name: "{{user}}", content: { text: "Check BONK token" } },
      { name: "WaboTrader", content: { text: "Let me analyze BONK for you..." } },
    ],
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return (
      text.includes("analyze") ||
      text.includes("analysis") ||
      text.includes("check") ||
      text.includes("look up") ||
      text.includes("research")
    );
  },
  handler: async (_runtime: any, message: any) => {
    const text = message.content?.text || "";
    const tokenMatch = text.match(/(?:analyze|check|research|look up)\s+(\S+)/i);
    const token = tokenMatch?.[1] || "SOL";

    try {
      const service = getSolanaService();
      const analysis: TokenAnalysis = await service.analyzeToken(token);

      const riskEmoji = analysis.riskScore <= 3 ? "🟢" : analysis.riskScore <= 6 ? "🟡" : "🔴";

      const responseText = `📊 **Token Analysis: ${analysis.symbol} (${analysis.name})**

💰 **Price:** $${analysis.price.toFixed(analysis.price < 1 ? 6 : 2)}
📈 **24h Change:** ${analysis.priceChange24h >= 0 ? "+" : ""}${analysis.priceChange24h.toFixed(2)}%
📊 **24h Volume:** $${formatNumber(analysis.volume24h)}
💧 **Liquidity:** $${formatNumber(analysis.liquidity)}
${analysis.marketCap ? `🏦 **Market Cap:** $${formatNumber(analysis.marketCap)}` : ""}

${riskEmoji} **Risk Score:** ${analysis.riskScore}/10
${analysis.riskFactors.map((f) => `  • ${f}`).join("\n")}

**Next Steps:** Ask me to \`recommend a trade\` on ${analysis.symbol} for entry/exit points and position sizing.`;

      return {
        success: true,
        text: responseText,
        data: { analysis },
      };
    } catch (error: any) {
      return {
        success: false,
        text: `❌ Failed to analyze ${token}: ${error.message}. Please check the token symbol or address and try again.`,
      };
    }
  },
};

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toFixed(2);
}
