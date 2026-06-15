import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminApplicationService } from '../services/admin-application.service';
import { ApplicationUpsertRequestDto } from '../dto/requests/application-upsert-request.dto';
import { ApplicationResponseDto } from '../dto/responses/application-response.dto';
import { AdminAuthorizationService } from '../auth/admin-authorization.service';
import { SystemPermission } from '../auth/admin-permissions';

@Controller('/api/v1/admin/applications')
export class AdminApplicationController {
  constructor(
    private readonly applicationService: AdminApplicationService,
    private readonly access: AdminAuthorizationService,
  ) {}

  @Get()
  async list(@Req() request: Request): Promise<ApplicationResponseDto[]> {
    this.access.assertSystemPermission(request, SystemPermission.APPLICATIONS_MANAGE);
    return await this.applicationService.list({
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Get(':id')
  async getById(@Req() request: Request, @Param('id') id: string): Promise<ApplicationResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.APPLICATIONS_MANAGE);
    return await this.applicationService.getById(id, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Post()
  async create(
    @Req() request: Request,
    @Body() body: ApplicationUpsertRequestDto,
  ): Promise<ApplicationResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.APPLICATIONS_MANAGE);
    return await this.applicationService.create(body, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Put(':id')
  async update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() body: ApplicationUpsertRequestDto,
  ): Promise<ApplicationResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.APPLICATIONS_MANAGE);
    return await this.applicationService.update(id, body, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Post(':id/token/rotate')
  async rotateToken(@Req() request: Request, @Param('id') id: string): Promise<ApplicationResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.APPLICATIONS_MANAGE);
    return await this.applicationService.rotateToken(id, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Post(':id/token/revoke')
  async revokeToken(@Req() request: Request, @Param('id') id: string): Promise<ApplicationResponseDto> {
    this.access.assertSystemPermission(request, SystemPermission.APPLICATIONS_MANAGE);
    return await this.applicationService.revokeToken(id, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
  }

  @Delete(':id')
  async remove(@Req() request: Request, @Param('id') id: string): Promise<{ id: string }> {
    this.access.assertSystemPermission(request, SystemPermission.APPLICATIONS_MANAGE);
    await this.applicationService.remove(id, {
      actor: this.access.getUser(request),
      superAdmin: this.access.isSuperAdmin(request),
    });
    return { id };
  }
}
