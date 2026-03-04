import { IsOptional, IsString } from 'class-validator';

export class MediaAccessRequestDto {
  @IsOptional()
  @IsString()
  userId?: string;
}
