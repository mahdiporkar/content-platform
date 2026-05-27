import { IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ContentType } from '../../common/content-type.enum';
import {
  CollectionItemDisplay,
  CollectionItemLink,
  CollectionItemMetadata,
  CollectionItemType,
} from '../../common/collection-types';

export class CollectionItemAddRequestDto {
  @IsOptional()
  @IsString()
  contentId?: string | null;

  @IsOptional()
  @IsIn([ContentType.POST, ContentType.ARTICLE, ContentType.VIDEO, ContentType.GALLERY, ContentType.IMAGE])
  contentType?: ContentType | null;

  @IsOptional()
  @IsIn([CollectionItemType.CONTENT, CollectionItemType.CUSTOM])
  type?: CollectionItemType;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsObject()
  display?: CollectionItemDisplay | null;

  @IsOptional()
  @IsObject()
  link?: CollectionItemLink | null;

  @IsOptional()
  @IsObject()
  metadata?: CollectionItemMetadata | null;
}
