import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';

type ParsedHeaders = {
  applicationId?: string;
  applicationToken?: string;
};

@Injectable()
export class ApplicationHeaderService {
  private readonly logger = new Logger(ApplicationHeaderService.name);

  parse(request: Request): ParsedHeaders {
    this.warnDeprecatedHeaders(request);
    return {
      applicationId: this.getHeader(request, 'x-application-id') || this.getHeader(request, 'x-app-id'),
      applicationToken: this.getHeader(request, 'x-application-token'),
    };
  }

  private warnDeprecatedHeaders(request: Request): void {
    const rawHeaders = request.rawHeaders || [];
    const deprecated = new Set<string>();

    for (let index = 0; index < rawHeaders.length; index += 2) {
      const name = rawHeaders[index];
      if (name === 'x-app-id' || name === 'x-application-id' || name === 'x-application-token') {
        deprecated.add(name);
      }
    }

    deprecated.forEach((name) => {
      const replacement = name === 'x-app-id' ? 'X-Application-Id' : name === 'x-application-id' ? 'X-Application-Id' : 'X-Application-Token';
      this.logger.warn(`Deprecated application header "${name}" used. Switch to "${replacement}".`);
    });
  }

  private getHeader(request: Request, name: string): string | undefined {
    const value = request.headers[name] as string | string[] | undefined;
    if (!value) {
      return undefined;
    }
    return Array.isArray(value) ? value[0] : value;
  }
}
