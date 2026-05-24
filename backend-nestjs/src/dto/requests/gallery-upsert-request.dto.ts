import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ContentStatus } from '../../common/content-status.enum';
import { SUPPORTED_CONTENT_LOCALES } from '../../common/content-locale.constants';
import { GalleryImageDto } from './gallery-image.dto';
import { SeoMetaDto } from './seo-meta.dto';

export class GalleryUpsertRequestDto {
  @IsNotEmpty()
  applicationId!: string;

  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  slug!: string;

  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_CONTENT_LOCALES)
  locale?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoMetaDto)
  seo?: SeoMetaDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GalleryImageDto)
  gallery?: GalleryImageDto[];

  @IsEnum(ContentStatus)
  status!: ContentStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
