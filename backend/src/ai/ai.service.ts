import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async analyzeStock(symbol: string, data: any) {
    const prompt = `
      Analyze the following Indian stock data for ${symbol} and provide a production-grade investment recommendation.
      
      DATA:
      ${JSON.stringify(data, null, 2)}
      
      STRICT RULES:
      - Return ONLY a valid JSON object.
      - No prose before or after the JSON.
      - Use Indian market context (Promoter holding, Debt/Equity in ₹ Cr).
      - Be objective and data-driven.
      
      OUTPUT FORMAT:
      {
        "recommendation": "BUY | HOLD | SELL",
        "confidence": 0-100,
        "intrinsic_value": number,
        "summary": "...",
        "bull_case": ["...", "..."],
        "bear_case": ["...", "..."],
        "risks": ["...", "..."],
        "verdict": "..."
      }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      // Log the analysis for audit
      await this.prisma.aIAnalysisLog.create({
        data: {
          symbol,
          recommendation: result.recommendation,
          confidence: result.confidence,
          summary: result.summary,
          verdict: result.verdict,
          payload: result,
        },
      });

      return result;
    } catch (error) {
      this.logger.error('AI Analysis failed', error);
      throw error;
    }
  }
}
