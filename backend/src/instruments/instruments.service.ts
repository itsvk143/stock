import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InstrumentsService {
  private readonly logger = new Logger(InstrumentsService.name);
  private readonly INSTRUMENT_URL = 'https://margincalculator.angelbroking.com/OpenAPI_Standard/v1/OpenAPIScripMaster.json';

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncInstruments() {
    try {
      this.logger.log('Fetching instruments from Angel One...');
      const response = await axios.get(this.INSTRUMENT_URL);
      const instruments = response.data;

      if (!Array.isArray(instruments)) {
        throw new Error('Invalid instrument data received');
      }

      this.logger.log(`Received ${instruments.length} instruments. Upserting to database...`);

      // We use upsert to avoid duplicates. For large datasets, we might want to use createMany or chunked upserts.
      // For MVP, we'll focus on NSE/BSE Equity first to keep it fast.
      const filteredInstruments = [];
      for (let i = 0; i < instruments.length; i++) {
        const inst = instruments[i];
        if ((inst.exch_seg === 'NSE' || inst.exch_seg === 'BSE') && inst.instrumenttype === '') {
          filteredInstruments.push({
            symbol: inst.symbol,
            exchange: inst.exch_seg,
            tradingsymbol: inst.name,
            instrumentToken: inst.token,
            yahooSymbol: `${inst.symbol}.${inst.exch_seg === 'NSE' ? 'NS' : 'BO'}`,
          });
        }
      }

      this.logger.log(`Filtered to ${filteredInstruments.length} Equity instruments.`);
      
      // CRITICAL: Clear the original massive array immediately
      (instruments as any) = null;

      // Chunking for database safety
      const chunkSize = 1000;
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < filteredInstruments.length; i += chunkSize) {
        const chunk = filteredInstruments.slice(i, i + chunkSize);
        
        await this.prisma.instrumentMaster.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        
        this.logger.log(`Synced ${Math.min(i + chunkSize, filteredInstruments.length)} / ${filteredInstruments.length}`);
        
        // Give the event loop a breather to keep the app responsive
        await sleep(50);
      }
      
      // Clear filtered array too
      (filteredInstruments as any) = null;

      this.logger.log('Instrument sync completed successfully.');
      
      // Manual GC to clear memory after large operation
      if (global.gc) {
        this.logger.log('Triggering manual garbage collection...');
        global.gc();
      }
    } catch (error) {
      this.logger.error('Failed to sync instruments', error);
    }
  }

  async search(query: string) {
    return this.prisma.instrumentMaster.findMany({
      where: {
        OR: [
          { symbol: { contains: query, mode: 'insensitive' } },
          { tradingsymbol: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }

  async getByToken(token: string) {
    return this.prisma.instrumentMaster.findUnique({
      where: { instrumentToken: token },
    });
  }

  async screener(filters: {
    minMarketCap?: number;
    maxPe?: number;
    minRoe?: number;
  }) {
    // For MVP, we'll join with StockCache if data exists
    // Since we don't have real-time fundamental sync for all stocks yet,
    // this will work for stocks that have been cached.
    return this.prisma.stockCache.findMany({
      where: {
        AND: [
          filters.minMarketCap ? { marketCap: { gte: filters.minMarketCap } } : {},
          filters.maxPe ? { peRatio: { lte: filters.maxPe } } : {},
          filters.minRoe ? { roe: { gte: filters.minRoe } } : {},
        ],
      },
      take: 50,
      orderBy: { marketCap: 'desc' },
    });
  }
}
