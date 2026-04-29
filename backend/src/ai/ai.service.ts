import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    private db: DatabaseService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async analyzeStock(symbol: string, data: any) {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
      Analyze the following Indian stock data for ${symbol} and provide a production-grade investment recommendation.
      
      DATA:
      ${JSON.stringify(data, null, 2)}
      
      STRICT RULES:
      - Return ONLY a valid JSON object.
      - Do not include any markdown formatting or \`\`\`json blocks. Just the raw JSON string.
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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const analysisResult = JSON.parse(cleanJson);

      // Log the analysis for audit using SQL
      const sql = `
        INSERT INTO "AIAnalysisLog" (
          "id", "symbol", "recommendation", "confidence", "summary", "verdict", "payload", "createdAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
        )
      `;
      await this.db.query(sql, [
        symbol,
        analysisResult.recommendation,
        analysisResult.confidence,
        analysisResult.summary,
        analysisResult.verdict,
        JSON.stringify(analysisResult),
      ]);

      return analysisResult;
    } catch (error) {
      this.logger.error('Gemini Analysis failed', error);
      throw error;
    }
  }
}
