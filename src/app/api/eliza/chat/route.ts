/**
 * ElizaOS Chat API Route — Proxies messages to WaboTrader agent
 */
import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/eliza";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId, walletAddress } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing 'message' field in request body" },
        { status: 400 }
      );
    }

    const result = await processMessage(message, agentId, walletAddress);

    return NextResponse.json({
      text: result.text,
      data: result.data || null,
      timestamp: Date.now(),
      agent: "WaboTrader",
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
