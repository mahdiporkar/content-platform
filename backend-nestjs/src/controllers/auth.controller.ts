import { Body, Controller, Post, Logger } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginRequestDto } from '../dto/requests/login-request.dto';
import { AuthResponseDto } from '../dto/responses/auth-response.dto';

@Controller('/api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() request: LoginRequestDto): Promise<AuthResponseDto> {
    this.logger.log(`Login attempt for ${request.email}`);
    return this.authService.login(request);
  }
}
