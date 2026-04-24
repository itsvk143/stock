import { Controller, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { MarketService } from '../market/market.service';
import { RiskService } from './risk/risk.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly marketService: MarketService,
    private readonly riskService: RiskService,
  ) {}

  @Get('analyze')
  async analyze(@Query('symbol') symbol: string, @Query('token') token: string) {
    // 1. Fetch Fundamentals (Mocked or from Cache/API)
    // In a real app, you'd fetch from an external provider or DB cache
    const fundamentals = {
      marketCap: 1920000, // ₹ Cr
      peRatio: 28.4,
      pbRatio: 3.2,
      roe: 12.5,
      debtToEquity: 0.42,
      promoterHolding: 50.3,
    };

    // 2. Fetch recent candles for technical context
    const candles = await this.marketService.getCandleData(
      'NSE',
      token,
      'ONE_DAY',
      '2024-03-01 09:15',
      '2024-04-24 15:30',
    );

    const technicals = {
      rsi: 62.5,
      macd: 'Bullish Crossover',
      sma50: 2850,
      sma200: 2600,
    };

    // 3. Calculate Risk Score
    const risk = this.riskService.calculateRiskScore({
      debtToEquity: fundamentals.debtToEquity,
      promoterHolding: fundamentals.promoterHolding,
      volatility: 1.5, // Mocked
      earningsStability: 0.8, // Mocked
    });

    // 4. Run AI Analysis
    const analysis = await this.aiService.analyzeStock(symbol, {
      fundamentals,
      technicals,
      candles: candles.slice(-10),
      risk,
    });

    return {
      ...analysis,
      risk,
    };
  }
}
