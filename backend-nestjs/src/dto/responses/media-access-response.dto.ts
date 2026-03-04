export class MediaAccessResponseDto {
  constructor(
    public mediaId: string,
    public url: string,
    public signed: boolean,
    public expiresAt: string | null,
  ) {}
}
