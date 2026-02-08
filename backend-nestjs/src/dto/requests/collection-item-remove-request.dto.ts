import { IsIn, IsNotEmpty } from 'class-validator';
import { ContentType } from '../../common/content-type.enum';

export class CollectionItemRemoveRequestDto {
  @IsNotEmpty()
  contentId!: string;

  @IsNotEmpty()
  @IsIn([ContentType.POST, ContentType.ARTICLE, ContentType.VIDEO, ContentType.IMAGE])
  contentType!: ContentType;
}
