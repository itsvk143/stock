import { MarketService } from './market.service';
export declare class MarketController {
    private readonly marketService;
    constructor(marketService: MarketService);
    getLtp(exchange: string, tradingsymbol: string, symboltoken: string): Promise<any>;
    getCandles(exchange: string, symboltoken: string, interval: string, from: string, to: string): Promise<any>;
}
