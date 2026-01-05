import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GalleryImageDto {
  @IsNotEmpty()
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  caption?: string;
}
