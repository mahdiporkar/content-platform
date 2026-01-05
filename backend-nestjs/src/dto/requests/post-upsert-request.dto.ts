import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ContentStatus } from '../../common/content-status.enum';
import { GalleryImageDto } from './gallery-image.dto';
import { SeoMetaDto } from './seo-meta.dto';

export class PostUpsertRequestDto {
  @IsNotEmpty()
  applicationId!: string;

  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  slug!: string;

  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

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
}
