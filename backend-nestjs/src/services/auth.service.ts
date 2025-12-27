import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginRequestDto } from '../dto/requests/login-request.dto';
import { AuthResponseDto } from '../dto/responses/auth-response.dto';
import { AdminUserEntity } from '../entities/admin-user.entity';
import { JwtTokenService } from '../auth/jwt-token.service';

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

    const applicationIds = (admin.applications || []).map((entry) => entry.applicationId);
    const token = this.jwtTokenService.sign({
      sub: admin.id,
      email: admin.email,
      applicationIds,
    });
    return new AuthResponseDto(token);
  }
}