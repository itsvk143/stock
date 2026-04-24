import { Injectable } from '@nestjs/common';

@Injectable()
export class RiskService {
  calculateRiskScore(data: {
    debtToEquity: number;
    promoterHolding: number;
    volatility: number;
    earningsStability: number;
  }) {
    // Basic scoring algorithm (0-100, lower is safer)
    let score = 0;

    // Debt/Equity factor (Max 30 points)
    if (data.debtToEquity < 0.5) score += 5;
    else if (data.debtToEquity < 1) score += 15;
    else score += 30;

    // Promoter Holding factor (Max 20 points)
    if (data.promoterHolding > 50) score += 0;
    else if (data.promoterHolding > 30) score += 10;
    else score += 20;

    // Volatility factor (Max 30 points)
    score += Math.min(data.volatility * 10, 30);

    // Earnings stability factor (Max 20 points)
    score += (1 - data.earningsStability) * 20;

    let level = 'Low';
    if (score > 40) level = 'Moderate';
    if (score > 70) level = 'High';

    return {
      score: Math.round(score),
      level,
    };
  }
}
