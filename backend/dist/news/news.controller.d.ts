import { NewsService } from './news.service';
export declare class NewsController {
    private readonly newsService;
    constructor(newsService: NewsService);
    getStockNews(symbol: string): Promise<{
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
