"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const { authenticator } = require('otplib');
const { SmartAPI } = require('smartapi-javascript');
let AuthService = AuthService_1 = class AuthService {
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    smartApi;
    sessionData = null;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('SMART_API_KEY');
        this.smartApi = new SmartAPI({
            api_key: apiKey,
        });
    }
    async login() {
        try {
            const clientCode = this.configService.get('SMART_CLIENT_CODE');
            const password = this.configService.get('SMART_PASSWORD');
            const totpSecret = this.configService.get('SMART_TOTP_SECRET');
            const totp = authenticator.generate(totpSecret);
            const response = await this.smartApi.generateSession(clientCode, password, totp);
            if (response.status) {
                this.sessionData = response.data;
                this.logger.log('Successfully logged into SmartAPI');
                return response.data;
            }
            else {
                this.logger.error('Failed to log into SmartAPI: ' + response.message);
                throw new Error(response.message);
            }
        }
        catch (error) {
            this.logger.error('SmartAPI login error', error);
            throw error;
        }
    }
    async getSession() {
        if (!this.sessionData) {
            return await this.login();
        }
        return this.sessionData;
    }
    async logout() {
        if (this.sessionData) {
            await this.smartApi.terminateSession(this.configService.get('SMART_CLIENT_CODE'));
            this.sessionData = null;
        }
    }
    getSmartApiInstance() {
        return this.smartApi;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map