import { ConfigService } from '@nestjs/config';
export declare class MarketService {
    private configService;
    private readonly logger;
    private readonly dataLayerUrl;
    constructor(configService: ConfigService);
    getLtp(symbol: string): Promise<any>;
    getCandleData(exchange: string, symboltoken: string, interval: string, fromDate: string, toDate: string): Promise<never[]>;
}
