import { Injectable, NotImplementedException } from '@nestjs/common';
import { LoginRequestDto } from '../dto/requests/login-request.dto';
import { AuthResponseDto } from '../dto/responses/auth-response.dto';

@Injectable()
export class AuthService {
  login(_request: LoginRequestDto): AuthResponseDto {
    throw new NotImplementedException('Auth login not implemented yet.');
  }
}