import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { GalleryImageDto } from './gallery-image.dto';
import { SeoMetaDto } from './seo-meta.dto';

export class ApplicationUpsertRequestDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

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
}
