import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
export declare class AiService {
    private configService;
    private db;
    private readonly logger;
    private genAI;
    constructor(configService: ConfigService, db: DatabaseService);
    analyzeStock(symbol: string, data: any): Promise<any>;
}
