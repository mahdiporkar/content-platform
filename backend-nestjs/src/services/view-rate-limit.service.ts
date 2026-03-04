import { Injectable } from '@nestjs/common';
import { InMemoryRateLimiterService } from './in-memory-rate-limiter.service';
import { TooManyRequestsHttpException } from '../common/too-many-requests.exception';

@Injectable()
export class ViewRateLimitService {
  private readonly limit = 30;
  private readonly windowMs = 60_000;

  constructor(private readonly rateLimiter: InMemoryRateLimiterService) {}

  assertAllowed(applicationId: string, clientIp: string, contentId: string): void {
    const key = `view:${applicationId}:${clientIp}:${contentId}`;
    const status = this.rateLimiter.increment(key, this.limit, this.windowMs);
    if (!status.allowed) {
      throw new TooManyRequestsHttpException(`Too many view events. Retry in ${status.retryAfterSeconds} seconds.`);
    }
  }
}
