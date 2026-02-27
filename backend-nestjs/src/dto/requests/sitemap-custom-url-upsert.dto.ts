import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { SitemapLastmodMode } from '../../entities/sitemap-custom-url.entity';
import { SITEMAP_CHANGEFREQ_VALUES } from './sitemap-template-upsert.dto';

export class SitemapCustomUrlUpsertRequestDto {
  @IsString()
  pathOrUrl!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn([SitemapLastmodMode.NOW, SitemapLastmodMode.FIXED_DATE, SitemapLastmodMode.NONE])
  lastmodMode?: SitemapLastmodMode;

  @IsOptional()
  @IsString()
  lastmodValue?: string;

  @IsOptional()
  @IsIn(SITEMAP_CHANGEFREQ_VALUES)
  changefreq?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  priority?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

