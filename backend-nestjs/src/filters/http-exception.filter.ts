import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const basePayload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (typeof exceptionResponse === 'string') {
      response.status(status).json({ ...basePayload, message: exceptionResponse });
      return;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      response.status(status).json({ ...basePayload, ...exceptionResponse });
      return;
    }

    response.status(status).json({ ...basePayload, message: exception.message });
  }
}