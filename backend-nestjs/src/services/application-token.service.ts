import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export type GeneratedApplicationToken = {
  rawToken: string;
  tokenHash: string;
  tokenSalt: string;
};

@Injectable()
export class ApplicationTokenService {
  generate(): GeneratedApplicationToken {
    const rawToken = randomBytes(32).toString('hex');
    return this.hashToken(rawToken);
  }

  hashToken(rawToken: string, providedSalt?: string): GeneratedApplicationToken {
    const tokenSalt = providedSalt || randomBytes(16).toString('hex');
    const tokenHash = this.computeHash(rawToken, tokenSalt);
    return { rawToken, tokenHash, tokenSalt };
  }

  matches(rawToken: string, tokenHash: string | null | undefined, tokenSalt: string | null | undefined): boolean {
    if (!rawToken || !tokenHash || !tokenSalt) {
      return false;
    }
    const candidate = Buffer.from(this.computeHash(rawToken, tokenSalt), 'hex');
    const existing = Buffer.from(tokenHash, 'hex');
    if (candidate.length !== existing.length) {
      return false;
    }
    return timingSafeEqual(candidate, existing);
  }

  private computeHash(rawToken: string, salt: string): string {
    return createHash('sha256').update(`${rawToken}:${salt}`, 'utf8').digest('hex');
  }
}
