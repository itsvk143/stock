import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    
    const config: PoolConfig = {
      connectionString,
      max: 2, // Very low connection pool for Railway free tier
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(config);

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
    });
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      this.logger.log('Database connected successfully');
      
      // Basic schema initialization
      await client.query(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT PRIMARY KEY,
          "email" TEXT UNIQUE NOT NULL,
          "name" TEXT,
          "password" TEXT NOT NULL,
          "clientCode" TEXT UNIQUE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "InstrumentMaster" (
          "id" TEXT PRIMARY KEY,
          "symbol" TEXT NOT NULL,
          "exchange" TEXT NOT NULL,
          "tradingsymbol" TEXT NOT NULL,
          "instrumentToken" TEXT UNIQUE NOT NULL,
          "expiry" TEXT,
          "strike" TEXT,
          "lotsize" TEXT,
          "instrumenttype" TEXT,
          "tick_size" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "idx_instrument_symbol" ON "InstrumentMaster"("symbol");
        CREATE INDEX IF NOT EXISTS "idx_instrument_tradingsymbol" ON "InstrumentMaster"("tradingsymbol");

        CREATE TABLE IF NOT EXISTS "Watchlist" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "WatchlistItem" (
          "id" TEXT PRIMARY KEY,
          "watchlistId" TEXT NOT NULL REFERENCES "Watchlist"("id") ON DELETE CASCADE,
          "instrumentToken" TEXT NOT NULL,
          "symbol" TEXT NOT NULL,
          "exchange" TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Portfolio" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Holding" (
          "id" TEXT PRIMARY KEY,
          "portfolioId" TEXT NOT NULL REFERENCES "Portfolio"("id") ON DELETE CASCADE,
          "instrumentToken" TEXT NOT NULL,
          "symbol" TEXT NOT NULL,
          "exchange" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "avgPrice" DOUBLE PRECISION NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "StockCache" (
          "symbol" TEXT PRIMARY KEY,
          "instrumentToken" TEXT UNIQUE NOT NULL,
          "lastPrice" DOUBLE PRECISION,
          "change" DOUBLE PRECISION,
          "changePercent" DOUBLE PRECISION,
          "marketCap" DOUBLE PRECISION,
          "peRatio" DOUBLE PRECISION,
          "pbRatio" DOUBLE PRECISION,
          "roe" DOUBLE PRECISION,
          "roce" DOUBLE PRECISION,
          "debtToEquity" DOUBLE PRECISION,
          "promoterHolding" DOUBLE PRECISION,
          "fiiHolding" DOUBLE PRECISION,
          "diiHolding" DOUBLE PRECISION,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "AIAnalysisLog" (
          "id" TEXT PRIMARY KEY,
          "symbol" TEXT NOT NULL,
          "recommendation" TEXT NOT NULL,
          "confidence" INTEGER NOT NULL,
          "summary" TEXT NOT NULL,
          "verdict" TEXT NOT NULL,
          "payload" JSONB NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      this.logger.log('Database schema initialized');
      client.release();
    } catch (err) {
      this.logger.error('Database initialization failed', err);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  // Helper for transactions or specific client needs
  async getClient() {
    return this.pool.connect();
  }
}
