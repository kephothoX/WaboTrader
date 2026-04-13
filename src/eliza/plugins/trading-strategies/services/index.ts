import { StrategyService } from '../services/StrategyService';
import { StrategyType, RiskProfile } from '../types';

export function generateStrategy(type: StrategyType, riskProfile: RiskProfile, token: string) {
    const service = new StrategyService();
    return service.generateStrategy(type, riskProfile, token);
}

export function getStrategy(id: string) {
    const service = new StrategyService();
    return service.getStrategy(id);
}

export function listStrategies() {
    const service = new StrategyService();
    return service.listStrategies();
}

export function deleteStrategy(id: string) {
    const service = new StrategyService();
    return service.deleteStrategy(id);
}

export function publishStrategy(id: string) {
    const service = new StrategyService();
    return service.publishStrategy(id);
}

export function browseMarketplace() {
    const service = new StrategyService();
    return service.browseMarketplace();
}
