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
  private readonly INSTRUMENT_URL =
    'https://margincalculator.angelbroking.com/OpenAPI_Standard/v1/OpenAPIScripMaster.json';

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncInstruments() {
    const tempFilePath = path.join(os.tmpdir(), 'instruments.json');
    this.logger.log('Sync started — downloading instrument file...');

    try {
      // Step 1: Stream download to disk (no RAM used for download)
      const writer = fs.createWriteStream(tempFilePath);
      const response = await axios({
        url: this.INSTRUMENT_URL,
        method: 'GET',
        responseType: 'stream',
      });
      response.data.pipe(writer);
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });

      const stats = fs.statSync(tempFilePath);
      this.logger.log(`File downloaded: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);

      // Step 2: Parse and filter — only NSE cash equities (instrumenttype === '')
      // This gives us ~2,000-3,000 stocks instead of 90,000+ derivatives
      const raw = fs.readFileSync(tempFilePath, 'utf8');
      const all: any[] = JSON.parse(raw);

      const equities = all
        .filter(
          (inst) =>
            inst.exch_seg === 'NSE' && inst.instrumenttype === '',
        )
        .map((inst) => ({
          symbol: inst.symbol,
          exchange: inst.exch_seg,
          tradingsymbol: inst.name,
          instrumentToken: inst.token,
          expiry: null,
          strike: null,
          lotsize: inst.lotsize || null,
          instrumenttype: inst.instrumenttype || null,
          tick_size: inst.tick_size ? String(inst.tick_size) : null,
        }));

      this.logger.log(`Filtered to ${equities.length} NSE equities. Saving to DB...`);

      // Step 3: Save in small chunks
      const chunkSize = 500;
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let saved = 0;

      for (let i = 0; i < equities.length; i += chunkSize) {
        const chunk = equities.slice(i, i + chunkSize);
        await this.prisma.instrumentMaster.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        saved += chunk.length;
        this.logger.log(`Saved ${saved} / ${equities.length}`);
        await sleep(50);
      }

      this.logger.log(`✅ Sync complete! ${saved} NSE equities saved.`);
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`);
    } finally {
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      } catch (_) {}
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
