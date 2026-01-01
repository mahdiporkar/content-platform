import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApplicationUpsertRequestDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  websiteUrl?: string;
}
