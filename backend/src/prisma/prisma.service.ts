import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Limit to 1 DB connection to minimize memory usage on Railway free tier
    const url = process.env.DATABASE_URL || '';
    const dbUrl = url + (url.includes('?') ? '&' : '?') + 'connection_limit=1&pool_timeout=10';
    super({
      datasources: { db: { url: dbUrl } },
      log: ['error'],  // only log errors, not queries (saves memory)
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
