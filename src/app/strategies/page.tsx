"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Providers } from "@/components/Providers";
import StrategyGenerator from "@/components/StrategyGenerator";
import BacktestResults from "@/components/BacktestResults";
import StrategyDashboard from "@/components/StrategyDashboard";
import StrategyMarketplace from "@/components/StrategyMarketplace";
import NavSidebar from "@/components/NavSidebar";
import AgentPulseCenter from "@/components/AgentPulseCenter";
import Footer from "@/components/Footer";
import { shareStrategyViaWhatsApp } from "@/lib/whatsapp";
import LiveTickerBar from "@/components/LiveTickerBar";

export default function StrategiesPage() {
  return (
    <Providers>
      <StrategiesApp />
    </Providers>
  );
}

function StrategiesApp() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"generator" | "dashboard" | "marketplace">("generator");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState<any>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAgentStatus();
  }, []);

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch("/api/eliza/agents");
      if (!res.ok) throw new Error(`Status API error: ${res.status}`);
      const data = await res.json();
      setAgentStatus(data);
    } catch (e) {
      console.error("Failed to fetch agent status:", e);
      // Fallback status if API is offline
      setAgentStatus({
        ready: false,
        model: "Qwen3:8b",
        performance: { totalTrades: 0, winRate: 0, totalProfitSol: 0, activeStrategies: [] }
      });
    }
  };

  const TABS = [
    { id: "generator",   icon: "🎯", label: "Generator" },
    { id: "dashboard",   icon: "📊", label: "Dashboard" },
    { id: "marketplace", icon: "🏪", label: "Marketplace" },
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
              <h1>Trading Strategies</h1>
              <p>AI-powered strategy generation, backtesting &amp; autonomous execution</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div className="sim-toggle-btn" style={{ cursor: 'default', opacity: 0.8 }}>
                🎯 Live Mode Only
              </div>
              <button
                className="share-wa-btn"
                onClick={() => shareStrategyViaWhatsApp({
                  name: "WaboTrader Strategy Suite",
                  type: "Multi-Strategy",
                  token: "SOL / USDC",
                  riskProfile: "Moderate",
                  winRate: agentStatus?.performance?.winRate || 0.68,
                  totalReturn: 12.4,
                })}
              >
                <span className="share-wa-icon">💬</span>
                Share via WhatsApp
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="page-stat-row">
            <div className="page-stat-card">
              <span className="page-stat-card-label">Active Strategies</span>
              <span className="page-stat-card-value">
                {agentStatus?.performance?.activeStrategies.length || 0}
              </span>
            </div>
            <div className="page-stat-card">
              <span className="page-stat-card-label">Total Profit</span>
              <span className="page-stat-card-value positive">
                +{agentStatus?.performance?.totalProfitSol.toFixed(2) || "0.00"} SOL
              </span>
            </div>
            <div className="page-stat-card">
              <span className="page-stat-card-label">Win Rate</span>
              <span className="page-stat-card-value">
                {((agentStatus?.performance?.winRate || 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="page-stat-card">
              <span className="page-stat-card-label">Execution Status</span>
              <span className="page-stat-card-value accent">AUTONOMOUS</span>
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
            {activeTab === "generator" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <StrategyGenerator />
                <BacktestResults />
              </div>
            )}
            {activeTab === "dashboard"   && <StrategyDashboard />}
            {activeTab === "marketplace" && <StrategyMarketplace />}
          </div>

          {/* Info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { icon: "🚀", title: "Strategy Types", desc: "Momentum, Mean Reversion, Arbitrage, Grid Trading, DCA" },
              { icon: "📈", title: "Risk Profiles",  desc: "Conservative (5%), Moderate (10%), Aggressive (20%)" },
              { icon: "⚡", title: "Auto Execution", desc: "Up to 5 concurrent strategies with 10 trades/hour rate limit" },
            ].map(card => (
              <div key={card.title} className="glass-card">
                <div style={{ fontSize: 20, marginBottom: 8 }}>{card.icon}</div>
                <div className="card-title">{card.title}</div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
          
          <Footer />
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
