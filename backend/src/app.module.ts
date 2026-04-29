import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { MarketModule } from './market/market.module';
import { AiModule } from './ai/ai.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { RedisModule } from './redis/redis.module';
import { DatabaseModule } from './database/database.module';
import { NewsModule } from './news/news.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    AuthModule,
    InstrumentsModule,
    MarketModule,
    AiModule,
    PortfolioModule,
    NewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
