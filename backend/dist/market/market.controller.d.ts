import { MarketService } from './market.service';
export declare class MarketController {
    private readonly marketService;
    constructor(marketService: MarketService);
    getLtp(symbol: string): Promise<any>;
    getCandles(exchange: string, symboltoken: string, interval: string, from: string, to: string): Promise<never[]>;
}
