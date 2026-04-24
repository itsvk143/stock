import { Controller, Get, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('stock')
  async getStockNews(@Query('symbol') symbol: string) {
    return this.newsService.getNewsForStock(symbol);
  }

  @Get('market')
  async getMarketNews() {
    return this.newsService.getMarketNews();
  }
}
