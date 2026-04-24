import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getPortfolio(userId: string) {
    return this.prisma.portfolio.findMany({
      where: { userId },
      include: { holdings: true },
    });
  }

  async addHolding(userId: string, portfolioId: string, data: any) {
    return this.prisma.holding.create({
      data: {
        portfolioId,
        instrumentToken: data.token,
        symbol: data.symbol,
        exchange: data.exchange,
        quantity: data.quantity,
        avgPrice: data.avgPrice,
      },
    });
  }

  async getWatchlist(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: { items: true },
    });
  }

  async addToWatchlist(userId: string, watchlistId: string, data: any) {
    return this.prisma.watchlistItem.create({
      data: {
        watchlistId,
        instrumentToken: data.token,
        symbol: data.symbol,
        exchange: data.exchange,
      },
    });
  }
}
