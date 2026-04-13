import { NextRequest, NextResponse } from "next/server";
import { PredictionMarketService } from "@/eliza/plugins/prediction-markets/services/PredictionMarketService";
import { MarketCategory, MarketStatus } from "@/eliza/plugins/prediction-markets/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, category, resolutionDate, initialLiquidity } = body;

    const service = new PredictionMarketService();
    const market = service.createMarket(
      question || 'Will something happen?',
      (category as MarketCategory) || 'other',
      resolutionDate ? new Date(resolutionDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      initialLiquidity || 1000,
      'system'
    );

    return NextResponse.json({ 
      text: `Market created: ${market.question}`,
      content: { market }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as MarketCategory;
    const status = searchParams.get('status') as MarketStatus;
    const sort = searchParams.get('sort') as 'liquidity' | 'volume' | 'trending';

    const service = new PredictionMarketService();
    const markets = service.browseMarkets({ category, status }, sort);

    return NextResponse.json({ 
      text: 'Markets retrieved',
      content: { markets }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
