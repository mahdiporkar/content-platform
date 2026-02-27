import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { SitemapLastmodPolicy } from '../../entities/sitemap-template.entity';

export const SITEMAP_CHANGEFREQ_VALUES = [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
] as const;

export class SitemapTemplateUpsertRequestDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsIn([SitemapLastmodPolicy.UPDATED_AT, SitemapLastmodPolicy.PUBLISHED_AT])
  lastmodPolicy?: SitemapLastmodPolicy;

  @IsOptional()
  @IsIn(SITEMAP_CHANGEFREQ_VALUES)
  defaultChangefreq?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  defaultPriority?: number;
}

