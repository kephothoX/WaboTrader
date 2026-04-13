/**
 * Perplexity Research Provider — Live market intelligence via Perplexity API
 */

export const perplexityProvider = {
  name: "PERPLEXITY_RESEARCH",
  description: "Provides real-time market research and news from Perplexity AI",
  dynamic: false,
  get: async () => {
    // Perplexity context is injected on-demand by actions that need deep research
    // This provider simply tells the agent that Perplexity is available
    return {
      text: "Perplexity Sonar-Reasoning is available for deep market research. Use it when users ask for comprehensive market analysis or news.",
      data: {
        available: !!process.env.PERPLEXITY_API_KEY,
        model: "sonar-reasoning",
      },
    };
  },
};

/**
 * Search Perplexity for financial data (called by actions on demand)
 */
export async function searchPerplexity(query: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return "Perplexity API key not configured. Set PERPLEXITY_API_KEY in .env";
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-reasoning",
        messages: [
          {
            role: "system",
            content: "You are a financial research analyst. Provide concise market data and analysis. Focus on Solana ecosystem tokens and DeFi protocols.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No results found.";
  } catch (error: any) {
    console.error("Perplexity search failed:", error);
    return `Research unavailable: ${error.message}`;
  }
}
