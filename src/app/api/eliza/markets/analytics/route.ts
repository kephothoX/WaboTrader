import { NextRequest, NextResponse } from "next/server";
import { PredictionMarketService } from "@/eliza/plugins/prediction-markets/services/PredictionMarketService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get('marketId');
    const type = searchParams.get('type');

    const service = new PredictionMarketService();

    if (type === 'analytics' && marketId) {
      const analytics = service.getAnalytics(marketId);
      return NextResponse.json({ 
        text: 'Analytics retrieved',
        content: analytics
      });
    }

    if (type === 'comments' && marketId) {
      const comments = service.getComments(marketId);
      return NextResponse.json({ comments });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { marketId, content, sentiment } = body;

    const service = new PredictionMarketService();
    const comment = service.postComment(marketId || '', 'default', content || '', sentiment || 'neutral');

    return NextResponse.json({ 
      text: 'Comment posted',
      content: comment
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
