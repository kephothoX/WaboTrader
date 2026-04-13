/**
 * ElizaOS Agent Status API Route
 */
import { NextResponse } from "next/server";
import { getAgentStatus } from "@/eliza";

export async function GET() {
  try {
    const status = await getAgentStatus();
    return NextResponse.json(status, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Agent status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get agent status", ready: false },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
