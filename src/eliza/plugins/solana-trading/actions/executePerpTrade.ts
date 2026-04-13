/**
 * EXECUTE_PERP_TRADE Action — Executes a long/short perpetual position
 */
import { getSolanaService } from "../services/solanaService";

export const executePerpTrade = {
  name: "EXECUTE_PERP_TRADE",
  description: "Execute a perpetual long or short position with leverage on Solana (using Jupiter/Drift/Mango)",
  similes: ["open long", "open short", "perp trade", "leverage trade", "long sol", "short btc"],
  examples: [
    [
      { name: "{{user}}", content: { text: "Open 2x long on SOL with 1 SOL collateral" } },
      { name: "WaboTrader", content: { text: "Preparing your 2x Long on SOL via Jupiter Perps..." } },
    ],
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return (
      (text.includes("long") || text.includes("short")) &&
      (text.includes("open") || text.includes("trade") || text.includes("leverage"))
    );
  },
  handler: async (_runtime: any, message: any) => {
    const text = message.content?.text || "";
    const service = getSolanaService();

    // Parse intent: "Open 2x long on SOL with 1 SOL collateral"
    const longMatch = text.match(/long\s+(?:on\s+)?(\S+)/i);
    const shortMatch = text.match(/short\s+(?:on\s+)?(\S+)/i);
    const levMatch = text.match(/([\d.]+)x/i);
    const collatMatch = text.match(/with\s+([\d.]+)\s+(\S+)\s+(?:as\s+)?collateral/i);

    const side = longMatch ? "LONG" : "SHORT";
    const symbol = longMatch ? longMatch[1].toUpperCase() : (shortMatch ? shortMatch[1].toUpperCase() : "SOL");
    const leverage = levMatch ? parseFloat(levMatch[1]) : 1.1;
    const collateralAmount = collatMatch ? parseFloat(collatMatch[1]) : 0.1;

    try {
      const quote = await service.getPerpQuote(symbol, side, collateralAmount, leverage);
      const perpLink = service.generatePerpLink(quote);
      
      let responseText = `📈 **Perpetual Trade Prepared (${quote.protocol})**\n\n`;
      responseText += `Side: **${quote.side}**\n`;
      responseText += `Asset: **${quote.symbol}**\n`;
      responseText += `Leverage: **${quote.leverage.toFixed(1)}x** ${quote.capped ? "(Capped for safety)" : ""}\n`;
      responseText += `Collateral: **${quote.amount} SOL**\n`;
      responseText += `\n📊 **Risk Analysis:**\n`;
      responseText += `• Est. Entry: $${quote.entryPrice.toFixed(2)}\n`;
      responseText += `• Liquidation: $${quote.liquidationPrice.toFixed(2)}\n`;
      responseText += `• Total Fee: $${quote.fee.toFixed(4)}\n\n`;
      
      responseText += `👉 **[EXECUTE PERP ON JUPITER](${perpLink})**\n`;
      responseText += `\n*Note: High leverage is extremely risky. Ensure you have sufficient collateral.*`;

      return {
        success: true,
        text: responseText,
        data: { quote, perpLink }
      };

    } catch (error: any) {
      return {
        success: false,
        text: `❌ Failed to prepare perp trade: ${error.message}`
      };
    }
  },
};
