import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SitemapService } from '../services/sitemap.service';

@Controller('/public/:tenant')
export class PublicSitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async sitemapIndex(@Param('tenant') tenant: string, @Res() response: Response): Promise<void> {
    const resolved = await this.sitemapService.getPublicSitemapXml(tenant);
    response.send(resolved.xml);
  }

  @Get('sitemap-:type-:index.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async sitemapChunk(
    @Param('tenant') tenant: string,
    @Param('type') type: string,
    @Param('index') index: string,
    @Res() response: Response,
  ): Promise<void> {
    const resolved = await this.sitemapService.getPublicSitemapXml(tenant, type, Number(index));
    response.send(resolved.xml);
  }
}

