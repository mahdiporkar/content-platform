import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ContentType } from '../../common/content-type.enum';

class CollectionReorderItemDto {
  @IsString()
  @IsOptional()
  contentId?: string;

  @IsString()
  @IsOptional()
  contentType?: ContentType;

  @IsString()
  @IsOptional()
  itemId?: string;

  @IsInt()
  @Min(1)
  position!: number;
}

export class CollectionReorderRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderedItemIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectionReorderItemDto)
  items?: CollectionReorderItemDto[];
}
