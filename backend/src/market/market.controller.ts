import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('ltp')
  async getLtp(
    @Query('exchange') exchange: string,
    @Query('tradingsymbol') tradingsymbol: string,
    @Query('symboltoken') symboltoken: string,
  ) {
    return this.marketService.getLtp(exchange, tradingsymbol, symboltoken);
  }

  @Get('candles')
  async getCandles(
    @Query('exchange') exchange: string,
    @Query('symboltoken') symboltoken: string,
    @Query('interval') interval: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.marketService.getCandleData(exchange, symboltoken, interval, from, to);
  }
}
