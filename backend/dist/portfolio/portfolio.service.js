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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let PortfolioService = class PortfolioService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getPortfolio(userId) {
        const sql = `
      SELECT p.*, 
        COALESCE(json_agg(h.*) FILTER (WHERE h.id IS NOT NULL), '[]') as holdings
      FROM "Portfolio" p
      LEFT JOIN "Holding" h ON p.id = h."portfolioId"
      WHERE p."userId" = $1
      GROUP BY p.id
    `;
        const res = await this.db.query(sql, [userId]);
        return res.rows;
    }
    async addHolding(userId, portfolioId, data) {
        const sql = `
      INSERT INTO "Holding" (
        "id", "portfolioId", "instrumentToken", "symbol", "exchange", 
        "quantity", "avgPrice", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
      ) RETURNING *
    `;
        const res = await this.db.query(sql, [
            portfolioId,
            data.token,
            data.symbol,
            data.exchange,
            data.quantity,
            data.avgPrice,
        ]);
        return res.rows[0];
    }
    async getWatchlist(userId) {
        const sql = `
      SELECT w.*, 
        COALESCE(json_agg(wi.*) FILTER (WHERE wi.id IS NOT NULL), '[]') as items
      FROM "Watchlist" w
      LEFT JOIN "WatchlistItem" wi ON w.id = wi."watchlistId"
      WHERE w."userId" = $1
      GROUP BY w.id
    `;
        const res = await this.db.query(sql, [userId]);
        return res.rows;
    }
    async addToWatchlist(userId, watchlistId, data) {
        const sql = `
      INSERT INTO "WatchlistItem" (
        "id", "watchlistId", "instrumentToken", "symbol", "exchange", "createdAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, NOW()
      ) RETURNING *
    `;
        const res = await this.db.query(sql, [
            watchlistId,
            data.token,
            data.symbol,
            data.exchange,
        ]);
        return res.rows[0];
    }
};
exports.PortfolioService = PortfolioService;
exports.PortfolioService = PortfolioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PortfolioService);
//# sourceMappingURL=portfolio.service.js.map