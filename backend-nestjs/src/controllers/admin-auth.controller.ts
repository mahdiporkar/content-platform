import { Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { AdminUserService } from '../services/admin-user.service';

@Controller('/api/v1/admin/auth')
export class AdminAuthController {
  constructor(
    private readonly access: AdminAuthorizationService,
    private readonly adminUserService: AdminUserService,
  ) {}

  @Post('logout')
  async logout(@Req() request: Request): Promise<{ ok: boolean }> {
    const user = this.access.getUser(request);
    await this.adminUserService.rotateSessions(user.sub);
    return { ok: true };
  }
}
