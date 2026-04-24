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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const market_service_1 = require("../market/market.service");
const risk_service_1 = require("./risk/risk.service");
let AiController = class AiController {
    aiService;
    marketService;
    riskService;
    constructor(aiService, marketService, riskService) {
        this.aiService = aiService;
        this.marketService = marketService;
        this.riskService = riskService;
    }
    async analyze(symbol, token) {
        const fundamentals = {
            marketCap: 1920000,
            peRatio: 28.4,
            pbRatio: 3.2,
            roe: 12.5,
            debtToEquity: 0.42,
            promoterHolding: 50.3,
        };
        const candles = await this.marketService.getCandleData('NSE', token, 'ONE_DAY', '2024-03-01 09:15', '2024-04-24 15:30');
        const technicals = {
            rsi: 62.5,
            macd: 'Bullish Crossover',
            sma50: 2850,
            sma200: 2600,
        };
        const risk = this.riskService.calculateRiskScore({
            debtToEquity: fundamentals.debtToEquity,
            promoterHolding: fundamentals.promoterHolding,
            volatility: 1.5,
            earningsStability: 0.8,
        });
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
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('analyze'),
    __param(0, (0, common_1.Query)('symbol')),
    __param(1, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "analyze", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        market_service_1.MarketService,
        risk_service_1.RiskService])
], AiController);
//# sourceMappingURL=ai.controller.js.map