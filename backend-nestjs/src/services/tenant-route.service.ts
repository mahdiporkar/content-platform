import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TenantRouteSyncRequestDto } from '../dto/requests/tenant-route-sync-request.dto';
import { ApplicationEntity } from '../entities/application.entity';
import { TenantRouteEntity, TenantRouteStatus } from '../entities/tenant-route.entity';

@Injectable()
export class TenantRouteService {
  constructor(
    @InjectRepository(TenantRouteEntity)
    private readonly routeRepo: Repository<TenantRouteEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
  ) {}

  async syncByApplicationId(applicationId: string, request: TenantRouteSyncRequestDto) {
    const application = await this.applicationRepo.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new BadRequestException('Application not found.');
    }
    return this.sync(application, request);
  }

  async listByApplicationId(applicationId: string): Promise<TenantRouteEntity[]> {
    return this.routeRepo.find({
      where: { applicationId },
      order: { source: 'ASC', routeKey: 'ASC' },
    });
  }

  async sync(application: ApplicationEntity, request: TenantRouteSyncRequestDto) {
    const source = request.source.trim();
    const keys = new Set<string>();
    const now = new Date();
    const existing = await this.routeRepo.find({ where: { applicationId: application.id, source } });
    const byKey = new Map(existing.map((route) => [route.routeKey, route]));

    for (const definition of request.routes) {
      const key = definition.key.trim();
      const path = definition.path.trim();
      const titles = Object.fromEntries(
        Object.entries(definition.titles || {})
          .map(([locale, title]) => [locale.trim(), title.trim()])
          .filter(([locale, title]) => Boolean(locale && title)),
      );
      if (!key || keys.has(key)) {
        throw new BadRequestException(`Route keys must be unique and non-empty: ${key || '(empty)'}.`);
      }
      if (!path.startsWith('/')) {
        throw new BadRequestException(`Route path must start with "/": ${key}.`);
      }
      if (Object.keys(titles).length === 0) {
        throw new BadRequestException(`At least one localized title is required: ${key}.`);
      }
      keys.add(key);

      const route = byKey.get(key) ?? this.routeRepo.create({
        id: uuidv4(),
        applicationId: application.id,
        source,
        routeKey: key,
      });
      route.pathTemplate = path;
      route.titles = titles;
      route.status = TenantRouteStatus.AVAILABLE;
      route.icon = definition.icon?.trim() || null;
      route.cssClass = definition.cssClass?.trim() || null;
      route.metadata = definition.metadata ?? null;
      route.lastSyncedAt = now;
      await this.routeRepo.save(route);
    }

    let unavailable = 0;
    if (request.replaceMissing !== false) {
      for (const route of existing.filter((entry) => !keys.has(entry.routeKey))) {
        route.status = TenantRouteStatus.UNAVAILABLE;
        route.lastSyncedAt = now;
        await this.routeRepo.save(route);
        unavailable += 1;
      }
    }

    return {
      applicationId: application.id,
      source,
      synchronized: keys.size,
      unavailable,
      synchronizedAt: now.toISOString(),
    };
  }
}
