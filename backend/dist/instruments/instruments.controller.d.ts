import { InstrumentsService } from './instruments.service';
export declare class InstrumentsController {
    private readonly instrumentsService;
    constructor(instrumentsService: InstrumentsService);
    search(query: string): Promise<{
        symbol: string;
        id: string;
        instrumentToken: string;
        exchange: string;
        tradingsymbol: string;
        yahooSymbol: string | null;
        expiry: string | null;
        strike: string | null;
        lotsize: string | null;
        instrumenttype: string | null;
        tick_size: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    forceSync(): Promise<{
        message: string;
    }>;
    getByToken(token: string): Promise<{
        symbol: string;
        id: string;
        instrumentToken: string;
        exchange: string;
        tradingsymbol: string;
        yahooSymbol: string | null;
        expiry: string | null;
        strike: string | null;
        lotsize: string | null;
        instrumenttype: string | null;
        tick_size: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    screener(minMarketCap?: string, maxPe?: string, minRoe?: string): Promise<{
        symbol: string;
        instrumentToken: string;
        updatedAt: Date;
        lastPrice: number | null;
        change: number | null;
        changePercent: number | null;
        marketCap: number | null;
        peRatio: number | null;
        pbRatio: number | null;
        roe: number | null;
        roce: number | null;
        debtToEquity: number | null;
        promoterHolding: number | null;
        fiiHolding: number | null;
        diiHolding: number | null;
    }[]>;
}
