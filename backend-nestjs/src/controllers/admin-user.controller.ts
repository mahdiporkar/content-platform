import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import { AdminUserUpsertRequestDto } from '../dto/requests/admin-user-upsert-request.dto';
import { AdminUserResponseDto } from '../dto/responses/admin-user-response.dto';

@Controller('/api/v1/admin/users')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async list(): Promise<AdminUserResponseDto[]> {
    return await this.adminUserService.list();
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<AdminUserResponseDto> {
    return await this.adminUserService.getById(id);
  }

  @Post()
  async create(@Body() request: AdminUserUpsertRequestDto): Promise<AdminUserResponseDto> {
    return await this.adminUserService.create(request);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() request: AdminUserUpsertRequestDto,
  ): Promise<AdminUserResponseDto> {
    return await this.adminUserService.update(id, request);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.adminUserService.remove(id);
    return { id };
  }
}
