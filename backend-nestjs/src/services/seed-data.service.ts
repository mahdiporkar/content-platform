import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { ApplicationEntity } from '../entities/application.entity';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { AdminUserApplicationEntity } from '../entities/admin-user-application.entity';

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
      const applicationId = existing[0].id;
      this.logger.log(`Existing applicationId: ${applicationId}`);
      return applicationId;
    }

    const application = this.applicationRepo.create({
      id: uuidv4(),
      name: 'Demo Application',
    });
    await this.applicationRepo.save(application);
    this.logger.log(`Seeded applicationId: ${application.id}`);
    return application.id;
  }

  private async ensureAdminUser(applicationId: string): Promise<void> {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL') || 'admin@example.com';
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD') || 'Admin123!';

    const existing = await this.adminUserRepo.findOne({ where: { email: adminEmail } });
    if (existing) {
      this.logger.log('Admin user already exists.');
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = this.adminUserRepo.create({
      id: uuidv4(),
      email: adminEmail,
      passwordHash,
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