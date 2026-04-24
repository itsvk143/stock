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
var NewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const rss_parser_1 = __importDefault(require("rss-parser"));
let NewsService = NewsService_1 = class NewsService {
    logger = new common_1.Logger(NewsService_1.name);
    parser;
    constructor() {
        this.parser = new rss_parser_1.default();
    }
    async getNewsForStock(symbol) {
        try {
            const url = `https://news.google.com/rss/search?q=${symbol}+stock+NSE+India&hl=en-IN&gl=IN&ceid=IN:en`;
            const feed = await this.parser.parseURL(url);
            return feed.items.slice(0, 5).map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                source: item.source,
            }));
        }
        catch (error) {
            this.logger.error(`Failed to fetch news for ${symbol}`, error);
            return [];
        }
    }
    async getMarketNews() {
        try {
            const url = 'https://news.google.com/rss/search?q=Indian+Stock+Market+NSE+BSE&hl=en-IN&gl=IN&ceid=IN:en';
            const feed = await this.parser.parseURL(url);
            return feed.items.slice(0, 10).map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                source: item.source,
            }));
        }
        catch (error) {
            this.logger.error('Failed to fetch market news', error);
            return [];
        }
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = NewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NewsService);
//# sourceMappingURL=news.service.js.map