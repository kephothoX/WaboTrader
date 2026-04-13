/**
 * ANALYZE_PERPS_PROTOCOL Action — Deep analysis of individual Solana perps protocols
 */
import { getSolanaService } from "../services/solanaService";

export const analyzePerpsProtocol = {
    name: "ANALYZE_PERPS_PROTOCOL",
    description: "Provide detailed analysis of a specific Solana perpetuals protocol including metrics, trends, and trading insights",
    similes: ["analyze perps protocol", "deep dive protocol", "protocol analysis", "check protocol", "protocol metrics"],
    examples: [
        [
            { name: "{{user}}", content: { text: "Analyze Jupiter Perps" } },
            { name: "WaboTrader", content: { text: "Analyzing Jupiter Perps protocol..." } },
        ],
        [
            { name: "{{user}}", content: { text: "Deep dive into Zeta Markets" } },
            { name: "WaboTrader", content: { text: "Fetching detailed analysis for Zeta Markets..." } },
        ],
        [
            { name: "{{user}}", content: { text: "Check Mango Markets protocol" } },
            { name: "WaboTrader", content: { text: "Analyzing Mango Markets perps protocol..." } },
        ],
    ],
    validate: async (_runtime: any, message: any) => {
        const text = (message.content?.text || "").toLowerCase();
        return (
            (text.includes("analyze") || text.includes("check") || text.includes("deep dive")) &&
            (text.includes("protocol") || text.includes("perps") || text.includes("perp"))
        );
    },
    handler: async (_runtime: any, message: any) => {
        try {
            const text = (message.content?.text || "").toLowerCase();

            // Extract protocol name from message
            const protocolNames = [
                "jupiter", "zeta", "mango", "drift", "psyoptions", "solanatracker",
                "orca", "raydium", "serum", "openbook", "phoenix", "lifinity"
            ];

            let targetProtocol = null;
            for (const name of protocolNames) {
                if (text.includes(name)) {
                    targetProtocol = name;
                    break;
                }
            }

            if (!targetProtocol) {
                return {
                    success: false,
                    text: `❌ Could not identify the protocol to analyze.\n\n📋 **Supported Protocols:**\n• Jupiter Perps\n• Zeta Markets\n• Mango Markets\n• Drift Protocol\n• PsyOptions\n• Solana Tracker\n• Orca\n• Raydium\n• Serum\n• OpenBook\n• Phoenix\n• Lifinity\n\n💡 Try: "analyze Jupiter Perps" or "deep dive Zeta Markets"`,
                };
            }

            // Fetch perps data
            const response = await fetch('https://api.llama.fi/overview/open-interest');
            const data = await response.json();

            // Find the specific protocol
            const protocol = data.protocols.find((p: any) =>
                p.name.toLowerCase().includes(targetProtocol) ||
                p.displayName.toLowerCase().includes(targetProtocol)
            );

            if (!protocol) {
                return {
                    success: false,
                    text: `❌ Protocol "${targetProtocol}" not found in current perps data.\n\n🔍 **Available Solana Perps Protocols:**\n${data.protocols
                        .filter((p: any) => p.chains && p.chains.includes('Solana'))
                        .map((p: any) => `• ${p.displayName}`)
                        .join('\n')}`,
                };
            }

            // Format currency helper
            const formatCurrency = (value: number) => {
                if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
                return `$${value.toFixed(2)}`;
            };

            // Calculate trends
            const change1d = protocol.change_1d || 0;
            const change7d = protocol.change_7d || 0;
            const change30d = protocol.change_30d || 0;

            // Volume analysis
            const volume24h = protocol.total24h || 0;
            const volume7d = protocol.total7d || 0;
            const volume30d = protocol.total30d || 0;

            // Market share calculation
            const solanaProtocols = data.protocols.filter((p: any) =>
                p.chains && p.chains.includes('Solana')
            );
            const totalSolanaVolume = solanaProtocols.reduce((sum: number, p: any) =>
                sum + (p.total24h || 0), 0
            );
            const marketShare = totalSolanaVolume > 0 ? (volume24h / totalSolanaVolume) * 100 : 0;

            // Build detailed analysis
            let responseText = `🔬 **${protocol.displayName} Protocol Analysis**\n`;
            responseText += `📊 **Protocol Metrics:**\n`;
            responseText += `• 24h Volume: ${formatCurrency(volume24h)}\n`;
            responseText += `• 7d Volume: ${formatCurrency(volume7d)}\n`;
            responseText += `• 30d Volume: ${formatCurrency(volume30d)}\n`;
            responseText += `• Market Share: ${marketShare.toFixed(2)}%\n\n`;

            // Performance analysis
            responseText += `📈 **Performance Trends:**\n`;
            const trend1d = change1d >= 0 ? "🟢" : "🔴";
            const trend7d = change7d >= 0 ? "🟢" : "🔴";
            const trend30d = change30d >= 0 ? "🟢" : "🔴";

            responseText += `${trend1d} 24h Change: ${change1d >= 0 ? '+' : ''}${change1d.toFixed(2)}%\n`;
            responseText += `${trend7d} 7d Change: ${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%\n`;
            responseText += `${trend30d} 30d Change: ${change30d >= 0 ? '+' : ''}${change30d.toFixed(2)}%\n\n`;

            // Trading insights
            responseText += `🎯 **Trading Insights:**\n`;

            // Momentum analysis
            if (change1d > 5 && change7d > 10) {
                responseText += `• Strong bullish momentum - consider long positions\n`;
            } else if (change1d < -5 && change7d < -10) {
                responseText += `• Bearish trend developing - reduce exposure\n`;
            } else if (Math.abs(change1d) < 2) {
                responseText += `• Sideways movement - wait for clearer signals\n`;
            }

            // Volume analysis
            const avgDailyVolume = volume30d / 30;
            if (volume24h > avgDailyVolume * 1.5) {
                responseText += `• High volume day - increased market interest\n`;
            } else if (volume24h < avgDailyVolume * 0.7) {
                responseText += `• Low volume day - reduced liquidity\n`;
            }

            // Market share insights
            if (marketShare > 20) {
                responseText += `• Dominant market position - high influence on Solana perps\n`;
            } else if (marketShare < 5) {
                responseText += `• Smaller player - monitor for growth potential\n`;
            }

            // Risk assessment
            responseText += `\n⚠️ **Risk Assessment:**\n`;
            if (change30d < -20) {
                responseText += `• High risk - significant 30d decline\n`;
            } else if (change30d > 20) {
                responseText += `• Moderate risk - strong growth may attract competition\n`;
            } else {
                responseText += `• Moderate risk - stable performance\n`;
            }

            // Recommendations
            responseText += `\n💡 **Recommendations:**\n`;
            if (change1d > 0 && marketShare > 10) {
                responseText += `• Consider monitoring for entry opportunities\n`;
            }
            if (volume24h > avgDailyVolume) {
                responseText += `• High volume suggests strong interest\n`;
            }
            responseText += `• Always use stop losses and position sizing\n`;
            responseText += `• Monitor for news and protocol updates\n\n`;

            // Additional data
            if (protocol.url) {
                responseText += `🔗 **Links:**\n`;
                responseText += `• Website: ${protocol.url}\n`;
            }

            responseText += `📅 **Last Updated:** ${new Date().toLocaleString()}\n`;

            return {
                success: true,
                text: responseText,
                data: {
                    protocol: protocol.displayName,
                    volume24h,
                    change1d,
                    change7d,
                    change30d,
                    marketShare,
                    riskLevel: change30d < -20 ? 'high' : change30d > 20 ? 'moderate' : 'low'
                }
            };

        } catch (error: any) {
            console.error("Protocol analysis error:", error);
            return {
                success: false,
                text: `❌ Failed to analyze protocol: ${error.message}\n\n💡 Try again or specify a different protocol.`,
            };
        }
    },
};