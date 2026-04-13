/**
 * WaboTrader — WhatsApp Share Utilities
 * Generates deep-link wa.me URLs for sharing trades, strategies, and market info.
 */

const WABO_APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ||
      "https://5ti3xaebkq3wxjdwgwkvmz3htjsifhyhrd4bmxabssqr.node.k8s.prd.nos.ci";

export interface TradeShareParams {
  symbol: string;
  side: "LONG" | "SHORT" | "BUY" | "SELL";
  price: number;
  leverage?: number;
  slippage?: number;
  jupiterLink?: string;
  walletAddress?: string;
}

export interface StrategyShareParams {
  name: string;
  type: string;
  token: string;
  riskProfile: string;
  winRate?: number;
  totalReturn?: number;
  description?: string;
}

export interface MarketShareParams {
  question: string;
  marketId: string;
  yesPrice?: number;
  noPrice?: number;
  volume?: number;
  endDate?: string;
}

export interface AgentAlertShareParams {
  message: string;
  type: "thought" | "alert" | "action" | "status";
  timestamp?: number;
}

/** Encode text to WhatsApp-safe URL */
function waEncode(text: string): string {
  return encodeURIComponent(text);
}

/** Open a wa.me share link in a new tab */
function openWhatsApp(text: string): void {
  const url = `https://wa.me/?text=${waEncode(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Share a trade signal via WhatsApp
 */
export function shareTradeViaWhatsApp(params: TradeShareParams): void {
  const { symbol, side, price, leverage, slippage, jupiterLink } = params;

  const sideEmoji = side === "LONG" || side === "BUY" ? "🟢" : "🔴";
  const leverageText = leverage ? ` @ ${leverage}x leverage` : "";
  const slippageText = slippage ? `\n📊 Slippage: ${slippage.toFixed(2)}%` : "";

  const text = [
    `🤖 *WaboTrader Signal*`,
    ``,
    `${sideEmoji} *${side} ${symbol}*`,
    `💰 Price: $${price.toFixed(4)}${leverageText}`,
    slippageText,
    ``,
    jupiterLink
      ? `⚡ Execute Trade (Non-Custodial):\n${jupiterLink}`
      : `🔗 Trade on WaboTrader:\n${WABO_APP_URL}`,
    ``,
    `_Powered by WaboTrader AI — The Stealth Vanguard of Solana_`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  openWhatsApp(text);
}

/**
 * Share a Jupiter Blink / swap link via WhatsApp
 */
export function shareBlinkViaWhatsApp(
  symbol: string,
  jupiterLink: string,
  price?: number
): void {
  const text = [
    `⚡ *WaboTrader — Swap Link*`,
    ``,
    `🪙 Token: *${symbol}*`,
    price ? `💰 Price: $${price.toFixed(4)}` : null,
    ``,
    `🔗 Click to execute (non-custodial):`,
    jupiterLink,
    ``,
    `_Never leave your wallet. Just click & sign._`,
    `_Powered by WaboTrader × Jupiter Aggregator_`,
  ]
    .filter(Boolean)
    .join("\n");

  openWhatsApp(text);
}

/**
 * Share a trading strategy via WhatsApp
 */
export function shareStrategyViaWhatsApp(params: StrategyShareParams): void {
  const { name, type, token, riskProfile, winRate, totalReturn, description } = params;

  const winRateText = winRate != null ? `\n🎯 Win Rate: ${(winRate * 100).toFixed(0)}%` : "";
  const returnText = totalReturn != null ? `\n📈 Total Return: ${totalReturn > 0 ? "+" : ""}${totalReturn.toFixed(1)}%` : "";

  const text = [
    `📊 *WaboTrader Strategy Signal*`,
    ``,
    `🚀 *${name}*`,
    `🔷 Type: ${type} | 🎲 Risk: ${riskProfile}`,
    `🪙 Token: ${token}`,
    winRateText,
    returnText,
    description ? `\n📝 ${description}` : null,
    ``,
    `🌐 View & Apply on WaboTrader:`,
    `${WABO_APP_URL}/strategies`,
    ``,
    `_Autonomous AI-generated strategy. DYOR._`,
    `_Powered by WaboTrader AI_`,
  ]
    .filter(Boolean)
    .join("\n");

  openWhatsApp(text);
}

/**
 * Share a prediction market via WhatsApp
 */
export function shareMarketViaWhatsApp(params: MarketShareParams): void {
  const { question, marketId, yesPrice, noPrice, volume, endDate } = params;

  const yesPriceText = yesPrice != null ? `🟢 YES: ${(yesPrice * 100).toFixed(0)}¢` : null;
  const noPriceText = noPrice != null ? `🔴 NO: ${(noPrice * 100).toFixed(0)}¢` : null;
  const volumeText = volume != null ? `💧 Volume: $${volume.toLocaleString()}` : null;
  const endText = endDate ? `⏰ Closes: ${endDate}` : null;

  const text = [
    `🎯 *WaboTrader Prediction Market*`,
    ``,
    `❓ *${question}*`,
    ``,
    yesPriceText,
    noPriceText,
    volumeText,
    endText,
    ``,
    `🔗 Trade this market:`,
    `${WABO_APP_URL}/markets?id=${marketId}`,
    ``,
    `_Forecast events & earn. Powered by WaboTrader AI_`,
  ]
    .filter(Boolean)
    .join("\n");

  openWhatsApp(text);
}

/**
 * Share a live agent alert / insight via WhatsApp
 */
export function shareAgentAlertViaWhatsApp(params: AgentAlertShareParams): void {
  const { message, type, timestamp } = params;

  const typeEmoji: Record<string, string> = {
    thought: "🧠",
    alert: "⚠️",
    action: "⚡",
    status: "📡",
  };

  const emoji = typeEmoji[type] || "📡";
  const timeText = timestamp
    ? new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleTimeString();

  const text = [
    `${emoji} *WaboTrader Agent ${type.toUpperCase()}*`,
    `🕐 ${timeText}`,
    ``,
    message,
    ``,
    `📡 Follow live at: ${WABO_APP_URL}`,
    `_WaboTrader — Autonomous Solana AI Agent_`,
  ].join("\n");

  openWhatsApp(text);
}

/**
 * Generic share helper (for chat responses)
 */
export function shareTextViaWhatsApp(title: string, content: string, link?: string): void {
  const text = [
    `🤖 *WaboTrader — ${title}*`,
    ``,
    content,
    link ? `\n🔗 ${link}` : null,
    ``,
    `_Powered by WaboTrader AI_`,
  ]
    .filter(Boolean)
    .join("\n");

  openWhatsApp(text);
}
