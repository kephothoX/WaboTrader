"use client";

import { useEffect, useRef, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface TickerItem {
  symbol: string;
  price: number;
  change24h: number;
}

// Fallback static data while data loads
const FALLBACK_TICKERS: TickerItem[] = [
  { symbol: "SOL", price: 145.82, change24h: 3.21 },
  { symbol: "BTC", price: 64320.0, change24h: 1.45 },
  { symbol: "ETH", price: 3120.5, change24h: -0.82 },
  { symbol: "JUP", price: 0.847, change24h: 5.33 },
  { symbol: "BONK", price: 0.0000215, change24h: 12.4 },
  { symbol: "RAY", price: 5.62, change24h: -1.2 },
  { symbol: "WIF", price: 2.18, change24h: 7.8 },
  { symbol: "PYTH", price: 0.421, change24h: -3.1 },
];

interface LiveTickerBarProps {
  agentStatus?: { name: string; ready: boolean; model: string; simulation: boolean } | null;
  onOpenPulse?: () => void;
}

export default function LiveTickerBar({ agentStatus, onOpenPulse }: LiveTickerBarProps) {
  const [tickers, setTickers] = useState<TickerItem[]>(FALLBACK_TICKERS);
  const [mounted, setMounted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchTickers();
    const interval = setInterval(fetchTickers, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const fetchTickers = async () => {
    try {
      const res = await fetch("/api/eliza/movers?limit=10");
      if (!res.ok) {
        console.warn(`Ticker API returned ${res.status}`);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Ticker API returned non-JSON response");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setTickers(data.map((m: any) => ({
          symbol: m.symbol,
          price: m.price,
          change24h: m.priceChange24h
        })));
      }
    } catch (e) {
      console.error("Ticker fetch failed:", e);
    }
  };

  // Duplicate items for seamless loop
  const displayItems = [...tickers, ...tickers];

  return (
    <div className="ticker-bar">
      {/* Agent badge */}
      <div className="ticker-agent-badge" onClick={onOpenPulse} title="View Live Agent Pulse">
        <span className={`ticker-agent-dot ${agentStatus?.ready ? "ticker-agent-dot--live" : ""}`} />
        <span className="ticker-agent-label">
          {agentStatus?.simulation ? "SIM" : agentStatus?.ready ? "LIVE AI" : "OFFLINE"}
        </span>
      </div>

      {/* Scrolling ticker */}
      <div className="ticker-track-wrapper">
        <div className="ticker-track" ref={trackRef}>
          {displayItems.map((item, idx) => (
            <div key={`${item.symbol}-${idx}`} className="ticker-item">
              <span className="ticker-symbol">{item.symbol}</span>
              <span className="ticker-price">
                ${item.price < 0.01
                  ? item.price.toFixed(7)
                  : item.price < 1
                  ? item.price.toFixed(4)
                  : item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`ticker-change ${item.change24h >= 0 ? "ticker-change--up" : "ticker-change--down"}`}>
                {item.change24h >= 0 ? "▲" : "▼"} {Math.abs(item.change24h).toFixed(2)}%
              </span>
              <span className="ticker-sep">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right info & Wallet */}
      <div className="ticker-right">
        <div className="ticker-agent-meta">
          <span className="ticker-model">{agentStatus?.model || "Qwen3:8b"}</span>
          <span className="ticker-ooda">OODA ●</span>
        </div>
        <div className="ticker-wallet-wrapper">
          {mounted && <WalletMultiButton className="connect-wallet-btn header-wallet-btn" />}
        </div>
      </div>
    </div>
  );
}
