import assert from 'assert';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { LoginProtectionService } from '../src/services/login-protection.service';
import { InMemoryRateLimiterService } from '../src/services/in-memory-rate-limiter.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { ApplicationTokenGuard } from '../src/auth/application-token.guard';
import { ApplicationHeaderService } from '../src/services/application-header.service';
import { ApplicationTokenService } from '../src/services/application-token.service';
import { MediaPolicy } from '../src/entities/application.entity';
import { DomainPolicyService } from '../src/services/domain-policy.service';
import { DeliveryContentController } from '../src/controllers/delivery-content.controller';
import { ViewRateLimitService } from '../src/services/view-rate-limit.service';
import { ContentType } from '../src/common/content-type.enum';
import { TooManyRequestsHttpException } from '../src/common/too-many-requests.exception';
import { PublicMediaUrlService } from '../src/services/public-media-url.service';
import { buildCorsConfiguration } from '../src/common/cors-config';

function makeContext(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as never;
}

async function corsAllows(
  env: NodeJS.ProcessEnv,
  origin: string | undefined,
): Promise<boolean> {
  const configuration = buildCorsConfiguration(env);
  const originHandler = configuration.options.origin;
  assert.equal(typeof originHandler, 'function');
  const checkOrigin = originHandler as (
    requestOrigin: string,
    callback: (error: Error | null, allowed?: boolean) => void,
  ) => void;

  return new Promise((resolve, reject) => {
    checkOrigin(
      origin as string,
      (error, allowed) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(Boolean(allowed));
      },
    );
  });
}

async function testCorsConfiguration(): Promise<void> {
  const configuredEnv = {
    NODE_ENV: 'production',
    CORS_ALLOWED_ORIGINS: 'https://cms.example.com, http://localhost:3002,https://cms.example.com',
  };
  const configuredCors = buildCorsConfiguration(configuredEnv);
  assert.equal(await corsAllows(configuredEnv, 'https://cms.example.com'), true);
  assert.equal(await corsAllows(configuredEnv, 'http://localhost:3002'), true);
  assert.equal(await corsAllows(configuredEnv, 'https://blocked.example.com'), false);
  assert.equal(await corsAllows(configuredEnv, undefined), true);
  assert.ok(
    (configuredCors.options.allowedHeaders as string[]).some(
      (header) => header.toLowerCase() === 'x-application-id',
    ),
    'CORS must allow X-Application-Id for admin preflight requests',
  );

  const developmentConfiguration = buildCorsConfiguration({ NODE_ENV: 'development' });
  assert.equal(developmentConfiguration.missingInProduction, false);
  assert.equal(await corsAllows({ NODE_ENV: 'development' }, 'https://local.example.com'), true);

  const productionConfiguration = buildCorsConfiguration({ NODE_ENV: 'production' });
  assert.equal(productionConfiguration.missingInProduction, true);
  assert.equal(await corsAllows({ NODE_ENV: 'production' }, 'https://blocked.example.com'), false);
  assert.equal(await corsAllows({ NODE_ENV: 'production' }, undefined), true);
}

async function testLoginRateLimit(): Promise<void> {
  const service = new LoginProtectionService(new InMemoryRateLimiterService());
  const ip = '127.0.0.1';
  const email = 'admin@example.com';
  service.assertAllowed(ip, email);
  let blocked = false;
  for (let index = 0; index < 6; index += 1) {
    try {
      service.recordFailure(ip, email);
    } catch (error) {
      blocked = error instanceof TooManyRequestsHttpException;
    }
  }
  assert.equal(blocked, true, 'login attempts should be rate limited');
}

async function testJwtInvalidation(): Promise<void> {
  const guard = new JwtAuthGuard(
    {
      verify: () => ({ sub: 'admin-1', tokenVersion: 1, applicationIds: [], email: 'admin@example.com' }),
    } as never,
    {
      findOne: async () => ({ id: 'admin-1', status: 'suspended', tokenVersion: 2 }),
    } as never,
  );

  await assert.rejects(
    () =>
      guard.canActivate(
        makeContext({
          method: 'GET',
          path: '/api/v1/admin/users',
          headers: { authorization: 'Bearer token' },
        }),
      ),
    UnauthorizedException,
  );
}

async function testDeliveryGuardTokens(): Promise<void> {
  const tokenService = new ApplicationTokenService();
  const issued = tokenService.generate();
  const application = {
    id: 'app-1',
    status: 'active',
    mediaPolicy: MediaPolicy.PUBLIC_VIA_GATEWAY,
    apiToken: null,
    apiTokenHash: issued.tokenHash,
    apiTokenSalt: issued.tokenSalt,
    save: async () => undefined,
  };

  const repo = {
    findOne: async () => application,
    save: async () => application,
  };

  const guard = new ApplicationTokenGuard(
    repo as never,
    { verify: () => ({ sub: 'admin-1', applicationIds: ['app-1'], tokenVersion: 1, email: 'a@example.com' }) } as never,
    tokenService,
    new ApplicationHeaderService(),
  );

  await assert.rejects(
    () =>
      guard.canActivate(
        makeContext({
          method: 'GET',
          path: '/api/v1/content/app-1/posts',
          params: { applicationId: 'app-1' },
          headers: {},
          rawHeaders: [],
        }),
      ),
    UnauthorizedException,
  );

  await assert.rejects(
    () =>
      guard.canActivate(
        makeContext({
          method: 'GET',
          path: '/api/v1/content/app-1/posts',
          params: { applicationId: 'app-1' },
          headers: { 'x-application-id': 'app-1', 'x-application-token': 'wrong-token' },
          rawHeaders: ['X-Application-Id', 'app-1', 'X-Application-Token', 'wrong-token'],
        }),
      ),
    UnauthorizedException,
  );
}

async function testDomainLockedPolicy(): Promise<void> {
  const controller = new DeliveryContentController(
    {
      listContent: async () => ({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 10 }),
      incrementView: async () => undefined,
    } as never,
    new DomainPolicyService(),
    new ViewRateLimitService(new InMemoryRateLimiterService()),
    {} as never,
  );

  const app = { id: 'app-1', mediaPolicy: MediaPolicy.DOMAIN_LOCKED, allowedDomains: ['allowed.example'] };

  await assert.rejects(
    () =>
      controller.listContent(
        {
          application: app,
          headers: { origin: 'https://blocked.example' },
        } as never,
        {},
      ),
    ForbiddenException,
  );

  const response = await controller.listContent(
    {
      application: app,
      headers: {},
    } as never,
    {},
  );
  assert.deepEqual(response.items, []);
}

async function testViewRateLimitAndDomainEnforcement(): Promise<void> {
  let incrementCalls = 0;
  const controller = new DeliveryContentController(
    {
      listContent: async () => ({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 10 }),
      incrementView: async () => {
        incrementCalls += 1;
      },
    } as never,
    new DomainPolicyService(),
    new ViewRateLimitService(new InMemoryRateLimiterService()),
    {} as never,
  );

  const app = { id: 'app-1', mediaPolicy: MediaPolicy.DOMAIN_LOCKED, allowedDomains: ['allowed.example'] };
  await assert.rejects(
    () =>
      controller.trackView(
        {
          application: app,
          headers: { origin: 'https://blocked.example' },
          ip: '127.0.0.1',
        } as never,
        { contentId: 'content-1', contentType: ContentType.ARTICLE },
      ),
    ForbiddenException,
  );

  for (let index = 0; index < 30; index += 1) {
    await controller.trackView(
      {
        application: app,
        headers: {},
        ip: '127.0.0.1',
      } as never,
      { contentId: 'content-1', contentType: ContentType.ARTICLE },
    );
  }

  await assert.rejects(
    () =>
      controller.trackView(
        {
          application: app,
          headers: {},
          ip: '127.0.0.1',
        } as never,
        { contentId: 'content-1', contentType: ContentType.ARTICLE },
      ),
    TooManyRequestsHttpException,
  );

  assert.equal(incrementCalls, 30);
}

async function testPublicMediaUrlService(): Promise<void> {
  const service = new PublicMediaUrlService({
    get: (key: string) => {
      if (key === 'CONTENT_PLATFORM_BASE_URL') return 'http://localhost:3000/';
      if (key === 'MINIO_PUBLIC_BASE_URL') return 'http://localhost:9000';
      return undefined;
    },
  } as never);

  const appWithBase = {
    id: 'app-1',
    publicBaseUrlOverride: 'http://app.local/',
  };
  const appWithoutBase = {
    id: 'app-1',
    publicBaseUrlOverride: null,
  };

  const rewritten = service.toPublicMediaUrl(appWithBase as never, 'http://localhost:9000/media/a/b.png');
  assert.equal(rewritten, 'http://app.local/media/a/b.png');
  assert.equal(rewritten?.includes('localhost:9000'), false);

  const defaultBased = service.toPublicMediaUrl(appWithoutBase as never, '/media/a/b.png');
  assert.equal(defaultBased, 'http://localhost:3000/media/a/b.png');

  const html = `<p><img src="http://localhost:9000/media/a/b.png"><a href='https://cdn.example.com/media/c/d.jpg'>x</a></p>`;
  const rewrittenHtml = service.rewriteHtmlMediaUrls(appWithBase as never, html);
  assert.equal(rewrittenHtml?.includes('http://app.local/media/a/b.png'), true);
  assert.equal(rewrittenHtml?.includes("href='http://app.local/media/c/d.jpg'"), true);
  assert.equal(rewrittenHtml?.includes('localhost:9000'), false);
}

async function main(): Promise<void> {
  await testCorsConfiguration();
  await testLoginRateLimit();
  await testJwtInvalidation();
  await testDeliveryGuardTokens();
  await testDomainLockedPolicy();
  await testViewRateLimitAndDomainEnforcement();
  await testPublicMediaUrlService();
  console.log('security-hardening tests passed');
}

void main();
