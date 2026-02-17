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
  async list(@Req() request: Request): Promise<AdminUserResponseDto[]> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    return await this.adminUserService.list();
  }

  @Get(':id')
  async getById(@Req() request: Request, @Param('id') id: string): Promise<AdminUserResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    return await this.adminUserService.getById(id);
  }

  @Post()
  async create(
    @Req() request: Request,
    @Body() body: AdminUserUpsertRequestDto,
  ): Promise<AdminUserResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    return await this.adminUserService.create(body);
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: AdminUserUpsertRequestDto,
  ): Promise<AdminUserResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    return await this.adminUserService.update(id, body);
  }

  @Delete(':id')
  async remove(@Req() request: Request, @Param('id') id: string): Promise<{ id: string }> {
    this.access.assertSystemPermission(request, SystemPermission.USERS_MANAGE);
    await this.adminUserService.remove(id);
    return { id };
  }
}
