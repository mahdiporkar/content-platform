import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApplicationTokenGuard } from '../auth/application-token.guard';
import { ApplicationEntity } from '../entities/application.entity';
import { DomainPolicyService } from '../services/domain-policy.service';
import { MediaVariantService } from '../services/media-variant.service';
import { MediaResolveResponseDto } from '../dto/responses/media-resolve-response.dto';
import { MediaWithVariantsResponseDto } from '../dto/responses/media-with-variants-response.dto';

@Controller('/api/public/media')
@UseGuards(ApplicationTokenGuard)
export class PublicMediaController {
  constructor(
    private readonly mediaVariantService: MediaVariantService,
    private readonly domainPolicy: DomainPolicyService,
  ) {}

  @Get(':mediaId')
  async getMedia(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('mediaId') mediaId: string,
  ): Promise<MediaWithVariantsResponseDto> {
    const application = request.application as ApplicationEntity;
    if (this.domainPolicy.hasOriginSignal(request)) {
      this.domainPolicy.ensureAllowed(application, request);
    }
    return await this.mediaVariantService.getMediaWithVariants(application.id, mediaId);
  }

  @Get(':mediaId/resolve')
  async resolveMedia(
    @Req() request: Request & { application?: ApplicationEntity },
    @Param('mediaId') mediaId: string,
    @Query('purpose') purpose?: string,
    @Query('size') size?: string,
    @Query('viewportWidth') viewportWidth?: string,
    @Query('device') device?: string,
    @Query('format') format?: string,
  ): Promise<MediaResolveResponseDto> {
    const application = request.application as ApplicationEntity;
    if (this.domainPolicy.hasOriginSignal(request)) {
      this.domainPolicy.ensureAllowed(application, request);
    }
    return await this.mediaVariantService.resolveVariant(application.id, mediaId, {
      purpose,
      size,
      viewportWidth: viewportWidth ? Number(viewportWidth) : undefined,
      device,
      format,
    });
  }
}
