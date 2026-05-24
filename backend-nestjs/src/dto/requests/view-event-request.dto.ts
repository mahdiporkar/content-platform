import { IsIn, IsNotEmpty } from 'class-validator';
import { ContentType } from '../../common/content-type.enum';

export class ViewEventRequestDto {
  @IsNotEmpty()
  contentId!: string;

  @IsNotEmpty()
  @IsIn([ContentType.ARTICLE, ContentType.VIDEO, ContentType.GALLERY, ContentType.IMAGE])
  contentType!: ContentType;
}
