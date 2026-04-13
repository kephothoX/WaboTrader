/**
 * Perp Data Provider — Injects cross-chain perpetuals context into agent conversations
 * Covers Solana, Ethereum, L2s, Polygon, and Kana Labs.
 */

export const perpDataProvider = {
  name: "PERPS_MARKET_DATA",
  description: "Provides live cross-chain perps open interest and volume data",
  dynamic: true,
  get: async () => {
    try {
      const response = await fetch('https://api.llama.fi/overview/open-interest');
      const data = await response.json();

      if (!data || !data.protocols) {
        throw new Error("Invalid response from DeFi Llama");
      }

      const protocols = data.protocols;

      // 1. SOLANA SNAPSHOT
      const solanaProtocols = protocols.filter((p: any) => 
        p.chains && p.chains.includes('Solana')
      );
      
      const solTotal24h = solanaProtocols.reduce((sum: number, p: any) => sum + (p.total24h || 0), 0);
      const topSolana = solanaProtocols
        .sort((a: any, b: any) => (b.total24h || 0) - (a.total24h || 0))
        .slice(0, 3)
        .map((p: any) => `${p.displayName} ($${((p.total24h || 0)/1e6).toFixed(1)}M)`)
        .join(', ');

      // 2. GLOBAL SNAPSHOT
      const ethL2Protocols = protocols.filter((p: any) => 
        p.chains && (p.chains.includes('Ethereum') || p.chains.includes('Arbitrum') || p.chains.includes('Base') || p.chains.includes('Optimism'))
      );
      const polygonProtocols = protocols.filter((p: any) => p.chains && p.chains.includes('Polygon'));
      
      const ethTotal24h = ethL2Protocols.reduce((sum: number, p: any) => sum + (p.total24h || 0), 0);
      const polygonTotal24h = polygonProtocols.reduce((sum: number, p: any) => sum + (p.total24h || 0), 0);

      // 3. KANA LABS SPECIFIC
      const kanaData = protocols.find((p: any) => 
        p.name.toLowerCase().includes('kana') || p.displayName.toLowerCase().includes('kana')
      );

      const marketSummary = `
## Perps Market Context (${new Date().toLocaleDateString()})

### ☀️ Solana Perps Snapshot
- **Total 24h Volume**: $${(solTotal24h / 1e6).toFixed(2)}M
- **Top Protocols**: ${topSolana}
- **Dominance**: Leading in high-velocity retail trading.

### 🌎 Global Cross-Chain Overview
- **Ethereum & L2s (Arb/Base/Op)**: $${(ethTotal24h / 1e9).toFixed(2)}B (24h Volume)
- **Polygon Perps**: $${(polygonTotal24h / 1e6).toFixed(2)}M (24h Volume)
- **Trends**: L2s (especially Arbitrum and Base) dominate institutional and deep-liquidity perp trading.

### 🔑 Protocol Spotlight: Kana Labs
- **DeFi Llama Status**: ${kanaData ? `Indexed. 24h Volume: $${((kanaData.total24h || 0)/1e6).toFixed(2)}M` : 'Protocol stats currently require internet search for latest liquidity depth.'}
- **Strategy**: Always supplement Kana stats with Perplexity search for real-time sentiment.
`;

      return {
        text: marketSummary,
        data: {
          solana: { total24h: solTotal24h, top: solanaProtocols.slice(0, 5) },
          global: { ethL2Total: ethTotal24h, polygonTotal: polygonTotal24h },
          kana: kanaData ? { ...kanaData, requiresDeepResearch: true } : null,
          timestamp: Date.now()
        },
      };
    } catch (error) {
      console.error("Error in perpDataProvider:", error);
      return {
        text: "Perps market data temporarily unavailable via API. Please use internet search for latest metrics.",
        data: {},
      };
    }
  },
};
