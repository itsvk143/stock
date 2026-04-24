import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  async getNewsForStock(symbol: string) {
    try {
      // Use Google News RSS for Indian stock market context
      const url = `https://news.google.com/rss/search?q=${symbol}+stock+NSE+India&hl=en-IN&gl=IN&ceid=IN:en`;
      const feed = await this.parser.parseURL(url);
      
      return feed.items.slice(0, 5).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        source: item.source,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch news for ${symbol}`, error);
      return [];
    }
  }

  async getMarketNews() {
    try {
      const url = 'https://news.google.com/rss/search?q=Indian+Stock+Market+NSE+BSE&hl=en-IN&gl=IN&ceid=IN:en';
      const feed = await this.parser.parseURL(url);
      
      return feed.items.slice(0, 10).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        source: item.source,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch market news', error);
      return [];
    }
  }
}
