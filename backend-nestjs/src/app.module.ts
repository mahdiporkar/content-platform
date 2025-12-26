import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { AdminPostController } from './controllers/admin-post.controller';
import { AdminArticleController } from './controllers/admin-article.controller';
import { AdminVideoController } from './controllers/admin-video.controller';
import { PublicContentController } from './controllers/public-content.controller';
import { AuthService } from './services/auth.service';
import { AdminPostService } from './services/admin-post.service';
import { AdminArticleService } from './services/admin-article.service';
import { AdminVideoService } from './services/admin-video.service';
import { PublicContentService } from './services/public-content.service';
import { ApplicationEntity } from './entities/application.entity';
import { AdminUserEntity } from './entities/admin-user.entity';
import { AdminUserApplicationEntity } from './entities/admin-user-application.entity';
import { PostEntity } from './entities/post.entity';
import { ArticleEntity } from './entities/article.entity';
import { VideoEntity } from './entities/video.entity';
import { JwtTokenService } from './auth/jwt-token.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { SeedDataService } from './services/seed-data.service';
import { MinioService } from './services/minio.service';
import { parseJdbcUrl } from './common/jdbc-url';

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
    ]),
  ],
  controllers: [
    AuthController,
    AdminPostController,
    AdminArticleController,
    AdminVideoController,
    PublicContentController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    JwtTokenService,
    AuthService,
    AdminPostService,
    AdminArticleService,
    AdminVideoService,
    PublicContentService,
    SeedDataService,
    MinioService,
  ],
})
export class AppModule {}