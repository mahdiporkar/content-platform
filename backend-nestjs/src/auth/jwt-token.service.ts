import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export type JwtPayload = {
  sub: string;
  email: string;
  role?: string;
  applicationIds: string[];
  tokenVersion: number;
  systemPermissions?: string[];
  servicePermissions?: string[];
};

@Injectable()
export class JwtTokenService {
  constructor(private readonly config: ConfigService) {}

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  signWithExpiry(payload: JwtPayload, expiresIn: jwt.SignOptions['expiresIn']): string {
    return jwt.sign(payload, this.secret, { expiresIn });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }

  private get secret(): jwt.Secret {
    const secret = this.config.get<string>('JWT_SECRET');
    if (secret) {
      return secret as jwt.Secret;
    }

    const appEnv = (
      this.config.get<string>('APP_ENV') ||
      this.config.get<string>('NODE_ENV') ||
      'development'
    ).toLowerCase();
    if (appEnv === 'production') {
      throw new Error('JWT_SECRET is not configured.');
    }
    return 'dev-secret-local-only' as jwt.Secret;
  }

  private get expiresIn(): jwt.SignOptions['expiresIn'] {
    return (this.config.get<string>('JWT_EXPIRES_IN') || '1h') as jwt.SignOptions['expiresIn'];
  }
}
