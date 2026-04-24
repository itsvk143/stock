"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskService = void 0;
const common_1 = require("@nestjs/common");
let RiskService = class RiskService {
    calculateRiskScore(data) {
        let score = 0;
        if (data.debtToEquity < 0.5)
            score += 5;
        else if (data.debtToEquity < 1)
            score += 15;
        else
            score += 30;
        if (data.promoterHolding > 50)
            score += 0;
        else if (data.promoterHolding > 30)
            score += 10;
        else
            score += 20;
        score += Math.min(data.volatility * 10, 30);
        score += (1 - data.earningsStability) * 20;
        let level = 'Low';
        if (score > 40)
            level = 'Moderate';
        if (score > 70)
            level = 'High';
        return {
            score: Math.round(score),
            level,
        };
    }
};
exports.RiskService = RiskService;
exports.RiskService = RiskService = __decorate([
    (0, common_1.Injectable)()
], RiskService);
//# sourceMappingURL=risk.service.js.map