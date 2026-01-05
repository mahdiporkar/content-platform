import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class SeoMetaDto {
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  @IsOptional()
  @IsBoolean()
  noFollow?: boolean;

  @IsOptional()
  @IsString()
  ogTitle?: string;

  @IsOptional()
  @IsString()
  ogDescription?: string;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsString()
  twitterTitle?: string;

  @IsOptional()
  @IsString()
  twitterDescription?: string;

  @IsOptional()
  @IsString()
  twitterImage?: string;

  @IsOptional()
  @IsString()
  schemaJsonLd?: string;
}
