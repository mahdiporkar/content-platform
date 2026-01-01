export class ApplicationResponseDto {
  constructor(
    public id: string,
    public name: string,
    public websiteUrl: string | null,
  ) {}
}
