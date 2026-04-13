"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  subLabel?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: "⬡", label: "Dashboard", subLabel: "Home" },
  { href: "/strategies", icon: "📈", label: "Strategies", subLabel: "AI Trading" },
  { href: "/markets", icon: "🎯", label: "Markets", subLabel: "Predictions" },
  { href: "/telegram", icon: "✈️", label: "Telegram", subLabel: "Mini App" },
];

interface NavSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  agentReady: boolean;
  agentModel: string;
  onOpenPulse: () => void;
}

export default function NavSidebar({
  isOpen,
  onToggle,
  agentReady,
  agentModel,
  onOpenPulse,
}: NavSidebarProps) {
  const pathname = usePathname();
  const { publicKey, connected } = useWallet();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="nav-overlay"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <nav className={`nav-sidebar ${isOpen ? "nav-sidebar--open" : "nav-sidebar--closed"}`}>
        {/* Brand */}
        <div className="nav-brand">
          <div className="nav-brand-logo">
            <Image src="/images/logo.png" alt="WaboTrader" width={28} height={28} style={{ objectFit: "contain" }} />
          </div>
          {isOpen && (
            <div className="nav-brand-text">
              <span className="nav-brand-name">WaboTrader</span>
              <span className="nav-brand-sub">Autonomous AI</span>
            </div>
          )}
          <button className="nav-toggle-btn" onClick={onToggle} title={isOpen ? "Collapse" : "Expand"}>
            {isOpen ? "‹" : "›"}
          </button>
        </div>

        {/* Nav Items */}
        <ul className="nav-items">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-item ${isActive ? "nav-item--active" : ""}`}
                  title={item.label}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {isOpen && (
                    <div className="nav-item-text">
                      <span className="nav-item-label">{item.label}</span>
                      <span className="nav-item-sublabel">{item.subLabel}</span>
                    </div>
                  )}
                  {isActive && <span className="nav-item-indicator" />}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="nav-divider" />

        {/* Social Links */}
        <div className="nav-social">
          <a
            href="https://chat.whatsapp.com/your-group-link"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-social-btn nav-social-btn--whatsapp"
            title="Join WhatsApp Group"
          >
            <span className="nav-item-icon">💬</span>
            {isOpen && <span className="nav-social-label">WhatsApp</span>}
          </a>
          <a
            href="https://t.me/WaboTraderBot"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-social-btn nav-social-btn--telegram"
            title="Open Telegram Bot"
          >
            <span className="nav-item-icon">✈️</span>
            {isOpen && <span className="nav-social-label">Telegram Bot</span>}
          </a>
        </div>

        <div className="nav-divider" />

        {/* Agent Status */}
        <div className="nav-agent-status" onClick={onOpenPulse} title="View Live Pulse">
          <div className={`nav-agent-dot ${agentReady ? "nav-agent-dot--online" : "nav-agent-dot--offline"}`} />
          {isOpen && (
            <div className="nav-agent-info">
              <span className="nav-agent-label">{agentReady ? "Agent Active" : "Agent Offline"}</span>
              <span className="nav-agent-model">{agentModel || "Qwen3:8b"}</span>
            </div>
          )}
        </div>

      </nav>
    </>
  );
}
