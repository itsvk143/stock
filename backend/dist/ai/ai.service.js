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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
const prisma_service_1 = require("../prisma/prisma.service");
let AiService = AiService_1 = class AiService {
    configService;
    prisma;
    logger = new common_1.Logger(AiService_1.name);
    openai;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.openai = new openai_1.default({
            apiKey: this.configService.get('OPENAI_API_KEY'),
        });
    }
    async analyzeStock(symbol, data) {
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
        }
        catch (error) {
            this.logger.error('AI Analysis failed', error);
            throw error;
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], AiService);
//# sourceMappingURL=ai.service.js.map