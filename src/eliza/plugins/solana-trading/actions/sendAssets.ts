/**
 * SEND_ASSETS Action — Queues a crypto transfer for batch approval
 */
import { getSolanaService } from "../services/solanaService";

export const sendAssets = {
  name: "SEND_ASSETS",
  description: "Queue a crypto transfer (SOL/SPL) for later batch approval via Telegram",
  similes: ["send money", "pay someone", "transfer crypto", "send sol", "pay usdc", "transfer tokens"],
  examples: [
    [
      { name: "{{user}}", content: { text: "Send 0.05 SOL to 7vH5..." } },
      { name: "WaboTrader", content: { text: "Queued 0.05 SOL transfer to 7vH5... for your next batch approval." } },
    ],
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return (
      text.includes("send") ||
      text.includes("pay") ||
      text.includes("transfer")
    );
  },
  handler: async (_runtime: any, message: any) => {
    const text = message.content?.text || "";
    const service = getSolanaService();

    // Parse intent: "Send 0.05 SOL to [ADDRESS]"
    const solMatch = text.match(/(?:send|pay|transfer)\s+([\d.]+)\s+(?:sol\s+)?to\s+(\S+)/i);
    const tokenMatch = text.match(/(?:send|pay|transfer)\s+([\d.]+)\s+(\S+)\s+to\s+(\S+)/i);

    let amount: number;
    let recipient: string;
    let mint: string = "So11111111111111111111111111111111111111112"; // Default SOL
    let symbol: string = "SOL";

    if (solMatch) {
      amount = parseFloat(solMatch[1]);
      recipient = solMatch[2];
    } else if (tokenMatch) {
      amount = parseFloat(tokenMatch[1]);
      symbol = tokenMatch[2].toUpperCase();
      recipient = tokenMatch[3];
      mint = service.resolveTokenMint(symbol);
    } else {
      return {
        success: false,
        text: "⚠️ I couldn't parse the transfer details. Please use: `Send [amount] [token] to [address]`",
      };
    }

    try {
      const id = await service.queueTransfer(recipient, amount, mint);
      
      return {
        success: true,
        text: `✅ **Transfer Queued (Batch Approval Required)**
        
Recipient: \`${recipient.slice(0,6)}...${recipient.slice(-4)}\`
Amount: **${amount} ${symbol}**
Queue ID: \`${id}\`

As per your security settings, this transfer is now in your **Pending Approvals** list. You can review and sign this (along with other pending payments) in a single batch from the Telegram Mini App or via the /pay dashboard.`,
        data: { id, recipient, amount, symbol, mint }
      };

    } catch (error: any) {
      return {
        success: false,
        text: `❌ Failed to queue transfer: ${error.message}`
      };
    }
  },
};
