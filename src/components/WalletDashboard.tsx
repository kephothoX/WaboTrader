"use client";

import { useState, useEffect } from "react";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number | null;
}

interface WalletData {
  address: string | null;
  solBalance: number;
  solPrice: number;
  solUsdValue: number;
  tokenBalances: TokenBalance[];
  totalUsdValue: number;
  connected: boolean;
}

interface WalletDashboardProps {
  walletAddress?: string | null;
  walletConnected?: boolean;
}

export default function WalletDashboard({ walletAddress, walletConnected }: WalletDashboardProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (walletConnected || walletAddress) {
      fetchWalletData();
      const interval = setInterval(fetchWalletData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    } else {
      setWallet(null);
      setLoading(false);
    }
  }, [walletConnected, walletAddress]);

  const fetchWalletData = async () => {
    try {
      let currentWallet = walletAddress;

      // If no address provided, try to get it from agent status
      if (!currentWallet) {
        const res = await fetch("/api/eliza/agents");
        const agentStatus = await res.json();
        currentWallet = agentStatus.wallet;
      }

      if (currentWallet) {
        // Fetch balance through the chat API with wallet context
        const balanceRes = await fetch("/api/eliza/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "show my balance",
            walletAddress: currentWallet
          }),
        });
        const balanceData = await balanceRes.json();

        if (balanceData.data) {
          setWallet({
            ...balanceData.data,
            connected: true,
          });
        } else {
          setWallet({
            address: currentWallet,
            solBalance: 0,
            solPrice: 0,
            solUsdValue: 0,
            tokenBalances: [],
            totalUsdValue: 0,
            connected: true,
          });
        }
      } else {
        setWallet({
          address: null,
          solBalance: 0,
          solPrice: 0,
          solUsdValue: 0,
          tokenBalances: [],
          totalUsdValue: 0,
          connected: false,
        });
      }
    } catch {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card">
        <div className="card-header">
          <span className="card-title">Wallet</span>
          <span className="card-icon">💰</span>
        </div>
        <div className="skeleton" style={{ height: 32, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: "60%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 40 }} />
      </div>
    );
  }

  const shortAddr = wallet?.address
    ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
    : "Not Connected";

  return (
    <div className="glass-card">
      <div className="card-header">
        <span className="card-title">Wallet</span>
        <span className="card-icon">💰</span>
      </div>

      <div className="wallet-balance" style={{ marginTop: 8 }}>
        {wallet?.solBalance?.toFixed(4) || "0.0000"} SOL
      </div>
      <div className="wallet-usd">
        ≈ ${wallet?.solUsdValue?.toFixed(2) || "0.00"} USD
      </div>

      <div className="wallet-address">
        <span>🔑</span>
        <span>{shortAddr}</span>
      </div>

      {wallet?.tokenBalances && wallet.tokenBalances.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="card-title" style={{ marginBottom: 10, fontSize: 11 }}>
            Token Holdings
          </div>
          <div className="token-list">
            {wallet.tokenBalances.map((token) => (
              <div key={token.symbol} className="token-row">
                <div className="token-info">
                  <div className="token-icon">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="token-symbol">{token.symbol}</div>
                    <div className="token-name">{token.name}</div>
                  </div>
                </div>
                <div className="token-balance-amount">
                  <div className="token-amount">{token.balance.toFixed(2)}</div>
                  <div className="token-usd">
                    {token.usdValue !== null ? `$${token.usdValue.toFixed(2)}` : "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {wallet && (
        <div
          style={{
            marginTop: 16,
            padding: "10px 12px",
            background: "rgba(20, 241, 149, 0.06)",
            borderRadius: 10,
            border: "1px solid rgba(20, 241, 149, 0.15)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Portfolio</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--sol-green)" }}>
            ${wallet.totalUsdValue?.toFixed(2) || "0.00"}
          </div>
        </div>
      )}
    </div>
  );
}
