/**
 * MARKET_OVERVIEW Action — Comprehensive market analysis with multiple token recommendations
 */
import { getSolanaService } from "../services/solanaService";

export const marketOverview = {
    name: "MARKET_OVERVIEW",
    description: "Provide comprehensive market overview with analysis of major tokens and trading recommendations",
    similes: ["market overview", "market analysis", "what's happening", "market summary", "trading opportunities", "analyze market"],
    examples: [
        [
            { name: "{{user}}", content: { text: "What's happening in the market?" } },
            { name: "WaboTrader", content: { text: "Let me give you a comprehensive market overview..." } },
        ],
        [
            { name: "{{user}}", content: { text: "Show me trading opportunities" } },
            { name: "WaboTrader", content: { text: "Analyzing current market conditions and opportunities..." } },
        ],
    ],
    validate: async (_runtime: any, message: any) => {
        const text = (message.content?.text || "").toLowerCase();
        return (
            text.includes("market overview") ||
            text.includes("market analysis") ||
            text.includes("what's happening") ||
            text.includes("market summary") ||
            text.includes("trading opportunities") ||
            (text.includes("analyze") && text.includes("market"))
        );
    },
    handler: async (_runtime: any, _message: any) => {
        try {
            const service = getSolanaService();

            // Analyze major tokens
            const majorTokens = [
                { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112" },
                { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
                { symbol: "USDT", name: "Tether USD", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
                { symbol: "BONK", name: "Bonk", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
                { symbol: "JUP", name: "Jupiter", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
                { symbol: "PYTH", name: "Pyth Network", mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt" },
                { symbol: "RAY", name: "Raydium", mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R" },
                { symbol: "ORCA", name: "Orca", mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE" }
            ];

            const analyses = [];
            const recommendations = [];

            for (const token of majorTokens) {
                try {
                    const analysis = await service.analyzeToken(token.symbol);
                    analyses.push(analysis);

                    // Generate quick recommendation
                    const rec = service.generateRecommendation(analysis);
                    recommendations.push({
                        symbol: token.symbol,
                        analysis,
                        recommendation: rec
                    });
                } catch (error) {
                    console.log(`Failed to analyze ${token.symbol}:`, error);
                }
            }

            // Sort by opportunity score (price change + volume + low risk)
            const opportunities = recommendations
                .map(rec => ({
                    ...rec,
                    score: (rec.analysis.priceChange24h * 0.3) +
                        (rec.analysis.volume24h / 1000000 * 0.4) -
                        (rec.analysis.riskScore * 0.3)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

            // Build comprehensive response
            let responseText = `🌍 **Solana Market Overview** (${new Date().toLocaleString()})\n\n`;

            // Major token summary
            responseText += `📊 **Major Token Performance:**\n`;
            for (const rec of recommendations.slice(0, 5)) {
                const change = rec.analysis.priceChange24h;
                const changeEmoji = change >= 0 ? "🟢" : "🔴";
                const actionEmoji = rec.recommendation.action === "BUY" ? "🟢" : rec.recommendation.action === "SELL" ? "🔴" : "🟡";

                responseText += `${changeEmoji} **${rec.symbol}**: $${rec.analysis.price.toFixed(rec.analysis.price < 1 ? 6 : 2)} `;
                responseText += `(${change >= 0 ? "+" : ""}${change.toFixed(2)}%) `;
                responseText += `${actionEmoji}${rec.recommendation.action}\n`;
            }

            // Top opportunities
            responseText += `\n🎯 **Top Trading Opportunities:**\n`;
            for (const opp of opportunities) {
                const actionEmoji = opp.recommendation.action === "BUY" ? "🟢" : opp.recommendation.action === "SELL" ? "🔴" : "🟡";
                const confEmoji = opp.recommendation.confidence === "HIGH" ? "⭐⭐⭐" : opp.recommendation.confidence === "MEDIUM" ? "⭐⭐" : "⭐";

                responseText += `${actionEmoji} **${opp.symbol}** - ${opp.recommendation.action} ${confEmoji}\n`;
                responseText += `  💰 $${opp.analysis.price.toFixed(opp.analysis.price < 1 ? 6 : 2)} `;
                responseText += `(${opp.analysis.priceChange24h >= 0 ? "+" : ""}${opp.analysis.priceChange24h.toFixed(2)}%)\n`;
                responseText += `  📊 Risk: ${opp.analysis.riskScore}/10 | Volume: $${formatNumber(opp.analysis.volume24h)}\n\n`;
            }

            // Market insights
            const bullishCount = recommendations.filter(r => r.recommendation.action === "BUY").length;
            const bearishCount = recommendations.filter(r => r.recommendation.action === "SELL").length;
            const neutralCount = recommendations.filter(r => r.recommendation.action === "HOLD").length;

            responseText += `📈 **Market Sentiment:** ${bullishCount} Bullish, ${neutralCount} Neutral, ${bearishCount} Bearish\n\n`;

            // Specific advice for stablecoins
            const usdcAnalysis = recommendations.find(r => r.symbol === "USDC");
            const usdtAnalysis = recommendations.find(r => r.symbol === "USDT");

            if (usdcAnalysis && usdtAnalysis) {
                responseText += `💵 **Stablecoin Analysis:**\n`;
                responseText += `• USDC: $${usdcAnalysis.analysis.price.toFixed(4)} (${usdcAnalysis.analysis.priceChange24h >= 0 ? "+" : ""}${usdcAnalysis.analysis.priceChange24h.toFixed(4)}%)\n`;
                responseText += `• USDT: $${usdtAnalysis.analysis.price.toFixed(4)} (${usdtAnalysis.analysis.priceChange24h >= 0 ? "+" : ""}${usdtAnalysis.analysis.priceChange24h.toFixed(4)}%)\n\n`;
            }

            responseText += `💡 **Proactive Recommendations:**\n`;
            if (bullishCount > bearishCount) {
                responseText += `• Market shows bullish momentum - consider long positions in top opportunities\n`;
            } else if (bearishCount > bullishCount) {
                responseText += `• Defensive stance recommended - consider stablecoin positions or profit-taking\n`;
            }

            responseText += `• Monitor ${opportunities[0]?.symbol} closely for potential breakout\n`;
            responseText += `• Consider portfolio rebalancing if heavily exposed to volatile assets\n\n`;

            responseText += `🔍 **Next Steps:** Ask me to \`analyze [TOKEN]\` for detailed analysis or \`recommend a trade on [TOKEN]\` for specific advice.`;

            return {
                success: true,
                text: responseText,
                data: {
                    analyses,
                    recommendations,
                    opportunities,
                    marketSentiment: { bullish: bullishCount, neutral: neutralCount, bearish: bearishCount }
                }
            };

        } catch (error: any) {
            console.error("Market overview error:", error);
            return {
                success: false,
                text: `❌ Failed to generate market overview: ${error.message}`,
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