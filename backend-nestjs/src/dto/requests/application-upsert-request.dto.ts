import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SeoMetaDto } from './seo-meta.dto';
import { ApplicationStatus, MediaPolicy } from '../../entities/application.entity';

export class ApplicationUpsertRequestDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn([ApplicationStatus.ACTIVE, ApplicationStatus.SUSPENDED])
  status?: ApplicationStatus;

  @IsOptional()
  @IsObject()
  rateLimitPolicy?: Record<string, unknown>;

  @IsOptional()
  @IsIn([MediaPolicy.PUBLIC_VIA_GATEWAY, MediaPolicy.DOMAIN_LOCKED, MediaPolicy.JWT_REQUIRED])
  mediaPolicy?: MediaPolicy;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @IsOptional()
  @IsString()
  apiToken?: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  publicBaseUrlOverride?: string;

  @IsOptional()
  @IsString()
  mediaBaseUrlOverride?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoMetaDto)
  seo?: SeoMetaDto;

}
