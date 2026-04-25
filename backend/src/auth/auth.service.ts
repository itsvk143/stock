import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const { authenticator } = require('otplib');
// @ts-ignore
const { SmartAPI } = require('smartapi-javascript');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private smartApi: any;
  private sessionData: any = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SMART_API_KEY');
    this.smartApi = new SmartAPI({
      api_key: apiKey,
    });
  }

  async login() {
    try {
      const clientCode = this.configService.get<string>('SMART_CLIENT_CODE');
      const password = this.configService.get<string>('SMART_PASSWORD');
      const totpSecret = this.configService.get<string>('SMART_TOTP_SECRET');

      const totp = authenticator.generate(totpSecret);

      const response = await this.smartApi.generateSession(clientCode, password, totp);

      if (response.status) {
        this.sessionData = response.data;
        this.logger.log('Successfully logged into SmartAPI');
        return response.data;
      } else {
        this.logger.error('Failed to log into SmartAPI: ' + response.message);
        throw new Error(response.message);
      }
    } catch (error) {
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
}
