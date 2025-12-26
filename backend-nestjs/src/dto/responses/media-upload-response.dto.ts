export class MediaUploadResponseDto {
  constructor(
    public objectKey: string,
    public contentType: string,
    public sizeBytes: number,
    public url: string,
  ) {}
}
