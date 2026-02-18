import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { AdminApplicationController } from './controllers/admin-application.controller';
import { AdminPostController } from './controllers/admin-post.controller';
import { AdminArticleController } from './controllers/admin-article.controller';
import { AdminVideoController } from './controllers/admin-video.controller';
import { AdminMediaController } from './controllers/admin-media.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { AdminCollectionController } from './controllers/admin-collection.controller';
import { AdminAppCollectionController } from './controllers/admin-app-collection.controller';
import { AdminImageController } from './controllers/admin-image.controller';
import { AdminAnalyticsController } from './controllers/admin-analytics.controller';
import { DeliveryContentController } from './controllers/delivery-content.controller';
import { MediaGatewayController } from './controllers/media-gateway.controller';
import { AuthService } from './services/auth.service';
import { AdminApplicationService } from './services/admin-application.service';
import { AdminPostService } from './services/admin-post.service';
import { AdminArticleService } from './services/admin-article.service';
import { AdminVideoService } from './services/admin-video.service';
import { AdminImageService } from './services/admin-image.service';
import { AdminUserService } from './services/admin-user.service';
import { ApplicationEntity } from './entities/application.entity';
import { AdminUserEntity } from './entities/admin-user.entity';
import { AdminUserApplicationEntity } from './entities/admin-user-application.entity';
import { PostEntity } from './entities/post.entity';
import { ArticleEntity } from './entities/article.entity';
import { VideoEntity } from './entities/video.entity';
import { ImageEntity } from './entities/image.entity';
import { CollectionEntity } from './entities/collection.entity';
import { CollectionItemEntity } from './entities/collection-item.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { ViewEventEntity } from './entities/view-event.entity';
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
            VideoEntity,
            ImageEntity,
            CollectionEntity,
            CollectionItemEntity,
            AuditLogEntity,
            ViewEventEntity,
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
      VideoEntity,
      ImageEntity,
      CollectionEntity,
      CollectionItemEntity,
      AuditLogEntity,
      ViewEventEntity,
    ]),
  ],
  controllers: [
    AuthController,
    AdminApplicationController,
    AdminCollectionController,
    AdminAppCollectionController,
    AdminPostController,
    AdminArticleController,
    AdminVideoController,
    AdminImageController,
    AdminMediaController,
    AdminUserController,
    AdminAnalyticsController,
    DeliveryContentController,
    MediaGatewayController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    JwtTokenService,
    ApplicationTokenGuard,
    AdminAuthorizationService,
    AuthService,
    AdminApplicationService,
    AdminCollectionService,
    AdminPostService,
    AdminArticleService,
    AdminVideoService,
    AdminImageService,
    AdminUserService,
    AdminAnalyticsService,
    DeliveryContentService,
    BaseUrlService,
    DomainPolicyService,
    AuditLogService,
    SeedDataService,
    MinioService,
  ],
})
export class AppModule {}
