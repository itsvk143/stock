import { PortfolioService } from './portfolio.service';
export declare class PortfolioController {
    private readonly portfolioService;
    constructor(portfolioService: PortfolioService);
    getPortfolio(userId: string): Promise<({
        holdings: {
            symbol: string;
            id: string;
            instrumentToken: string;
            exchange: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            avgPrice: number;
            portfolioId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
    })[]>;
    addHolding(body: any): Promise<{
        symbol: string;
        id: string;
        instrumentToken: string;
        exchange: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        avgPrice: number;
        portfolioId: string;
    }>;
    getWatchlist(userId: string): Promise<({
        items: {
            symbol: string;
            id: string;
            instrumentToken: string;
            exchange: string;
            createdAt: Date;
            watchlistId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
    })[]>;
    addToWatchlist(body: any): Promise<{
        symbol: string;
        id: string;
        instrumentToken: string;
        exchange: string;
        createdAt: Date;
        watchlistId: string;
    }>;
}
