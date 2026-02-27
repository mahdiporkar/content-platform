import { IsNotEmpty, IsString } from 'class-validator';

export class SitemapTestUrlRequestDto {
  @IsString()
  @IsNotEmpty()
  url!: string;
}

