/**
 * GET_PORTFOLIO_ANALYTICS Action — Comprehensive portfolio analysis with performance metrics
 */
import { getSolanaService } from "../services/solanaService";

export const getPortfolioAnalytics = {
    name: "GET_PORTFOLIO_ANALYTICS",
    description: "Analyze portfolio performance, risk metrics, and provide rebalancing recommendations",
    similes: ["portfolio analytics", "performance analysis", "risk analysis", "portfolio health", "how is my portfolio"],
    examples: [
        [
            { name: "{{user}}", content: { text: "Show me my portfolio analytics" } },
            { name: "WaboTrader", content: { text: "Analyzing your portfolio performance and risk metrics..." } },
        ],
        [
            { name: "{{user}}", content: { text: "How is my portfolio doing?" } },
            { name: "WaboTrader", content: { text: "Let me check your portfolio health and performance..." } },
        ],
    ],
    validate: async (_runtime: any, message: any) => {
        const text = (message.content?.text || "").toLowerCase();
        return (
            text.includes("portfolio analytics") ||
            text.includes("performance analysis") ||
            text.includes("risk analysis") ||
            text.includes("portfolio health") ||
            (text.includes("how is my portfolio") && text.includes("doing"))
        );
    },
    handler: async (_runtime: any, _message: any) => {
        const service = getSolanaService();
        const address = service.walletAddress;

        if (!address) {
            return {
                success: false,
                text: `⚠️ No wallet configured. Set \`SOLANA_PRIVATE_KEY\` in your .env file to enable portfolio analytics.`,
            };
        }

        try {
            const solBalance = await service.getSOLBalance();
            const solPrice = await service.getSOLPrice();
            const tokenBalances = await service.getTokenBalances();

            // Calculate portfolio metrics
            const totalValue = solBalance * solPrice + tokenBalances.reduce((sum, token) => sum + (token.usdValue || 0), 0);

            // Mock historical data (in real implementation, this would come from a database or on-chain history)
            const historicalData = await service.getPortfolioHistory(30); // Last 30 days

            const performance = calculatePerformanceMetrics(historicalData);
            const risk = calculateRiskMetrics(historicalData);
            const diversification = calculateDiversificationMetrics(tokenBalances, solBalance * solPrice, totalValue);

            let responseText = `📊 **Portfolio Analytics**

💰 **Total Value:** $${totalValue.toFixed(2)}
📈 **30-Day Return:** ${performance.totalReturn >= 0 ? "+" : ""}${performance.totalReturn.toFixed(2)}%
📊 **Sharpe Ratio:** ${performance.sharpeRatio.toFixed(2)}
⚠️ **Max Drawdown:** ${risk.maxDrawdown.toFixed(2)}%
📊 **Volatility:** ${risk.volatility.toFixed(2)}%

🎯 **Diversification:**
• **SOL Allocation:** ${diversification.solAllocation.toFixed(1)}%
• **Top Token:** ${diversification.topToken} (${diversification.topTokenAllocation.toFixed(1)}%)
• **Concentration Risk:** ${diversification.concentrationRisk}

💡 **Recommendations:**
${performance.totalReturn < 0 ? "• Consider rebalancing to reduce losses\n" : ""}
${risk.volatility > 0.5 ? "• High volatility detected - consider defensive positions\n" : ""}
${diversification.concentrationRisk === "HIGH" ? "• Portfolio heavily concentrated - diversify across more assets\n" : ""}`;

            return {
                success: true,
                text: responseText,
                data: {
                    totalValue,
                    performance,
                    risk,
                    diversification,
                    holdings: [
                        { symbol: "SOL", balance: solBalance, usdValue: solBalance * solPrice, allocation: diversification.solAllocation },
                        ...tokenBalances.map(token => ({
                            symbol: token.symbol,
                            balance: token.balance,
                            usdValue: token.usdValue || 0,
                            allocation: ((token.usdValue || 0) / totalValue * 100)
                        }))
                    ]
                }
            };

        } catch (error: any) {
            console.error("Portfolio analytics error:", error);
            return {
                success: false,
                text: `❌ Failed to analyze portfolio: ${error.message}`,
            };
        }
    },
};

// Helper functions for calculations
function calculatePerformanceMetrics(historicalData: any[]) {
    if (!historicalData.length) {
        return { totalReturn: 0, sharpeRatio: 0 };
    }

    const startValue = historicalData[0].value;
    const endValue = historicalData[historicalData.length - 1].value;
    const totalReturn = ((endValue - startValue) / startValue) * 100;

    // Calculate daily returns
    const dailyReturns = [];
    for (let i = 1; i < historicalData.length; i++) {
        const dailyReturn = (historicalData[i].value - historicalData[i - 1].value) / historicalData[i - 1].value;
        dailyReturns.push(dailyReturn);
    }

    const avgReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const volatility = Math.sqrt(dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length);
    const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;

    return { totalReturn, sharpeRatio };
}

function calculateRiskMetrics(historicalData: any[]) {
    if (!historicalData.length) {
        return { maxDrawdown: 0, volatility: 0 };
    }

    // Calculate drawdowns
    let peak = historicalData[0].value;
    let maxDrawdown = 0;

    for (const data of historicalData) {
        if (data.value > peak) {
            peak = data.value;
        }
        const drawdown = (peak - data.value) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Calculate volatility (standard deviation of returns)
    const returns = [];
    for (let i = 1; i < historicalData.length; i++) {
        returns.push((historicalData[i].value - historicalData[i - 1].value) / historicalData[i - 1].value);
    }

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);

    return { maxDrawdown: maxDrawdown * 100, volatility };
}

function calculateDiversificationMetrics(tokenBalances: any[], solValue: number, totalValue: number) {
    const solAllocation = (solValue / totalValue) * 100;

    let topToken = "None";
    let topTokenAllocation = 0;

    for (const token of tokenBalances) {
        const allocation = ((token.usdValue || 0) / totalValue) * 100;
        if (allocation > topTokenAllocation) {
            topToken = token.symbol;
            topTokenAllocation = allocation;
        }
    }

    let concentrationRisk = "LOW";
    if (solAllocation > 70 || topTokenAllocation > 50) {
        concentrationRisk = "HIGH";
    } else if (solAllocation > 50 || topTokenAllocation > 30) {
        concentrationRisk = "MEDIUM";
    }

    return { solAllocation, topToken, topTokenAllocation, concentrationRisk };
}