import { PrismaService } from '../prisma/prisma.service';
export declare class PortfolioService {
    private prisma;
    constructor(prisma: PrismaService);
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
    addHolding(userId: string, portfolioId: string, data: any): Promise<{
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
    addToWatchlist(userId: string, watchlistId: string, data: any): Promise<{
        symbol: string;
        id: string;
        instrumentToken: string;
        exchange: string;
        createdAt: Date;
        watchlistId: string;
    }>;
}
