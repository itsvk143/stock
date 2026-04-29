import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PortfolioService {
  constructor(private db: DatabaseService) {}

  async getPortfolio(userId: string) {
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

  async addHolding(userId: string, portfolioId: string, data: any) {
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

  async getWatchlist(userId: string) {
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

  async addToWatchlist(userId: string, watchlistId: string, data: any) {
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
}
