import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AdminApplicationService } from '../services/admin-application.service';
import { ApplicationUpsertRequestDto } from '../dto/requests/application-upsert-request.dto';
import { ApplicationResponseDto } from '../dto/responses/application-response.dto';

@Controller('/api/v1/admin/applications')
export class AdminApplicationController {
  constructor(private readonly applicationService: AdminApplicationService) {}

  @Get()
  async list(): Promise<ApplicationResponseDto[]> {
    return await this.applicationService.list();
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ApplicationResponseDto> {
    return await this.applicationService.getById(id);
  }

  @Post()
  async create(@Body() request: ApplicationUpsertRequestDto): Promise<ApplicationResponseDto> {
    return await this.applicationService.create(request);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() request: ApplicationUpsertRequestDto,
  ): Promise<ApplicationResponseDto> {
    return await this.applicationService.update(id, request);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.applicationService.remove(id);
    return { id };
  }
}
