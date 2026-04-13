/**
 * Trade Evaluator — Tracks trade outcomes and extracts lessons for agent memory
 */

export const tradeEvaluator = {
  name: "trade-outcome-evaluator",
  description: "Evaluates completed trades and extracts patterns for the agent's learning",
  alwaysRun: false,
  examples: [],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return text.includes("trade executed") || text.includes("swap completed");
  },
  handler: async (_runtime: any, message: any) => {
    const text = message.content?.text || "";

    // Extract trade data from the message context
    const tradeData = message.content?.data;
    if (!tradeData) return null;

    const timestamp = new Date().toISOString();
    const isSimulation = text.includes("[SIMULATION]");

    const evaluation = {
      timestamp,
      type: "trade_execution",
      simulation: isSimulation,
      success: text.includes("✅"),
      extractedFacts: [] as string[],
    };

    if (evaluation.success) {
      evaluation.extractedFacts.push(
        `Trade executed successfully at ${timestamp}`,
        `Mode: ${isSimulation ? "Simulation" : "Live"}`
      );
    } else {
      evaluation.extractedFacts.push(
        `Trade failed at ${timestamp}`,
        `Error context preserved for future reference`
      );
    }

    console.log("📝 Trade evaluation:", JSON.stringify(evaluation, null, 2));
    return evaluation;
  },
};
