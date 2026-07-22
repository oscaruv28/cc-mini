import 'dotenv/config';
import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';

/**
 * Configuración única de MikroORM.
 * La consume tanto la app (MikroOrmModule.forRoot) como el CLI
 * (migraciones y seed), para no divergir entre runtime y herramientas.
 *
 * `dotenv/config` se importa aquí porque el CLI corre este archivo de forma
 * standalone, fuera del ConfigModule de NestJS.
 */
export default defineConfig({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  dbName: process.env.DB_NAME ?? 'cc_mini',
  user: process.env.DB_USER ?? 'cc_mini',
  password: process.env.DB_PASSWORD ?? 'cc_mini',

  // Entidades: JS compilado en runtime, TS para el CLI en desarrollo.
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],

  extensions: [Migrator, SeedManager],
  migrations: { path: 'dist/migrations', pathTs: 'src/migrations' },
  seeder: { path: 'dist/seeders', pathTs: 'src/seeders' },

  // Sin auto-sincronización de esquema: el esquema se gobierna con migraciones.
  debug: process.env.NODE_ENV !== 'production',
});
