import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { ApplicationEntity, MediaPolicy } from '../entities/application.entity';

@Injectable()
export class DomainPolicyService {
  ensureAllowed(application: ApplicationEntity, request: Request, options?: { allowMissing?: boolean }) {
    if (application.mediaPolicy !== MediaPolicy.DOMAIN_LOCKED) {
      return;
    }

    const origin = this.getHeader(request, 'origin');
    const referer = this.getHeader(request, 'referer');
    const host = this.extractHost(origin || referer);

    if (!host) {
      if (options?.allowMissing) {
        return;
      }
      throw new ForbiddenException('Domain policy enforced: missing origin.');
    }

    const allowed = (application.allowedDomains || []).map((domain) => domain.toLowerCase());
    if (allowed.length === 0) {
      throw new ForbiddenException('Domain policy enforced: no domains allowed.');
    }
    if (!allowed.includes(host)) {
      throw new ForbiddenException('Domain policy enforced: domain not allowed.');
    }
  }

  private getHeader(request: Request, name: string): string | undefined {
    const value = request.headers[name];
    if (!value) {
      return undefined;
    }
    return Array.isArray(value) ? value[0] : value;
  }

  private extractHost(value: string | undefined): string | null {
    if (!value) {
      return null;
    }
    try {
      const url = new URL(value);
      return url.hostname.toLowerCase();
    } catch {
      const sanitized = value.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
      return sanitized ? sanitized.toLowerCase() : null;
    }
  }
}
