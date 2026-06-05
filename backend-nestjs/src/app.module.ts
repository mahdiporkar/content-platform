import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { AdminApplicationController } from './controllers/admin-application.controller';
import { AdminPostController } from './controllers/admin-post.controller';
import { AdminArticleController } from './controllers/admin-article.controller';
import { AdminPageController } from './controllers/admin-page.controller';
import { AdminMenuController } from './controllers/admin-menu.controller';
import { AdminGalleryController } from './controllers/admin-gallery.controller';
import { AdminVideoController } from './controllers/admin-video.controller';
import { AdminMediaController } from './controllers/admin-media.controller';
import { AdminMediaLibraryController } from './controllers/admin-media-library.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { AdminCollectionController } from './controllers/admin-collection.controller';
import { AdminAppCollectionController } from './controllers/admin-app-collection.controller';
import { AdminImageController } from './controllers/admin-image.controller';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { DeliveryContentController } from './controllers/delivery-content.controller';
import { MediaGatewayController } from './controllers/media-gateway.controller';
import { MediaController } from './controllers/media.controller';
import { PublicMediaController } from './controllers/public-media.controller';
import { PublicSitemapController } from './controllers/public-sitemap.controller';
import { PublicPageMenuController } from './controllers/public-page-menu.controller';
import { AuthService } from './services/auth.service';
import { AdminApplicationService } from './services/admin-application.service';
import { AdminPostService } from './services/admin-post.service';
import { AdminArticleService } from './services/admin-article.service';
import { AdminPageService } from './services/admin-page.service';
import { AdminMenuService } from './services/admin-menu.service';
import { AdminGalleryService } from './services/admin-gallery.service';
import { AdminVideoService } from './services/admin-video.service';
import { AdminImageService } from './services/admin-image.service';
import { AdminUserService } from './services/admin-user.service';
import { ApplicationEntity } from './entities/application.entity';
import { AdminUserEntity } from './entities/admin-user.entity';
import { AdminUserApplicationEntity } from './entities/admin-user-application.entity';
import { PostEntity } from './entities/post.entity';
import { ArticleEntity } from './entities/article.entity';
import { PageEntity } from './entities/page.entity';
import { MenuEntity } from './entities/menu.entity';
import { MenuItemEntity } from './entities/menu-item.entity';
import { GalleryEntity } from './entities/gallery.entity';
import { VideoEntity } from './entities/video.entity';
import { ImageEntity } from './entities/image.entity';
import { CollectionEntity } from './entities/collection.entity';
import { CollectionItemEntity } from './entities/collection-item.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { ViewEventEntity } from './entities/view-event.entity';
import { MediaAssetEntity } from './entities/media-asset.entity';
import { MediaVariantEntity } from './entities/media-variant.entity';
import { MediaReferenceEntity } from './entities/media-reference.entity';
import { SitemapSettingsEntity } from './entities/sitemap-settings.entity';
import { SitemapTemplateEntity } from './entities/sitemap-template.entity';
import { SitemapOverrideEntity } from './entities/sitemap-override.entity';
import { SitemapCustomUrlEntity } from './entities/sitemap-custom-url.entity';
import { SitemapUrlCheckEntity } from './entities/sitemap-url-check.entity';
import { ConsumerUserEntity } from './entities/consumer-user.entity';
import { ConsumerEntitlementEntity } from './entities/consumer-entitlement.entity';
import { JwtTokenService } from './auth/jwt-token.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ApplicationTokenGuard } from './auth/application-token.guard';
import { AdminAuthorizationService } from './auth/admin-authorization.service';
import { SeedDataService } from './services/seed-data.service';
import { MinioService } from './services/minio.service';
import { parseJdbcUrl } from './common/jdbc-url';
import { BaseUrlService } from './services/base-url.service';
import { DomainPolicyService } from './services/domain-policy.service';
import { DeliveryContentService } from './services/delivery-content.service';
import { AdminCollectionService } from './services/admin-collection.service';
import { AuditLogService } from './services/audit-log.service';
import { AdminAnalyticsService } from './services/admin-analytics.service';
import { ScheduledPublisherService } from './services/scheduled-publisher.service';
import { MediaLibraryService } from './services/media-library.service';
import { MediaReferenceService } from './services/media-reference.service';
import { MediaLifecycleService } from './services/media-lifecycle.service';
import { MinioStorageProvider } from './services/minio-storage.provider';
import { MediaVariantService } from './services/media-variant.service';
import { SitemapService } from './services/sitemap.service';
import { AdminSitemapController } from './controllers/admin-sitemap.controller';
import { InMemoryRateLimiterService } from './services/in-memory-rate-limiter.service';
import { LoginProtectionService } from './services/login-protection.service';
import { ViewRateLimitService } from './services/view-rate-limit.service';
import { ApplicationTokenService } from './services/application-token.service';
import { ApplicationHeaderService } from './services/application-header.service';
import { AccessControlService } from './services/access-control.service';
import { PublicMediaUrlService } from './services/public-media-url.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jdbc = config.get<string>('DB_URL');
        const parsed = jdbc ? parseJdbcUrl(jdbc) : null;
        const host = parsed?.host || config.get<string>('DB_HOST') || 'localhost';
        const port = parsed?.port || Number(config.get<string>('DB_PORT') || 5432);
        const database = parsed?.database || config.get<string>('DB_NAME') || 'content_platform';
        return {
          type: 'postgres',
          host,
          port,
          database,
          username: config.get<string>('DB_USER') || 'content',
          password: config.get<string>('DB_PASSWORD') || 'content',
          entities: [
            ApplicationEntity,
            AdminUserEntity,
            AdminUserApplicationEntity,
            PostEntity,
            ArticleEntity,
            PageEntity,
            MenuEntity,
            MenuItemEntity,
            GalleryEntity,
            VideoEntity,
            ImageEntity,
            CollectionEntity,
            CollectionItemEntity,
            AuditLogEntity,
            ViewEventEntity,
            MediaAssetEntity,
            MediaVariantEntity,
            MediaReferenceEntity,
            SitemapSettingsEntity,
            SitemapTemplateEntity,
            SitemapOverrideEntity,
            SitemapCustomUrlEntity,
            SitemapUrlCheckEntity,
            ConsumerUserEntity,
            ConsumerEntitlementEntity,
          ],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([
      ApplicationEntity,
      AdminUserEntity,
      AdminUserApplicationEntity,
      PostEntity,
      ArticleEntity,
      PageEntity,
      MenuEntity,
      MenuItemEntity,
      GalleryEntity,
      VideoEntity,
      ImageEntity,
      CollectionEntity,
      CollectionItemEntity,
      AuditLogEntity,
      ViewEventEntity,
      MediaAssetEntity,
      MediaVariantEntity,
      MediaReferenceEntity,
      SitemapSettingsEntity,
      SitemapTemplateEntity,
      SitemapOverrideEntity,
      SitemapCustomUrlEntity,
      SitemapUrlCheckEntity,
      ConsumerUserEntity,
      ConsumerEntitlementEntity,
    ]),
  ],
  controllers: [
    AuthController,
    AdminAuthController,
    AdminApplicationController,
    AdminCollectionController,
    AdminAppCollectionController,
    AdminPostController,
    AdminArticleController,
    AdminPageController,
    AdminMenuController,
    AdminGalleryController,
    AdminVideoController,
    AdminImageController,
    AdminMediaController,
    AdminMediaLibraryController,
    AdminUserController,
    AdminAnalyticsController,
    DeliveryContentController,
    PublicMediaController,
    PublicSitemapController,
    PublicPageMenuController,
    AdminSitemapController,
    MediaGatewayController,
    MediaController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    JwtTokenService,
    ApplicationTokenService,
    PublicMediaUrlService,
    ApplicationTokenGuard,
    ApplicationHeaderService,
    AdminAuthorizationService,
    AuthService,
    AdminApplicationService,
    AdminCollectionService,
    AdminPostService,
    AdminArticleService,
    AdminPageService,
    AdminMenuService,
    AdminGalleryService,
    AdminVideoService,
    AdminImageService,
    AdminUserService,
    AdminAnalyticsService,
    DeliveryContentService,
    BaseUrlService,
    DomainPolicyService,
    AuditLogService,
    SeedDataService,
    InMemoryRateLimiterService,
    LoginProtectionService,
    ViewRateLimitService,
    AccessControlService,
    MinioService,
    MinioStorageProvider,
    MediaLibraryService,
    MediaVariantService,
    SitemapService,
    MediaReferenceService,
    MediaLifecycleService,
    { provide: 'STORAGE_PROVIDER', useExisting: MinioStorageProvider },
    ScheduledPublisherService,
  ],
})
export class AppModule {}
