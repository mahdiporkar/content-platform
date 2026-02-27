export class SitemapPreviewEntryResponseDto {
  constructor(
    public contentId: string | null,
    public contentType: string,
    public title: string | null,
    public finalUrl: string | null,
    public lastmod: string | null,
    public priority: number | null,
    public changefreq: string | null,
    public source: 'template' | 'override' | 'manual',
    public status: 'OK' | 'ERROR' | 'WARNING',
    public errors: string[],
    public duplicate: boolean,
  ) {}
}

