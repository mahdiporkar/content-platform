import { IsArray, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AdminUserRole, AdminUserStatus } from '../../entities/admin-user.entity';

export class AdminUserUpsertRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsIn([AdminUserRole.SUPER_ADMIN, AdminUserRole.EDITOR, AdminUserRole.PUBLISHER])
  role?: AdminUserRole;

  @IsOptional()
  @IsIn([AdminUserStatus.ACTIVE, AdminUserStatus.SUSPENDED])
  status?: AdminUserStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicationIds?: string[];
}
