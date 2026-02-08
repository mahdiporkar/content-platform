export class CollectionResponseDto {
  constructor(
    public id: string,
    public applicationId: string,
    public slug: string,
    public title: string,
    public description: string | null,
    public allowedTypes: string[] | null,
    public maxItems: number | null,
    public isPublic: boolean,
    public itemsCount: number,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
