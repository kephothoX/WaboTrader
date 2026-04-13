/**
 * Market Data Provider — Injects live Solana market context into agent conversations
 */
import { getSolanaService } from "../services/solanaService";

export const marketDataProvider = {
  name: "SOLANA_MARKET_DATA",
  description: "Provides live Solana market data and trending tokens context",
  dynamic: true,
  get: async () => {
    try {
      const service = getSolanaService();
      const solPrice = await service.getSOLPrice();

      // Fetch top token prices including stablecoins
      const topMints = [
        "So11111111111111111111111111111111111111112", // SOL
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
        "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
        "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // JUP
        "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt", // PYTH
        "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY
      ];
      const prices = await service.getMultipleTokenPrices(topMints);

      const marketSummary = `Current Solana Market Data (${new Date().toISOString()}):
- SOL: $${solPrice.toFixed(2)}
- USDC: $${(prices[topMints[1]] || 0).toFixed(4)} (24h change: analyze for details)
- USDT: $${(prices[topMints[2]] || 0).toFixed(4)} (24h change: analyze for details)
- BONK: $${(prices[topMints[3]] || 0).toFixed(8)}
- JUP: $${(prices[topMints[4]] || 0).toFixed(4)}
- PYTH: $${(prices[topMints[5]] || 0).toFixed(4)}
- RAY: $${(prices[topMints[6]] || 0).toFixed(4)}

Market sentiment analysis available. Ask for 'market overview' for comprehensive analysis.`;

      return {
        text: marketSummary,
        data: { solPrice, prices, timestamp: Date.now() },
      };
    } catch {
      return {
        text: "Market data temporarily unavailable",
        data: {},
      };
    }
  },
};
