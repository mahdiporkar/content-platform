export class SitemapTestUrlResponseDto {
  constructor(
    public ok: boolean,
    public httpStatus: number | null,
    public errorMessage: string | null,
  ) {}
}

