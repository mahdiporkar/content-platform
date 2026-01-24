import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminUserUpsertRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicationIds?: string[];
}
