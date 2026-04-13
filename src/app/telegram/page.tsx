"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Providers } from "@/components/Providers";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { shareTradeViaWhatsApp, shareStrategyViaWhatsApp } from "@/lib/whatsapp";

type Tab = "market" | "perps" | "transfer" | "strategy";

interface PulseEvent {
  id: string;
  type: "thought" | "alert" | "action" | "status";
  message: string;
  data?: any;
  timestamp: number;
}

interface Mover {
  mint: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  liquidity: number;
}

interface PendingTransfer {
  id: string;
  to: string;
  amount: number;
  symbol: string;
}

export default function TelegramMiniApp() {
  return (
    <Providers>
      <TmaDashboard />
    </Providers>
  );
}

function TmaDashboard() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>("market");
  const [pulses, setPulses] = useState<PulseEvent[]>([]);
  const [movers, setMovers] = useState<Mover[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [perpQuote, setPerpQuote] = useState<any>(null);
  const [leverage, setLeverage] = useState(2.0);
  const [autoMode, setAutoMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [agentStatus, setAgentStatus] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const es = new EventSource("/api/eliza/pulse");
    es.onmessage = (event) => {
      if (event.data === ": heartbeat") return;
      try {
        const pulse = JSON.parse(event.data);
        setPulses(prev => [pulse, ...prev].slice(0, 15));
      } catch {}
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => { es.close(); clearInterval(interval); };
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, moverRes, transferRes] = await Promise.all([
        fetch("/api/eliza/agents"),
        fetch("/api/eliza/movers"),
        fetch("/api/eliza/transfers"),
      ]);
      setAgentStatus(await statusRes.json());
      setMovers(await moverRes.json());
      setPendingTransfers(await transferRes.json());
    } catch {}
  };

  const fetchPerpQuote = async (side: "LONG" | "SHORT") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/eliza/perps?symbol=SOL&side=${side}&leverage=${leverage}`);
      setPerpQuote(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const approveBatch = async () => {
    setLoading(true);
    try {
      await fetch("/api/eliza/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: pendingTransfers.map(t => t.id) }),
      });
      setPendingTransfers([]);
      alert("Batch transaction successful!");
    } catch {
      alert("Batch failed");
    } finally {
      setLoading(false);
    }
  };

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "market",   icon: "📊", label: "Market" },
    { id: "perps",    icon: "📈", label: "Perps" },
    { id: "transfer", icon: "💸", label: "Transfer" },
    { id: "strategy", icon: "🎯", label: "Strategy" },
  ];

  return (
    <div className="tma-shell">
      {/* Ambient orbs */}
      <div className="tma-orb tma-orb-1" />
      <div className="tma-orb tma-orb-2" />

      {/* Header */}
      <header className="tma-header">
        <div className="tma-brand">
          <div className="tma-brand-logo">
            <Image src="/images/logo.png" alt="Wabo" width={22} height={22} style={{ objectFit: "contain" }} />
          </div>
          <div>
            <span className="tma-brand-name">WaboTrader</span>
            <span className="tma-brand-tagline">Autonomous AI</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/" style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}>
            🌐 Web App
          </Link>
          {mounted && <WalletMultiButton className="connect-wallet-btn" style={{ fontSize: 11, padding: "6px 10px" }} />}
        </div>
      </header>

      {/* Main content */}
      <main className="tma-main">

        {/* ── MARKET TAB ──────────────────────────────────── */}
        {activeTab === "market" && (
          <div className="animate-in">
            {/* Pulse section */}
            <div className="tma-pulse-section">
              <div className="tma-pulse-header">
                <div className="tma-pulse-dot" />
                <span className="tma-pulse-title">Live Intelligence</span>
              </div>
              <div className="tma-pulse-list">
                {pulses.length > 0 ? pulses.map(p => (
                  <div key={p.id} className="tma-pulse-item">
                    <span className="tma-pulse-time">
                      {new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="tma-pulse-msg">{p.message}</span>
                  </div>
                )) : (
                  <div className="tma-empty" style={{ padding: "16px 0" }}>Connecting to agent stream...</div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="tma-stats-grid">
              <div className="tma-stat-card">
                <span className="tma-stat-label">Win Rate</span>
                <span className="tma-stat-value green">
                  {((agentStatus?.performance?.winRate || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="tma-stat-card">
                <span className="tma-stat-label">Hedge Ratio</span>
                <span className="tma-stat-value purple">
                  {agentStatus?.performance ? "1.4x" : "---"}
                </span>
              </div>
              <div className="tma-stat-card">
                <span className="tma-stat-label">Sentiment</span>
                <span className={`tma-stat-value ${agentStatus?.market?.marketSentiment === "BULLISH" ? "green" : "blue"}`}>
                  {agentStatus?.market?.marketSentiment || "SCAN..."}
                </span>
              </div>
            </div>

            {/* Top movers */}
            <div className="tma-glass-card">
              <div className="tma-section-title">🚀 Top Positive Movers</div>
              <div className="tma-movers-scroll">
                {movers.length > 0 ? movers.map((m, idx) => (
                  <div key={`${m.mint}-${idx}`} className="tma-mover-card">
                    <span className="tma-mover-symbol">{m.symbol}</span>
                    <span className={`tma-mover-change ${m.priceChange24h >= 0 ? "up" : "down"}`}>
                      {m.priceChange24h >= 0 ? "▲" : "▼"} {Math.abs(m.priceChange24h).toFixed(1)}%
                    </span>
                    <button
                      className="tma-trade-sm-btn"
                      onClick={() => setActiveTab("perps")}
                    >
                      Trade Perp
                    </button>
                    <button
                      className="share-wa-btn"
                      onClick={() => shareTradeViaWhatsApp({
                        symbol: m.symbol,
                        side: "LONG",
                        price: m.price,
                      })}
                    >
                      💬
                    </button>
                  </div>
                )) : (
                  <div className="tma-empty" style={{ padding: "12px 0" }}>Scanning markets...</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PERPS TAB ──────────────────────────────────── */}
        {activeTab === "perps" && (
          <div className="tma-glass-card animate-in">
            <div className="tma-section-title">📈 Perpetual Trading</div>
            <div className="tma-perp-pair">SOL-PERP</div>

            <div className="tma-leverage-row">
              <div className="tma-leverage-label">
                <span>Leverage</span>
                <span>{leverage.toFixed(1)}x</span>
              </div>
              <input
                id="tma-leverage-slider"
                aria-label="Leverage slider"
                className="tma-leverage-slider"
                type="range"
                min="1.1" max="3.0" step="0.1"
                value={leverage}
                onChange={e => setLeverage(parseFloat(e.target.value))}
              />
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Safety Cap: 3.0x</div>
            </div>

            <div className="tma-side-btns">
              <button className="tma-long-btn" onClick={() => fetchPerpQuote("LONG")} disabled={loading}>
                {loading ? "..." : "🟢 Go Long"}
              </button>
              <button className="tma-short-btn" onClick={() => fetchPerpQuote("SHORT")} disabled={loading}>
                {loading ? "..." : "🔴 Go Short"}
              </button>
            </div>

            {perpQuote && (
              <div className="tma-quote-card">
                <div className="tma-quote-row">
                  <span>Entry Price</span>
                  <span>${perpQuote.entryPrice?.toFixed(2)}</span>
                </div>
                <div className="tma-quote-row">
                  <span>Liquidation</span>
                  <span style={{ color: "var(--text-red)" }}>${perpQuote.liquidationPrice?.toFixed(2)}</span>
                </div>
                <div className="tma-quote-row">
                  <span>Side</span>
                  <span>{perpQuote.side}</span>
                </div>
                <a
                  href={`https://jup.ag/perps/SOL?leverage=${leverage}&side=${perpQuote.side?.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tma-execute-btn"
                  style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                >
                  ⚡ Confirm {perpQuote.side} Position
                </a>
                <button
                  className="share-wa-btn"
                  style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                  onClick={() => shareTradeViaWhatsApp({
                    symbol: "SOL",
                    side: perpQuote.side,
                    price: perpQuote.entryPrice,
                    leverage,
                    jupiterLink: `https://jup.ag/perps/SOL?leverage=${leverage}&side=${perpQuote.side?.toLowerCase()}`,
                  })}
                >
                  💬 Share via WhatsApp
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSFER TAB ────────────────────────────────── */}
        {activeTab === "transfer" && (
          <div className="tma-glass-card animate-in">
            <div className="tma-section-title">💸 Pending Batch Approvals</div>
            {pendingTransfers.length > 0 ? (
              <>
                <div className="tma-transfer-list">
                  {pendingTransfers.map(t => (
                    <div key={t.id} className="tma-transfer-item">
                      <div>
                        <div className="tma-transfer-amount">{t.amount} {t.symbol}</div>
                        <div className="tma-transfer-to">{t.to.slice(0, 10)}...</div>
                      </div>
                      <span className="sim-badge">QUEUED</span>
                    </div>
                  ))}
                </div>
                <button
                  className="tma-execute-btn"
                  disabled={loading}
                  onClick={approveBatch}
                  style={{ marginTop: 16 }}
                >
                  {loading ? "PROCESSING..." : `✅ APPROVE ALL (${pendingTransfers.length})`}
                </button>
              </>
            ) : (
              <div className="tma-empty">
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                No pending transfers.
                <div style={{ fontSize: 12, marginTop: 6, color: "var(--text-muted)" }}>
                  Ask the AI: "Send 0.1 SOL to [address]"
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STRATEGY TAB ────────────────────────────────── */}
        {activeTab === "strategy" && (
          <div className="animate-in">
            <div className="tma-glass-card">
              <div className="tma-section-title">🧠 Wabo AI Advisor</div>
              <div className="tma-advisor-note">
                "Market sentiment is currently <strong>BULLISH</strong>. I am prioritizing Drift and Mango for cross-margin hedging with controlled leverage."
              </div>
              <div className="tma-strategy-card">
                <div className="tma-strategy-tag">Recommendation</div>
                <div className="tma-strategy-name">SOL-USDC Hedged Long</div>
                <div className="tma-strategy-detail">Entry: $145.20 | Leverage: 1.5x | Risk: Moderate</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
                <button className="tma-execute-btn" onClick={() => alert("Strategy applied!")}>
                  🤖 Auto-Apply Strategy
                </button>
                <button
                  className="share-wa-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => shareStrategyViaWhatsApp({
                    name: "SOL-USDC Hedged Long",
                    type: "Momentum",
                    token: "SOL",
                    riskProfile: "Moderate",
                    winRate: 0.68,
                    totalReturn: 12.4,
                    description: "Entry: $145.20 | Leverage: 1.5x",
                  })}
                >
                  💬 Share Strategy via WhatsApp
                </button>
              </div>
            </div>

            <div className="tma-glass-card">
              <div className="tma-section-title">📊 Quick Commands</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { cmd: "/strategy momentum SOL", desc: "Generate momentum strategy" },
                  { cmd: "/backtest 30", desc: "Backtest last 30 days" },
                  { cmd: "/marketplace", desc: "Browse strategy marketplace" },
                ].map(item => (
                  <div
                    key={item.cmd}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 12px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: 10,
                      border: "1px solid var(--sol-border)"
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--sol-green)" }}>{item.cmd}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <Link
                      href="/"
                      style={{ fontSize: 10, color: "var(--sol-purple)", textDecoration: "none", fontWeight: 700 }}
                    >
                      OPEN ›
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Bottom nav */}
      <nav className="tma-bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tma-nav-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tma-nav-icon">{tab.icon}</span>
            <span className="tma-nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
