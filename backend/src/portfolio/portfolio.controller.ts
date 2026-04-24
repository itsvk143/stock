import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  async getPortfolio(@Query('userId') userId: string) {
    return this.portfolioService.getPortfolio(userId);
  }

  @Post('holding')
  async addHolding(@Body() body: any) {
    return this.portfolioService.addHolding(body.userId, body.portfolioId, body.data);
  }

  @Get('watchlist')
  async getWatchlist(@Query('userId') userId: string) {
    return this.portfolioService.getWatchlist(userId);
  }

  @Post('watchlist')
  async addToWatchlist(@Body() body: any) {
    return this.portfolioService.addToWatchlist(body.userId, body.watchlistId, body.data);
  }
}
