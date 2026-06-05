import { IsEnum, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { SUPPORTED_CONTENT_LOCALES } from '../../common/content-locale.constants';
import { MenuLocation, MenuStatus } from '../../common/menu-types';

export class MenuUpsertRequestDto {
  @IsNotEmpty()
  applicationId!: string;

  @IsNotEmpty()
  code!: string;

  @IsNotEmpty()
  title!: string;

  @IsEnum(MenuLocation)
  location!: MenuLocation;

  @IsString()
  @IsIn(SUPPORTED_CONTENT_LOCALES)
  languageCode!: string;

  @IsEnum(MenuStatus)
  status!: MenuStatus;
}
