import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
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

  constructor(private db: DatabaseService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncInstruments() {
    const tempFilePath = path.join(os.tmpdir(), 'instruments.json');
    this.logger.log('Sync started — downloading instrument file...');

    try {
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
      this.logger.log(`File downloaded: ${(stats.size / 1024 / 1024).toFixed(1)} MB. Parsing...`);

      const equities: any[][] = [];
      const JSONStream = require('JSONStream');
      const stream = fs.createReadStream(tempFilePath);
      const parser = JSONStream.parse('*');

      stream.pipe(parser);

      await new Promise<void>((resolve, reject) => {
        parser.on('data', (inst: any) => {
          if (inst.exch_seg === 'NSE' && inst.instrumenttype === '') {
            equities.push([
              inst.symbol,
              inst.exch_seg,
              inst.name,
              inst.token,
              null,
              null,
              inst.lotsize || null,
              inst.instrumenttype || null,
              inst.tick_size ? String(inst.tick_size) : null,
              new Date(),
              new Date(),
            ]);
          }
        });
        parser.on('end', resolve);
        parser.on('error', reject);
      });

      this.logger.log(`Filtered to ${equities.length} NSE equities. Saving to DB...`);

      // Using raw pg client for bulk insert efficiency
      const client = await this.db.getClient();
      try {
        const chunkSize = 200;
        let saved = 0;

        for (let i = 0; i < equities.length; i += chunkSize) {
          const chunk = equities.slice(i, i + chunkSize);
          
          // Generate ($1, $2, ...), ($n, $n+1, ...)
          const values: any[] = [];
          const placeHolders = chunk.map((row, rowIndex) => {
            const rowPlaceHolders = row.map((_, colIndex) => `$${rowIndex * row.length + colIndex + 1}`);
            values.push(...row);
            return `(${rowPlaceHolders.join(',')})`;
          }).join(',');

          const sql = `
            INSERT INTO "InstrumentMaster" (
              "symbol", "exchange", "tradingsymbol", "instrumentToken", 
              "expiry", "strike", "lotsize", "instrumenttype", "tick_size", 
              "createdAt", "updatedAt"
            ) VALUES ${placeHolders}
            ON CONFLICT ("instrumentToken") DO NOTHING
          `;

          await client.query(sql, values);
          saved += chunk.length;
          this.logger.log(`Saved ${saved} / ${equities.length}`);
          await new Promise(r => setTimeout(r, 50));
        }
      } finally {
        client.release();
      }

      this.logger.log(`✅ Sync complete! ${equities.length} NSE equities processed.`);
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
    const sql = `
      SELECT * FROM "InstrumentMaster"
      WHERE "symbol" ILIKE $1 OR "tradingsymbol" ILIKE $1
      LIMIT 10
    `;
    const res = await this.db.query(sql, [`%${query}%`]);
    return res.rows;
  }

  async getByToken(token: string) {
    const sql = `SELECT * FROM "InstrumentMaster" WHERE "instrumentToken" = $1 LIMIT 1`;
    const res = await this.db.query(sql, [token]);
    return res.rows[0] || null;
  }

  async screener(filters: {
    minMarketCap?: number;
    maxPe?: number;
    minRoe?: number;
  }) {
    let sql = `SELECT * FROM "StockCache" WHERE 1=1`;
    const params: any[] = [];

    if (filters.minMarketCap) {
      params.push(filters.minMarketCap);
      sql += ` AND "marketCap" >= $${params.length}`;
    }
    if (filters.maxPe) {
      params.push(filters.maxPe);
      sql += ` AND "peRatio" <= $${params.length}`;
    }
    if (filters.minRoe) {
      params.push(filters.minRoe);
      sql += ` AND "roe" >= $${params.length}`;
    }

    sql += ` ORDER BY "marketCap" DESC LIMIT 50`;
    const res = await this.db.query(sql, params);
    return res.rows;
  }
}
