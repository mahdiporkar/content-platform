import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginRequestDto } from '../dto/requests/login-request.dto';
import { AuthResponseDto } from '../dto/responses/auth-response.dto';
import { AdminUserEntity, AdminUserStatus } from '../entities/admin-user.entity';
import { JwtTokenService } from '../auth/jwt-token.service';
import { normalizeServicePermissions, normalizeSystemPermissions } from '../auth/admin-permissions';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminUserRepo: Repository<AdminUserEntity>,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async login(request: LoginRequestDto): Promise<AuthResponseDto> {
    const admin = await this.adminUserRepo.findOne({
      where: { email: request.email },
      relations: ['applications'],
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const valid = await bcrypt.compare(request.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    if (admin.status === AdminUserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended.');
    }

    const applicationIds = (admin.applications || []).map((entry) => entry.applicationId);
    const systemPermissions = normalizeSystemPermissions(admin.role, admin.systemPermissions);
    const servicePermissions = normalizeServicePermissions(admin.role, admin.servicePermissions);
    const token = this.jwtTokenService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      applicationIds,
      systemPermissions,
      servicePermissions,
    });
    return new AuthResponseDto(token);
  }
}
