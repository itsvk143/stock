import { DatabaseService } from '../database/database.service';
export declare class InstrumentsService {
    private db;
    private readonly logger;
    private readonly INSTRUMENT_URL;
    constructor(db: DatabaseService);
    syncInstruments(): Promise<void>;
    search(query: string): Promise<any[]>;
    getByToken(token: string): Promise<any>;
    screener(filters: {
        minMarketCap?: number;
        maxPe?: number;
        minRoe?: number;
    }): Promise<any[]>;
}
