export class GalleryImageResponseDto {
  constructor(
    public url: string,
    public alt: string | null,
    public caption: string | null,
  ) {}
}
