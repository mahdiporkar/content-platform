export class ApplicationResponseDto {
  constructor(
    public id: string,
    public name: string,
    public description: string | null,
    public status: string,
    public rateLimitPolicy: Record<string, unknown> | null,
    public mediaPolicy: string,
    public allowedDomains: string[] | null,
    public apiToken: string | null,
    public tokenPreview: string | null,
    public tokenCreatedAt: string | null,
    public lastRotatedAt: string | null,
    public lastUsedAt: string | null,
    public websiteUrl: string | null,
    public publicBaseUrlOverride: string | null,
    public mediaBaseUrlOverride: string | null,
    public tags: string[] | null,
    public seo: Record<string, unknown> | null,
    public createdAt: string,
    public updatedAt: string,
  ) {}
}
