import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ValidationError } from 'class-validator';
import { validateJwtSecret } from './common/jwt-secret';

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

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
  });

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
      'Admin plane uses Bearer JWT on /api/v1/admin/** and /api/v1/media/**. Delivery plane uses X-Application-Id + X-Application-Token, with domain-locked acting as an extra browser-domain check.'
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
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


