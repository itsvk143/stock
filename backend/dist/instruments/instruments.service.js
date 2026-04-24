"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
const schedule_1 = require("@nestjs/schedule");
let InstrumentsService = InstrumentsService_1 = class InstrumentsService {
    prisma;
    logger = new common_1.Logger(InstrumentsService_1.name);
    INSTRUMENT_URL = 'https://margincalculator.angelbroking.com/OpenAPI_Standard/v1/InstrumentJSON.json';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        const count = await this.prisma.instrumentMaster.count();
        if (count === 0) {
            this.logger.log('Instrument master is empty, starting initial sync...');
            await this.syncInstruments();
        }
    }
    async syncInstruments() {
        try {
            this.logger.log('Fetching instruments from Angel One...');
            const response = await axios_1.default.get(this.INSTRUMENT_URL);
            const instruments = response.data;
            if (!Array.isArray(instruments)) {
                throw new Error('Invalid instrument data received');
            }
            this.logger.log(`Received ${instruments.length} instruments. Upserting to database...`);
            const filteredInstruments = instruments.filter(inst => (inst.exch_seg === 'NSE' || inst.exch_seg === 'BSE') && inst.instrumenttype === '');
            this.logger.log(`Filtered to ${filteredInstruments.length} Equity instruments.`);
            const chunkSize = 1000;
            for (let i = 0; i < filteredInstruments.length; i += chunkSize) {
                const chunk = filteredInstruments.slice(i, i + chunkSize);
                await Promise.all(chunk.map(inst => this.prisma.instrumentMaster.upsert({
                    where: { instrumentToken: inst.token },
                    update: {
                        symbol: inst.symbol,
                        exchange: inst.exch_seg,
                        tradingsymbol: inst.name,
                        yahooSymbol: `${inst.symbol}.${inst.exch_seg === 'NSE' ? 'NS' : 'BO'}`,
                    },
                    create: {
                        symbol: inst.symbol,
                        exchange: inst.exch_seg,
                        tradingsymbol: inst.name,
                        instrumentToken: inst.token,
                        yahooSymbol: `${inst.symbol}.${inst.exch_seg === 'NSE' ? 'NS' : 'BO'}`,
                    }
                })));
                this.logger.log(`Synced ${Math.min(i + chunkSize, filteredInstruments.length)} / ${filteredInstruments.length}`);
            }
            this.logger.log('Instrument sync completed successfully.');
        }
        catch (error) {
            this.logger.error('Failed to sync instruments', error);
        }
    }
    async search(query) {
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
    async getByToken(token) {
        return this.prisma.instrumentMaster.findUnique({
            where: { instrumentToken: token },
        });
    }
    async screener(filters) {
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InstrumentsService);
//# sourceMappingURL=instruments.service.js.map