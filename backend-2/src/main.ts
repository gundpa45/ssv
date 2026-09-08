import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ----- CORS -----
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : true;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ----- API Prefix -----
  app.setGlobalPrefix('api/v1', {
    exclude: ['/'],
  });

  // ----- Validation Pipe -----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ----- Graceful Shutdown -----
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);

  const port =
    Number(process.env.PORT) ||
    Number(configService.get('APP_PORT')) ||
    3000;

  await app.listen(port);

  logger.log(
    `🚀 ${configService.get('APP_NAME') || 'WMS Backend'} running on port ${port} [${process.env.NODE_ENV || 'development'}]`,
  );
}

void bootstrap();