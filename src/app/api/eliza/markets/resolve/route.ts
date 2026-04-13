import { NextRequest, NextResponse } from "next/server";
import { PredictionMarketService } from "@/eliza/plugins/prediction-markets/services/PredictionMarketService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, marketId, outcome, lpPositionId, yesAmount, noAmount } = body;

    const service = new PredictionMarketService();
    let result;

    switch (action) {
      case 'resolve': {
        const market = service.resolveMarket(marketId || '', outcome || 'yes', 'system');
        result = { text: `Market resolved as ${market.resolvedOutcome}`, content: { market } };
        break;
      }

      case 'claim': {
        const claimResult = service.claimWinnings(marketId || '', 'default');
        result = { text: `Claimed winnings`, content: claimResult };
        break;
      }

      case 'provideLiquidity': {
        const lpResult = service.provideLiquidity(marketId || '', 'default', yesAmount || 100, noAmount || 100);
        result = { text: 'Liquidity provided', content: lpResult };
        break;
      }

      case 'removeLiquidity': {
        const removeResult = service.removeLiquidity(lpPositionId || '');
        result = { text: 'Liquidity removed', content: removeResult };
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result || { text: 'Action completed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
