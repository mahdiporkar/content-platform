import { IsIn, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ContentType } from '../../common/content-type.enum';

export class CollectionItemAddRequestDto {
  @IsNotEmpty()
  contentId!: string;

  @IsNotEmpty()
  @IsIn([ContentType.ARTICLE, ContentType.VIDEO, ContentType.IMAGE])
  contentType!: ContentType;

  @IsOptional()
  @IsNumber()
  position?: number;
}
