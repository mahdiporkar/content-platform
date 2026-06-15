import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminUserService } from '../services/admin-user.service';
import { AdminUserUpsertRequestDto } from '../dto/requests/admin-user-upsert-request.dto';
import { AdminUserResponseDto } from '../dto/responses/admin-user-response.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { SystemPermission } from '../auth/admin-permissions';

@Controller('/api/v1/admin/users')
export class AdminUserController {
  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly access: AdminAuthorizationService,
  ) {}

  @Get()
  async list(
    @Req() request: Request,
  ): Promise<AdminUserResponseDto[]> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    const scope = {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    };
    const applicationId = scope.superAdmin ? undefined : this.access.getApplicationId(request);
    return await this.adminUserService.list({
      actor: scope.actor,
      superAdmin: scope.superAdmin,
    }, applicationId);
  }

  @Get(':id')
  async getById(@Req() request: Request, @Param('id') id: string): Promise<AdminUserResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    return await this.adminUserService.getById(id, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Post()
  async create(
    @Req() request: Request,
    @Body() body: AdminUserUpsertRequestDto,
  ): Promise<AdminUserResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    return await this.adminUserService.create(body, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: AdminUserUpsertRequestDto,
  ): Promise<AdminUserResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    return await this.adminUserService.update(id, body, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Post(':id/sessions/rotate')
  async rotateSessions(@Req() request: Request, @Param('id') id: string): Promise<AdminUserResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    return await this.adminUserService.rotateSessions(id, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Delete(':id')
  async remove(@Req() request: Request, @Param('id') id: string): Promise<{ id: string }> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    await this.adminUserService.remove(id, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
    return { id };
  }
}
