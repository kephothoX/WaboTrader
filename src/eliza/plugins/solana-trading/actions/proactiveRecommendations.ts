/**
 * PROACTIVE_RECOMMENDATIONS Action — Agent-initiated trading suggestions based on market analysis
 */
import { getSolanaService } from "../services/solanaService";

export const proactiveRecommendations = {
    name: "PROACTIVE_RECOMMENDATIONS",
    description: "Provide autonomous trading recommendations based on current market conditions",
    similes: ["what should I trade", "trading ideas", "opportunities", "suggestions", "what's hot"],
    examples: [
        [
            { name: "{{user}}", content: { text: "What should I trade today?" } },
            { name: "WaboTrader", content: { text: "Let me analyze current market conditions and suggest opportunities..." } },
        ],
        [
            { name: "{{user}}", content: { text: "Any good opportunities?" } },
            { name: "WaboTrader", content: { text: "Scanning for high-conviction trading opportunities..." } },
        ],
    ],
    validate: async (_runtime: any, message: any) => {
        const text = (message.content?.text || "").toLowerCase();
        return (
            text.includes("what should i") ||
            text.includes("trading ideas") ||
            text.includes("opportunities") ||
            text.includes("suggestions") ||
            text.includes("what's hot") ||
            text.includes("recommend something")
        );
    },
    handler: async (_runtime: any, _message: any) => {
        try {
            const service = getSolanaService();

            // Analyze trending tokens for opportunities
            const trendingTokens = [
                { symbol: "SOL", name: "Solana", weight: 1.0 },
                { symbol: "BONK", name: "Bonk", weight: 0.8 },
                { symbol: "JUP", name: "Jupiter", weight: 0.9 },
                { symbol: "PYTH", name: "Pyth Network", weight: 0.7 },
                { symbol: "RAY", name: "Raydium", weight: 0.6 },
                { symbol: "ORCA", name: "Orca", weight: 0.5 },
            ];

            const opportunities = [];

            for (const token of trendingTokens) {
                try {
                    const analysis = await service.analyzeToken(token.symbol);
                    const recommendation = service.generateRecommendation(analysis);

                    // Calculate opportunity score
                    const score = calculateOpportunityScore(analysis, recommendation, token.weight);
                    opportunities.push({
                        token,
                        analysis,
                        recommendation,
                        score
                    });
                } catch (error) {
                    console.log(`Failed to analyze ${token.symbol}:`, error);
                }
            }

            // Sort by opportunity score
            opportunities.sort((a, b) => b.score - a.score);

            // Get top 3 opportunities
            const topOpportunities = opportunities.slice(0, 3);

            let responseText = `🎯 **Proactive Trading Recommendations** (${new Date().toLocaleDateString()})\n\n`;

            responseText += `Based on current market analysis, here are my top trading opportunities:\n\n`;

            for (let i = 0; i < topOpportunities.length; i++) {
                const opp = topOpportunities[i];
                const actionEmoji = opp.recommendation.action === "BUY" ? "🟢" : opp.recommendation.action === "SELL" ? "🔴" : "🟡";
                const confEmoji = opp.recommendation.confidence === "HIGH" ? "⭐⭐⭐" : opp.recommendation.confidence === "MEDIUM" ? "⭐⭐" : "⭐";

                responseText += `${i + 1}. ${actionEmoji} **${opp.token.symbol}** - ${opp.recommendation.action} ${confEmoji}\n`;
                responseText += `   💰 $${opp.analysis.price.toFixed(opp.analysis.price < 1 ? 6 : 2)}\n`;
                responseText += `   📈 24h: ${opp.analysis.priceChange24h >= 0 ? "+" : ""}${opp.analysis.priceChange24h.toFixed(2)}%\n`;
                responseText += `   📊 Risk: ${opp.analysis.riskScore}/10\n`;

                if (opp.recommendation.action === "BUY" && opp.recommendation.entryPrice) {
                    responseText += `   🎯 Entry: $${opp.recommendation.entryPrice.toFixed(opp.recommendation.entryPrice < 1 ? 6 : 2)}\n`;
                    responseText += `   💰 Position: ${opp.recommendation.positionSizePct}% of portfolio\n`;
                }

                responseText += `\n`;
            }

            // Market sentiment summary
            const bullishCount = opportunities.filter(o => o.recommendation.action === "BUY").length;
            const bearishCount = opportunities.filter(o => o.recommendation.action === "SELL").length;
            const neutralCount = opportunities.filter(o => o.recommendation.action === "HOLD").length;

            responseText += `📊 **Market Sentiment:** ${bullishCount} Bullish, ${neutralCount} Neutral, ${bearishCount} Bearish\n\n`;

            // Risk management advice
            responseText += `⚠️ **Risk Management:**\n`;
            responseText += `• Never invest more than you can afford to lose\n`;
            responseText += `• Diversify across multiple assets\n`;
            responseText += `• Set stop-loss orders to protect profits\n`;
            responseText += `• Consider stablecoins (USDC/USDT) for portfolio stability\n\n`;

            responseText += `💡 **Next Steps:**\n`;
            responseText += `• Ask me to \`analyze [TOKEN]\` for detailed analysis\n`;
            responseText += `• Say \`recommend a trade on [TOKEN]\` for specific advice\n`;
            responseText += `• Connect your wallet to execute trades\n\n`;

            responseText += `Remember: These are suggestions based on technical analysis. Always do your own research! 🚀`;

            return {
                success: true,
                text: responseText,
                data: {
                    opportunities: topOpportunities,
                    marketSentiment: { bullish: bullishCount, neutral: neutralCount, bearish: bearishCount }
                }
            };

        } catch (error: any) {
            console.error("Proactive recommendations error:", error);
            return {
                success: false,
                text: `❌ Failed to generate recommendations: ${error.message}`,
            };
        }
    },
};

function calculateOpportunityScore(analysis: any, recommendation: any, weight: number): number {
    let score = 0;

    // Price momentum (30% weight)
    score += (analysis.priceChange24h / 10) * 0.3; // Normalize to -3 to +3 range

    // Volume strength (25% weight)
    const volumeScore = Math.min(analysis.volume24h / 10000000, 3); // Cap at 3 for $10M+ volume
    score += volumeScore * 0.25;

    // Risk-adjusted return (25% weight)
    const riskAdjReturn = (analysis.priceChange24h * (1 - analysis.riskScore / 10));
    score += (riskAdjReturn / 5) * 0.25; // Normalize

    // Recommendation confidence (20% weight)
    const confScore = recommendation.confidence === "HIGH" ? 3 :
        recommendation.confidence === "MEDIUM" ? 2 : 1;
    score += confScore * 0.2;

    // Token weight multiplier
    score *= weight;

    return score;
}