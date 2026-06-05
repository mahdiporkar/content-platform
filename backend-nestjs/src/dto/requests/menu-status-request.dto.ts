import { IsEnum } from 'class-validator';
import { MenuStatus } from '../../common/menu-types';

export class MenuStatusRequestDto {
  @IsEnum(MenuStatus)
  status!: MenuStatus;
}
