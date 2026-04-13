"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { Providers } from "@/components/Providers";
import WaboTraderChat from "@/components/WaboTraderChat";
import WalletDashboard from "@/components/WalletDashboard";
import TradeActionCards from "@/components/TradeActionCards";
import PortfolioAnalytics from "@/components/PortfolioAnalytics";
import TransactionHistory from "@/components/TransactionHistory";
import SolanaPerpsAnalytics from "@/components/SolanaPerpsAnalytics";
import AgentPulseCenter from "@/components/AgentPulseCenter";
import NavSidebar from "@/components/NavSidebar";
import LiveTickerBar from "@/components/LiveTickerBar";
import SplashScreen from "@/components/SplashScreen";
import Footer from "@/components/Footer";

interface AgentStatus {
  name: string;
  ready: boolean;
  wallet: string | null;
  simulation: boolean;
  model: string;
  network: string;
  actions: string[];
  performance?: {
    totalTrades: number;
    winRate: number;
    totalProfitSol: number;
    activeStrategies: string[];
    lastRun: string;
  };
  market?: {
    solPrice: number;
    totalVolume24h: number;
    marketSentiment: string;
    topOpportunities: string[];
  };
}

export default function Home() {
  return (
    <Providers>
      <App />
    </Providers>
  );
}

function App() {
  const { publicKey, connected } = useWallet();
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);     // persistent right panel
  const [pulseOpen, setPulseOpen] = useState(false);  // pulse modal
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Suppress non-app console noise
    const originalError = console.error;
    const suppressedNoise = [
      "Failed to decode", "@solana/web3.js", "WalletConnectionError",
      "StandardWalletAdapter", "User rejected the request",
      "WalletWindowClosedError", "WalletConfigError"
    ];
    console.error = function (...args: any[]) {
      const msg = String(args[0]);
      if (!suppressedNoise.some(n => msg.includes(n))) originalError.apply(console, args);
    };

    fetchAgentStatus();
    setMounted(true);
    const interval = setInterval(fetchAgentStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch("/api/eliza/agents");
      const data = await res.json();
      setAgentStatus(data);
    } catch {
      setAgentStatus(null);
    }
  };

  const handleAction = (command: string) => {
    // Dispatch command into the persistent chat panel
    const event = new CustomEvent("wabotrader-command", { detail: { command } });
    setTimeout(() => window.dispatchEvent(event), 100);
  };

  return (
    <div className="app-shell">
      {/* ── Row 1: Ticker Bar ── */}
      <LiveTickerBar
        agentStatus={agentStatus}
        onOpenPulse={() => setPulseOpen(true)}
      />

      {/* ── Row 2 Col 1: Nav Sidebar ── */}
      <NavSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        agentReady={agentStatus?.ready ?? false}
        agentModel={agentStatus?.model ?? "Qwen3:8b"}
        onOpenPulse={() => setPulseOpen(true)}
      />

      {/* ── Row 2 Col 2: Main Content ── */}
      <main className="main-content-area">
        <div className="dashboard-content">

          {/* ── Stat Grid ── */}
          <div className="dashboard-stat-grid">
            <div className="stat-card-hero">
              <span className="stat-hero-label">Agent Mode</span>
              <span className={`stat-hero-value ${agentStatus?.ready ? "positive" : ""}`}>
                {agentStatus?.simulation ? "⚠️ SIM" : agentStatus?.ready ? "🟢 LIVE" : "⏳ INIT"}
              </span>
              <span className="stat-hero-sub">Autonomous OODA Loop</span>
            </div>
            <div className="stat-card-hero">
              <span className="stat-hero-label">Net Profit</span>
              <span className="stat-hero-value positive">+{agentStatus?.performance?.totalProfitSol.toFixed(2) || "0.00"} SOL</span>
              <span className="stat-hero-sub">Autonomous Yield</span>
            </div>
            <div className="stat-card-hero">
              <span className="stat-hero-label">Win Rate</span>
              <span className="stat-hero-value positive">{((agentStatus?.performance?.winRate || 0) * 100).toFixed(0)}%</span>
              <span className="stat-hero-sub">↑ {agentStatus?.performance?.totalTrades || 0} Trades</span>
            </div>
            <div className="stat-card-hero">
              <span className="stat-hero-label">Total Volume</span>
              <span className="stat-hero-value accent">
                ${agentStatus?.market ? (agentStatus.market.totalVolume24h / 1000000).toFixed(2) : "0.00"}M
              </span>
              <span className="stat-hero-sub">24h Market Dom</span>
            </div>
            <div className="stat-card-hero">
              <span className="stat-hero-label">AI Status</span>
              <span className="stat-hero-value" style={{ fontSize: 16 }}>
                {agentStatus?.market?.marketSentiment || "OPTIMIZING"}
              </span>
              <span className="stat-hero-sub">via Nosana GPU</span>
            </div>
          </div>

          {/* ── Trade Actions ── */}
          <TradeActionCards onAction={handleAction} />

          {/* ── Perps Analytics ── */}
          <SolanaPerpsAnalytics />

          {/* ── Wallet / Portfolio ── */}
          <div className="dashboard-analytics-row">
            <WalletDashboard
              walletAddress={publicKey?.toString() || null}
              walletConnected={connected}
            />
            {connected && publicKey ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <PortfolioAnalytics />
                <TransactionHistory />
              </div>
            ) : (
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 36 }}>🔗</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Connect Your Wallet</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Connect a Solana wallet to unlock portfolio analytics, transaction history, and live trade execution.
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <Footer />

        </div>
      </main>

      {/* ── Row 2 Col 3: Persistent AI Chat Panel ── */}
      <aside className={`chat-panel-persistent ${chatOpen ? "" : ""}`}>
        <div className="chat-panel-header">
          <div className="chat-panel-title">
            <span>🤖</span>
            <span>WaboTrader AI</span>
            <div className={`status-dot ${agentStatus?.ready ? "" : "offline"}`} style={{ margin: 0 }} />
          </div>
          <div className="chat-panel-actions">
            <button
              className="chat-panel-btn"
              onClick={() => setPulseOpen(true)}
              title="Live Agent Pulse"
            >
              📡 Pulse
            </button>
          </div>
        </div>

        {mounted && (
          <WaboTraderChat
            walletAddress={publicKey?.toString() || null}
            onConnectWallet={() => { /* wallet modal handled by NavSidebar */ }}
            mode="panel"
            onOpenPulse={() => setPulseOpen(true)}
          />
        )}
      </aside>

      {/* ── Live Pulse Modal ── */}
      {pulseOpen && (
        <div className="modal-overlay" onClick={() => setPulseOpen(false)}>
          <div
            className="modal-content activity-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-simple">
              <div className="modal-title-simple">📡 Live Agent Consciousness</div>
              <button className="modal-close" onClick={() => setPulseOpen(false)}>×</button>
            </div>
            {mounted && <AgentPulseCenter />}
          </div>
        </div>
      )}
      {/* ── SplashScreen ── */}
      <SplashScreen />
    </div>
  );
}