import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContentType } from '../../common/content-type.enum';

export class CollectionItemRemoveRequestDto {
  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsNotEmpty()
  contentId?: string;

  @IsOptional()
  @IsIn([ContentType.POST, ContentType.ARTICLE, ContentType.VIDEO, ContentType.GALLERY, ContentType.IMAGE])
  contentType?: ContentType;
}
