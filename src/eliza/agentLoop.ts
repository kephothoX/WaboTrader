/**
 * Agent Autonomous Loop — The "Heartbeat" of WaboTrader
 * Periodically observes the market, decides on insights, and emits pulses.
 */
import { pulseRegistry } from "./pulseRegistry";
import { solanaTradingPlugin } from "./plugins/solana-trading";
import { tradingAdvisor } from "./plugins/solana-trading/actions/tradingAdvisor";
import type { SolanaService } from "./plugins/solana-trading/services/solanaService";
import { perpDataProvider } from "./plugins/solana-trading/providers/perpDataProvider";
import { searchPerplexity } from "./plugins/solana-trading/providers/perplexityProvider";

let loopInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * The Autonomous OODA Loop (Observe, Orient, Decide, Act)
 */
async function runIteration(service: SolanaService) {
  if (isRunning) return;
  isRunning = true;

  try {
    // Service is now passed in as a parameter to avoid circularity issues
    
    // 1. OBSERVE — Scan for positive movers
    pulseRegistry.emitPulse({
        type: "status",
        message: "Scanning Solana ecosystem for top positive movers..."
    });

    // 1b. PROTOCOL RESEARCH — Check for special targets like Kana Labs
    const perpContext = await perpDataProvider.get();
    if (perpContext.data.kana && perpContext.data.kana.requiresDeepResearch && process.env.PERPLEXITY_API_KEY) {
        pulseRegistry.emitPulse({
            type: "thought",
            message: "Protocol Spotlight: Kana Labs depth metrics are indexed. Initializing deep sentiment pass via Perplexity..."
        });
        
        const sentiment = await searchPerplexity("Latest liquidity depth and user sentiment for Kana Labs protocol on Solana.");
        
        pulseRegistry.emitPulse({
            type: "thought",
            message: `🧠 **Kana Labs Research Update**: ${sentiment.slice(0, 150)}...`,
            data: { fullResearch: sentiment }
        });
    }

    const movers = await service.getPositiveMovers(3);
    
    if (movers.length === 0) {
        pulseRegistry.emitPulse({
            type: "thought",
            message: "Market appears stable. No significant breakout opportunities detected in the last hour."
        });
        return;
    }

    // 2. ORIENT & DECIDE — Analyze the top mover
    const topMover = movers[0];
    pulseRegistry.emitPulse({
        type: "thought",
        message: `Analyzing breakout candidate: ${topMover.symbol} (+${topMover.priceChange24h.toFixed(2)}%)`,
        data: topMover
    });

    // 2. ANALYZE (Evaluate for Spot & Perps)
    console.log(`🧠 Analyzing ${movers.length} breakout candidates...`);
    for (const mover of movers) {
        const recommendation = service.generateRecommendation(mover);
        
        if (recommendation.action === "BUY" && recommendation.confidence === "HIGH") {
            // Proactive Spot Signal
            pulseRegistry.emitPulse({
                type: "action",
                message: `🚀 **MOVER ALERT**: High confidence in **${mover.symbol}** breakout.`,
                data: { mover, recommendation }
            });

            // Proactive Perp Hedge/Speculation
            const perpQuote = await service.getPerpQuote(mover.symbol, "LONG", 0.5, 2.0);
            pulseRegistry.emitPulse({
                type: "action",
                message: `📈 **PERP STRATEGY**: Potential 2x LONG on ${mover.symbol} with SOL collateral. (Leverage capped for safety)`,
                data: { perpQuote }
            });
        }
    }

    // 3. STRATEGIC ADVISOR PASS
    const advisorResult = await tradingAdvisor.handler(null, { content: { text: "market strategy" } });
    if (advisorResult.success) {
        pulseRegistry.emitPulse({
            type: "thought",
            message: "🧠 **STRATEGY SYNC**: Cross-market analysis updated for Jupiter, Drift, and Mango.",
            data: advisorResult.data
        });
    }

    // Strategy Logic
    const recommendation = service.generateRecommendation(topMover);
    
    if (recommendation.action === "BUY" && recommendation.confidence !== "LOW") {
        // 3. ACT — Autonomous Trade
        const tradeAmount = 0.05; // Default safe amount
        
        pulseRegistry.emitPulse({
            type: "alert",
            message: `CRITERIA MET: Initiating autonomous trade for ${topMover.symbol}.`,
            data: { recommendation, amount: tradeAmount }
        });

        // If a real wallet is configured in .env, execute. 
        // Otherwise, prepare a Blink for the user to see in their log.
        const swapLink = service.generateSwapLink("So11111111111111111111111111111111111111112", topMover.mint, tradeAmount);
        
        pulseRegistry.emitPulse({
            type: "action",
            message: `EXECUTIVE ACTION: ${recommendation.action} ${tradeAmount} SOL of ${topMover.symbol}`,
            data: { 
                txLink: swapLink, 
                reason: recommendation.reasoning[0],
                indicators: recommendation.technicalIndicators
            }
        });
    } else {
        pulseRegistry.emitPulse({
            type: "thought",
            message: `Decided to wait on ${topMover.symbol}. ${recommendation.reasoning[0]}`,
            status: "monitoring"
        } as any);
    }

  } catch (error) {
    console.error("Agent Loop Iteration Error:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the autonomous agent loop
 * @param service The initialized SolanaService instance
 */
export function startAgentLoop(service: SolanaService) {
  if (loopInterval) return;
  
  console.log("🛡️ Starting Autonomous Agent Loop...");
  
  // Initial run
  runIteration(service);
  
  // Run every 60 seconds
  loopInterval = setInterval(() => runIteration(service), 60000);
}

/**
 * Stop the agent loop
 */
export function stopAgentLoop() {
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
    console.log("🛑 Autonomous Agent Loop stopped.");
  }
}
