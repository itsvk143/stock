"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const database_service_1 = require("../database/database.service");
let AiService = AiService_1 = class AiService {
    configService;
    db;
    logger = new common_1.Logger(AiService_1.name);
    genAI;
    constructor(configService, db) {
        this.configService = configService;
        this.db = db;
        const apiKey = this.configService.get('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        }
    }
    async analyzeStock(symbol, data) {
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
        }
        catch (error) {
            this.logger.error('Gemini Analysis failed', error);
            throw error;
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        database_service_1.DatabaseService])
], AiService);
//# sourceMappingURL=ai.service.js.map