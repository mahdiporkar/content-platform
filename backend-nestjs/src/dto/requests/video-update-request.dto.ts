import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ContentStatus } from '../../common/content-status.enum';
import { SUPPORTED_CONTENT_LOCALES } from '../../common/content-locale.constants';
import { GalleryImageDto } from './gallery-image.dto';
import { SeoMetaDto } from './seo-meta.dto';

export class VideoUpdateRequestDto {
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_CONTENT_LOCALES)
  locale?: string;

  @IsOptional()
  @IsString()
  posterKey?: string;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  altText?: string;

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
