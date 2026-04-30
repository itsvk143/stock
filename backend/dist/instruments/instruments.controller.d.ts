import { InstrumentsService } from './instruments.service';
export declare class InstrumentsController {
    private readonly instrumentsService;
    constructor(instrumentsService: InstrumentsService);
    search(query: string): Promise<any[]>;
    forceSync(): Promise<{
        message: string;
    }>;
    getByToken(token: string): Promise<any>;
    screener(minMarketCap?: string, maxPe?: string, minRoe?: string): Promise<any[]>;
}
