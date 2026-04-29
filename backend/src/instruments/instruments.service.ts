import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InstrumentsService {
  private readonly logger = new Logger(InstrumentsService.name);
  private readonly INSTRUMENT_URL = 'https://margincalculator.angelbroking.com/OpenAPI_Standard/v1/OpenAPIScripMaster.json';

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncInstruments() {
    const tempFilePath = path.join(os.tmpdir(), 'instruments.json');
    this.logger.log(`Starting stream-to-disk sync. Temp file: ${tempFilePath}`);

    try {
      // 1. Download to disk using streams (ZERO RAM buffering)
      const writer = fs.createWriteStream(tempFilePath);
      const response = await axios({
        url: this.INSTRUMENT_URL,
        method: 'GET',
        responseType: 'stream',
      });

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(undefined));
        writer.on('error', reject);
      });

      this.logger.log('File downloaded to disk. Reading and parsing...');

      // 2. Read and parse file manually
      const fileContent = fs.readFileSync(tempFilePath, 'utf8');
      const instruments = JSON.parse(fileContent);
      
      this.logger.log(`Total instruments found: ${instruments.length}. Filtering...`);

      const filteredInstruments = [];
      for (const inst of instruments) {
        if (inst.exch_seg === 'NSE' || inst.exch_seg === 'NFO') {
          filteredInstruments.push({
            symbol: inst.symbol,
            exchange: inst.exch_seg,
            tradingsymbol: inst.name,
            instrumentToken: inst.token,
            expiry: inst.expiry,
            strike: inst.strike ? String(inst.strike) : null,
            lotsize: inst.lotsize,
            instrumenttype: inst.instrumenttype,
            tick_size: inst.tick_size ? String(inst.tick_size) : null,
          });
        }
      }

      this.logger.log(`Filtered down to ${filteredInstruments.length} instruments. Saving to DB...`);

      const chunkSize = 1000;
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < filteredInstruments.length; i += chunkSize) {
        const chunk = filteredInstruments.slice(i, i + chunkSize);
        await this.prisma.instrumentMaster.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        this.logger.log(`Synced ${Math.min(i + chunkSize, filteredInstruments.length)} / ${filteredInstruments.length}`);
        await sleep(50);
      }

      this.logger.log('Instrument sync completed successfully.');
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`);
    } finally {
      // Clean up the temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      if (global.gc) global.gc();
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
