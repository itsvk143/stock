import { PortfolioService } from './portfolio.service';
export declare class PortfolioController {
    private readonly portfolioService;
    constructor(portfolioService: PortfolioService);
    getPortfolio(userId: string): Promise<any[]>;
    addHolding(body: any): Promise<any>;
    getWatchlist(userId: string): Promise<any[]>;
    addToWatchlist(body: any): Promise<any>;
}
