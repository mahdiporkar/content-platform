import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { ApplicationEntity } from '../entities/application.entity';
import { AdminUserEntity, AdminUserRole } from '../entities/admin-user.entity';
import { AdminUserApplicationEntity } from '../entities/admin-user-application.entity';
import { ApplicationTokenService } from './application-token.service';

@Injectable()
export class SeedDataService implements OnModuleInit {
  private readonly logger = new Logger(SeedDataService.name);

  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    @InjectRepository(AdminUserEntity)
    private readonly adminUserRepo: Repository<AdminUserEntity>,
    @InjectRepository(AdminUserApplicationEntity)
    private readonly adminUserApplicationRepo: Repository<AdminUserApplicationEntity>,
    private readonly config: ConfigService,
    private readonly applicationTokenService: ApplicationTokenService,
  ) {}

  async onModuleInit(): Promise<void> {
    const applicationId = await this.ensureApplication();
    if (applicationId) {
      await this.ensureAdminUser(applicationId);
    }
  }

  private async ensureApplication(): Promise<string | null> {
    const existing = await this.applicationRepo.find({ take: 1, order: { id: 'ASC' } });
    if (existing.length > 0) {
      const application = existing[0];
      if (!application.apiTokenHash && application.apiToken) {
        const migrated = this.applicationTokenService.hashToken(application.apiToken);
        application.apiTokenHash = migrated.tokenHash;
        application.apiTokenSalt = migrated.tokenSalt;
        application.apiToken = null;
        application.lastRotatedAt = new Date();
        await this.applicationRepo.save(application);
      } else if (!application.apiTokenHash) {
        const issued = this.applicationTokenService.generate();
        application.apiTokenHash = issued.tokenHash;
        application.apiTokenSalt = issued.tokenSalt;
        application.tokenCreatedAt = new Date();
        application.lastRotatedAt = new Date();
        await this.applicationRepo.save(application);
        this.logger.log(`Seeded application token for existing app ${application.id}: ${issued.rawToken}`);
      }
      this.logger.log(`Existing applicationId: ${application.id}`);
      return application.id;
    }

    const issued = this.applicationTokenService.generate();
    const application = this.applicationRepo.create({
      id: uuidv4(),
      name: 'Demo Application',
      apiToken: null,
      apiTokenHash: issued.tokenHash,
      apiTokenSalt: issued.tokenSalt,
      tokenCreatedAt: new Date(),
      lastRotatedAt: new Date(),
    });
    await this.applicationRepo.save(application);
    this.logger.log(`Seeded applicationId: ${application.id}`);
    this.logger.log(`Seeded application token: ${issued.rawToken}`);
    return application.id;
  }

  private async ensureAdminUser(applicationId: string): Promise<void> {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'admin@example.com';
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD') || 'Admin123!';

    const existing = await this.adminUserRepo.findOne({ where: { email: adminEmail } });
    if (existing) {
      if (existing.role !== AdminUserRole.SUPER_ADMIN) {
        existing.role = AdminUserRole.SUPER_ADMIN;
        existing.systemPermissions = null;
        existing.servicePermissions = null;
        await this.adminUserRepo.save(existing);
        this.logger.log('Updated seed admin user role to super_admin.');
      }
      this.logger.log('Admin user already exists.');
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = this.adminUserRepo.create({
      id: uuidv4(),
      email: adminEmail,
      passwordHash,
      role: AdminUserRole.SUPER_ADMIN,
      tokenVersion: 1,
      applications: [],
    });

    const link = this.adminUserApplicationRepo.create({
      adminUserId: admin.id,
      applicationId,
      adminUser: admin,
    });

    admin.applications = [link];

    await this.adminUserRepo.save(admin);
    this.logger.log(`Seeded admin user: ${adminEmail} (set ADMIN_PASSWORD to override).`);
  }

}
