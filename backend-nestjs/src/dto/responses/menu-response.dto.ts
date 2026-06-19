import { MenuItemTarget, MenuItemType, MenuLocation, MenuStatus } from '../../common/menu-types';

export class MenuItemResponseDto {
  constructor(
    public id: string,
    public menuId: string,
    public parentId: string | null,
    public title: string,
    public itemType: MenuItemType,
    public referenceId: string | null,
    public url: string | null,
    public target: MenuItemTarget,
    public icon: string | null,
    public cssClass: string | null,
    public sortOrder: number,
    public isVisible: boolean,
    public dynamic: boolean,
    public source: string | null,
    public sourceKey: string | null,
    public managedBy: 'TENANT' | 'CMS' | 'ADMIN',
    public children: MenuItemResponseDto[],
    public createdAt: string,
    public updatedAt: string,
  ) {}
}

export class MenuResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public code: string,
    public title: string,
    public location: MenuLocation,
    public languageCode: string,
    public status: MenuStatus,
    public items: MenuItemResponseDto[],
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
