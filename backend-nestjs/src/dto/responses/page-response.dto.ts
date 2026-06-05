import { ContentStatus } from '../../common/content-status.enum';

export class PageContentResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public title: string,
    public slug: string,
    public content: string,
    public html: string | null,
    public coverImage: string | null,
    public languageCode: string,
    public status: ContentStatus,
    public seoTitle: string | null,
    public seoDescription: string | null,
    public seoKeywords: string[] | null,
    public parentId: string | null,
    public sortOrder: number | null,
    public showInMenu: boolean,
    public publishedAt: string | null,
    public createdBy: string | null,
    public updatedBy: string | null,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
