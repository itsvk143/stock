import { DatabaseService } from '../database/database.service';
export declare class PortfolioService {
    private db;
    constructor(db: DatabaseService);
    getPortfolio(userId: string): Promise<any[]>;
    addHolding(userId: string, portfolioId: string, data: any): Promise<any>;
    getWatchlist(userId: string): Promise<any[]>;
    addToWatchlist(userId: string, watchlistId: string, data: any): Promise<any>;
}
