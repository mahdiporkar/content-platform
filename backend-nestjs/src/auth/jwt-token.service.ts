import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export type JwtPayload = {
  sub: string;
  email: string;
  applicationIds: string[];
};

@Injectable()
export class JwtTokenService {
  constructor(private readonly config: ConfigService) {}

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }

  private get secret(): jwt.Secret {
    return (this.config.get<string>('JWT_SECRET') || 'dev-secret') as jwt.Secret;
  }

  private get expiresIn(): jwt.SignOptions['expiresIn'] {
    return (this.config.get<string>('JWT_EXPIRES_IN') || '1h') as jwt.SignOptions['expiresIn'];
  }
}