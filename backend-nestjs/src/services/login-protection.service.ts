import { Injectable } from '@nestjs/common';
import { InMemoryRateLimiterService } from './in-memory-rate-limiter.service';
import { TooManyRequestsHttpException } from '../common/too-many-requests.exception';

@Injectable()
export class LoginProtectionService {
  private readonly loginWindowMs = 60_000;
  private readonly loginLimitPerIp = 5;
  private readonly loginLimitPerEmail = 5;
  private readonly lockoutThreshold = 8;
  private readonly lockoutMs = 15 * 60_000;

  constructor(private readonly rateLimiter: InMemoryRateLimiterService) {}

  assertAllowed(ip: string, email: string): void {
    for (const key of this.keys(ip, email)) {
      const lock = this.rateLimiter.isLocked(`lock:${key}`);
      if (lock.locked) {
        throw new TooManyRequestsHttpException(`Too many login attempts. Retry in ${lock.retryAfterSeconds} seconds.`);
      }
    }
  }

  recordFailure(ip: string, email: string): void {
    const ipStatus = this.rateLimiter.increment(`login:ip:${ip}`, this.loginLimitPerIp, this.loginWindowMs);
    const emailStatus = this.rateLimiter.increment(`login:email:${email}`, this.loginLimitPerEmail, this.loginWindowMs);

    if (!ipStatus.allowed || ipStatus.count >= this.lockoutThreshold) {
      this.rateLimiter.lock(`lock:login:ip:${ip}`, this.lockoutMs);
    }
    if (!emailStatus.allowed || emailStatus.count >= this.lockoutThreshold) {
      this.rateLimiter.lock(`lock:login:email:${email}`, this.lockoutMs);
    }

    if (!ipStatus.allowed || !emailStatus.allowed) {
      const retryAfterSeconds = Math.max(ipStatus.retryAfterSeconds, emailStatus.retryAfterSeconds);
      throw new TooManyRequestsHttpException(`Too many login attempts. Retry in ${retryAfterSeconds} seconds.`);
    }
  }

  recordSuccess(ip: string, email: string): void {
    this.rateLimiter.clear(`login:ip:${ip}`);
    this.rateLimiter.clear(`login:email:${email}`);
    this.rateLimiter.clear(`lock:login:ip:${ip}`);
    this.rateLimiter.clear(`lock:login:email:${email}`);
  }

  private keys(ip: string, email: string): string[] {
    return [`login:ip:${ip}`, `login:email:${email}`];
  }
}
