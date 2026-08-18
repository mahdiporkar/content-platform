import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { ApplicationEntity, ApplicationStatus, MediaPolicy } from '../entities/application.entity';
import { AdminUserEntity, AdminUserRole, AdminUserStatus } from '../entities/admin-user.entity';
import { AdminUserApplicationEntity } from '../entities/admin-user-application.entity';
import { ApplicationTokenService } from './application-token.service';
import { JwtTokenService } from '../auth/jwt-token.service';
import { DEFAULT_SERVICE_PERMISSIONS, SystemPermission } from '../auth/admin-permissions';
import { InMemoryRateLimiterService } from './in-memory-rate-limiter.service';
import { TooManyRequestsHttpException } from '../common/too-many-requests.exception';

@Injectable()
export class DemoSessionService implements OnModuleInit {
  constructor(
    @InjectRepository(ApplicationEntity) private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(AdminUserEntity) private readonly users: Repository<AdminUserEntity>,
    @InjectRepository(AdminUserApplicationEntity) private readonly links: Repository<AdminUserApplicationEntity>,
    private readonly config: ConfigService,
    private readonly applicationTokens: ApplicationTokenService,
    private readonly jwtTokens: JwtTokenService,
    private readonly limiter: InMemoryRateLimiterService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.enabled) await this.expireOldSessions();
  }

  async create(workspaceName: string, locale: string | undefined, clientIp: string) {
    if (!this.enabled) throw new ForbiddenException('Public demo sessions are disabled.');
    const attempt = this.limiter.increment(`demo-session:${clientIp}`, 3, 60 * 60 * 1000);
    if (!attempt.allowed) throw new TooManyRequestsHttpException(`Demo workspace limit reached. Try again in ${attempt.retryAfterSeconds} seconds.`);
    await this.expireOldSessions();

    const applicationId = uuidv4();
    const userId = uuidv4();
    const expiresAt = new Date(Date.now() + this.ttlHours * 60 * 60 * 1000);
    const issued = this.applicationTokens.generate();
    const safeName = workspaceName.trim().replace(/[<>]/g, '').slice(0, 60);
    const application = this.applications.create({
      id: applicationId,
      name: safeName,
      description: 'Isolated public demo workspace',
      status: ApplicationStatus.ACTIVE,
      rateLimitPolicy: { requestsPerMinute: 120 },
      mediaPolicy: MediaPolicy.PUBLIC_VIA_GATEWAY,
      allowedDomains: null,
      apiToken: null,
      apiTokenHash: issued.tokenHash,
      apiTokenSalt: issued.tokenSalt,
      tokenCreatedAt: new Date(),
      lastRotatedAt: new Date(),
      lastUsedAt: null,
      managementTokenHash: null,
      managementTokenSalt: null,
      managementTokenCreatedAt: null,
      managementTokenLastRotatedAt: null,
      managementTokenLastUsedAt: null,
      websiteUrl: null,
      publicBaseUrlOverride: null,
      mediaBaseUrlOverride: null,
      tags: ['public-demo', locale || 'en'],
      seo: null,
      demoExpiresAt: expiresAt,
    });
    const email = `demo-${userId}@demo.local`;
    const user = this.users.create({
      id: userId,
      email,
      passwordHash: await bcrypt.hash(uuidv4(), 4),
      role: AdminUserRole.SYSTEM_ADMIN,
      status: AdminUserStatus.ACTIVE,
      tokenVersion: 1,
      systemPermissions: [SystemPermission.APPLICATIONS_MANAGE],
      servicePermissions: [...DEFAULT_SERVICE_PERMISSIONS],
      applications: [],
    });
    await this.applications.save(application);
    await this.users.save(user);
    await this.links.save(this.links.create({ adminUserId: userId, applicationId, adminUser: user }));
    const token = this.jwtTokens.signWithExpiry({ sub: userId, email, role: AdminUserRole.SYSTEM_ADMIN, applicationIds: [applicationId], tokenVersion: 1, systemPermissions: [SystemPermission.APPLICATIONS_MANAGE], servicePermissions: [...DEFAULT_SERVICE_PERMISSIONS] }, `${this.ttlHours}h`);
    return { token, applicationId, applicationToken: issued.rawToken, workspaceName: safeName, expiresAt: expiresAt.toISOString() };
  }

  private async expireOldSessions(): Promise<void> {
    const expired = await this.applications.createQueryBuilder('app').where('app.demo_expires_at IS NOT NULL').andWhere('app.demo_expires_at < :now', { now: new Date() }).getMany();
    for (const app of expired) {
      const linked = await this.links.find({ where: { applicationId: app.id } });
      await this.links.delete({ applicationId: app.id });
      await this.applications.update(app.id, { status: ApplicationStatus.SUSPENDED });
      for (const link of linked) await this.users.delete(link.adminUserId);
    }
  }

  private get enabled(): boolean { return (this.config.get<string>('DEMO_MODE') || 'false').toLowerCase() === 'true'; }
  private get ttlHours(): number { return Math.min(48, Math.max(1, Number(this.config.get<string>('DEMO_SESSION_TTL_HOURS') || 12))); }
}
