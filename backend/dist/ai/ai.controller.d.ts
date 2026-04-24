import { AiService } from './ai.service';
import { MarketService } from '../market/market.service';
import { RiskService } from './risk/risk.service';
export declare class AiController {
    private readonly aiService;
    private readonly marketService;
    private readonly riskService;
    constructor(aiService: AiService, marketService: MarketService, riskService: RiskService);
    analyze(symbol: string, token: string): Promise<any>;
}
