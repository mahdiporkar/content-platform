import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : undefined;
    const message = exception instanceof Error ? exception.message : 'Unexpected error';

    this.logger.error(
      JSON.stringify({
        method: request.method,
        path: request.url,
        statusCode: status,
        message,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

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

    response.status(status).json({ ...basePayload, message });
  }
}
