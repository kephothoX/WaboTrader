"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Providers } from "@/components/Providers";
import MarketDiscovery from "@/components/MarketDiscovery";
import MarketCreator from "@/components/MarketCreator";
import MarketTradingInterface from "@/components/MarketTradingInterface";
import MarketAnalytics from "@/components/MarketAnalytics";
import PositionManager from "@/components/PositionManager";
import MarketComments from "@/components/MarketComments";
import NavSidebar from "@/components/NavSidebar";
import LiveTickerBar from "@/components/LiveTickerBar";
import AgentPulseCenter from "@/components/AgentPulseCenter";
import { shareMarketViaWhatsApp } from "@/lib/whatsapp";

export default function MarketsPage() {
  return (
    <Providers>
      <MarketsApp />
    </Providers>
  );
}

function MarketsApp() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"discover" | "create" | "trade" | "positions">("discover");
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/eliza/agents")
      .then(res => res.json())
      .then(data => setAgentStatus(data))
      .catch(console.error);
  }, []);

  const TABS = [
    { id: "discover",   icon: "🔍", label: "Discover" },
    { id: "create",     icon: "✨", label: "Create" },
    { id: "trade",      icon: "💰", label: "Trade" },
    { id: "positions",  icon: "📋", label: "Positions" },
  ] as const;

  return (
    <div className="app-shell">
      {/* Ticker */}
      <LiveTickerBar onOpenPulse={() => setPulseOpen(true)} agentStatus={agentStatus} />

      {/* Nav */}
      <NavSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        agentReady={agentStatus?.ready || false}
        agentModel={agentStatus?.model || "Qwen3:8b"}
        onOpenPulse={() => setPulseOpen(true)}
      />

      {/* Content */}
      <main className="main-content-area">
        <div className="page-shell">
          {/* Header */}
          <div className="page-header">
            <div className="page-title-block">
              <h1>Prediction Markets</h1>
              <p>Forecast events and trade on outcomes with the crowd</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div className="sim-toggle-btn" style={{ cursor: 'default', opacity: 0.8 }}>
                🎯 Live Mode Only
              </div>
              {selectedMarket && (
                <button
                  className="share-wa-btn"
                  onClick={() => shareMarketViaWhatsApp({
                    question: "Current prediction market",
                    marketId: selectedMarket,
                    volume: agentStatus?.market?.totalVolume24h || 48200,
                  })}
                >
                  <span className="share-wa-icon">💬</span>
                  Share Market
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="page-stat-row">
            <div className="page-stat-card">
              <span className="page-stat-card-label">Active Markets</span>
              <span className="page-stat-card-value">
                {agentStatus?.market?.topOpportunities.length || 7}
              </span>
            </div>
            <div className="page-stat-card">
              <span className="page-stat-card-label">24h Market Volume</span>
              <span className="page-stat-card-value positive">
                ${agentStatus?.market ? (agentStatus.market.totalVolume24h / 1000).toFixed(1) : "---"}K
              </span>
            </div>
            <div className="page-stat-card">
              <span className="page-stat-card-label">Market Sentiment</span>
              <span className={`page-stat-card-value ${agentStatus?.market?.marketSentiment === "BULLISH" ? "positive" : ""}`}>
                {agentStatus?.market?.marketSentiment || "SCANNING"}
              </span>
            </div>
            <div className="page-stat-card">
              <span className="page-stat-card-label">Agent Confidence</span>
              <span className="page-stat-card-value accent">
                {((agentStatus?.performance?.winRate || 0.72) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="page-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`page-tab ${activeTab === tab.id ? "page-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="animate-in" key={activeTab}>
            {activeTab === "discover" && <MarketDiscovery />}

            {activeTab === "create" && (
              <div style={{ maxWidth: 600 }}>
                <MarketCreator onMarketCreated={(marketId) => {
                  setSelectedMarket(marketId);
                  setActiveTab("trade");
                }} />
              </div>
            )}

            {activeTab === "trade" && selectedMarket && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <MarketTradingInterface marketId={selectedMarket} />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <MarketAnalytics marketId={selectedMarket} />
                  <MarketComments marketId={selectedMarket} />
                </div>
              </div>
            )}

            {activeTab === "trade" && !selectedMarket && (
              <div className="glass-card" style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Select a Market</div>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  Go to <strong>Discover</strong> and select a market to start trading.
                </p>
              </div>
            )}

            {activeTab === "positions" && <PositionManager />}
          </div>

          {/* Info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { icon: "🎯", title: "How It Works",       desc: "Buy YES or NO shares. If your prediction is correct, you win the pot!" },
              { icon: "💧", title: "Liquidity Pools",    desc: "Provide liquidity and earn a share of trading fees from all volume." },
              { icon: "🏆", title: "Resolved Markets",   desc: "Claim your winnings automatically when markets resolve on-chain." },
            ].map(card => (
              <div key={card.title} className="glass-card">
                <div style={{ fontSize: 20, marginBottom: 8 }}>{card.icon}</div>
                <div className="card-title">{card.title}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Pulse Modal */}
      {pulseOpen && (
        <div className="modal-overlay" onClick={() => setPulseOpen(false)}>
          <div className="modal-content activity-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-simple">
              <div className="modal-title-simple">📡 Live Agent Consciousness</div>
              <button className="modal-close" onClick={() => setPulseOpen(false)}>×</button>
            </div>
            <AgentPulseCenter />
          </div>
        </div>
      )}
    </div>
  );
}
