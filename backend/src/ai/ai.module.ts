import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { RiskService } from './risk/risk.service';

import { MarketModule } from '../market/market.module';

@Module({
  imports: [MarketModule],
  providers: [AiService, RiskService],
  controllers: [AiController]
})
export class AiModule {}
