export class AdminUserResponseDto {
  constructor(
    public id: string,
    public email: string,
    public role: string,
    public status: string,
    public applicationIds: string[],
  ) {}
}
