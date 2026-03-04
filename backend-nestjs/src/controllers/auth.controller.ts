import { Body, Controller, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginRequestDto } from '../dto/requests/login-request.dto';
import { AuthResponseDto } from '../dto/responses/auth-response.dto';
import { LoginProtectionService } from '../services/login-protection.service';
import { getClientIp } from '../common/client-ip';

@Controller('/api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly loginProtection: LoginProtectionService,
  ) {}

  @Post('login')
  async login(@Req() httpRequest: Request, @Body() request: LoginRequestDto): Promise<AuthResponseDto> {
    const email = request.email.trim().toLowerCase();
    const clientIp = getClientIp(httpRequest);
    this.loginProtection.assertAllowed(clientIp, email);
    this.logger.log(`Login attempt for ${request.email}`);
    try {
      const response = await this.authService.login({ ...request, email });
      this.loginProtection.recordSuccess(clientIp, email);
      return response;
    } catch (error) {
      this.loginProtection.recordFailure(clientIp, email);
      throw error;
    }
  }
}
