import { NextRequest, NextResponse } from "next/server";
import { PredictionMarketService } from "@/eliza/plugins/prediction-markets/services/PredictionMarketService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, marketId, shareType, amount, shares } = body;

    const service = new PredictionMarketService();
    const userId = 'default';

    let result;

    if (action === 'buy') {
      const tradeResult = service.buyShares(marketId || '', userId, shareType || 'yes', amount || 100);
      result = { text: `Bought shares`, content: tradeResult };
    } else if (action === 'sell') {
      const tradeResult = service.sellShares(marketId || '', userId, shareType || 'yes', shares || 1);
      result = { text: `Sold shares`, content: tradeResult };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result || { text: 'Trade completed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get('marketId');
    const userId = searchParams.get('userId') || 'default';

    const service = new PredictionMarketService();
    const positions = service.getPositions(userId);

    if (marketId) {
      const position = service.getPosition(marketId, userId);
      return NextResponse.json({ position });
    }

    return NextResponse.json({ positions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
