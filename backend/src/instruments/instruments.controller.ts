import { Controller, Get, Query, Param } from '@nestjs/common';
import { InstrumentsService } from './instruments.service';

@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query || query.length < 2) return [];
    return this.instrumentsService.search(query);
  }

  @Get('sync')
  async forceSync() {
    this.instrumentsService.syncInstruments(); // Run in background
    return { message: 'Sync started' };
  }

  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    return this.instrumentsService.getByToken(token);
  }

  @Get('screener')
  async screener(
    @Query('minMarketCap') minMarketCap?: string,
    @Query('maxPe') maxPe?: string,
    @Query('minRoe') minRoe?: string,
  ) {
    return this.instrumentsService.screener({
      minMarketCap: minMarketCap ? parseFloat(minMarketCap) : undefined,
      maxPe: maxPe ? parseFloat(maxPe) : undefined,
      minRoe: minRoe ? parseFloat(minRoe) : undefined,
    });
  }
}
