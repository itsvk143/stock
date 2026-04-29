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
    this.logger.log(`Starting stream-to-disk sync. Temp: ${tempFilePath}`);

    try {
      // Step 1: Stream download directly to disk — zero RAM buffering
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
      this.logger.log('Download complete. Starting incremental JSON parse...');

      // Step 2: Incrementally parse and save using JSONStream
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const JSONStream = require('JSONStream');
      const chunkSize = 500;
      let batch: any[] = [];
      let total = 0;
      let saved = 0;

      const flushBatch = async () => {
        if (batch.length === 0) return;
        const toSave = batch.splice(0);
        saved += toSave.length;
        await this.prisma.instrumentMaster.createMany({
          data: toSave,
          skipDuplicates: true,
        });
        this.logger.log(`Saved ${saved} instruments so far...`);
      };

      await new Promise<void>((resolve, reject) => {
        const readStream = fs.createReadStream(tempFilePath, { encoding: 'utf8' });
        const jsonStream = JSONStream.parse('*');

        jsonStream.on('data', async (inst: any) => {
          total++;
          if (inst.exch_seg === 'NSE' || inst.exch_seg === 'NFO') {
            batch.push({
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

          if (batch.length >= chunkSize) {
            jsonStream.pause();
            try {
              await flushBatch();
            } catch (e) {
              this.logger.error(`Batch save failed: ${e.message}`);
            }
            jsonStream.resume();
          }
        });

        jsonStream.on('end', async () => {
          try {
            await flushBatch();
            this.logger.log(`Sync complete. Scanned: ${total}, Saved: ${saved}`);
            resolve();
          } catch (e) {
            reject(e);
          }
        });

        jsonStream.on('error', reject);
        readStream.pipe(jsonStream);
      });

    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`);
    } finally {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
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
