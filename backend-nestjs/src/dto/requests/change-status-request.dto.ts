import { IsEnum, IsNotEmpty } from 'class-validator';
import { ContentStatus } from '../../common/content-status.enum';

export class ChangeStatusRequestDto {
  @IsNotEmpty()
  applicationId!: string;

  @IsEnum(ContentStatus)
  status!: ContentStatus;
}