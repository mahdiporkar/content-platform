import { Injectable } from '@nestjs/common';

type CounterRecord = {
  count: number;
  resetAt: number;
};

type LockRecord = {
  until: number;
};

@Injectable()
export class InMemoryRateLimiterService {
  private readonly counters = new Map<string, CounterRecord>();
  private readonly locks = new Map<string, LockRecord>();

  isLocked(key: string): { locked: boolean; retryAfterSeconds: number } {
    const lock = this.locks.get(key);
    if (!lock) {
      return { locked: false, retryAfterSeconds: 0 };
    }
    if (lock.until <= Date.now()) {
      this.locks.delete(key);
      return { locked: false, retryAfterSeconds: 0 };
    }
    return { locked: true, retryAfterSeconds: Math.ceil((lock.until - Date.now()) / 1000) };
  }

  increment(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSeconds: number; count: number } {
    const now = Date.now();
    const current = this.counters.get(key);
    if (!current || current.resetAt <= now) {
      const next = { count: 1, resetAt: now + windowMs };
      this.counters.set(key, next);
      return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000), count: 1 };
    }

    current.count += 1;
    this.counters.set(key, current);
    return {
      allowed: current.count <= limit,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
      count: current.count,
    };
  }

  clear(key: string): void {
    this.counters.delete(key);
    this.locks.delete(key);
  }

  lock(key: string, durationMs: number): void {
    this.locks.set(key, { until: Date.now() + durationMs });
  }
}
