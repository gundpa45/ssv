import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
  origin: true,
  credentials: true,
});
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const configService = app.get(ConfigService);

  const port = Number(process.env.PORT) || Number(configService.get('APP_PORT')) || 3000;

  await app.listen(port);

  console.log(
    `🚀 ${configService.get('APP_NAME')} running on port ${port}`,
  );
}

void bootstrap();