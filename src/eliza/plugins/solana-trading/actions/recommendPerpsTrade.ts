/**
 * RECOMMEND_PERPS_TRADE Action — AI-powered trading recommendations for Solana perps
 */
import { getSolanaService } from "../services/solanaService";

export const recommendPerpsTrade = {
    name: "RECOMMEND_PERPS_TRADE",
    description: "Provide AI-powered trading recommendations for Solana perpetuals based on market analysis and risk assessment",
    similes: ["recommend perps trade", "perps trading advice", "should I trade perps", "perps strategy", "trading recommendation"],
    examples: [
        [
            { name: "{{user}}", content: { text: "Should I trade Solana perps?" } },
            { name: "WaboTrader", content: { text: "Analyzing market conditions for perps trading recommendations..." } },
        ],
        [
            { name: "{{user}}", content: { text: "Recommend a perps trade" } },
            { name: "WaboTrader", content: { text: "Generating personalized perps trading recommendation..." } },
        ],
        [
            { name: "{{user}}", content: { text: "What's a good perps strategy?" } },
            { name: "WaboTrader", content: { text: "Developing perps trading strategy based on current market data..." } },
        ],
    ],
    validate: async (_runtime: any, message: any) => {
        const text = (message.content?.text || "").toLowerCase();
        return (
            (text.includes("recommend") || text.includes("should") || text.includes("strategy")) &&
            (text.includes("perps") || text.includes("perp") || text.includes("trade"))
        );
    },
    handler: async (_runtime: any, message: any) => {
        try {
            // Fetch current market data
            const response = await fetch('https://api.llama.fi/overview/open-interest');
            const data = await response.json();

            // Filter for Solana protocols
            const solanaProtocols = data.protocols.filter((protocol: any) =>
                protocol.chains && protocol.chains.includes('Solana')
            );

            // Calculate market metrics
            const totalVolume24h = solanaProtocols.reduce((sum: number, protocol: any) =>
                sum + (protocol.total24h || 0), 0
            );

            const bullishProtocols = solanaProtocols.filter((p: any) => (p.change_1d || 0) > 0).length;
            const bearishProtocols = solanaProtocols.filter((p: any) => (p.change_1d || 0) < 0).length;

            // Market sentiment
            const marketSentiment = bullishProtocols > bearishProtocols ? 'bullish' :
                bearishProtocols > bullishProtocols ? 'bearish' : 'neutral';

            // Find top performing protocols
            const topPerformers = solanaProtocols
                .sort((a: any, b: any) => (b.change_1d || 0) - (a.change_1d || 0))
                .slice(0, 3);

            const worstPerformers = solanaProtocols
                .sort((a: any, b: any) => (a.change_1d || 0) - (b.change_1d || 0))
                .slice(0, 3);

            // Risk assessment
            const volatility = solanaProtocols.reduce((sum: number, p: any) =>
                sum + Math.abs(p.change_1d || 0), 0
            ) / solanaProtocols.length;

            // Format currency helper
            const formatCurrency = (value: number) => {
                if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
                return `$${value.toFixed(2)}`;
            };

            // Build recommendation
            let responseText = `🎯 **Solana Perps Trading Recommendation**\n`;
            responseText += `📅 **${new Date().toLocaleString()}**\n\n`;

            // Market overview
            responseText += `🌍 **Market Overview:**\n`;
            responseText += `• Total 24h Volume: ${formatCurrency(totalVolume24h)}\n`;
            responseText += `• Market Sentiment: ${marketSentiment === 'bullish' ? '🟢 Bullish' : marketSentiment === 'bearish' ? '🔴 Bearish' : '🟡 Neutral'}\n`;
            responseText += `• Active Protocols: ${solanaProtocols.length}\n`;
            responseText += `• Average Volatility: ${volatility.toFixed(2)}%\n\n`;

            // Primary recommendation
            responseText += `💡 **Primary Recommendation:**\n`;

            if (marketSentiment === 'bullish' && volatility < 10) {
                responseText += `🟢 **BULLISH OUTLOOK** - Consider long positions\n`;
                responseText += `• Market showing positive momentum with controlled volatility\n`;
                responseText += `• Good conditions for leveraged long positions\n\n`;

                // Suggest specific protocols
                if (topPerformers.length > 0) {
                    responseText += `🎯 **Recommended Protocols:**\n`;
                    for (const protocol of topPerformers.slice(0, 2)) {
                        responseText += `• ${protocol.displayName} (+${(protocol.change_1d || 0).toFixed(2)}%)\n`;
                    }
                    responseText += `\n`;
                }

            } else if (marketSentiment === 'bearish' && volatility > 15) {
                responseText += `🔴 **BEARISH OUTLOOK** - Exercise caution\n`;
                responseText += `• High volatility with negative momentum\n`;
                responseText += `• Consider reducing exposure or hedging positions\n\n`;

            } else if (volatility > 20) {
                responseText += `⚠️ **HIGH VOLATILITY** - Wait for stabilization\n`;
                responseText += `• Extreme market conditions - avoid new positions\n`;
                responseText += `• Monitor for volatility contraction before entering\n\n`;

            } else {
                responseText += `🟡 **NEUTRAL/STABLE** - Selective opportunities\n`;
                responseText += `• Market in consolidation phase\n`;
                responseText += `• Look for breakouts or wait for clearer trends\n\n`;
            }

            // Risk management
            responseText += `🛡️ **Risk Management Guidelines:**\n`;
            responseText += `• Maximum position size: 5-10% of portfolio\n`;
            responseText += `• Use stop losses: ${volatility > 10 ? '2-3%' : '1-2%'} below entry\n`;
            responseText += `• Take profits: ${volatility > 10 ? '5-10%' : '3-5%'} above entry\n`;
            responseText += `• Monitor liquidation levels closely\n\n`;

            // Strategy suggestions
            responseText += `📋 **Strategy Suggestions:**\n`;

            if (marketSentiment === 'bullish') {
                responseText += `• Long bias with trailing stops\n`;
                responseText += `• Scale into positions on pullbacks\n`;
                responseText += `• Consider funding rate arbitrage\n`;
            } else if (marketSentiment === 'bearish') {
                responseText += `• Reduce leverage or close positions\n`;
                responseText += `• Consider short positions with tight stops\n`;
                responseText += `• Monitor for capitulation signals\n`;
            } else {
                responseText += `• Range trading between support/resistance\n`;
                responseText += `• Wait for directional momentum\n`;
                responseText += `• Focus on high-conviction setups only\n`;
            }

            responseText += `\n`;

            // Performance highlights
            if (topPerformers.length > 0) {
                responseText += `🚀 **Top Performers (24h):**\n`;
                for (const protocol of topPerformers.slice(0, 2)) {
                    responseText += `• ${protocol.displayName}: +${(protocol.change_1d || 0).toFixed(2)}%\n`;
                }
                responseText += `\n`;
            }

            // Warning section
            responseText += `⚠️ **Important Disclaimers:**\n`;
            responseText += `• This is not financial advice - DYOR\n`;
            responseText += `• Perps trading involves high risk of loss\n`;
            responseText += `• Always use proper risk management\n`;
            responseText += `• Market conditions can change rapidly\n\n`;

            responseText += `🔄 **Next Update:** ${new Date(Date.now() + 3600000).toLocaleString()}\n`;

            return {
                success: true,
                text: responseText,
                data: {
                    marketSentiment,
                    totalVolume24h,
                    volatility,
                    recommendedAction: marketSentiment === 'bullish' ? 'long' :
                        marketSentiment === 'bearish' ? 'caution' : 'wait',
                    topPerformers: topPerformers.map((p: any) => ({
                        name: p.displayName,
                        change1d: p.change_1d
                    }))
                }
            };

        } catch (error: any) {
            console.error("Trading recommendation error:", error);
            return {
                success: false,
                text: `❌ Failed to generate trading recommendation: ${error.message}\n\n💡 Try again in a moment or check market data availability.`,
            };
        }
    },
};