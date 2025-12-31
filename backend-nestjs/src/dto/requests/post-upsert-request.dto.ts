import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContentStatus } from '../../common/content-status.enum';

export class PostUpsertRequestDto {
  @IsNotEmpty()
  applicationId!: string;

  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  slug!: string;

  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsEnum(ContentStatus)
  status!: ContentStatus;
}
