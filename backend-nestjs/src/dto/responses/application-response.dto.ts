export class ApplicationResponseDto {
  constructor(
    public id: string,
    public name: string,
    public websiteUrl: string | null,
    public tags: string[] | null,
    public seo: Record<string, unknown> | null,
    public gallery: Record<string, unknown>[] | null,
  ) {}
}
