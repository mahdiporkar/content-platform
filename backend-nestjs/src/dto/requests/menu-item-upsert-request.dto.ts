import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { MenuItemTarget, MenuItemType } from '../../common/menu-types';

export class MenuItemUpsertRequestDto {
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsNotEmpty()
  title!: string;

  @IsEnum(MenuItemType)
  itemType!: MenuItemType;

  @IsOptional()
  @IsString()
  referenceId?: string | null;

  @IsOptional()
  @IsString()
  url?: string | null;

  @IsEnum(MenuItemTarget)
  target!: MenuItemTarget;

  @IsOptional()
  @IsString()
  icon?: string | null;

  @IsOptional()
  @IsString()
  cssClass?: string | null;

  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
