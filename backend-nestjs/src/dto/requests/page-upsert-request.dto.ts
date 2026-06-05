import { IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ContentStatus } from '../../common/content-status.enum';
import { SUPPORTED_CONTENT_LOCALES } from '../../common/content-locale.constants';

export class PageUpsertRequestDto {
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
  coverImage?: string;

  @IsString()
  @IsIn(SUPPORTED_CONTENT_LOCALES)
  languageCode!: string;

  @IsEnum(ContentStatus)
  status!: ContentStatus;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number | null;

  @IsOptional()
  @IsBoolean()
  showInMenu?: boolean;
}
