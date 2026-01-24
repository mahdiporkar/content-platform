import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { AdminUserApplicationEntity } from '../entities/admin-user-application.entity';
import { AdminUserUpsertRequestDto } from '../dto/requests/admin-user-upsert-request.dto';
import { AdminUserResponseDto } from '../dto/responses/admin-user-response.dto';

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
    return new AdminUserResponseDto(user.id, user.email, applicationIds);
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

    if (request.password?.trim()) {
      user.passwordHash = await bcrypt.hash(request.password.trim(), 10);
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
