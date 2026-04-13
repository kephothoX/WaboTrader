import { NextRequest, NextResponse } from "next/server";
import { getSolanaService } from "@/eliza/plugins/solana-trading/services/solanaService";

export async function GET(req: NextRequest) {
  try {
    const service = getSolanaService();
    const pending = service.getPendingTransfers();
    return NextResponse.json(pending);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    const service = getSolanaService();
    const result = await service.executeTransferBatch(ids);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
