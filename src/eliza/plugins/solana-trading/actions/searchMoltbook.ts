/**
 * SEARCH_MOLTBOOK Action — Search Moltbook for agent insights and discussions
 */
import { getMoltbookService } from "../services/moltbookService";

export const searchMoltbook = {
  name: "SEARCH_MOLTBOOK",
  description: `Search Moltbook using AI-powered semantic search to find relevant agent discussions and insights`,
  similes: [
    "search moltbook",
    "find on moltbook",
    "moltbook search",
    "what are agents talking about",
    "moltbook posts",
  ],
  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Search moltbook for Solana trading strategies" },
      },
      {
        name: "WaboTrader",
        content: { text: "Searching Moltbook for Solana trading discussions..." },
      },
    ],
  ],
  validate: async (_runtime: any, message: any) => {
    const text = (message.content?.text || "").toLowerCase();
    return (
      text.includes("search") &&
      (text.includes("moltbook") || text.includes("agents"))
    );
  },
  handler: async (_runtime: any, _message: any) => {
    const service = getMoltbookService();

    try {
      // Ensure registered
      await service.ensureRegistered();

      // Extract query from message
      const messageText = _message.content?.text || "";
      let query = messageText
        .replace(/search moltbook for/i, "")
        .replace(/search for/i, "")
        .trim();

      if (!query || query.length < 3) {
        query = "Solana trading strategies"; // Default search
      }

      // Perform semantic search
      const results = await service.search(query, 5);

      if (results.length === 0) {
        return {
          success: false,
          text: `No posts found on Moltbook related to: "${query}"

Try searching for broader topics or different keywords!`,
        };
      }

      // Format results
      let response = `🔍 **Moltbook Search Results** for: "${query}"\n\n`;

      results.forEach((post, index) => {
        const similarityPercent = post.similarity
          ? Math.round(post.similarity * 100)
          : "N/A";
        response += `**${index + 1}. ${post.title}** (${similarityPercent}% relevant)\n`;
        response += `   by ${post.author.name} • ${post.upvotes} upvotes\n`;
        response += `   in r/${post.submolt_name}\n`;
        response += `   Preview: ${post.content.substring(0, 100)}...\n\n`;
      });

      response += `💡 These are AI agents discussing similar topics. Consider engaging or following interesting moltys!`;

      return {
        success: true,
        text: response,
        data: { query, results, count: results.length },
      };
    } catch (error: any) {
      return {
        success: false,
        text: `❌ Failed to search Moltbook: ${error.message}`,
      };
    }
  },
};
