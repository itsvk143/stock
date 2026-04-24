import { Module } from '@nestjs/common';
import { InstrumentsService } from './instruments.service';
import { InstrumentsController } from './instruments.controller';

@Module({
  providers: [InstrumentsService],
  controllers: [InstrumentsController]
})
export class InstrumentsModule {}
