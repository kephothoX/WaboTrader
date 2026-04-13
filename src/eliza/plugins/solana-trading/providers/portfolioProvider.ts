/**
 * Portfolio Provider — Tracks portfolio state and historical performance
 */
import { getSolanaService } from "../services/solanaService";

export const portfolioProvider = {
    name: "PORTFOLIO_PROVIDER",
    description: "Provides portfolio context and historical performance data",

    get: async () => {
        const service = getSolanaService();
        const address = service.walletAddress;

        if (!address) {
            return {
                text: "No wallet configured for portfolio tracking",
                data: { portfolio: null },
            };
        }

        try {
            const solBalance = await service.getSOLBalance();
            const solPrice = await service.getSOLPrice();
            const tokenBalances = await service.getTokenBalances();

            const totalValue = solBalance * solPrice + tokenBalances.reduce((sum, token) => sum + (token.usdValue || 0), 0);

            // Get historical data (mock implementation - would need database in production)
            const historicalData = await service.getPortfolioHistory(7); // Last 7 days

            const portfolioSummary = `Portfolio Status:
- Total Value: $${totalValue.toFixed(2)}
- SOL Balance: ${solBalance.toFixed(4)} SOL ($${(solBalance * solPrice).toFixed(2)})
- Assets Tracked: ${tokenBalances.length + 1}
- Last Updated: ${new Date().toISOString()}`;

            return {
                text: portfolioSummary,
                data: {
                    portfolio: {
                        address,
                        totalValue,
                        solBalance,
                        solPrice,
                        tokenBalances,
                        lastUpdated: Date.now(),
                        historicalData
                    }
                },
            };

        } catch (error: any) {
            console.error("Portfolio provider error:", error);
            return {
                text: `Portfolio tracking unavailable: ${error.message}`,
                data: { portfolio: null },
            };
        }
    },
};