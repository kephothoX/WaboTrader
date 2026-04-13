/**
 * WaboTrader — Chat Action Registry
 *
 * Maps natural-language intent patterns to executable app actions.
 * Used by WaboTraderChat to intercept commands and execute them client-side
 * instead of (or in addition to) sending them to the AI backend.
 *
 * Priority: local action → AI agent fallback
 */

export type ActionResult =
  | { handled: true; text: string; data?: any; sideEffect?: () => void }
  | { handled: false };

export interface ActionContext {
  walletAddress?: string | null;
  onNavigate?: (path: string) => void;
  onOpenModal?: (modal: "pulse" | "chat") => void;
}

interface ActionPattern {
  patterns: RegExp[];
  handler: (match: RegExpMatchArray, ctx: ActionContext) => ActionResult;
  description: string;
}

const appUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "";

// ─── Action Registry ──────────────────────────────────────────────────────────

const actions: ActionPattern[] = [
  // ── Navigation ─────────────────────────────────────────────────────────────
  {
    patterns: [/\b(go to|open|show me|navigate to|take me to)\s+(strategies|strategy page)\b/i],
    description: "Navigate to strategies page",
    handler: (_, ctx) => {
      ctx.onNavigate?.("/strategies");
      return {
        handled: true,
        text: "📊 Navigating to **Trading Strategies**...\n\nYou'll find the Strategy Generator, Dashboard, and Marketplace there.",
      };
    },
  },
  {
    patterns: [/\b(go to|open|show me|navigate to|take me to)\s+(markets?|prediction markets?)\b/i],
    description: "Navigate to markets page",
    handler: (_, ctx) => {
      ctx.onNavigate?.("/markets");
      return {
        handled: true,
        text: "🎯 Navigating to **Prediction Markets**...\n\nDiscover, create, and trade on prediction market outcomes.",
      };
    },
  },
  {
    patterns: [/\b(go to|open|show me|navigate to|take me to)\s+(telegram|bot|mini app)\b/i],
    description: "Open Telegram mini app",
    handler: (_, ctx) => {
      ctx.onNavigate?.("/telegram");
      return {
        handled: true,
        text: "✈️ Opening **Telegram Mini App**...\n\nYou can also access WaboTrader directly from Telegram for mobile trading.",
      };
    },
  },

  // ── Jupiter Blink / Trade Execution ────────────────────────────────────────
  {
    patterns: [
      /\b(buy|long)\s+([\d.]+)?\s*(sol|usdc|bonk|jup|ray|eth|btc)\b/i,
      /\bopen\s+(long|buy)\s+(position\s+on\s+)?(sol|usdc|bonk|jup|ray|eth|btc)\b/i,
    ],
    description: "Generate Jupiter buy/long blink link",
    handler: (match) => {
      const symbol = (match[3] || match[2] || "SOL").toUpperCase();
      const jupLink = `https://jup.ag/swap/USDC-${symbol}`;
      return {
        handled: true,
        text: `⚡ **Jupiter Swap Link — BUY ${symbol}**\n\n🔗 Non-custodial swap (click & sign in your wallet):\n\`${jupLink}\`\n\n🛡️ WaboTrader never holds your keys. You maintain 100% custody.`,
        data: { jupiterLink: jupLink, symbol, side: "BUY" },
      };
    },
  },
  {
    patterns: [
      /\b(sell|short)\s+([\d.]+)?\s*(sol|usdc|bonk|jup|ray|eth|btc)\b/i,
      /\bopen\s+(short|sell)\s+(position\s+on\s+)?(sol|usdc|bonk|jup|ray|eth|btc)\b/i,
    ],
    description: "Generate Jupiter sell/short blink link",
    handler: (match) => {
      const symbol = (match[3] || match[2] || "SOL").toUpperCase();
      const jupLink = `https://jup.ag/swap/${symbol}-USDC`;
      return {
        handled: true,
        text: `⚡ **Jupiter Swap Link — SELL ${symbol}**\n\n🔗 Non-custodial swap (click & sign in your wallet):\n\`${jupLink}\`\n\n🛡️ WaboTrader never holds your keys.`,
        data: { jupiterLink: jupLink, symbol, side: "SELL" },
      };
    },
  },

  // ── Perps ──────────────────────────────────────────────────────────────────
  {
    patterns: [
      /\b(open|start|go)?\s*(2x|3x|[\d.]+x)?\s*(long)\s+(perp|perpetual)?\s+(on\s+)?(sol|btc|eth|bonk|jup)\b/i,
    ],
    description: "Open perps long link",
    handler: (match) => {
      const leverage = match[2] ? parseFloat(match[2]) : 2;
      const symbol = (match[6] || "SOL").toUpperCase();
      const safeL = Math.min(leverage, 3.0);
      const link = `https://jup.ag/perps/${symbol}?leverage=${safeL}&side=long`;
      return {
        handled: true,
        text: `📈 **LONG ${symbol}-PERP @ ${safeL}x**\n\n⚡ Execute on Jupiter Perps (non-custodial):\n\`${link}\`\n\n⚠️ Risk cap: 3x max leverage enforced by WaboTrader safety layer.`,
        data: { jupiterLink: link, symbol, side: "LONG", leverage: safeL },
      };
    },
  },
  {
    patterns: [
      /\b(open|start|go)?\s*(2x|3x|[\d.]+x)?\s*(short)\s+(perp|perpetual)?\s+(on\s+)?(sol|btc|eth|bonk|jup)\b/i,
    ],
    description: "Open perps short link",
    handler: (match) => {
      const leverage = match[2] ? parseFloat(match[2]) : 2;
      const symbol = (match[6] || "SOL").toUpperCase();
      const safeL = Math.min(leverage, 3.0);
      const link = `https://jup.ag/perps/${symbol}?leverage=${safeL}&side=short`;
      return {
        handled: true,
        text: `📉 **SHORT ${symbol}-PERP @ ${safeL}x**\n\n⚡ Execute on Jupiter Perps (non-custodial):\n\`${link}\`\n\n⚠️ Risk cap: 3x max leverage enforced by WaboTrader safety layer.`,
        data: { jupiterLink: link, symbol, side: "SHORT", leverage: safeL },
      };
    },
  },

  // ── Strategies ─────────────────────────────────────────────────────────────
  {
    patterns: [/\b(generate|create|build|make)\s+(a\s+)?(momentum|mean reversion|arbitrage|grid|dca|trend following)?\s*strategy\b/i],
    description: "Open strategy generator",
    handler: (match) => {
      const type = match[3] || "momentum";
      return {
        handled: true,
        text: `🎯 **Strategy Generator — ${type.toUpperCase()}**\n\nI'm opening the Strategy Generator for you.\n\nYou can configure:\n• Token & market\n• Risk profile (conservative / moderate / aggressive)\n• Backtest period\n• Auto-execution settings\n\n_Navigating to Strategies → Generator..._`,
        sideEffect: () => {
          if (typeof window !== "undefined") {
            window.location.href = `/strategies?tab=generator&type=${type}`;
          }
        },
      };
    },
  },

  // ── Prediction Markets ─────────────────────────────────────────────────────
  {
    patterns: [/\b(create|start|open)\s+(a\s+)?(new\s+)?(prediction\s+)?market\b/i],
    description: "Open market creator",
    handler: () => {
      return {
        handled: true,
        text: `🎯 **Create Prediction Market**\n\nNavigating to the Market Creator...\n\nYou can create markets on any question:\n• Will SOL reach $200 by end of 2025?\n• Will Bitcoin dominate > 55%?\n• Any custom question!\n\n_Opening Markets → Create Market..._`,
        sideEffect: () => {
          if (typeof window !== "undefined") {
            window.location.href = "/markets?tab=create";
          }
        },
      };
    },
  },

  // ── Wallet ─────────────────────────────────────────────────────────────────
  {
    patterns: [/\b(show|check|view|display)\s+(my\s+)?(wallet|balance|portfolio)\b/i],
    description: "Show wallet dashboard",
    handler: (_, ctx) => {
      if (!ctx.walletAddress) {
        return {
          handled: true,
          text: "🔗 **Wallet Not Connected**\n\nConnect your Solana wallet using the button in the top navigation to view your balance and portfolio.\n\n_Supported: Phantom, Solflare, and other Solana wallets._",
        };
      }
      return {
        handled: true,
        text: `💼 **Wallet Dashboard**\n\nAddress: \`${ctx.walletAddress.slice(0, 6)}...${ctx.walletAddress.slice(-4)}\`\n\nYour portfolio is displayed in the main dashboard. Scroll down on the home screen to see:\n• Token balances\n• Portfolio analytics\n• Transaction history`,
      };
    },
  },

  // ── Help ───────────────────────────────────────────────────────────────────
  {
    patterns: [/^\s*(help|\/help|what can you do|capabilities|commands)\s*$/i],
    description: "Show help",
    handler: () => ({
      handled: true,
      text: `📖 **WaboTrader — Full Capability Guide**

🤖 **AI Chat Commands:**
• \`analyze SOL\` — deep token analysis
• \`buy/sell [token]\` — generate swap link
• \`long/short [token] [leverage]x\` — perp trade link
• \`generate strategy\` — AI strategy builder

📊 **Page Navigation:**
• \`go to strategies\` — Strategy Generator, Dashboard, Marketplace
• \`go to markets\` — Prediction Market Discovery & Trading
• \`go to telegram\` — Telegram Mini App

💼 **Portfolio:**
• \`show my balance\` — wallet & token holdings
• \`show portfolio\` — analytics & P&L

🔔 **Agent Pulses:**
• \`show live pulse\` — open real-time agent consciousness feed

📲 **WhatsApp Sharing:**
• Every trade signal has a 💬 share button
• Share strategies, markets, and alerts directly to WhatsApp

_Use \`@perpsanalyzer\`, \`@riskmanager\` to talk to specialist agents._`,
    }),
  },

  // ── Live Pulse ─────────────────────────────────────────────────────────────
  {
    patterns: [/\b(show|open|view)\s+(live\s+)?(pulse|agent\s+pulse|consciousness|activity)\b/i],
    description: "Open live pulse modal",
    handler: (_, ctx) => {
      ctx.onOpenModal?.("pulse");
      return {
        handled: true,
        text: "📡 **Opening Live Agent Consciousness...**\n\nWatch me think in real-time. Autonomous OODA loop active — monitoring 250+ Solana pairs.",
      };
    },
  },
];

// ─── Executor ─────────────────────────────────────────────────────────────────

/**
 * Try to match and execute a local action from a chat message.
 * Returns `handled: false` if no pattern matches → caller should send to AI.
 */
export function tryExecuteAction(message: string, ctx: ActionContext): ActionResult {
  for (const action of actions) {
    for (const pattern of action.patterns) {
      const match = message.match(pattern);
      if (match) {
        const result = action.handler(match, ctx);
        if (result.handled && result.sideEffect) {
          // Defer side effect slightly so response renders first
          setTimeout(result.sideEffect, 600);
        }
        return result;
      }
    }
  }
  return { handled: false };
}

/**
 * Returns a formatted list of all available client-side actions (for /help)
 */
export function getAvailableActions(): string[] {
  return actions.map((a) => a.description);
}
