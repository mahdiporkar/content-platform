export class AdminUserResponseDto {
  constructor(
    public id: string,
    public email: string,
    public applicationIds: string[],
  ) {}
}
