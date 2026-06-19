import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ValidationError } from 'class-validator';
import { validateJwtSecret } from './common/jwt-secret';
import { buildCorsConfiguration } from './common/cors-config';

function buildFieldErrors(errors: ValidationError[]) {
  return errors.flatMap((error) => {
    if (!error.constraints) {
      return [];
    }
    return Object.values(error.constraints).map((message) => ({
      field: error.property,
      message,
    }));
  });
}

async function bootstrap() {
  validateJwtSecret(process.env);
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const cors = buildCorsConfiguration(process.env);

  if (cors.missingInProduction) {
    logger.warn(
      'CORS_ALLOWED_ORIGINS is not configured in production; browser cross-origin requests will be rejected.',
    );
  }
  app.enableCors(cors.options);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Validation failed',
          fieldErrors: buildFieldErrors(errors),
        }),
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Content Platform API')
    .setDescription(
      'Admin plane uses Bearer JWT on /api/v1/admin/** and /api/v1/media/**. Delivery plane uses X-Application-Id + X-Application-Token. Tenant route management uses X-Application-Id + Bearer management token.'
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addSecurityRequirements('bearer')
    .addApiKey({ type: 'apiKey', name: 'X-Application-Id', in: 'header' }, 'application-id')
    .addApiKey({ type: 'apiKey', name: 'X-Application-Token', in: 'header' }, 'application-token')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}

bootstrap();


