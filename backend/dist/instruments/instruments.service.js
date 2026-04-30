"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var InstrumentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrumentsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const schedule_1 = require("@nestjs/schedule");
let InstrumentsService = InstrumentsService_1 = class InstrumentsService {
    db;
    logger = new common_1.Logger(InstrumentsService_1.name);
    INSTRUMENT_URL = 'https://margincalculator.angelbroking.com/OpenAPI_Standard/v1/OpenAPIScripMaster.json';
    constructor(db) {
        this.db = db;
    }
    async syncInstruments() {
        const tempFilePath = path.join(os.tmpdir(), 'instruments.json');
        this.logger.log('Sync started — downloading instrument file...');
        try {
            const writer = fs.createWriteStream(tempFilePath);
            const response = await (0, axios_1.default)({
                url: this.INSTRUMENT_URL,
                method: 'GET',
                responseType: 'stream',
            });
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', () => resolve());
                writer.on('error', reject);
            });
            const stats = fs.statSync(tempFilePath);
            this.logger.log(`File downloaded: ${(stats.size / 1024 / 1024).toFixed(1)} MB. Parsing...`);
            const equities = [];
            const JSONStream = require('JSONStream');
            const stream = fs.createReadStream(tempFilePath);
            const parser = JSONStream.parse('*');
            stream.pipe(parser);
            await new Promise((resolve, reject) => {
                parser.on('data', (inst) => {
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
            const client = await this.db.getClient();
            try {
                const chunkSize = 200;
                let saved = 0;
                for (let i = 0; i < equities.length; i += chunkSize) {
                    const chunk = equities.slice(i, i + chunkSize);
                    const values = [];
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
            }
            finally {
                client.release();
            }
            this.logger.log(`✅ Sync complete! ${equities.length} NSE equities processed.`);
        }
        catch (error) {
            this.logger.error(`Sync failed: ${error.message}`);
        }
        finally {
            try {
                if (fs.existsSync(tempFilePath))
                    fs.unlinkSync(tempFilePath);
            }
            catch (_) { }
            if (global.gc)
                global.gc();
        }
    }
    async search(query) {
        const sql = `
      SELECT * FROM "InstrumentMaster"
      WHERE "symbol" ILIKE $1 OR "tradingsymbol" ILIKE $1
      LIMIT 10
    `;
        const res = await this.db.query(sql, [`%${query}%`]);
        return res.rows;
    }
    async getByToken(token) {
        const sql = `SELECT * FROM "InstrumentMaster" WHERE "instrumentToken" = $1 LIMIT 1`;
        const res = await this.db.query(sql, [token]);
        return res.rows[0] || null;
    }
    async screener(filters) {
        let sql = `SELECT * FROM "StockCache" WHERE 1=1`;
        const params = [];
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
};
exports.InstrumentsService = InstrumentsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstrumentsService.prototype, "syncInstruments", null);
exports.InstrumentsService = InstrumentsService = InstrumentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], InstrumentsService);
//# sourceMappingURL=instruments.service.js.map