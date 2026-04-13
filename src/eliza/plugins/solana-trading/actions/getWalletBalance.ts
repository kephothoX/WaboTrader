/**
 * GET_WALLET_BALANCE Action — Displays SOL and token balances with USD values
 */
import { getSolanaService } from "../services/solanaService";

export const getWalletBalance = {
  name: "GET_WALLET_BALANCE",
  description: "Show SOL and SPL token balances for the configured wallet",
  similes: ["balance", "wallet", "my tokens", "portfolio", "holdings", "what do I have"],
  examples: [
    [
      { name: "{{user}}", content: { text: "What's my balance?" } },
      { name: "WaboTrader", content: { text: "Let me check your wallet balance..." } },
    ],
    [
      { name: "{{user}}", content: { text: "Show my wallet" } },
      { name: "WaboTrader", content: { text: "Fetching your wallet details..." } },
    ],
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return (
      text.includes("balance") ||
      text.includes("wallet") ||
      text.includes("portfolio") ||
      text.includes("holdings") ||
      text.includes("my tokens")
    );
  },
  handler: async (_runtime: any, _message: any) => {
    // Get wallet address from runtime (client-side) first, then fallback to service
    const walletAddressFromClient = _runtime?.walletAddress || _message?.content?.walletAddress;
    const service = getSolanaService();

    // Use client wallet first, then service wallet as fallback
    let address = walletAddressFromClient || service.walletAddress;

    console.log("GET_WALLET_BALANCE - Address from client:", walletAddressFromClient);
    console.log("GET_WALLET_BALANCE - Service wallet:", service.walletAddress);
    console.log("GET_WALLET_BALANCE - Final address:", address);

    if (!address) {
      console.warn("GET_WALLET_BALANCE - No wallet address found");
      return {
        success: false,
        text: `🔗 **No Wallet Connected**

To check your portfolio and execute trades, you need to connect your Solana wallet first.

Supported wallets:
• Phantom
• Backpack
• Solflare
• Magic Eden
• Trust Wallet

Click the "Connect Wallet" button in the top right to get started.`,
      };
    }

    try {
      // Pass the client wallet address to the service methods
      const solBalance = await service.getSOLBalance(address);
      const solPrice = await service.getSOLPrice();
      const solUsdValue = solBalance * solPrice;
      const tokenBalances = await service.getTokenBalances(address);

      let totalUsdValue = solUsdValue;
      let tokenLines = "";

      if (tokenBalances.length > 0) {
        for (const token of tokenBalances) {
          const usdStr = token.usdValue !== null ? `$${token.usdValue.toFixed(2)}` : "N/A";
          tokenLines += `  • ${token.symbol}: ${token.balance.toFixed(token.decimals > 4 ? 4 : 2)} (${usdStr})\n`;
          if (token.usdValue) totalUsdValue += token.usdValue;
        }
      }

      const shortAddr = `${address.slice(0, 4)}...${address.slice(-4)}`;

      return {
        success: true,
        text: `💰 **Wallet Balance** (${shortAddr})

**SOL:** ${solBalance.toFixed(4)} SOL ($${solUsdValue.toFixed(2)})

${tokenBalances.length > 0 ? `**SPL Tokens:**\n${tokenLines}` : "**SPL Tokens:** None found"}

💵 **Total Portfolio Value:** ~$${totalUsdValue.toFixed(2)}

_Network: ${process.env.SOLANA_NETWORK || "mainnet-beta"}_`,
        data: {
          address,
          solBalance,
          solPrice,
          solUsdValue,
          tokenBalances,
          totalUsdValue,
        },
      };
    } catch (error: any) {
      console.error("Error fetching wallet balance:", error);
      return {
        success: false,
        text: `❌ Failed to fetch wallet balance: ${error.message}`,
      };
    }
  },
};
