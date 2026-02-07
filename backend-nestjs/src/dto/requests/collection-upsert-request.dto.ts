import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CollectionUpsertRequestDto {
  @IsNotEmpty()
  applicationId!: string;

  @IsNotEmpty()
  slug!: string;

  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedTypes?: string[];

  @IsOptional()
  @IsNumber()
  maxItems?: number;
}
