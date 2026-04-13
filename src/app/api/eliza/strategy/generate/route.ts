import { NextRequest, NextResponse } from "next/server";
import { StrategyService } from "@/eliza/plugins/trading-strategies/services/StrategyService";
import { BacktestEngine } from "@/eliza/plugins/trading-strategies/services/BacktestEngine";
import { StrategyExecutor } from "@/eliza/plugins/trading-strategies/services/StrategyExecutor";
import { StrategyType, RiskProfile } from "@/eliza/plugins/trading-strategies/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, type, riskProfile, token, strategyId, period } = body;

    const strategyService = new StrategyService();
    const backtestEngine = new BacktestEngine();
    const executor = new StrategyExecutor();

    let result;

    switch (action) {
      case 'generate': {
        const strategy = strategyService.generateStrategy(
          (type as StrategyType) || 'momentum',
          (riskProfile as RiskProfile) || 'moderate',
          token || 'SOL'
        );
        result = { text: `Strategy generated: ${strategy.name}`, content: { strategy } };
        break;
      }

      case 'backtest': {
        const strategy = strategyService.getStrategy(strategyId || '');
        if (!strategy) {
          return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
        }
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (period || 30) * 24 * 60 * 60 * 1000);
        const backtestResult = await backtestEngine.runBacktest(strategy, startDate, endDate);
        result = { text: 'Backtest completed', content: { backtest: backtestResult } };
        break;
      }

      case 'optimize': {
        const strategy = strategyService.getStrategy(strategyId || '');
        if (!strategy) {
          return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
        }
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (period || 30) * 24 * 60 * 60 * 1000);
        const optimized = await backtestEngine.optimizeStrategy(strategy, startDate, endDate);
        result = { text: 'Strategy optimized', content: { strategy: optimized } };
        break;
      }

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

    return NextResponse.json(result || { text: 'Action completed' }, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Strategy API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const strategyService = new StrategyService();
    const strategies = strategyService.listStrategies();
    return NextResponse.json({ strategies }, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, strategies: [] }, 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
