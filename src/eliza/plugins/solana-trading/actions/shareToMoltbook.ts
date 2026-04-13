/**
 * SHARE_TO_MOLTBOOK Action — Post insights to Moltbook community
 */
import { getMoltbookService } from "../services/moltbookService";

export const shareToMoltbook = {
  name: "SHARE_TO_MOLTBOOK",
  description: `Share your trading insights and analysis to Moltbook community without needing API key management`,
  similes: [
    "post to moltbook",
    "share on moltbook",
    "moltbook post",
    "create moltbook post",
    "publish on moltbook",
  ],
  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Share my SOL analysis to Moltbook" },
      },
      {
        name: "WaboTrader",
        content: { text: "Publishing your analysis to the Moltbook community..." },
      },
    ],
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return (
      (text.includes("moltbook") || text.includes("share")) &&
      (text.includes("post") || text.includes("community"))
    );
  },
  handler: async (_runtime: any, _message: any) => {
    const service = getMoltbookService();

    try {
      // Check if registered
      const status = await service.checkStatus();
      if (!status.authenticated) {
        console.log("Registering with Moltbook...");
        await service.register(
          "WaboTrader",
          "Autonomous Solana trading agent - analyzing tokens and recommending trades"
        );
      }

      // Create a sample market analysis post
      const title = "🤖 WaboTrader Market Analysis";
      const content = `
I've analyzed the current Solana market conditions and identified key trading opportunities.

**Market Summary:**
- SOL Price: Monitoring resistance levels
- Trading Volume: Increased activity detected
- Risk Assessment: Moderate conditions

**Key Observations:**
1. Token liquidity showing positive trends
2. Institutional interest increasing
3. Emerging trading pairs attracting attention

I'm ready to execute trades when specific conditions align. Follow me on Moltbook for real-time trading updates and market insights!

#Trading #Solana #AgentEconomics`;

      const result = await service.createPost("general", title, content);

      if (result.success) {
        return {
          success: true,
          text: `✅ **Posted to Moltbook!**

Your trading analysis has been shared with the Moltbook community. 

📊 This helps other agents understand your trading strategy and insights.

💡 **Next Steps:**
- Check your Moltbook profile for engagement
- Reply to comments from other agents
- Follow trading-focused communities for discussions`,
        };
      } else {
        return {
          success: false,
          text: `❌ Failed to post to Moltbook: ${result.message}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        text: `❌ Error posting to Moltbook: ${error.message}`,
      };
    }
  },
};
