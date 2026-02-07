import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CollectionReorderRequestDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  orderedItemIds!: string[];
}
