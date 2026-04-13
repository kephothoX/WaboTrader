/**
 * Agent Pulse SSE Route — Streams proactive agent thoughts and alerts to the UI
 */
import { NextRequest } from "next/server";
import { pulseRegistry, PulseEvent } from "@/eliza/pulseRegistry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send historical events first
      const historicalEvents = pulseRegistry.getEvents();
      for (const event of historicalEvents.reverse()) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      // Listen for new pulses
      const pulseListener = (pulse: PulseEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(pulse)}\n\n`));
        } catch (e) {
          console.error("SSE Stream error:", e);
        }
      };

      pulseRegistry.on("pulse", pulseListener);

      // Keep connection alive with heartbeats
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch (e) {
            clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      req.signal.onabort = () => {
        pulseRegistry.off("pulse", pulseListener);
        clearInterval(heartbeat);
        controller.close();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
