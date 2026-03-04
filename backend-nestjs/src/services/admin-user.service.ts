import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { AdminUserEntity, AdminUserRole, AdminUserStatus } from '../entities/admin-user.entity';
import { AdminUserApplicationEntity } from '../entities/admin-user-application.entity';
import { AdminUserUpsertRequestDto } from '../dto/requests/admin-user-upsert-request.dto';
import { AdminUserResponseDto } from '../dto/responses/admin-user-response.dto';
import { normalizeServicePermissions, normalizeSystemPermissions } from '../auth/admin-permissions';

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
    const role = user.role ?? AdminUserRole.EDITOR;
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

  async list(): Promise<AdminUserResponseDto[]> {
    const users = await this.adminUserRepo.find({ order: { email: 'ASC' } });
    return users.map((user) => this.mapUser(user));
  }

  async getById(id: string): Promise<AdminUserResponseDto> {
    const user = await this.adminUserRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Admin user not found.');
    }
    return this.mapUser(user);
  }

  async create(request: AdminUserUpsertRequestDto): Promise<AdminUserResponseDto> {
    const email = request.email.trim().toLowerCase();
    const existing = await this.adminUserRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already in use.');
    }
    if (!request.password?.trim()) {
      throw new BadRequestException('Password is required.');
    }

    const passwordHash = await bcrypt.hash(request.password.trim(), 10);
    const user = this.adminUserRepo.create({
      id: uuidv4(),
      email,
      passwordHash,
      role: request.role ?? AdminUserRole.EDITOR,
      status: request.status ?? AdminUserStatus.ACTIVE,
      tokenVersion: 1,
      systemPermissions: normalizeSystemPermissions(
        request.role ?? AdminUserRole.EDITOR,
        request.systemPermissions,
      ),
      servicePermissions: normalizeServicePermissions(
        request.role ?? AdminUserRole.EDITOR,
        request.servicePermissions,
      ),
      applications: [],
    });
    await this.adminUserRepo.save(user);

    if (request.applicationIds) {
      await this.replaceApplications(user.id, request.applicationIds);
    }

    const saved = await this.adminUserRepo.findOne({ where: { id: user.id } });
    if (!saved) {
      throw new NotFoundException('Admin user not found.');
    }
    return this.mapUser(saved);
  }

  async update(id: string, request: AdminUserUpsertRequestDto): Promise<AdminUserResponseDto> {
    const user = await this.adminUserRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Admin user not found.');
    }

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
    user.role = request.role ?? user.role ?? AdminUserRole.EDITOR;
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
      await this.replaceApplications(user.id, request.applicationIds);
    }

    const saved = await this.adminUserRepo.findOne({ where: { id: user.id } });
    if (!saved) {
      throw new NotFoundException('Admin user not found.');
    }
    return this.mapUser(saved);
  }

  async remove(id: string): Promise<void> {
    const user = await this.adminUserRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Admin user not found.');
    }
    await this.adminUserRepo.remove(user);
  }

  async rotateSessions(id: string): Promise<AdminUserResponseDto> {
    const user = await this.adminUserRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Admin user not found.');
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
}
