import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtPayload } from './jwt-token.service';
import { AdminUserRole } from '../entities/admin-user.entity';
import { ServicePermission, SystemPermission } from './admin-permissions';

@Injectable()
export class AdminAuthorizationService {
  getUser(request: Request): JwtPayload {
    const user = (request as Request & { user?: JwtPayload }).user;
    if (!user) {
      throw new UnauthorizedException('Missing authenticated user.');
    }
    return user;
  }

  isSuperAdmin(request: Request): boolean {
    return this.getUser(request).role === AdminUserRole.SUPER_ADMIN;
  }

  assertSuperAdmin(request: Request): void {
    if (!this.isSuperAdmin(request)) {
      throw new ForbiddenException('Only super admins can perform this action.');
    }
  }

  assertSystemPermission(request: Request, permission: SystemPermission): void {
    if (this.isSuperAdmin(request)) {
      return;
    }
    const user = this.getUser(request);
    const permissions = user.systemPermissions || [];
    if (!permissions.includes(permission)) {
      throw new ForbiddenException('You do not have system-level permission for this action.');
    }
  }

  assertServicePermission(request: Request, permission: ServicePermission): void {
    if (this.isSuperAdmin(request)) {
      return;
    }
    const user = this.getUser(request);
    const permissions = user.servicePermissions || [];
    if (!permissions.includes(permission)) {
      throw new ForbiddenException('You do not have service-level permission for this action.');
    }
  }

  assertAnyServicePermission(request: Request, permissions: ServicePermission[]): void {
    if (this.isSuperAdmin(request)) {
      return;
    }
    const user = this.getUser(request);
    const current = new Set(user.servicePermissions || []);
    const hasAny = permissions.some((permission) => current.has(permission));
    if (!hasAny) {
      throw new ForbiddenException('You do not have service-level permission for this action.');
    }
  }

  assertApplicationAccess(request: Request, applicationId: string): void {
    if (this.isSuperAdmin(request)) {
      return;
    }
    const user = this.getUser(request);
    const allowed = new Set((user.applicationIds || []).map((entry) => entry.trim()).filter(Boolean));
    if (!applicationId || !allowed.has(applicationId)) {
      throw new ForbiddenException('You do not have access to this application.');
    }
  }

  getApplicationId(request: Request): string {
    const headerValue = request.headers['x-application-id'];
    const headerApplicationId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const queryApplicationId = request.query?.applicationId;
    const bodyApplicationId = (request.body as { applicationId?: string } | undefined)?.applicationId;
    const applicationId =
      headerApplicationId ||
      bodyApplicationId ||
      (Array.isArray(queryApplicationId) ? queryApplicationId[0] : queryApplicationId);
    if (!applicationId || typeof applicationId !== 'string' || !applicationId.trim()) {
      throw new BadRequestException('Application id is required.');
    }
    return applicationId.trim();
  }

  withApplicationId<T extends object>(request: Request, body: T): T & { applicationId: string } {
    return {
      ...body,
      applicationId: this.getApplicationId(request),
    };
  }

  assertServiceAccess(
    request: Request,
    permission: ServicePermission,
    applicationId: string,
  ): void {
    this.assertServicePermission(request, permission);
    this.assertApplicationAccess(request, applicationId);
  }
}
