"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { tryExecuteAction } from "@/lib/chatActions";
import { shareTextViaWhatsApp } from "@/lib/whatsapp";

interface Message {
  id: string;
  role: "user" | "agent" | "system";
  agentId?: string;
  agentName?: string;
  text: string;
  data?: any;
  timestamp: number;
  threadId?: string;
  isAgentToAgent?: boolean;
}

interface Agent {
  id: string;
  name: string;
  status: "online" | "busy" | "offline";
  avatar: string;
  specialty: string;
}

interface WaboTraderChatProps {
  onNewMessage?: (message: Message) => void;
  walletAddress?: string | null;
  onConnectWallet?: () => void;
  mode?: "panel" | "modal";   // panel = full height, modal = 70vh
  onOpenPulse?: () => void;
}

const AGENTS: Agent[] = [
  { id: "wabotrader",     name: "WaboTrader",    status: "online", avatar: "🤖", specialty: "Trading & Analytics" },
  { id: "perps-analyzer", name: "PerpsAnalyzer", status: "online", avatar: "📊", specialty: "Perpetuals Analysis" },
  { id: "risk-manager",   name: "RiskManager",   status: "online", avatar: "🛡️", specialty: "Risk Assessment" },
];

export default function WaboTraderChat({
  onNewMessage,
  walletAddress,
  onConnectWallet,
  mode = "modal",
  onOpenPulse,
}: WaboTraderChatProps) {
  const [agents] = useState<Agent[]>(AGENTS);
  const [activeAgent, setActiveAgent] = useState<string>("wabotrader");
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [threads, setThreads] = useState<{ [key: string]: Message[] }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getWelcomeMessage = useCallback(() => {
    const base = `👋 **Welcome to WaboTrader AI Hub**\n\n🤖 **Multi-Agent System:**\n• **WaboTrader** — main trading orchestrator\n• **PerpsAnalyzer** — perpetuals & leverage specialist\n• **RiskManager** — risk assessment & portfolio guard\n\n💡 **I can execute app features:**\n• \`analyze SOL\` / \`buy SOL\` / \`sell JUP\`\n• \`long SOL 2x\` / \`short BTC 1.5x\`\n• \`generate momentum strategy\`\n• \`go to strategies\` / \`go to markets\`\n• \`help\` for full command list\n\n`;
    if (!walletAddress) {
      return base + `🔗 **Connect wallet** to unlock trading & portfolio features.`;
    }
    return base + `✅ **Wallet Connected** — Full trading access unlocked!`;
  }, [walletAddress]);

  useEffect(() => {
    setMounted(true);
    setMessages([{ id: "welcome", role: "agent", text: getWelcomeMessage(), timestamp: Date.now() }]);
  }, [getWelcomeMessage]);

  const scrollToBottom = useCallback((force = false) => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (force || scrollHeight - scrollTop - clientHeight < 120) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (mounted) scrollToBottom(messages.length <= 1);
  }, [messages, scrollToBottom, mounted]);

  useEffect(() => {
    if (mounted) {
      setMessages(prev =>
        prev.map(m => m.id === "welcome" ? { ...m, text: getWelcomeMessage() } : m)
      );
    }
  }, [walletAddress, getWelcomeMessage, mounted]);

  const requiresWallet = (msg: string) => {
    const ops = ["balance", "wallet", "buy", "sell", "swap", "trade", "execute", "portfolio", "transfer", "send"];
    return ops.some(op => msg.toLowerCase().includes(op));
  };

  const sendMessage = useCallback(async (text?: string, targetAgentId?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const mentionMatch = messageText.match(/^@(\w+)\s+(.+)$/);
    const agentId = targetAgentId || (mentionMatch ? mentionMatch[1] : activeAgent);
    const clean = mentionMatch ? mentionMatch[2] : messageText;

    // 1. Try local action registry first
    const localResult = tryExecuteAction(clean, {
      walletAddress,
      onNavigate: (path) => { window.location.href = path; },
      onOpenModal: (modal) => { if (modal === "pulse") onOpenPulse?.(); },
    });

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: clean,
      timestamp: Date.now(),
      agentId,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    if (localResult.handled) {
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        role: "agent",
        agentId,
        agentName: agents.find(a => a.id === agentId)?.name || "Agent",
        text: localResult.text,
        data: localResult.data,
        timestamp: Date.now(),
        threadId: activeThread ?? undefined,
      };
      setTimeout(() => {
        setMessages(prev => [...prev, agentMsg]);
        onNewMessage?.(agentMsg);
      }, 300);
      return;
    }

    // 2. Wallet-gated check
    if (requiresWallet(clean) && !walletAddress) {
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        role: "system",
        text: "🔗 **Wallet Required**\n\nConnect your Solana wallet to perform trading actions. Click the wallet button in the navigation sidebar.",
        timestamp: Date.now(),
      }]);
      return;
    }

    // 3. Send to AI backend
    setIsLoading(true);
    try {
      const res = await fetch("/api/eliza/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, walletAddress, agentId, threadId: activeThread }),
      });
      const data = await res.json();

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        role: "agent",
        agentId,
        agentName: agents.find(a => a.id === agentId)?.name || "Agent",
        text: data.text || data.error || "No response received.",
        data: data.data,
        timestamp: Date.now(),
        threadId: activeThread ?? undefined,
      };
      setMessages(prev => [...prev, agentMsg]);
      if (activeThread) {
        setThreads(prev => ({ ...prev, [activeThread]: [...(prev[activeThread] || []), userMsg, agentMsg] }));
      }
      onNewMessage?.(agentMsg);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "system",
        text: "❌ Failed to reach the agent. Please check server status.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, walletAddress, activeAgent, activeThread, agents, onNewMessage, onOpenPulse]);

  // Listen for quick action commands dispatched globally
  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail?.command) sendMessage(e.detail.command); };
    window.addEventListener("wabotrader-command", handler as EventListener);
    return () => window.removeEventListener("wabotrader-command", handler as EventListener);
  }, [sendMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const mentionMatch = val.match(/@(\w*)$/);
    if (mentionMatch) { setMentionQuery(mentionMatch[1]); setShowMentionSuggestions(true); }
    else setShowMentionSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectMention = (agentId: string) => {
    const m = input.match(/@\w*$/);
    if (m) {
      setInput(`${input.slice(0, m.index)}@${agentId} `);
      setShowMentionSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const copyMessage = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const shareMessage = (msg: Message) => {
    const title = msg.agentName ? `${msg.agentName} Signal` : "WaboTrader AI";
    // If it contains a Jupiter link, include it
    const jupMatch = msg.text.match(/https:\/\/jup\.ag[^\s`\n)]+/);
    shareTextViaWhatsApp(title, msg.text.replace(/\*\*/g, "").replace(/`/g, ""), jupMatch?.[0]);
  };

  const renderText = (text: string, data?: any) => {
    const lines = text.split("\n");
    const jupiterLink = data?.jupiterLink || text.match(/https:\/\/jup\.ag[^\s`\n)]+/)?.[0];

    return (
      <>
        {lines.map((line, i) => {
          let processed = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          processed = processed.replace(/`(.*?)`/g, "<code>$1</code>");
          return (
            <span key={i}>
              <span dangerouslySetInnerHTML={{ __html: processed }} />
              {i < lines.length - 1 && <br />}
            </span>
          );
        })}
        {jupiterLink && (
          <div style={{ marginTop: 10 }}>
            <a href={jupiterLink} target="_blank" rel="noopener noreferrer" className="jupiter-link-btn">
              ⚡ Execute on Jupiter
            </a>
          </div>
        )}
      </>
    );
  };

  const quickActions = [
    { label: "📊 Analyze SOL", command: "analyze SOL", agent: "wabotrader" },
    { label: "📈 Perps Data", command: "show perps analytics", agent: "perps-analyzer" },
    { label: "💰 Balance",    command: "show my balance",       agent: "wabotrader" },
    { label: "🛡️ Risk Check", command: "assess portfolio risk", agent: "risk-manager" },
    { label: "🎯 Strategies", command: "go to strategies" },
    { label: "🔍 BONK",       command: "analyze BONK",          agent: "wabotrader" },
    { label: "📡 Pulse",      command: "show live pulse" },
    { label: "❓ Help",        command: "help" },
  ];

  const panelHeight = mode === "panel" ? "calc(100vh - 36px - 52px)" : "70vh";

  return (
    <div className="chat-panel" style={{ height: panelHeight, border: "none", flex: 1 }}>
      {/* Agent selector bar */}
      <div className="agent-status-bar">
        <div className="agent-selector">
          <button className="agent-selector-btn" onClick={() => setShowAgentSelector(!showAgentSelector)}>
            {agents.find(a => a.id === activeAgent)?.avatar}{" "}
            {agents.find(a => a.id === activeAgent)?.name}
            <span className="dropdown-arrow">▼</span>
          </button>

          {showAgentSelector && (
            <div className="agent-dropdown">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  className={`agent-option ${agent.id === activeAgent ? "active" : ""}`}
                  onClick={() => { setActiveAgent(agent.id); setShowAgentSelector(false); }}
                >
                  <span className="agent-avatar">{agent.avatar}</span>
                  <div className="agent-info">
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-specialty">{agent.specialty}</div>
                  </div>
                  <span className={`agent-status ${agent.status}`}>●</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="thread-info">
          {activeThread && (
            <span className="thread-badge">
              🧵 Thread Active
              <button className="thread-close" onClick={() => setActiveThread(null)}>×</button>
            </span>
          )}
        </div>

        <div className="agent-collaboration">
          <button
            className="collab-btn"
            onClick={() => {
              const msg: Message = {
                id: `a2a-${Date.now()}`,
                role: "agent",
                agentId: "wabotrader",
                agentName: "WaboTrader",
                text: "@perps-analyzer Share current market momentum scores.",
                timestamp: Date.now(),
                isAgentToAgent: true,
              };
              setMessages(prev => [...prev, msg]);
            }}
            title="Agent collaboration"
          >🤝</button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={scrollContainerRef}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`chat-message ${msg.role} ${msg.isAgentToAgent ? "agent-to-agent" : ""}`}
          >
            <div className="message-header">
              <div className="message-sender">
                {msg.role === "user"   && "👤 You"}
                {msg.role === "agent"  && `${agents.find(a => a.id === msg.agentId)?.avatar || "🤖"} ${msg.agentName || "Agent"}`}
                {msg.role === "system" && "🔧 System"}
              </div>
              {msg.threadId && <div className="message-thread">🧵 {msg.threadId.slice(-6)}</div>}
              <div className="message-time" suppressHydrationWarning>
                {mounted && new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div className="message-bubble">
              {renderText(msg.text, msg.data)}
            </div>
            {/* Action row: only on agent messages */}
            {msg.role === "agent" && msg.id !== "welcome" && (
              <div className="message-share-row">
                <button
                  className="msg-action-btn msg-action-btn--copy"
                  onClick={() => copyMessage(msg.text, msg.id)}
                >
                  {copiedId === msg.id ? "✓ Copied" : "⎘ Copy"}
                </button>
                <button
                  className="msg-action-btn msg-action-btn--wa"
                  onClick={() => shareMessage(msg)}
                >
                  💬 WhatsApp
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="chat-message agent">
            <div className="message-header">
              <div className="message-sender">
                {agents.find(a => a.id === activeAgent)?.avatar}{" "}
                {agents.find(a => a.id === activeAgent)?.name}
              </div>
            </div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <div className="quick-actions">
          {quickActions.map(qa => (
            <button
              key={qa.label}
              className="quick-action-btn"
              onClick={() => sendMessage(qa.command, qa.agent)}
              disabled={isLoading}
            >
              {qa.label}
            </button>
          ))}
        </div>

        <div className="chat-input-wrapper" style={{ position: "relative" }}>
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            placeholder={`Ask ${agents.find(a => a.id === activeAgent)?.name}... (use @agentname for multi-agent)`}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />

          {showMentionSuggestions && (
            <div className="mention-suggestions">
              {agents
                .filter(a => a.name.toLowerCase().includes(mentionQuery.toLowerCase()) || a.id.includes(mentionQuery.toLowerCase()))
                .map(agent => (
                  <div key={agent.id} className="mention-suggestion" onClick={() => selectMention(agent.id)}>
                    <div className="mention-avatar">{agent.avatar}</div>
                    <div className="mention-info">
                      <div className="mention-name">{agent.name}</div>
                      <div className="mention-specialty">{agent.specialty}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <button className="chat-send-btn" onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
