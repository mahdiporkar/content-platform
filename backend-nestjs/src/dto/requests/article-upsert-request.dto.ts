import { IsEnum, IsNotEmpty } from 'class-validator';
import { ContentStatus } from '../../common/content-status.enum';

export class ArticleUpsertRequestDto {
  @IsNotEmpty()
  applicationId!: string;

  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  slug!: string;

  @IsNotEmpty()
  content!: string;

  @IsEnum(ContentStatus)
  status!: ContentStatus;
}