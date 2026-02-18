import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ValidationError } from 'class-validator';

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
      'Admin endpoints use Bearer JWT. Content/Media access is controlled by application mediaPolicy: public, domain-locked, or JWT-required.'
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addApiKey({ type: 'apiKey', name: 'x-app-id', in: 'header' }, 'app-id')
    .addApiKey({ type: 'apiKey', name: 'x-application-id', in: 'header' }, 'application-id')
    .addApiKey({ type: 'apiKey', name: 'x-application-token', in: 'header' }, 'application-token')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`Backend listening on port ${port}`);
}

bootstrap();


