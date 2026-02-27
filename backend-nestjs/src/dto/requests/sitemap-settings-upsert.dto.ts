import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SitemapRegenStrategy } from '../../entities/sitemap-settings.entity';

export class SitemapSettingsUpsertRequestDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  sitemapPath?: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(86400)
  cacheTtlSeconds?: number;

  @IsOptional()
  @IsIn([
    SitemapRegenStrategy.ON_PUBLISH,
    SitemapRegenStrategy.SCHEDULED,
    SitemapRegenStrategy.MANUAL,
  ])
  regenStrategy?: SitemapRegenStrategy;
}

