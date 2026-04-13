import { NextRequest, NextResponse } from "next/server";
import { StrategyService } from "@/eliza/plugins/trading-strategies/services/StrategyService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { strategyId } = body;

    const strategyService = new StrategyService();
    const result = strategyService.publishStrategy(strategyId || '');

    return NextResponse.json({ 
      text: result ? 'Strategy published' : 'Strategy not found',
      content: { success: result }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');
    const sort = searchParams.get('sort');

    const strategyService = new StrategyService();
    const strategies = strategyService.browseMarketplace();

    return NextResponse.json({ 
      text: 'Marketplace strategies',
      content: { strategies }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
