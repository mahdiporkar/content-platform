import { IsOptional, IsString, Length } from 'class-validator';

export class DemoSessionRequestDto {
  @IsString()
  @Length(2, 60)
  workspaceName!: string;

  @IsOptional()
  @IsString()
  @Length(2, 5)
  locale?: string;
}
