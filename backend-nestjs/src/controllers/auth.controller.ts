import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginRequestDto } from '../dto/requests/login-request.dto';
import { AuthResponseDto } from '../dto/responses/auth-response.dto';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() request: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(request);
  }
}