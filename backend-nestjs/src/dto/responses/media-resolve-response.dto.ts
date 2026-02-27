export class MediaResolveResponseDto {
  constructor(
    public mediaId: string,
    public variantId: string,
    public resolvedPurpose: string,
    public resolvedSize: string | null,
    public resolvedDevice: string | null,
    public url: string,
    public width: number | null,
    public height: number | null,
    public duration: number | null,
    public fallbackUsed: boolean,
  ) {}
}
