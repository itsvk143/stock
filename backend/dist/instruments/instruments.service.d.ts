import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class InstrumentsService implements OnModuleInit {
    private prisma;
    private readonly logger;
    private readonly INSTRUMENT_URL;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    syncInstruments(): Promise<void>;
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
    screener(filters: {
        minMarketCap?: number;
        maxPe?: number;
        minRoe?: number;
    }): Promise<{
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
