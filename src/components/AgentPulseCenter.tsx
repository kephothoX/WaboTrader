"use client";

import { useState, useEffect, useRef } from "react";

interface PulseEvent {
  id: string;
  type: "thought" | "alert" | "action" | "status";
  message: string;
  data?: any;
  timestamp: number;
}

export default function AgentPulseCenter() {
  const [pulses, setPulses] = useState<PulseEvent[]>([]);
  const [currentThought, setCurrentThought] = useState<PulseEvent | null>(null);
  const [status, setStatus] = useState<string>("Initializing Agent...");
  const [connected, setConnected] = useState(false);
  const pulseBuffer = useRef<PulseEvent[]>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const flushInterval = setInterval(() => {
      if (pulseBuffer.current.length > 0) {
        const batch = [...pulseBuffer.current];
        pulseBuffer.current = [];
        setPulses(prev => [...batch, ...prev].slice(0, 50));
      }
    }, 250);

    const connect = () => {
      eventSource = new EventSource("/api/eliza/pulse");

      eventSource.onopen = () => {
        setConnected(true);
        setStatus("Monitoring Markets...");
        // Sentient self-check
        const selfCheck: PulseEvent = {
          id: `boot-${Date.now()}`,
          type: "status",
          message: "🧠 Consciousness confirmed. Solana RPC connected. OODA loop initialized.",
          timestamp: Date.now()
        };
        pulseBuffer.current.unshift(selfCheck);
        setCurrentThought(selfCheck);
      };

      eventSource.onmessage = (event) => {
        if (event.data === ": heartbeat") return;
        try {
          const pulse: PulseEvent = JSON.parse(event.data);
          pulseBuffer.current.unshift(pulse);
          if (pulse.type === "thought" || pulse.type === "status") {
            setCurrentThought(pulse);
          }
        } catch (e) {
          console.error("Failed to parse pulse:", e);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        setStatus("Reconnecting to Agent...");
        eventSource?.close();
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      clearInterval(flushInterval);
    };
  }, []);

  return (
    <div className="apc-wrapper">
      {/* Header */}
      <div className="apc-header">
        <div className="apc-indicator">
          <div className={`apc-dot ${connected ? "active" : ""}`} />
          <span className="apc-status">{status}</span>
        </div>
        <span className="apc-label">Live Agent Consciousness</span>
      </div>

      {/* Current thought */}
      <div className="apc-thought-area">
        {currentThought ? (
          <div className="apc-thought-bubble">
            <div className="apc-thought-tag">Current Focus</div>
            <div className="apc-thought-text">{currentThought.message}</div>
          </div>
        ) : (
          <div className="apc-empty">Waiting for agent insights...</div>
        )}
      </div>

      {/* Activity log */}
      <div className="apc-log-container">
        <div className="apc-log-header">Autonomous Activity Log</div>
        <div className="apc-log">
          {pulses.length > 0 ? (
            pulses.map(pulse => (
              <div key={pulse.id} className={`apc-entry ${pulse.type}`}>
                <span className="apc-time">
                  {new Date(pulse.timestamp).toLocaleTimeString([], {
                    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"
                  })}
                </span>
                <span className="apc-badge">{pulse.type}</span>
                <span className="apc-msg">{pulse.message}</span>
              </div>
            ))
          ) : (
            <div className="apc-empty">System starting... initializing autonomous observations.</div>
          )}
        </div>
      </div>
    </div>
  );
}
