import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './mikro-orm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallsModule } from './calls/calls.module';
import { TicketsModule } from './tickets/tickets.module';
import { InteractionsModule } from './interactions/interactions.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '1d' },
    }),
    AuthModule,
    UsersModule,
    CatalogModule,
    CallsModule,
    TicketsModule,
    // Timeline combinado (solo lectura) sobre la vista v_interaction.
    InteractionsModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard global: protege todos los endpoints salvo los marcados @Public.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Filtro global: respuesta de error consistente + log de lo inesperado.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
