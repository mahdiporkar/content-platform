import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DemoSessionRequestDto } from '../dto/requests/demo-session-request.dto';
import { DemoSessionService } from '../services/demo-session.service';
import { getClientIp } from '../common/client-ip';

@Controller('/api/v1/demo')
export class DemoSessionController {
  constructor(private readonly sessions: DemoSessionService) {}

  @Post('sessions')
  create(@Req() request: Request, @Body() body: DemoSessionRequestDto) {
    return this.sessions.create(body.workspaceName, body.locale, getClientIp(request));
  }
}
