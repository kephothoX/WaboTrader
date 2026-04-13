import { NextRequest, NextResponse } from "next/server";
import { getSolanaService } from "@/eliza/plugins/solana-trading/services/solanaService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol") || "SOL";
    const side = (searchParams.get("side") || "LONG") as "LONG" | "SHORT";
    const amount = parseFloat(searchParams.get("amount") || "0.1");
    const leverage = parseFloat(searchParams.get("leverage") || "2.1");

    const service = getSolanaService();
    const quote = await service.getPerpQuote(symbol, side, amount, leverage);
    return NextResponse.json(quote);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
