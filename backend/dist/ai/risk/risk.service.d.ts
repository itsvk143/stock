export declare class RiskService {
    calculateRiskScore(data: {
        debtToEquity: number;
        promoterHolding: number;
        volatility: number;
        earningsStability: number;
    }): {
        score: number;
        level: string;
    };
}
