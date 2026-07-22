import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MikroORM } from '@mikro-orm/core';
import { AppModule } from './app.module';
import { DatabaseSeeder } from './seeders/DatabaseSeeder';

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
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Entrypoint para `docker compose up` desde cero: migra y siembra según env.
  const orm = app.get(MikroORM);
  if (process.env.DB_AUTO_MIGRATE === 'true') {
    await orm.getMigrator().up();
    console.log('Migraciones aplicadas.');
  }
  if (process.env.DB_SEED === 'true') {
    await orm.getSeeder().seed(DatabaseSeeder);
    console.log('Seed ejecutado.');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API escuchando en http://localhost:${port}/api`);
  console.log(`Swagger en http://localhost:${port}/api/docs`);
}
bootstrap();
