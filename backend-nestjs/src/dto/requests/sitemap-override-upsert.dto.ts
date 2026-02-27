import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { SITEMAP_CHANGEFREQ_VALUES } from './sitemap-template-upsert.dto';

export class SitemapOverrideUpsertRequestDto {
  @IsOptional()
  @IsString()
  customUrl?: string;

  @IsOptional()
  @IsBoolean()
  excluded?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  priorityOverride?: number;

  @IsOptional()
  @IsIn(SITEMAP_CHANGEFREQ_VALUES)
  changefreqOverride?: string;
}

