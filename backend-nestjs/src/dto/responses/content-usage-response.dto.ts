import { MediaReferenceType } from '../../entities/media-reference.entity';

export class ContentUsageResponseDto {
  constructor(
    public refType: MediaReferenceType,
    public refId: string,
    public refField: string,
    public title: string | null,
    public routePath: string | null,
    public createdAt: string,
  ) {}
}

