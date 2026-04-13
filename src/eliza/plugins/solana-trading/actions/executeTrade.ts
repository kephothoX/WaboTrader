/**
 * EXECUTE_TRADE Action — Executes a token swap via Jupiter Aggregator on Solana
 */
import { getSolanaService } from "../services/solanaService";

export const executeTrade = {
  name: "EXECUTE_TRADE",
  description: "Execute a token swap on Solana via Jupiter Aggregator",
  similes: ["execute trade", "swap", "buy token", "sell token", "execute swap", "make trade"],
  examples: [
    [
      { name: "{{user}}", content: { text: "Execute trade: buy 1 SOL of BONK" } },
      { name: "WaboTrader", content: { text: "Getting a quote from Jupiter for the swap..." } },
    ],
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return (
      text.includes("execute") ||
      text.includes("swap") ||
      (text.includes("buy") && !text.includes("should")) ||
      (text.includes("sell") && !text.includes("should"))
    );
  },
  handler: async (_runtime: any, message: any) => {
    const text = message.content?.text || "";
    const service = getSolanaService();

    // Check wallet connection first
    if (!service.walletAddress) {
      return {
        success: false,
        text: `🔑 **Wallet Not Connected**

Please connect a Solana wallet to execute trades. The app requires a connected wallet for all trading operations.

**Supported Wallets:**
• Phantom
• Solflare
• Backpack
• Trust Wallet

Click the "Connect Wallet" button in the top right to get started.`,
      };
    }

    // Parse trade intent
    const buyMatch = text.match(/buy\s+([\d.]+)\s+(?:sol\s+(?:of|worth)\s+)?(\S+)/i);
    const sellMatch = text.match(/sell\s+([\d.]+)\s+(\S+)/i);
    const swapMatch = text.match(/swap\s+([\d.]+)\s+(\S+)\s+(?:to|for)\s+(\S+)/i);

    let inputMint: string;
    let outputMint: string;
    let amount: number;

    if (buyMatch) {
      amount = parseFloat(buyMatch[1]);
      const targetToken = buyMatch[2];
      inputMint = service.resolveTokenMint("SOL");
      outputMint = service.resolveTokenMint(targetToken);
    } else if (sellMatch) {
      amount = parseFloat(sellMatch[1]);
      const token = sellMatch[2];
      inputMint = service.resolveTokenMint(token);
      outputMint = service.resolveTokenMint("SOL");
    } else if (swapMatch) {
      amount = parseFloat(swapMatch[1]);
      inputMint = service.resolveTokenMint(swapMatch[2]);
      outputMint = service.resolveTokenMint(swapMatch[3]);
    } else {
      return {
        success: false,
        text: `⚠️ I couldn't parse your trade intent. Please use a format like:
• \`buy 0.5 SOL of BONK\`
• \`sell 1000 BONK\`
• \`swap 1 SOL for USDC\``,
      };
    }

    try {
      // Analyze the token first to get risk/volatility for slippage
      const analysis = await service.analyzeToken(outputMint);
      const slippageBps = service.calculateOptimalSlippage(analysis);
      
      // Get quote
      const quote = await service.getSwapQuote(inputMint, outputMint, amount, slippageBps);

      if (!quote) {
        return {
          success: false,
          text: "❌ Failed to get a quote from Jupiter. The token pair may not have sufficient liquidity.",
        };
      }

      const swapLink = service.generateSwapLink(inputMint, outputMint, amount);
      const impactWarning = quote.priceImpactPct > 1
        ? `\n⚠️ **High price impact: ${quote.priceImpactPct.toFixed(2)}%** — Use caution.`
        : "";

      return {
        success: true,
        text: `🔗 **Transaction Link Prepared (Non-Custodial)**

I've prepared a direct swap route via Jupiter using **${slippageBps / 100}% dynamic slippage** based on current market volatility and risk assessment (${analysis.riskScore}/10).

📋 **Trade Details:**
  • **Route**: ${quote.routePlan.join(" → ") || "Jupiter Best Route"}
  • **Input**: ${amount} [TOKEN]
  • **Estimated Output**: ${parseFloat(quote.outAmount) / 10**9} [TOKEN]
  • **Price Impact**: ${quote.priceImpactPct.toFixed(4)}%${impactWarning}

🛡️ **Sign Securely:**
Click the link below to review and sign this transaction in your personal wallet (Phantom/Solflare). This ensures your private keys never leave your device.

👉 **[EXECUTE SWAP ON JUPITER](${swapLink})**`,
        data: { quote, swapLink, analysis },
      };
    } catch (error: any) {
      return {
        success: false,
        text: `❌ Trade execution error: ${error.message}`,
      };
    }
  },
};
