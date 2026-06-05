import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { ApplicationEntity } from '../entities/application.entity';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { AdminUserApplicationEntity } from '../entities/admin-user-application.entity';
import { MenuEntity } from '../entities/menu.entity';
import { MenuItemEntity } from '../entities/menu-item.entity';
import { MenuItemTarget, MenuItemType, MenuLocation, MenuStatus } from '../common/menu-types';
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
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
    @InjectRepository(MenuItemEntity)
    private readonly menuItemRepo: Repository<MenuItemEntity>,
    private readonly config: ConfigService,
    private readonly applicationTokenService: ApplicationTokenService,
  ) {}

  async onModuleInit(): Promise<void> {
    const applicationId = await this.ensureApplication();
    if (applicationId) {
      await this.ensureAdminUser(applicationId);
    }
    await this.ensurePersonalBrandingMenus();
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
      this.logger.log('Admin user already exists.');
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = this.adminUserRepo.create({
      id: uuidv4(),
      email: adminEmail,
      passwordHash,
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

  private async ensurePersonalBrandingMenus(): Promise<void> {
    const configuredApplicationId =
      this.config.get<string>('PERSONAL_BRANDING_APPLICATION_ID') ||
      this.config.get<string>('CONTENT_PLATFORM_APPLICATION_ID') ||
      'b04535c1-6dea-48a5-bd74-a27d379afad4';
    const application =
      (await this.applicationRepo.findOne({ where: { id: configuredApplicationId } })) ||
      (await this.applicationRepo.findOne({ where: { name: 'majidporkar' } }));

    if (!application) {
      return;
    }

    const menus = [
      {
        languageCode: 'fa',
        title: 'منوی اصلی',
        items: [
          ['خانه', '/fa/home'],
          ['پروژه‌ها', '/fa/projects'],
          ['وبلاگ', '/fa/blog'],
          ['گالری', '/fa/gallery'],
          ['ویدیوها', '/fa/videos'],
          ['اینستاگرام', '/fa/instagram'],
          ['درباره من', '/fa/about'],
          ['تماس', '/fa/contact'],
        ],
      },
      {
        languageCode: 'en',
        title: 'Main Menu',
        items: [
          ['Home', '/en/home'],
          ['Projects', '/en/projects'],
          ['Blog', '/en/blog'],
          ['Gallery', '/en/gallery'],
          ['Videos', '/en/videos'],
          ['Instagram', '/en/instagram'],
          ['About', '/en/about'],
          ['Contact', '/en/contact'],
        ],
      },
      {
        languageCode: 'ar',
        title: 'القائمة الرئيسية',
        items: [
          ['الرئيسية', '/ar/home'],
          ['المشاريع', '/ar/projects'],
          ['المدونة', '/ar/blog'],
          ['المعرض', '/ar/gallery'],
          ['الفيديوهات', '/ar/videos'],
          ['إنستغرام', '/ar/instagram'],
          ['نبذة عني', '/ar/about'],
          ['تواصل', '/ar/contact'],
        ],
      },
    ] as const;

    for (const menuConfig of menus) {
      let menu = await this.menuRepo.findOne({
        where: {
          applicationId: application.id,
          code: 'main-menu',
          languageCode: menuConfig.languageCode,
        },
      });

      if (!menu) {
        menu = this.menuRepo.create({
          id: uuidv4(),
          applicationId: application.id,
          code: 'main-menu',
          title: menuConfig.title,
          location: MenuLocation.HEADER,
          languageCode: menuConfig.languageCode,
          status: MenuStatus.ACTIVE,
        });
        await this.menuRepo.save(menu);
      }

      const existingItems = await this.menuItemRepo.find({ where: { menuId: menu.id } });
      const existingUrls = new Set(
        existingItems
          .map((item) => item.url?.trim())
          .filter((url): url is string => Boolean(url)),
      );
      const nextSortOrder =
        existingItems.length > 0
          ? Math.max(...existingItems.map((item) => item.sortOrder)) + 1
          : 0;
      let addedCount = 0;

      for (const [index, [title, url]] of menuConfig.items.entries()) {
        if (existingUrls.has(url)) {
          continue;
        }
        await this.menuItemRepo.save(
          this.menuItemRepo.create({
            id: uuidv4(),
            menuId: menu.id,
            parentId: null,
            title,
            itemType: MenuItemType.CUSTOM_URL,
            referenceId: null,
            url,
            target: MenuItemTarget.SELF,
            icon: null,
            cssClass: null,
            sortOrder: existingItems.length > 0 ? nextSortOrder + addedCount : index,
            isVisible: true,
          }),
        );
        addedCount += 1;
      }

      const baselineUrls = new Set<string>(menuConfig.items.map(([, url]) => url));
      const refreshedItems = await this.menuItemRepo.find({ where: { menuId: menu.id } });
      const baselineItems = refreshedItems.filter((item) => item.url && baselineUrls.has(item.url));
      const sortOrders = new Set(baselineItems.map((item) => item.sortOrder));
      if (baselineItems.length > 0 && sortOrders.size !== baselineItems.length) {
        const orderByUrl = new Map<string, number>(
          menuConfig.items.map(([, url], index) => [url, index]),
        );
        for (const item of baselineItems) {
          item.sortOrder = orderByUrl.get(item.url ?? '') ?? item.sortOrder;
        }
        await this.menuItemRepo.save(baselineItems);
      }
    }
  }
}
