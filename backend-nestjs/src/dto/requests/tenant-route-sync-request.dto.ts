import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TenantRouteDefinitionDto {
  @IsNotEmpty()
  @IsString()
  key!: string;

  @IsNotEmpty()
  @IsString()
  path!: string;

  @IsObject()
  titles!: Record<string, string>;

  @IsOptional()
  @IsString()
  icon?: string | null;

  @IsOptional()
  @IsString()
  cssClass?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}

export class TenantRouteSyncRequestDto {
  @IsNotEmpty()
  @IsString()
  source!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TenantRouteDefinitionDto)
  routes!: TenantRouteDefinitionDto[];

  @IsOptional()
  @IsBoolean()
  replaceMissing?: boolean;
}
