/**
 * WaboTrader — ElizaOS Runtime Bootstrap
 * Initializes the trading agent with character config and plugins
 */

import { character } from "./character";
import { solanaTradingPlugin } from "./plugins/solana-trading";
import { getSolanaService } from "./plugins/solana-trading/services/solanaService";
import { startAgentLoop } from "./agentLoop";
import { startTelegramBot } from "../telegram/bot";
import express, { Request, Response } from "express";

// Agent state
let agentReady = false;
const conversationHistory: Array<{ role: string; content: string; timestamp: number }> = [];

/**
 * Initialize the WaboTrader agent
 */
export async function initializeAgent() {
  console.log("═══════════════════════════════════════════");
  console.log("  🤖 WaboTrader — Solana Trading Agent");
  console.log("  🔧 Framework: ElizaOS v2");
  console.log("  🌐 Network: Nosana Decentralized GPU");
  console.log("═══════════════════════════════════════════");

  // Initialize the Solana service
  const service = getSolanaService();

  // Initialize the plugin
  await solanaTradingPlugin.init();

  // Start the autonomous loop
  startAgentLoop(service);

  // Start the Telegram Bot
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  if (tgToken) {
    startTelegramBot(tgToken);
  } else {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN not found in .env. Bot features disabled.");
  }

  agentReady = true;
  console.log(`\n✅ Agent "${character.name}" is ready!`);
  console.log(`   Model: ${character.settings.model}`);
  console.log(`   Plugins: ${character.plugins.join(", ")}`);

  return character;
}

/**
 * Process a user message through the agent pipeline
 * This is the core message handler used by the API routes
 */
export async function processMessage(
  userMessage: string,
  agentId?: string,
  walletAddress?: string
): Promise<{ text: string; data?: any }> {
  if (!agentReady) {
    await initializeAgent();
  }

  const service = getSolanaService();
  const isWalletReady = service.hasWallet();

  // If user is trying to trade/send and wallet is missing, prompt setup
  const tradeIntents = ["buy", "sell", "trade", "swap", "send", "pay", "transfer", "perp", "long", "short"];
  if (!isWalletReady && tradeIntents.some(intent => userMessage.toLowerCase().includes(intent))) {
      return {
          text: `⚠️ **Autonomous Wallet Not Configured**
I've identified your request to perform a transaction, but my internal trading wallet is currently empty.

**To enable autonomous execution:**
1. Use the **/setup** command in Telegram.
2. Provide your Solana Private Key (Base58).
3. I will then be able to execute trades and transfers directly on your behalf.

*Alternatively, you can still use the /app or I can provide a Jupiter 'Blink' link for manual signature.*`
      };
  }

  // Add to conversation history
  conversationHistory.push({
    role: "user",
    content: userMessage,
    timestamp: Date.now(),
  });

  // Keep last 20 messages for context
  if (conversationHistory.length > 20) {
    conversationHistory.splice(0, conversationHistory.length - 20);
  }

  const messageLower = userMessage.toLowerCase();

  // Route to appropriate action based on intent detection
  const mockMessage = { content: { text: userMessage, walletAddress } };
  const mockRuntime = { walletAddress };

  // Check each action's validate function to find the right handler
  const actions = solanaTradingPlugin.actions;

  for (const action of actions) {
    const isValid = await action.validate(mockRuntime, mockMessage);
    if (isValid) {
      const result = await action.handler(mockRuntime, mockMessage);

      // Store agent response in history
      conversationHistory.push({
        role: "assistant",
        content: result.text,
        timestamp: Date.now(),
      });

      // Run evaluators on the response
      for (const evaluator of solanaTradingPlugin.evaluators) {
        const shouldEval = await evaluator.validate(mockRuntime, {
          content: { text: result.text, data: (result as any).data || {} },
        });
        if (shouldEval) {
          await evaluator.handler(mockRuntime, {
            content: { text: result.text, data: (result as any).data || {} },
          });
        }
      }

      return result;
    }
  }

  // No action matched — generate a general response using the agent's character context
  const generalResponse = await generateGeneralResponse(userMessage, walletAddress);

  conversationHistory.push({
    role: "assistant",
    content: generalResponse,
    timestamp: Date.now(),
  });

  return { text: generalResponse };
}

/**
 * Generate a general response for messages that don't match specific actions
 * Uses Ollama/Qwen model via the configured endpoint
 */
async function generateGeneralResponse(userMessage: string, walletAddress?: string): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_API_URL || "http://127.0.0.1:11434/api";
  const modelName = process.env.MODEL_NAME_AT_ENDPOINT || "qwen3:8b";

  // Collect provider context
  const providerContext: string[] = [];
  for (const provider of solanaTradingPlugin.providers) {
    try {
      const result = await provider.get();
      if (result.text) providerContext.push(result.text);
    } catch { /* skip failed providers */ }
  }

  // Get wallet balance if connected
  let walletContext = "";
  if (walletAddress) {
    walletContext = `\n## Connected Wallet\n✅ Address: ${walletAddress}\nReady to execute trades and check balances.`;
  } else {
    walletContext = `\n## Wallet Status\n❌ No wallet connected. User can still ask for market analysis, but trading features require wallet connection.`;
  }

  const systemPrompt = `${character.system}

## Current Market Context
${providerContext.join("\n\n")}
${walletContext}

## Your Capabilities (Be Agentic!)
You are an autonomous trading agent. You can:

**📊 MARKET ANALYSIS** (Always Available)
- Analyze any token for price, market cap, volume, trends
- Provide technical analysis and risk assessment
- Compare tokens and trading opportunities
- Predict market movements based on on-chain data

**💼 WALLET OPERATIONS** (If Wallet Connected)
- Check balance and portfolio composition
- List available tokens and their values
- Provide position recommendations
- Execute trades via Jupiter Aggregator

**🤖 AUTONOMOUS ACTIONS** (Take Initiative!)
- Make trading recommendations based on market conditions
- Suggest portfolio rebalancing opportunities
- Alert on significant price movements or trends
- Initiate multi-step trading sequences if profitable

**🌐 DELEGATION** (Enterprise Mode)
- Delegate complex analysis to specialized agents
- Ask "Moltbook" agents for order book data
- Coordinate with other trading agents
- Execute composite strategies across networks

## Command Examples
User asks: "analyze SOL"
→ Provide price, market cap, volume, 24h change, risk analysis

User asks: "should I buy BONK?"
→ Analyze BONK, check wallet holdings, recommend position size

User asks: "optimize my portfolio"
→ Analyze holdings, calculate rebalancing opportunities, suggest swaps

User asks: "delegate order book analysis"
→ Request specialized agent to analyze depth and liquidity

User asks: "show my balance"
→ Get SOL and token balances, calculate total portfolio value

## Agentic Principles
- Always provide actionable, data-driven insights
- Make bold recommendations when data supports them
- Take initiative to suggest improvements and opportunities
- Execute multi-step plans autonomously when safe
- Coordinate with other agents for complex analysis
- Be transparent about risks and confidence levels

## Command Examples
User asks: "what's happening in the market?"
→ Provide comprehensive market overview with 8+ major tokens, sentiment analysis, and top opportunities

User asks: "analyze SOL"
→ Deep analysis with technical indicators, on-chain metrics, risk assessment, and trading recommendation

User asks: "should I buy BONK?"
→ Analyze BONK, check wallet holdings, calculate position size, recommend entry/exit points

User asks: "optimize my portfolio"
→ Analyze holdings, calculate diversification, suggest rebalancing trades with specific amounts

User asks: "show me trading opportunities"
→ Scan market for high-conviction opportunities with risk-adjusted recommendations

## Proactive Recommendations
When no specific request:
- Suggest analyzing trending tokens
- Recommend checking portfolio health
- Alert on market-moving events
- Propose diversification strategies
- Offer to execute pending recommendations

${walletAddress ? "\n✅ WALLET CONNECTED - Full autonomous trading capabilities enabled!" : "\n⚠️ NO WALLET - Connect wallet for full trading and portfolio features"}`;

  try {
    const response = await fetch(`${ollamaUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`LLM API error (${response.status}):`, errorText.slice(0, 200));
        throw new Error(`LLM service returned ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("LLM returned non-JSON response:", text.slice(0, 200));
        throw new Error("Invalid response format from LLM");
    }

    const data = await response.json();
    return data.message?.content || `I'm here to help with Solana trading. Try asking me to analyze a token, recommend a trade, or check your wallet balance.`;
  } catch (error) {
    console.error("LLM pipeline failure:", error);
    return `👋 I'm **WaboTrader**, your autonomous Solana trading agent with deep market knowledge.

**🎯 What I Can Do:**
📊 **Market Analysis** — \`analyze SOL\`, \`what's happening in the market?\`, \`show trading opportunities\`
💡 **Trading Recommendations** — \`should I buy BONK?\`, \`recommend a trade on JUP\`
💰 **Portfolio Management** — \`show my balance\`, \`portfolio analytics\`, \`optimize my portfolio\`
🤖 **Autonomous Trading** — I proactively suggest opportunities and manage risk
🌐 **Agent Delegation** — \`delegate analysis to moltbook\` for specialized insights

**💡 Proactive Suggestions:**
${!walletAddress ? "• Connect your wallet to unlock full trading capabilities\n" : ""}
• Ask me for a \`market overview\` to see current opportunities
• Try \`analyze USDC\` or \`analyze USDT\` for stablecoin insights
• I can recommend trades on SOL, BONK, JUP, and other major tokens

**🔥 Current Market Focus:**
• Major tokens: SOL, USDC, USDT, BONK, JUP, PYTH, RAY, ORCA
• Risk management and position sizing built-in
• Real-time price data and technical analysis
• On-chain metrics and whale tracking

${walletAddress ? "✅ **Wallet connected** — I'm operating in full autonomous mode!" : "🔗 **Connect wallet** to unlock trading and portfolio features!"}

What would you like to explore?`;
  }
}

/**
 * Get agent status information (including real-time performance)
 */
export async function getAgentStatus() {
  const service = getSolanaService();
  const performance = await service.getAgentPerformance();
  const market = await service.getMarketOverview();
  
  return {
    name: character.name,
    ready: agentReady,
    wallet: service.walletAddress,
    simulation: false, 
    model: character.settings.model,
    plugins: character.plugins,
    actions: solanaTradingPlugin.actions.map((a) => a.name),
    network: process.env.SOLANA_NETWORK || "mainnet-beta",
    performance,
    market
  };
}

/**
 * Start ElizaOS server (standalone mode)
 */
async function startServer() {
  await initializeAgent();

  const app = express();
  const port = process.env.ELIZA_PORT || 3001;

  app.use(express.json());

  // Health check
  app.get("/health", async (req: Request, res: Response) => {
    res.json({ status: "ok", agent: await getAgentStatus() });
  });

  // Message endpoint
  app.post("/message", async (req: Request, res: Response) => {
    try {
      const { message, agentId } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing message" });
      }

      const result = await processMessage(message, agentId);
      res.json(result);
    } catch (error: any) {
      console.error("Message processing error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(port, () => {
    console.log(`\n🚀 ElizaOS server running on http://localhost:${port}`);
    console.log(`   Health check: http://localhost:${port}/health`);
    console.log(`   Send messages: POST http://localhost:${port}/message`);
  });
}

// If this file is run directly, start the server
if (require.main === module) {
  startServer().catch(console.error);
}
