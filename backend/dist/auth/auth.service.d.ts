import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private configService;
    private readonly logger;
    private smartApi;
    private sessionData;
    constructor(configService: ConfigService);
    login(): Promise<any>;
    getSession(): Promise<any>;
    logout(): Promise<void>;
    getSmartApiInstance(): any;
}
