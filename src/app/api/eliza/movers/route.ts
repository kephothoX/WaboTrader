import { NextRequest, NextResponse } from "next/server";
import { getSolanaService } from "@/eliza/plugins/solana-trading/services/solanaService";

export async function GET(req: NextRequest) {
  try {
    const service = getSolanaService();
    const movers = await service.getPositiveMovers(10);
    return NextResponse.json(movers, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Movers API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error", movers: [] }, 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
