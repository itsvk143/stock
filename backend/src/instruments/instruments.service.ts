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
    this.logger.log('Sync started — downloading to disk...');

    try {
      // Step 1: Stream file to disk (no RAM used for download)
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
      this.logger.log('Download complete. Collecting instruments into batches...');

      // Step 2: Collect all matching instruments synchronously using JSONStream
      // We collect them first, then save in batches — avoids async stream race conditions
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const JSONStream = require('JSONStream');

      const instruments: any[] = await new Promise((resolve, reject) => {
        const result: any[] = [];
        const readStream = fs.createReadStream(tempFilePath, { encoding: 'utf8' });
        const jsonStream = JSONStream.parse('*');

        jsonStream.on('data', (inst: any) => {
          if (inst.exch_seg === 'NSE' || inst.exch_seg === 'NFO') {
            result.push({
              symbol: inst.symbol,
              exchange: inst.exch_seg,
              tradingsymbol: inst.name,
              instrumentToken: inst.token,
              expiry: inst.expiry || null,
              strike: inst.strike ? String(inst.strike) : null,
              lotsize: inst.lotsize || null,
              instrumenttype: inst.instrumenttype || null,
              tick_size: inst.tick_size ? String(inst.tick_size) : null,
            });
          }
        });

        jsonStream.on('end', () => resolve(result));
        jsonStream.on('error', reject);
        readStream.on('error', reject);
        readStream.pipe(jsonStream);
      });

      this.logger.log(`Parsed ${instruments.length} NSE/NFO instruments. Saving to DB...`);

      // Step 3: Save in chunks with a small delay between each
      const chunkSize = 500;
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      for (let i = 0; i < instruments.length; i += chunkSize) {
        const chunk = instruments.slice(i, i + chunkSize);
        await this.prisma.instrumentMaster.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        this.logger.log(
          `Saved ${Math.min(i + chunkSize, instruments.length)} / ${instruments.length}`,
        );
        await sleep(10); // small breather for event loop
      }

      this.logger.log('Sync complete!');
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
