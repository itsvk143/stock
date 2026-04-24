export declare class NewsService {
    private readonly logger;
    private parser;
    constructor();
    getNewsForStock(symbol: string): Promise<{
        title: string | undefined;
        link: string | undefined;
        pubDate: string | undefined;
        source: any;
    }[]>;
    getMarketNews(): Promise<{
        title: string | undefined;
        link: string | undefined;
        pubDate: string | undefined;
        source: any;
    }[]>;
}
