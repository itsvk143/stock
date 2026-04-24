import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class AiService {
    private configService;
    private prisma;
    private readonly logger;
    private openai;
    constructor(configService: ConfigService, prisma: PrismaService);
    analyzeStock(symbol: string, data: any): Promise<any>;
}
