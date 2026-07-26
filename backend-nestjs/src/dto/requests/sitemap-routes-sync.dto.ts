import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SITEMAP_CHANGEFREQ_VALUES } from './sitemap-template-upsert.dto';

export class SitemapRouteSyncItemDto {
  @IsString()
  @MaxLength(1024)
  @Matches(/^\/(?!\/)/, { message: 'path must be a root-relative path' })
  path!: string;

  @IsOptional()
  @IsString()
  @MaxLength(480)
  key?: string;

  @IsOptional()
  @IsString()
  lastModified?: string;

  @IsOptional()
  @IsIn(SITEMAP_CHANGEFREQ_VALUES)
  changefreq?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  priority?: number;
}

export class SitemapRoutesSyncDto {
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9._-]{0,63}$/i)
  source!: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  baseUrl?: string;

  @IsArray()
  @ArrayMaxSize(10000)
  @ValidateNested({ each: true })
  @Type(() => SitemapRouteSyncItemDto)
  routes!: SitemapRouteSyncItemDto[];
}
