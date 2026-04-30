import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly dataLayerUrl: string;

  constructor(private configService: ConfigService) {
    this.dataLayerUrl = this.configService.get<string>('DATA_LAYER_URL', 'http://localhost:8001');
  }

  async getLtp(symbol: string) {
    try {
      const response = await axios.get(`${this.dataLayerUrl}/stock/${symbol}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Data Layer error for ${symbol}: ${error.message}`);
      throw new Error(`Failed to fetch stock data for ${symbol}`);
    }
  }

  async getCandleData(exchange: string, symboltoken: string, interval: string, fromDate: string, toDate: string) {
    // This will be migrated to Python service in next phase
    this.logger.warn('getCandleData not yet migrated to Data Layer');
    return [];
  }
}
