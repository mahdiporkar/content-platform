import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ContentType } from '../../common/content-type.enum';

export class CollectionUpsertRequestDto {
  @IsOptional()
  @IsNotEmpty()
  applicationId!: string;

  @IsOptional()
  @IsString()
  slug!: string;

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
  @IsNumber()
  maxItems?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
