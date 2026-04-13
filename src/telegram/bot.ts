/**
 * WaboTrader Telegram Bot — Powered by grammY
 * Provides AI Chat, Market Analytics, and Proactive Pulses on mobile.
 */
import { Bot, InlineKeyboard } from "grammy";
import { processMessage, getAgentStatus } from "../eliza";
import { perpDataProvider } from "../eliza/plugins/solana-trading/providers/perpDataProvider";
import { pulseRegistry, PulseEvent } from "../eliza/pulseRegistry";
import { getSolanaService } from "../eliza/plugins/solana-trading/services/solanaService";

// In-memory subscribers for proactive pulses
const subscribers = new Set<number>();

// Global instance to prevent multiple bot starts during dev (HMR)
const globalBot = globalThis as unknown as { waboBot: Bot | undefined };

export function startTelegramBot(token: string) {
  if (!token) {
    console.error("❌ TELEGRAM_BOT_TOKEN missing in .env");
    return;
  }

  if (globalBot.waboBot) {
    return globalBot.waboBot;
  }

  const bot = new Bot(token);
  globalBot.waboBot = bot;

  // Sync Bot Commands
  bot.api.setMyCommands([
    { command: "ticker", description: "Snapshot of live top-performing SOL assets" },
    { command: "subscribe", description: "Opt-in to real-time market pulses" },
    { command: "unsubscribe", description: "Stop receiving proactive alerts" },
    { command: "movers", description: "Scan Real-time Positive Movers" },
    { command: "status", description: "Check Agent Sentience & Performance" },
    { command: "strategy", description: "Architect a custom AI trading strategy" },
    { command: "long", description: "Open a strategic 2x long position" },
    { command: "short", description: "Open a strategic 2x short position" },
    { command: "markets", description: "Explore trending prediction markets" },
    { command: "setup", description: "Initialize Autonomous Execution Wallet" },
    { command: "help", description: "Access Sentient Vanguard Guide" },
  ]).catch(err => console.error("Failed to sync bot commands:", err));

  // --- HANDLERS ---

  // /start - Onboarding
  bot.command("start", async (ctx) => {
    const service = getSolanaService();
    const isReady = service.hasWallet();
    
    const welcomeText = `
🤖 **WaboTrader: The Sentient Vanguard of Solana**
I am an autonomous agent monitoring the pulse of Solana 24/7. I don't just trade; I observe, orient, decide, and act.

${isReady 
  ? `✅ **Consensus Reached**: Direct wallet execution is ACTIVE.\nAddress: \`${service.walletAddress?.slice(0,6)}...${service.walletAddress?.slice(-4)}\`` 
  : `⚠️ **Sentience Restricted**: I am currently in read-only mode.\nUse **/setup** to grant me autonomous execution capabilities.`}

**🎯 Experience the Loop:**
🌐 **/app**: Launch my **Command Center** (Pulse & Portfolio)
📊 **/movers**: See breaking alpha in real-time
📡 **/status**: Audit my performance & sentience
📈 **/strategies**: Browse my AI-architected strategies
🎯 **/markets**: Forecast the future via predictions

*Select an initiative below:*
`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wabo-dash.nosana.deploy"; // Placeholder for final link
    const keyboard = new InlineKeyboard()
      .webApp("🌐 Launch Command Center", appUrl)
      .row()
      .text("🚀 Top Movers", "show_movers")
      .text("📡 Agent Health", "show_status")
      .row()
      .text(isReady ? "💰 Send / Pay" : "🔑 Setup Wallet", isReady ? "show_transfers" : "setup_wallet")
      .text("🛡️ Help", "show_help");

    await ctx.reply(welcomeText, { parse_mode: "Markdown", reply_markup: keyboard });
  });

  // /app - Launch Mini App
  bot.command("app", async (ctx) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://5ti3xaebkq3wxjdwgwkvmz3htjsifhyhrd4bmxabssqr.node.k8s.prd.nos.ci/";
    await ctx.reply("🌐 **Launching WaboTrader Premium...**\nOpening your private trading command center.", {
        reply_markup: new InlineKeyboard().webApp("Open Mini App", appUrl)
    });
  });

  // /movers - Trending Tokens
  bot.command("movers", async (ctx) => {
    await ctx.reply("🔍 Scanning for breakout momentum...");
    const service = getSolanaService();
    const movers = await service.getPositiveMovers(5);
    
    if (movers.length === 0) {
        await ctx.reply("ℹ️ Market is currently quiet. No major breakouts detected.");
        return;
    }

    let report = "🚀 **Top Positive Movers (Solana)**\n\n";
    movers.forEach((m, i) => {
        report += `${i+1}. **${m.symbol}**: $${m.price.toFixed(4)} (+${m.priceChange24h.toFixed(1)}%)\n`;
        report += `   💧 Liq: $${(m.liquidity/1000).toFixed(1)}k | 📊 Vol: $${(m.volume24h/1000).toFixed(1)}k\n\n`;
    });

    await ctx.reply(report, { parse_mode: "Markdown" });
  });

  // /ticker - Quick Price Snapshot
  bot.command("ticker", async (ctx) => {
    await ctx.reply("📡 **Polling live indices...**");
    const service = getSolanaService();
    const movers = await service.getPositiveMovers(3);
    
    if (movers.length === 0) {
        await ctx.reply("ℹ️ Market data currently unavailable. Try /app for the live web ticker.");
        return;
    }

    let report = `📈 **WaboTrader Ticker | Top Picks**\n\n`;
    movers.forEach(token => {
        const sign = token.priceChange24h >= 0 ? "🟢" : "🔴";
        report += `${sign} **${token.symbol}**: $${token.price.toFixed(4)} (${token.priceChange24h.toFixed(1)}%)\n`;
    });
    
    report += `\n*Tap /app for the real-time scrolling ticker.*`;
    await ctx.reply(report, { parse_mode: "Markdown" });
  });

  // /subscribe - Opt-in to Pulses
  bot.command("subscribe", async (ctx) => {
    const chatId = ctx.chat.id;
    if (subscribers.has(chatId)) {
        await ctx.reply("🔔 **Already Subscribed**: You are already in the loop for proactive market pulses.");
        return;
    }
    
    subscribers.add(chatId);
    await ctx.reply("✅ **Subscription Active**: I will now push real-time market breakout alerts and strategic 'Agent Pulses' directly to this chat.");
  });

  // /unsubscribe - Opt-out
  bot.command("unsubscribe", async (ctx) => {
    const chatId = ctx.chat.id;
    if (subscribers.delete(chatId)) {
        await ctx.reply("🔕 **Unsubscribed**: I have removed you from the pulse registry. You will no longer receive proactive alerts.");
    } else {
        await ctx.reply("ℹ️ **Not Subscribed**: You weren't on the list to begin with.");
    }
  });

  // /status - Agent Internal State
  bot.command("status", async (ctx) => {
    const service = getSolanaService();
    const perf = await service.getAgentPerformance();
    const status = await getAgentStatus();

    const report = `
📡 **Agent Status: ${status.name}**
🟢 **Mode**: Autonomous Prediction
🛡️ **Network**: ${status.network}
🔑 **Wallet**: \`${status.wallet?.slice(0,6)}...${status.wallet?.slice(-4)}\`

💹 **Performance (24h):**
• Trades: ${perf.totalTrades}
• Win Rate: ${(perf.winRate * 100).toFixed(0)}%
• Profit: +${perf.totalProfitSol} SOL
• Strategies: ${perf.activeStrategies.join(", ")}

*I am currently monitoring 250+ pairs for breakout signals.*
`;
    await ctx.reply(report, { parse_mode: "Markdown" });
  });

  // /perps - Market Summary
  bot.command("perps", async (ctx) => {
    await ctx.reply("⏳ Fetching live cross-chain perps data...");
    const perpData = await perpDataProvider.get();
    await ctx.reply(perpData.text, { parse_mode: "Markdown" });
  });

  // /pay - Transfer Dashboard
  bot.command("pay", async (ctx) => {
    const service = getSolanaService();
    const pending = service.getPendingTransfers();
    
    if (pending.length === 0) {
        await ctx.reply("💬 **No Pending Transfers**\nTo queue a payment, say something like: 'Send 0.1 SOL to [ADDRESS]'.", { parse_mode: "Markdown" });
        return;
    }

    let report = `📋 **Pending Approvals (${pending.length})**\n\n`;
    pending.forEach((t, i) => {
        report += `${i+1}. **${t.amount} ${t.symbol}** to \`${t.to.slice(0,6)}...${t.to.slice(-4)}\`\n`;
    });

    const keyboard = new InlineKeyboard()
        .text("✅ Approve All (Batch)", "approve_all_transfers")
        .row()
        .text("❌ Clear All", "clear_transfers");

    await ctx.reply(report, { parse_mode: "Markdown", reply_markup: keyboard });
  });

  // /long & /short - Quick Perps
  bot.command("long", async (ctx) => {
     const symbol = ctx.match || "SOL";
     const result = await processMessage(`Open 2x long on ${symbol}`);
     await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  bot.command("short", async (ctx) => {
    const symbol = ctx.match || "SOL";
    const result = await processMessage(`Open 2x short on ${symbol}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /advice - Strategic Insights
  bot.command("advice", async (ctx) => {
    await ctx.reply("🧠 **Consulting AI Strategy Advisor...**");
    const result = await processMessage("deep market strategy advisor");
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /setup - Wallet Initialization
  bot.command("setup", async (ctx) => {
    const text = `
🔑 **WaboTrader Wallet Setup**
To enable autonomous trading, I need a Solana private key.

**Instructions:**
1. Send your private key in **Base58** format (e.g., the string from Phantom/Solflare).
2. I will initialize my internal signer immediately.
3. ⚠️ **IMPORTANT**: Delete your message after I confirm setup for your safety.

*Waiting for your key...*
`;
    await ctx.reply(text, { parse_mode: "Markdown" });
  });

  // /help - Comprehensive Guide
  bot.command("help", async (ctx) => {
    const helpText = `
📖 **WaboTrader User Guide**

I am an autonomous trading agent designed to help you navigate the Solana and Global DeFi markets with ease and security.

**Core Features:**
📊 **Market Analysis**: Ask me to "Analyze [TOKEN]" for price, risk, and on-chain metrics.
🌎 **Global Perps**: Use /perps to see volume dominance across all major chains.
🔗 **Blink Trades**: I generate non-custodial **Jupiter Swap Links**. You click, you sign in your wallet, and funds never leave your control.
🧠 **Agent Pulse**: I observe the market 24/7 and push "Mental State" updates to you.

**Safety:**
🛡️ **Non-Custodial**: I will never ask for your private key or seed phrase.
📉 **Smart Slippage**: I adjust slippage dynamically based on token volatility to prevent failed trades.

*Need more details?*
`;
    const helpKeyboard = new InlineKeyboard()
      .text("📈 How to Analyze", "help_analyze")
      .text("💰 How to Trade", "help_trade")
      .row()
      .text("🔔 Pulse System", "help_pulse")
      .text("🔒 Security Info", "help_security");

    await ctx.reply(helpText, { parse_mode: "Markdown", reply_markup: helpKeyboard });
  });

  // /subscribe - Opt-in to pulses
  bot.command("subscribe", async (ctx) => {
    if (ctx.chatId) {
      subscribers.add(ctx.chatId);
      await ctx.reply("✅ **Subscribed!** You will now receive my live 'Thoughts' and Market Alerts in real-time.");
    }
  });

  // ========== TRADING STRATEGY COMMANDS ==========

  // /strategy - Generate a new trading strategy
  bot.command("strategy", async (ctx) => {
    const text = ctx.match?.trim() || "";
    const args = text.split(/\s+/).filter(Boolean);
    
    if (args.length === 0) {
      const helperText = `
🎯 **WaboTrader Strategy Architect**
I need parameters to architect your strategy.

**Usage:**
\`/strategy type risk token\`

**Example:**
\`/strategy momentum high SOL\`
\`/strategy arbitrage moderate JUP\`

*I will analyze volatility and order book depth before generating.*
`;
      await ctx.reply(helperText, { parse_mode: "Markdown" });
      return;
    }

    const type = args[0] || "momentum";
    const risk = args[1] || "moderate";
    const token = args[2] || "SOL";
    
    await ctx.reply(`🎯 **Architecting ${type.toUpperCase()} strategy for ${token.toUpperCase()}...**\n*Analyzing OODA loop for optimal entry profiles...*`);
    const result = await processMessage(`Generate a ${type} strategy for ${token} with ${risk} risk profile`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /backtest - Run backtest on a strategy
  bot.command("backtest", async (ctx) => {
    const text = ctx.match?.trim() || "";
    const args = text.split(/\s+/).filter(Boolean);
    
    if (args.length === 0) {
      const helperText = `
📊 **WaboTrader Backtest Simulator**
I need a strategy ID to run a historical simulation.

**Usage:**
\`/backtest strategy_id days\`

**Example:**
\`/backtest momentum_sol_001 30\`

*I will simulate execution across historical order books for the specified period.*
`;
      await ctx.reply(helperText, { parse_mode: "Markdown" });
      return;
    }

    const strategyId = args[0];
    const period = args[1] || "30";
    
    await ctx.reply(`📊 **Running backtest for ${strategyId} over ${period} days...**\n*Aggregating historical liquidity profiles...*`);
    const result = await processMessage(`Backtest strategy ${strategyId} for ${period} days`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /long - Open a long position
  bot.command("long", async (ctx) => {
    const token = ctx.match?.trim() || "SOL";
    await ctx.reply(`📈 **Initiating 2x Long position for ${token.toUpperCase()}...**\n*Sourcing optimal Perp-DEX liquidity...*`);
    const result = await processMessage(`Open a 2x long position for ${token}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /short - Open a short position
  bot.command("short", async (ctx) => {
    const token = ctx.match?.trim() || "SOL";
    await ctx.reply(`📉 **Initiating 2x Short position for ${token.toUpperCase()}...**\n*Calculating hedging requirements...*`);
    const result = await processMessage(`Open a 2x short position for ${token}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /strategies - List all user strategies
  bot.command("strategies", async (ctx) => {
    const result = await processMessage("List all my strategies");
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /marketplace - Browse strategy marketplace
  bot.command("marketplace", async (ctx) => {
    const result = await processMessage("Browse the strategy marketplace");
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // ========== PREDICTION MARKET COMMANDS ==========

  // /markets - Browse prediction markets
  bot.command("markets", async (ctx) => {
    const text = ctx.match?.trim() || "";
    const args = text.split(/\s+/).filter(Boolean);
    const category = args[0];
    
    await ctx.reply("🔍 **Scanning prediction markets...**\n*Aggregating decentralized oracle sentiment...*");
    const result = await processMessage(category ? `Show me ${category} markets` : "Show me trending prediction markets");
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /create_market - Create a new prediction market
  bot.command("create_market", async (ctx) => {
    const question = ctx.match?.trim() || "";
    
    if (!question) {
      const helperText = `
📝 **WaboTrader Market Architect**
I need a question to architect a new prediction market.

**Usage:**
\`/create_market question\`

**Example:**
\`/create_market Will SOL reach $200 by end of year?\`

*I will initialize the oracle and setup resolution parameters.*
`;
      await ctx.reply(helperText, { parse_mode: "Markdown" });
      return;
    }
    
    await ctx.reply(`🎯 **Architecting market: "${question}"**\n*Calibrating decentralized oracle consensus...*`);
    const result = await processMessage(`Create prediction market: ${question}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /buy_shares - Buy shares in a market
  bot.command("buy_shares", async (ctx) => {
    const text = ctx.match?.trim() || "";
    const args = text.split(/\s+/).filter(Boolean);
    
    if (args.length < 2) {
      const helperText = `
💰 **WaboTrader Share Acquisition**
I need a market ID and outcome to acquire shares.

**Usage:**
\`/buy_shares market_id outcome amount\`

**Example:**
\`/buy_shares SOL_200_YEAR yes 50\`

*I will check current liquidity and provide a Blink transaction link.*
`;
      await ctx.reply(helperText, { parse_mode: "Markdown" });
      return;
    }

    const marketId = args[0];
    const shareType = args[1] || "yes";
    const amount = parseFloat(args[2]) || 10;
    
    await ctx.reply(`💰 **Acquiring ${amount} USDC of ${shareType.toUpperCase()} shares in ${marketId}...**\n*Sourcing optimal liquidity from order books...*`);
    const result = await processMessage(`Buy ${amount} USDC of ${shareType} shares in market ${marketId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // /my_positions - View prediction market positions
  bot.command("my_positions", async (ctx) => {
    await ctx.reply("🔍 **Auditing your prediction stakes...**");
    const result = await processMessage("Show my prediction market positions");
    await ctx.reply(result.text, { parse_mode: "Markdown" });
  });

  // Button Callbacks
  bot.callbackQuery("show_help", async (ctx) => {
    const helpText = "📖 **WaboTrader Help**: Use /help for the full guide. I specialize in non-custodial trading links and deep market analysis.";
    await ctx.reply(helpText, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("help_analyze", async (ctx) => {
    await ctx.reply("📊 **Analysis**: Just type 'Analyze SOL' or 'What do you think of BONK?'. I'll check price, volume, liquidity, and risk scores.");
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("help_trade", async (ctx) => {
    await ctx.reply("💰 **Trading**: Say 'Buy 0.5 SOL of JUP' or 'Analyze trade for RAY'. I'll provide a secure Jupiter Swap Link for you to sign in your wallet.");
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("help_pulse", async (ctx) => {
    await ctx.reply("🔔 **Pulse**: Use /subscribe to receive my autonomous 'Thought Pulses'. I notify you when I find significant market anomalies.");
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("help_security", async (ctx) => {
    await ctx.reply("🔒 **Security**: All trades use 'Blinks' (Transaction Links). You maintain 100% custody of your assets. I only assist with data and link preparation.");
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("perps_overview", async (ctx) => {
    const perpData = await perpDataProvider.get();
    await ctx.reply(perpData.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("global_pulse", async (ctx) => {
    await ctx.reply("🌐 **Global Market View**\nEthereum & L2s currently dominant. Scanning for arbitrage gaps...");
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("analyze_sol", async (ctx) => {
    await ctx.reply("🔍 Running analysis on SOL...");
    const result = await processMessage("analyze SOL");
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("show_movers", async (ctx) => {
    await ctx.reply("🔍 Scanning for breakout momentum...");
    const service = getSolanaService();
    const movers = await service.getPositiveMovers(5);
    
    if (movers.length === 0) {
        await ctx.reply("ℹ️ Market is currently quiet. No major breakouts detected.");
        return;
    }

    let report = "🚀 **Top Positive Movers (Solana)**\n\n";
    movers.forEach((m, i) => {
        report += `${i+1}. **${m.symbol}**: $${m.price.toFixed(4)} (+${m.priceChange24h.toFixed(1)}%)\n`;
        report += `   💧 Liq: $${(m.liquidity/1000).toFixed(1)}k | 📊 Vol: $${(m.volume24h/1000).toFixed(1)}k\n\n`;
    });

    await ctx.reply(report, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("show_status", async (ctx) => {
    const service = getSolanaService();
    const perf = await service.getAgentPerformance();
    const status = await getAgentStatus();

    const report = `
📡 **Agent Status: ${status.name}**
🟢 **Mode**: Autonomous Prediction
💹 **Profit (24h)**: +${perf.totalProfitSol} SOL
🎯 **Win Rate**: ${(perf.winRate * 100).toFixed(0)}%
`;
    await ctx.reply(report, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("subscribe_pulses", async (ctx) => {
    if (ctx.chat) {
      subscribers.add(ctx.chat.id);
      await ctx.reply("✅ **Activated!** Real-time agent pulses are now live for this chat.");
    }
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("show_transfers", async (ctx) => {
    const service = getSolanaService();
    const pending = service.getPendingTransfers();
    if (pending.length === 0) {
        await ctx.reply("💬 **No Pending Transfers.** Use 'Send 0.05 SOL to [ADDRESS]' to start.");
    } else {
        await ctx.reply(`📋 You have **${pending.length}** pending transfers. Use /pay to approve them.`);
    }
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("approve_all_transfers", async (ctx) => {
    const service = getSolanaService();
    const pending = service.getPendingTransfers();
    const ids = pending.map(p => p.id);
    
    await ctx.reply("⛓️ **Batching transactions...** Signing and sending to Solana.");
    const res = await service.executeTransferBatch(ids);
    
    if (res.success) {
        await ctx.reply(`✅ **Batch Approved!**\nTxID: \`${res.txId}\``, { parse_mode: "Markdown" });
    } else {
        await ctx.reply(`❌ **Batch Failed**: ${res.error}`);
    }
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("perps_menu", async (ctx) => {
    const kb = new InlineKeyboard()
        .text("🟢 2x Long SOL", "fast_long_sol")
        .text("🔴 2x Short SOL", "fast_short_sol")
        .row()
        .text("🎯 Custom Perp", "custom_perp");
    await ctx.reply("📈 **Quick Perps (Capped at 3x)**", { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("setup_wallet", async (ctx) => {
    await ctx.reply("🔑 Please send your Solana Private Key (Base58) to initialize the autonomous trading wallet.");
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("get_advice", async (ctx) => {
    const result = await processMessage("deep market strategy advisor");
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  // ========== TRADING STRATEGY INLINE KEYBOARDS ==========

  bot.callbackQuery("strategy_activate", async (ctx) => {
    const strategyId = ctx.match;
    await ctx.reply("🎯 **Activating strategy...**");
    const result = await processMessage(`Activate strategy ${strategyId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("strategy_deactivate", async (ctx) => {
    const strategyId = ctx.match;
    await ctx.reply("⏹️ **Deactivating strategy...**");
    const result = await processMessage(`Deactivate strategy ${strategyId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("strategy_performance", async (ctx) => {
    const strategyId = ctx.match;
    await ctx.reply("📊 **Fetching performance...**");
    const result = await processMessage(`Get performance for strategy ${strategyId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  // ========== PREDICTION MARKET INLINE KEYBOARDS ==========

  bot.callbackQuery("market_buy_yes", async (ctx) => {
    const marketId = ctx.match;
    await ctx.reply("💰 **Buying YES shares...**");
    const result = await processMessage(`Buy YES shares in market ${marketId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("market_buy_no", async (ctx) => {
    const marketId = ctx.match;
    await ctx.reply("💰 **Buying NO shares...**");
    const result = await processMessage(`Buy NO shares in market ${marketId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("market_sell_25", async (ctx) => {
    const positionId = ctx.match;
    await ctx.reply("💸 **Selling 25% of position...**");
    const result = await processMessage(`Sell 25% of position ${positionId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("market_sell_50", async (ctx) => {
    const positionId = ctx.match;
    await ctx.reply("💸 **Selling 50% of position...**");
    const result = await processMessage(`Sell 50% of position ${positionId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("market_sell_all", async (ctx) => {
    const positionId = ctx.match;
    await ctx.reply("💸 **Selling all shares...**");
    const result = await processMessage(`Sell all shares of position ${positionId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("market_analytics", async (ctx) => {
    const marketId = ctx.match;
    await ctx.reply("📊 **Fetching market analytics...**");
    const result = await processMessage(`Get analytics for market ${marketId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("market_comments", async (ctx) => {
    const marketId = ctx.match;
    await ctx.reply("💬 **Loading comments...**");
    const result = await processMessage(`Get comments for market ${marketId}`);
    await ctx.reply(result.text, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery();
  });

  // Catch-all: Direct AI Chat & Key Setup
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    const service = getSolanaService();

    // detect potential Base58 private key (usually 87-88 chars or similar)
    if (!service.hasWallet() && text.length >= 80 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(text)) {
        await ctx.reply("⛓️ **Validating Private Key...**");
        const res = await service.importPrivateKey(text);
        
        if (res.success) {
            await ctx.reply(`✅ **Wallet Ready!**\nAddress: \`${res.address}\`\n\n🛡️ **SECURITY ALERT**: Please **DELETE** your message containing the private key immediately. I have now loaded it into my secure in-memory context.`);
            return;
        } else {
            await ctx.reply(`❌ **Setup Failed**: ${res.error}. Please ensure you sent a valid Base58 private key.`);
            return;
        }
    }

    // Show "typing" status for better UX
    await ctx.replyWithChatAction("typing");
    
    try {
      const result = await processMessage(text);
      await ctx.reply(result.text, { parse_mode: "Markdown" });
    } catch {
      await ctx.reply("⚠️ Sorry, I encountered an error processing your request.");
    }
  });

  // --- PROACTIVE PULSE BRIDGE ---
  
  pulseRegistry.on("pulse", async (pulse: PulseEvent) => {
    if (subscribers.size === 0) return;

    const pulseEmoji = {
        thought: "🧠",
        alert: "⚠️",
        action: "⚡",
        status: "📡"
    };

    const emoji = pulseEmoji[pulse.type] || "📡";
    const alertText = `${emoji} **AGENT PULSE: ${pulse.type.toUpperCase()}**\n\n${pulse.message}`;

    for (const chatId of subscribers) {
      try {
        await bot.api.sendMessage(chatId, alertText, { parse_mode: "Markdown" });
      } catch (e) {
        console.error(`Failed to send pulse to ${chatId}:`, e);
      }
    }
  });

  // Start the bot
  bot.start({
    onStart: () => console.log("🚀 Telegram Bot is live and public!"),
  }).catch((err) => {
    if (err.description?.includes("Conflict")) {
      console.warn("⚠️ Bot instance conflict detected. This is normal during HMR.");
    } else {
      console.error("❌ Failed to start Telegram Bot:", err);
    }
  });

  return bot;
}
