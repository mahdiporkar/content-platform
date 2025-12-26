export class PageResponseDto<T> {
  constructor(
    public items: T[],
    public totalElements: number,
    public totalPages: number,
    public page: number,
    public size: number,
  ) {}
}