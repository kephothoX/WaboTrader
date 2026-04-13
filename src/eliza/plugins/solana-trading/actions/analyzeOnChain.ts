/**
 * ANALYZE_ON_CHAIN Action — Deep on-chain analysis including holder analysis and whale tracking
 */
import { getSolanaService } from "../services/solanaService";

export const analyzeOnChain = {
    name: "ANALYZE_ON_CHAIN",
    description: "Perform deep on-chain analysis including holder distribution, whale tracking, and transaction flows",
    similes: ["analyze on-chain", "holder analysis", "whale tracking", "on-chain data", "deep analysis"],
    examples: [
        [
            { name: "{{user}}", content: { text: "Analyze SOL on-chain data" } },
            { name: "WaboTrader", content: { text: "Performing deep on-chain analysis of SOL..." } },
        ],
        [
            { name: "{{user}}", content: { text: "Show me BONK holder distribution" } },
            { name: "WaboTrader", content: { text: "Analyzing BONK holder distribution and whale activity..." } },
        ],
    ],
    validate: async (_runtime: any, message: any) => {
        const text = (message.content?.text || "").toLowerCase();
        return (
            text.includes("on-chain") ||
            text.includes("holder") ||
            text.includes("whale") ||
            text.includes("deep analysis") ||
            (text.includes("analyze") && (text.includes("chain") || text.includes("holders")))
        );
    },
    handler: async (_runtime: any, message: any) => {
        const text = message.content?.text || "";
        const tokenMatch = text.match(/(?:analyze|show)\s+(?:on-chain|holder|whale)?\s*(?:data|distribution|tracking)?\s+(?:for\s+)?(\S+)/i);
        const token = tokenMatch?.[1] || "SOL";

        try {
            const service = getSolanaService();
            const analysis = await service.analyzeOnChain(token);

            let responseText = `🔍 **On-Chain Analysis: ${analysis.symbol}**

🏦 **Holder Distribution:**
• **Total Holders:** ${analysis.holderStats.total.toLocaleString()}
• **Top 10 Holders:** ${((analysis.holderStats.top10Percentage || 0) * 100).toFixed(1)}% of supply
• **Top 100 Holders:** ${((analysis.holderStats.top100Percentage || 0) * 100).toFixed(1)}% of supply

🐋 **Whale Activity:**
• **Largest Holder:** ${analysis.whaleStats.largestHolder.percentage.toFixed(2)}% (${analysis.whaleStats.largestHolder.address.slice(0, 8)}...${analysis.whaleStats.largestHolder.address.slice(-4)})
• **Active Whales (24h):** ${analysis.whaleStats.activeWhales24h}
• **Large Transactions (24h):** ${analysis.whaleStats.largeTxCount24h}

💧 **Liquidity Analysis:**
• **DEX Liquidity:** $${(analysis.liquidity.dexLiquidity || 0).toLocaleString()}
• **Pool Concentration:** ${analysis.liquidity.poolConcentration || "N/A"}
• **Impermanent Loss Risk:** ${analysis.liquidity.ilRisk || "Low"}

📊 **Transaction Flow:**
• **24h Transactions:** ${analysis.transactionFlow.total24h.toLocaleString()}
• **Average Tx Size:** ${analysis.transactionFlow.avgTxSize?.toFixed(2) || "N/A"} ${analysis.symbol}
• **Buy Pressure:** ${analysis.transactionFlow.buyPressure || "N/A"}

⚠️ **Risk Indicators:**
${analysis.risks.map((risk) => `• ${risk}`).join("\n")}

💡 **Key Insights:**
${analysis.insights.map((insight) => `• ${insight}`).join("\n")}`;

            return {
                success: true,
                text: responseText,
                data: analysis
            };

        } catch (error: any) {
            console.error("On-chain analysis error:", error);
            return {
                success: false,
                text: `❌ Failed to perform on-chain analysis: ${error.message}`,
            };
        }
    },
};