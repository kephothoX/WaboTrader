/**
 * PERPS_ANALYTICS Action — Comprehensive Solana perpetuals market analysis
 */
import { getSolanaService } from "../services/solanaService";

export const perpsAnalytics = {
    name: "PERPS_ANALYTICS",
    description: "Provide comprehensive analysis of Solana perpetuals market including volume, protocols, and trading insights",
    similes: ["perps analytics", "perpetuals analysis", "solana perps", "perp market", "derivatives analysis", "futures market"],
    examples: [
        [
            { name: "{{user}}", content: { text: "Show me Solana perps analytics" } },
            { name: "WaboTrader", content: { text: "Analyzing Solana perpetuals market..." } },
        ],
        [
            { name: "{{user}}", content: { text: "What's happening in Solana perps?" } },
            { name: "WaboTrader", content: { text: "Let me check the latest perps data..." } },
        ],
        [
            { name: "{{user}}", content: { text: "Analyze perpetuals market" } },
            { name: "WaboTrader", content: { text: "Fetching comprehensive perps analytics..." } },
        ],
    ],
    validate: async (_runtime: any, message: any) => {
        const text = (message.content?.text || "").toLowerCase();
        return (
            text.includes("perps") ||
            text.includes("perpetuals") ||
            text.includes("derivatives") ||
            text.includes("futures") ||
            (text.includes("solana") && (text.includes("perp") || text.includes("future")))
        );
    },
    handler: async (_runtime: any, _message: any) => {
        try {
            // Fetch perps data from DeFi Llama API
            const response = await fetch('https://api.llama.fi/overview/open-interest');
            const data = await response.json();

            // Filter for Solana protocols
            const solanaProtocols = data.protocols.filter((protocol: any) =>
                protocol.chains && protocol.chains.includes('Solana')
            );

            // Calculate totals
            const totalVolume24h = solanaProtocols.reduce((sum: number, protocol: any) =>
                sum + (protocol.total24h || 0), 0
            );

            const totalVolume30d = solanaProtocols.reduce((sum: number, protocol: any) =>
                sum + (protocol.total30d || 0), 0
            );

            // Calculate weekly change
            const current7d = solanaProtocols.reduce((sum: number, protocol: any) =>
                sum + (protocol.total7d || 0), 0
            );

            const previous7d = solanaProtocols.reduce((sum: number, protocol: any) =>
                sum + (protocol.total14dto7d || 0), 0
            );

            const weeklyChange = previous7d > 0 ? ((current7d - previous7d) / previous7d) * 100 : 0;

            // Sort by 24h volume and get top protocols
            const topProtocols = solanaProtocols
                .sort((a: any, b: any) => (b.total24h || 0) - (a.total24h || 0))
                .slice(0, 5);

            // Format currency helper
            const formatCurrency = (value: number) => {
                if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
                return `$${value.toFixed(2)}`;
            };

            // Build comprehensive response
            let responseText = `📈 **Solana Perpetuals Analytics** (${new Date().toLocaleString()})\n\n`;

            // Market overview
            responseText += `🌍 **Market Overview:**\n`;
            responseText += `• 24h Volume: ${formatCurrency(totalVolume24h)}\n`;
            responseText += `• 30d Volume: ${formatCurrency(totalVolume30d)}\n`;
            responseText += `• Weekly Change: ${weeklyChange >= 0 ? '🟢' : '🔴'} ${weeklyChange >= 0 ? '+' : ''}${weeklyChange.toFixed(2)}%\n`;
            responseText += `• Active Protocols: ${solanaProtocols.length}\n\n`;

            // Top protocols
            responseText += `🏆 **Top Protocols by 24h Volume:**\n`;
            for (const protocol of topProtocols) {
                const change = protocol.change_1d || 0;
                const changeEmoji = change >= 0 ? "🟢" : "🔴";

                responseText += `${changeEmoji} **${protocol.displayName}**\n`;
                responseText += `  💰 24h: ${formatCurrency(protocol.total24h)}\n`;
                responseText += `  📊 Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\n`;
                responseText += `  📈 7d: ${formatCurrency(protocol.total7d)}\n\n`;
            }

            // Market insights
            const bullishProtocols = topProtocols.filter((p: any) => (p.change_1d || 0) > 0).length;
            const bearishProtocols = topProtocols.filter((p: any) => (p.change_1d || 0) < 0).length;

            responseText += `🎯 **Market Insights:**\n`;
            if (bullishProtocols > bearishProtocols) {
                responseText += `• Bullish momentum in top protocols (${bullishProtocols}/${topProtocols.length} showing gains)\n`;
                responseText += `• Consider monitoring for continued upward trends\n`;
            } else if (bearishProtocols > bullishProtocols) {
                responseText += `• Bearish pressure on major protocols (${bearishProtocols}/${topProtocols.length} showing losses)\n`;
                responseText += `• Exercise caution with leveraged positions\n`;
            } else {
                responseText += `• Mixed signals across top protocols\n`;
                responseText += `• Monitor individual protocol performance\n`;
            }

            // Volume analysis
            const avgVolume = totalVolume24h / solanaProtocols.length;
            responseText += `• Average protocol volume: ${formatCurrency(avgVolume)}\n`;
            responseText += `• Market concentration: ${((topProtocols[0]?.total24h || 0) / totalVolume24h * 100).toFixed(1)}% in top protocol\n\n`;

            // Trading recommendations
            responseText += `💡 **Trading Recommendations:**\n`;
            if (weeklyChange > 5) {
                responseText += `• Strong upward momentum - consider long positions with stop losses\n`;
            } else if (weeklyChange < -5) {
                responseText += `• Downward pressure - consider reducing exposure or hedging\n`;
            }

            const highGrowthProtocol = topProtocols.find((p: any) => (p.change_1d || 0) > 10);
            if (highGrowthProtocol) {
                responseText += `• ${highGrowthProtocol.displayName} showing strong growth (+${(highGrowthProtocol.change_1d || 0).toFixed(2)}%)\n`;
            }

            responseText += `\n🔍 **Available Commands:**\n`;
            responseText += `• "analyze [PROTOCOL]" - Deep dive into specific protocol\n`;
            responseText += `• "show perps chart" - View visual analytics\n`;
            responseText += `• "export perps data" - Download CSV/PNG data\n`;

            return {
                success: true,
                text: responseText,
                data: {
                    totalVolume24h,
                    totalVolume30d,
                    weeklyChange,
                    protocolCount: solanaProtocols.length,
                    topProtocols: topProtocols.map((p: any) => ({
                        name: p.displayName,
                        volume24h: p.total24h,
                        change1d: p.change_1d,
                        volume7d: p.total7d
                    })),
                    marketSentiment: bullishProtocols > bearishProtocols ? 'bullish' : bearishProtocols > bullishProtocols ? 'bearish' : 'neutral'
                }
            };

        } catch (error: any) {
            console.error("Perps analytics error:", error);
            return {
                success: false,
                text: `❌ Failed to fetch perps analytics: ${error.message}\n\n💡 Try again in a moment or check your connection.`,
            };
        }
    },
};