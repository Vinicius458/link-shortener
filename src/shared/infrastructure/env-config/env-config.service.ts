import { Injectable } from '@nestjs/common';
import { EnvConfig } from './env-config.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfigService implements EnvConfig {
  constructor(private configService: ConfigService) {}
  getAppPort(): number {
    return Number(this.configService.get<number>('PORT'));
  }

  getNodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  getDatabaseUrl(): string {
    const url = this.configService.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('Missing environment variable: DATABASE_URL');
    }
    return url;
  }
  getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('Missing environment variable: JWT_SECRET');
    }

    return secret;
  }

  getJwtExpiresInSeconds(): number {
    return Number(this.configService.get<number>('JWT_EXPIRES_IN'));
  }
}
