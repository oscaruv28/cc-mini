import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo común para toda la API.
  app.setGlobalPrefix('api');

  // Validación global de DTOs:
  // - whitelist: descarta propiedades no declaradas.
  // - forbidNonWhitelisted: rechaza payloads con campos desconocidos.
  // - transform: convierte tipos primitivos (p. ej. query params a number/Date).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS abierto para el frontend del monorepo (se puede acotar por entorno).
  app.enableCors();

  // Documentación interactiva de la API en /api/docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CC-Mini · Contact Center')
    .setDescription('API de actividad de atención (llamadas y tickets) y métricas operativas.')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API escuchando en http://localhost:${port}/api`);
  console.log(`Swagger en http://localhost:${port}/api/docs`);
}
bootstrap();
