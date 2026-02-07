import { DeliveryContentResponseDto } from './delivery-content-response.dto';

export class DeliveryCollectionResponseDto {
  constructor(
    public id: string,
    public appId: string,
    public slug: string,
    public title: string,
    public description: string | null,
    public allowedTypes: string[] | null,
    public maxItems: number | null,
    public items: DeliveryContentResponseDto[],
  ) {}
}
