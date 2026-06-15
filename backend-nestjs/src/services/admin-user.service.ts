import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { AdminUserEntity, AdminUserRole, AdminUserStatus } from '../entities/admin-user.entity';
import { AdminUserApplicationEntity } from '../entities/admin-user-application.entity';
import { AdminUserUpsertRequestDto } from '../dto/requests/admin-user-upsert-request.dto';
import { AdminUserResponseDto } from '../dto/responses/admin-user-response.dto';
import {
  normalizeServicePermissions,
  normalizeSystemPermissions,
  ServicePermission,
  SystemPermission,
} from '../auth/admin-permissions';
import { JwtPayload } from '../auth/jwt-token.service';

type UserScope = {
  actor: JwtPayload;
  superAdmin: boolean;
};

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminUserRepo: Repository<AdminUserEntity>,
    @InjectRepository(AdminUserApplicationEntity)
    private readonly adminUserApplicationRepo: Repository<AdminUserApplicationEntity>,
  ) {}

  private mapUser(user: AdminUserEntity): AdminUserResponseDto {
    const applicationIds = (user.applications || []).map((entry) => entry.applicationId);
    const role = user.role ?? AdminUserRole.SYSTEM_ADMIN;
    const systemPermissions = normalizeSystemPermissions(role, user.systemPermissions);
    const servicePermissions = normalizeServicePermissions(role, user.servicePermissions);
    return new AdminUserResponseDto(
      user.id,
      user.email,
      role,
      user.status ?? AdminUserStatus.ACTIVE,
      applicationIds,
      systemPermissions,
      servicePermissions,
    );
  }

  async list(scope: UserScope, applicationId?: string): Promise<AdminUserResponseDto[]> {
    const scopedApplicationId = this.resolveApplicationIdForRead(scope, applicationId);
    const users = await this.adminUserRepo.find({ order: { email: 'ASC' } });
    return users
      .filter((user) => this.canManageUser(scope, user, scopedApplicationId))
      .map((user) => this.mapUser(user));
  }

  async getById(id: string, scope: UserScope): Promise<AdminUserResponseDto> {
    const user = await this.adminUserRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Admin user not found.');
    }
    this.assertCanManageUser(scope, user);
    return this.mapUser(user);
  }

  async create(request: AdminUserUpsertRequestDto, scope: UserScope): Promise<AdminUserResponseDto> {
    const email = request.email.trim().toLowerCase();
    const existing = await this.adminUserRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already in use.');
    }
    if (!request.password?.trim()) {
      throw new BadRequestException('Password is required.');
    }
    this.assertAllowedRole(scope, request.role ?? AdminUserRole.SYSTEM_ADMIN);
    this.assertAllowedPermissions(scope, request.systemPermissions, request.servicePermissions);
    const applicationIds = this.resolveApplicationIdsForWrite(scope, request.applicationIds);

    const passwordHash = await bcrypt.hash(request.password.trim(), 10);
    const user = this.adminUserRepo.create({
      id: uuidv4(),
      email,
      passwordHash,
      role: request.role ?? AdminUserRole.SYSTEM_ADMIN,
      status: request.status ?? AdminUserStatus.ACTIVE,
      tokenVersion: 1,
      systemPermissions: normalizeSystemPermissions(
        request.role ?? AdminUserRole.SYSTEM_ADMIN,
        request.systemPermissions,
      ),
      servicePermissions: normalizeServicePermissions(
        request.role ?? AdminUserRole.SYSTEM_ADMIN,
        request.servicePermissions,
      ),
      applications: [],
    });
    await this.adminUserRepo.save(user);

    await this.replaceApplications(user.id, applicationIds);

    const saved = await this.adminUserRepo.findOne({ where: { id: user.id } });
    if (!saved) {
      throw new NotFoundException('Admin user not found.');
    }
    return this.mapUser(saved);
  }

  async update(id: string, request: AdminUserUpsertRequestDto, scope: UserScope): Promise<AdminUserResponseDto> {
    const user = await this.adminUserRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Admin user not found.');
    }
    this.assertCanManageUser(scope, user);
    this.assertAllowedRole(scope, request.role ?? user.role ?? AdminUserRole.SYSTEM_ADMIN);
    this.assertAllowedPermissions(scope, request.systemPermissions, request.servicePermissions);

    const email = request.email.trim().toLowerCase();
    if (email !== user.email) {
      const existing = await this.adminUserRepo.findOne({ where: { email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email is already in use.');
      }
      user.email = email;
    }

    let rotateSessions = false;
    if (request.password?.trim()) {
      user.passwordHash = await bcrypt.hash(request.password.trim(), 10);
      rotateSessions = true;
    }
    user.role = request.role ?? user.role ?? AdminUserRole.SYSTEM_ADMIN;
    const previousStatus = user.status ?? AdminUserStatus.ACTIVE;
    user.status = request.status ?? user.status ?? AdminUserStatus.ACTIVE;
    if (previousStatus !== user.status && user.status === AdminUserStatus.SUSPENDED) {
      rotateSessions = true;
    }
    user.systemPermissions = normalizeSystemPermissions(
      user.role,
      request.systemPermissions ?? user.systemPermissions,
    );
    user.servicePermissions = normalizeServicePermissions(
      user.role,
      request.servicePermissions ?? user.servicePermissions,
    );
    if (rotateSessions) {
      user.tokenVersion = (user.tokenVersion ?? 1) + 1;
    }

    await this.adminUserRepo.save(user);

    if (request.applicationIds) {
      await this.replaceApplications(user.id, this.resolveApplicationIdsForWrite(scope, request.applicationIds));
    }

    const saved = await this.adminUserRepo.findOne({ where: { id: user.id } });
    if (!saved) {
      throw new NotFoundException('Admin user not found.');
    }
    return this.mapUser(saved);
  }

  async remove(id: string, scope: UserScope): Promise<void> {
    const user = await this.adminUserRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Admin user not found.');
    }
    this.assertCanManageUser(scope, user);
    await this.adminUserRepo.remove(user);
  }

  async rotateSessions(id: string, scope?: UserScope): Promise<AdminUserResponseDto> {
    const user = await this.adminUserRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Admin user not found.');
    }
    if (scope) {
      this.assertCanManageUser(scope, user);
    }
    user.tokenVersion = (user.tokenVersion ?? 1) + 1;
    const saved = await this.adminUserRepo.save(user);
    return this.mapUser(saved);
  }

  private async replaceApplications(adminUserId: string, applicationIds: string[]): Promise<void> {
    await this.adminUserApplicationRepo.delete({ adminUserId });
    const uniqueIds = Array.from(new Set(applicationIds.map((entry) => entry.trim()).filter(Boolean)));
    if (uniqueIds.length === 0) {
      return;
    }
    const links = uniqueIds.map((applicationId) =>
      this.adminUserApplicationRepo.create({ adminUserId, applicationId }),
    );
    await this.adminUserApplicationRepo.save(links);
  }

  private canManageUser(scope: UserScope, user: AdminUserEntity, applicationId?: string): boolean {
    if (scope.superAdmin) {
      return true;
    }
    if ((user.role ?? AdminUserRole.SYSTEM_ADMIN) === AdminUserRole.SUPER_ADMIN) {
      return false;
    }
    if (applicationId) {
      return this.getUserApplicationIds(user).includes(applicationId);
    }
    return this.hasApplicationOverlap(scope.actor.applicationIds || [], this.getUserApplicationIds(user));
  }

  private assertCanManageUser(scope: UserScope, user: AdminUserEntity): void {
    if (!this.canManageUser(scope, user)) {
      throw new NotFoundException('Admin user not found.');
    }
  }

  private assertAllowedRole(scope: UserScope, role: AdminUserRole): void {
    if (!scope.superAdmin && role === AdminUserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can manage super admin users.');
    }
  }

  private assertAllowedPermissions(
    scope: UserScope,
    systemPermissions?: SystemPermission[],
    servicePermissions?: ServicePermission[],
  ): void {
    if (scope.superAdmin) {
      return;
    }
    const actorSystemPermissions = new Set(scope.actor.systemPermissions || []);
    const actorServicePermissions = new Set(scope.actor.servicePermissions || []);
    const hasForbiddenSystemPermission = (systemPermissions || []).some(
      (permission) => !actorSystemPermissions.has(permission),
    );
    const hasForbiddenServicePermission = (servicePermissions || []).some(
      (permission) => !actorServicePermissions.has(permission),
    );
    if (hasForbiddenSystemPermission || hasForbiddenServicePermission) {
      throw new ForbiddenException('You can only grant permissions that you already have.');
    }
  }

  private resolveApplicationIdsForWrite(scope: UserScope, applicationIds?: string[]): string[] {
    const normalized = Array.from(new Set((applicationIds || []).map((entry) => entry.trim()).filter(Boolean)));
    if (scope.superAdmin) {
      return normalized;
    }
    const allowed = new Set((scope.actor.applicationIds || []).map((entry) => entry.trim()).filter(Boolean));
    if (normalized.length === 0) {
      throw new BadRequestException('At least one application is required.');
    }
    const hasForbiddenApplication = normalized.some((applicationId) => !allowed.has(applicationId));
    if (hasForbiddenApplication) {
      throw new ForbiddenException('You can only manage users for your own applications.');
    }
    return normalized;
  }

  private resolveApplicationIdForRead(scope: UserScope, applicationId?: string): string | undefined {
    const normalized = applicationId?.trim();
    if (!normalized || scope.superAdmin) {
      return normalized || undefined;
    }
    const allowed = new Set((scope.actor.applicationIds || []).map((entry) => entry.trim()).filter(Boolean));
    if (!allowed.has(normalized)) {
      throw new ForbiddenException('You can only view users for your own applications.');
    }
    return normalized;
  }

  private getUserApplicationIds(user: AdminUserEntity): string[] {
    return (user.applications || []).map((entry) => entry.applicationId).filter(Boolean);
  }

  private hasApplicationOverlap(left: string[], right: string[]): boolean {
    const allowed = new Set(left.map((entry) => entry.trim()).filter(Boolean));
    return right.some((entry) => allowed.has(entry.trim()));
  }
}
