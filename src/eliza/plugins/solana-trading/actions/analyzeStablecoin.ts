/**
 * ANALYZE_STABLECOIN Action — Specialized analysis for stablecoins (USDC, USDT, etc.)
 */
import { getSolanaService } from "../services/solanaService";

export const analyzeStablecoin = {
    name: "ANALYZE_STABLECOIN",
    description: "Provide specialized analysis for stablecoins including peg stability, volume, and DeFi usage",
    similes: ["analyze stablecoin", "check stable", "stablecoin analysis", "USDC analysis", "USDT analysis"],
    examples: [
        [
            { name: "{{user}}", content: { text: "Analyze USDC" } },
            { name: "WaboTrader", content: { text: "Analyzing USDC stability and market dynamics..." } },
        ],
        [
            { name: "{{user}}", content: { text: "Check USDT peg" } },
            { name: "WaboTrader", content: { text: "Examining USDT peg stability and on-chain metrics..." } },
        ],
    ],
    validate: async (_runtime: any, message: any) => {
        const text = (message.content?.text || "").toLowerCase();
        const stablecoinKeywords = ["usdc", "usdt", "dai", "busd", "ust", "stablecoin", "stable"];

        return (
            text.includes("analyze") &&
            stablecoinKeywords.some(keyword => text.includes(keyword))
        ) || (
                text.includes("check") &&
                stablecoinKeywords.some(keyword => text.includes(keyword))
            );
    },
    handler: async (_runtime: any, message: any) => {
        const text = message.content?.text || "";
        const tokenMatch = text.match(/(?:analyze|check)\s+(\w+)/i);
        const token = tokenMatch?.[1]?.toUpperCase() || "USDC";

        try {
            const service = getSolanaService();

            // Map common stablecoin names to symbols
            const stablecoinMap: Record<string, string> = {
                "USDC": "USDC",
                "USDT": "USDT",
                "DAI": "DAI",
                "BUSD": "BUSD",
                "UST": "UST",
                "USD": "USDC", // Default to USDC
                "STABLECOIN": "USDC"
            };

            const symbol = stablecoinMap[token] || token;
            const analysis = await service.analyzeToken(symbol);

            // Get additional stablecoin-specific metrics
            const pegStability = await calculatePegStability(symbol, analysis.price);
            const defiUsage = await analyzeDeFiUsage(symbol);
            const volumeAnalysis = analyzeStablecoinVolume(analysis);

            let responseText = `💵 **Stablecoin Analysis: ${symbol}**

💰 **Price & Peg:**
• Current Price: $${analysis.price.toFixed(6)}
• 24h Change: ${analysis.priceChange24h >= 0 ? "+" : ""}${analysis.priceChange24h.toFixed(6)}%
• Peg Deviation: ${pegStability.deviation > 0 ? "+" : ""}${pegStability.deviation.toFixed(6)}% from $1.00
• Peg Stability: ${pegStability.rating} ${pegStability.rating === "EXCELLENT" ? "🟢" : pegStability.rating === "GOOD" ? "🟡" : "🔴"}

📊 **Market Metrics:**
• 24h Volume: $${formatNumber(analysis.volume24h)}
• Market Cap: $${formatNumber(analysis.marketCap || 0)}
• Liquidity: $${formatNumber(analysis.liquidity)}

🏦 **DeFi Usage & Adoption:**
• Primary DEX: ${defiUsage.primaryDex}
• Major Protocols: ${defiUsage.protocols.join(", ")}
• TVL Impact: ${defiUsage.tvlImpact}
• Lending Rate: ${defiUsage.lendingRate}

📈 **Volume Analysis:**
• Volume Trend: ${volumeAnalysis.trend}
• Institutional Flow: ${volumeAnalysis.institutionalFlow}
• Retail Activity: ${volumeAnalysis.retailActivity}

⚠️ **Risk Assessment:**
• Peg Risk: ${pegStability.risk}
• Counterparty Risk: ${defiUsage.counterpartyRisk}
• Regulatory Risk: ${defiUsage.regulatoryRisk}

💡 **Trading Considerations:**
${symbol === "USDC" ? "• Circle-backed, widely accepted in DeFi\n• Strong institutional adoption\n• Recommended for portfolio stability" : ""}
${symbol === "USDT" ? "• Tether-backed, high market share\n• Monitor peg stability closely\n• Good for quick transactions" : ""}

**Next Steps:** Consider ${symbol} for portfolio stability or as a base for trading pairs. Ask me to \`recommend a trade\` if you're considering positions.`;

            return {
                success: true,
                text: responseText,
                data: {
                    analysis,
                    pegStability,
                    defiUsage,
                    volumeAnalysis
                }
            };

        } catch (error: any) {
            return {
                success: false,
                text: `❌ Failed to analyze ${token}: ${error.message}. Please check the token symbol and try again.`,
            };
        }
    },
};

async function calculatePegStability(symbol: string, currentPrice: number): Promise<{
    deviation: number;
    rating: string;
    risk: string;
}> {
    const deviation = ((currentPrice - 1.0) / 1.0) * 100;

    let rating: string;
    let risk: string;

    const absDeviation = Math.abs(deviation);
    if (absDeviation <= 0.01) {
        rating = "EXCELLENT";
        risk = "Very Low";
    } else if (absDeviation <= 0.05) {
        rating = "GOOD";
        risk = "Low";
    } else if (absDeviation <= 0.1) {
        rating = "FAIR";
        risk = "Medium";
    } else {
        rating = "POOR";
        risk = "High";
    }

    return { deviation, rating, risk };
}

async function analyzeDeFiUsage(symbol: string): Promise<{
    primaryDex: string;
    protocols: string[];
    tvlImpact: string;
    lendingRate: string;
    counterpartyRisk: string;
    regulatoryRisk: string;
}> {
    // Mock data - in real implementation, this would query DeFi protocols
    const deFiData: Record<string, any> = {
        "USDC": {
            primaryDex: "Raydium",
            protocols: ["Aave", "Compound", "Curve", "Uniswap V3"],
            tvlImpact: "High - Major DeFi backbone",
            lendingRate: "2-5% APY",
            counterpartyRisk: "Low - Circle backing",
            regulatoryRisk: "Medium - US regulated"
        },
        "USDT": {
            primaryDex: "Raydium",
            protocols: ["Aave", "Compound", "PancakeSwap"],
            tvlImpact: "High - Largest stablecoin",
            lendingRate: "1-4% APY",
            counterpartyRisk: "Medium - Tether backing",
            regulatoryRisk: "High - Regulatory scrutiny"
        }
    };

    return deFiData[symbol] || {
        primaryDex: "Various",
        protocols: ["Multiple DeFi protocols"],
        tvlImpact: "Medium",
        lendingRate: "2-4% APY",
        counterpartyRisk: "Medium",
        regulatoryRisk: "Medium"
    };
}

function analyzeStablecoinVolume(analysis: any): {
    trend: string;
    institutionalFlow: string;
    retailActivity: string;
} {
    const volume = analysis.volume24h;
    const priceChange = analysis.priceChange24h;

    let trend: string;
    if (volume > 100000000) { // $100M+
        trend = "Very High - Institutional activity";
    } else if (volume > 50000000) { // $50M+
        trend = "High - Active trading";
    } else if (volume > 10000000) { // $10M+
        trend = "Moderate - Normal activity";
    } else {
        trend = "Low - Limited activity";
    }

    const institutionalFlow = Math.abs(priceChange) < 0.1 ? "Stable - Holding pattern" :
        priceChange > 0 ? "Buying pressure" : "Selling pressure";

    const retailActivity = volume > 50000000 ? "High - Broad participation" :
        volume > 10000000 ? "Moderate - Active retail" : "Low - Limited retail";

    return { trend, institutionalFlow, retailActivity };
}

function formatNumber(num: number): string {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toFixed(2);
}