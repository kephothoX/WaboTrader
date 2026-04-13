/**
 * Agent Pulse Registry — A simple event emitter for proactive agent thoughts
 */
import { EventEmitter } from "events";

export interface PulseEvent {
  id: string;
  type: "thought" | "alert" | "action" | "status";
  message: string;
  data?: unknown;
  timestamp: number;
}

class PulseRegistry extends EventEmitter {
  private events: PulseEvent[] = [];
  private maxEvents = 50;

  emitPulse(pulse: Omit<PulseEvent, "id" | "timestamp">) {
    const newPulse: PulseEvent = {
      ...pulse,
      id: `pulse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.events.unshift(newPulse);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    this.emit("pulse", newPulse);
    return newPulse;
  }

  getEvents() {
    return this.events;
  }
}

// Global singleton
export const pulseRegistry = new PulseRegistry();
