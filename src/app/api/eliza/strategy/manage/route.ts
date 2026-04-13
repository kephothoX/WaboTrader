import { NextRequest, NextResponse } from "next/server";
import { StrategyService } from "@/eliza/plugins/trading-strategies/services/StrategyService";
import { StrategyExecutor } from "@/eliza/plugins/trading-strategies/services/StrategyExecutor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, strategyId } = body;

    const strategyService = new StrategyService();
    const executor = new StrategyExecutor();

    let result;

    switch (action) {
      case 'activate': {
        const strategy = strategyService.getStrategy(strategyId || '');
        if (!strategy) {
          return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
        }
        const activationResult = await executor.activateStrategy(strategy);
        result = { text: activationResult.message, content: activationResult };
        break;
      }

      case 'deactivate': {
        const deactivationResult = await executor.deactivateStrategy(strategyId || '');
        result = { text: deactivationResult.message, content: deactivationResult };
        break;
      }

      case 'performance': {
        const performance = executor.getPerformance(strategyId || '');
        result = { text: 'Performance retrieved', content: { performance } };
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

export async function GET(req: NextRequest) {
  try {
    const service = new StrategyService();
    const strategies = service.listStrategies();
    return NextResponse.json({ strategies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
