import { IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ContentType } from '../../common/content-type.enum';
import { SUPPORTED_CONTENT_LOCALES } from '../../common/content-locale.constants';
import {
  CollectionAudience,
  CollectionFallback,
  CollectionMetadata,
  CollectionPlacement,
  CollectionPresentation,
  CollectionStatus,
} from '../../common/collection-types';

export class CollectionUpsertRequestDto {
  @IsOptional()
  @IsNotEmpty()
  applicationId!: string;

  @IsOptional()
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_CONTENT_LOCALES)
  locale?: string;

  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ContentType, { each: true })
  allowedTypes?: ContentType[];

  @IsOptional()
  @IsInt()
  @Min(1)
  maxItems?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsEnum(CollectionStatus)
  status?: CollectionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsObject()
  presentation?: CollectionPresentation | null;

  @IsOptional()
  @IsObject()
  placement?: CollectionPlacement | null;

  @IsOptional()
  @IsObject()
  fallback?: CollectionFallback | null;

  @IsOptional()
  @IsObject()
  audience?: CollectionAudience | null;

  @IsOptional()
  @IsObject()
  metadata?: CollectionMetadata | null;
}
