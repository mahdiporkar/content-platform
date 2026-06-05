import { IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MenuItemLayoutRequestDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class MenuItemsLayoutRequestDto {
  @ValidateNested({ each: true })
  @Type(() => MenuItemLayoutRequestDto)
  items!: MenuItemLayoutRequestDto[];
}
