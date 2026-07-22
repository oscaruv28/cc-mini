import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../../src/app.module';
import { Customer } from '../../src/entities/customer.entity';
import { User } from '../../src/entities/user.entity';
import { Disposition } from '../../src/entities/disposition.entity';
import { Call } from '../../src/entities/call.entity';
import { CallDirection, InteractionStatus, UserRole } from '../../src/entities/enums';

/** Arranca la app Nest igual que main.ts (prefijo /api + ValidationPipe). */
export async function createApp(): Promise<{ app: INestApplication; orm: MikroORM }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();
  return { app, orm: app.get(MikroORM) };
}

export interface SeedResult {
  agentA: string;
  agentB: string;
  password: string;
}

/**
 * Seed DETERMINISTA (timestamps fijos en UTC-5) para poder afirmar números
 * exactos de métricas y la frontera de medianoche.
 *
 * Agente Uno (día 2026-07-10):
 *   - 3 resueltas con duración 60/120/180s (avg = 120s), una a las 20:00 (Cali)
 *   - 1 abierta   → total 4, resueltas 3, tasa 0.75
 * Agente Dos (día 2026-07-11):
 *   - 1 resuelta 300s + 1 abierta → total 2, resueltas 1, tasa 0.5
 */
export async function seed(orm: MikroORM): Promise<SeedResult> {
  const em = orm.em.fork();
  await em
    .getConnection()
    .execute('truncate call, ticket, "user", customer, disposition, agent_availability restart identity cascade');

  const customer = em.create(Customer, { name: 'Test Corp', createdAt: new Date() });
  const disp = em.create(Disposition, { code: 'RESUELTO', label: 'Resuelto', active: true });
  const hash = await bcrypt.hash('test1234', 10);
  em.create(User, { name: 'Admin', email: 'admin@test.co', role: UserRole.ADMIN, customer, passwordHash: hash, createdAt: new Date() });
  const a = em.create(User, { name: 'Agente Uno', email: 'a@test.co', role: UserRole.AGENT, customer, passwordHash: hash, createdAt: new Date() });
  const b = em.create(User, { name: 'Agente Dos', email: 'b@test.co', role: UserRole.AGENT, customer, passwordHash: hash, createdAt: new Date() });
  await em.flush();

  const mkCall = (agent: User, openedIso: string, durationSec: number, resolved: boolean) => {
    const openedAt = new Date(openedIso);
    em.create(Call, {
      agent,
      direction: CallDirection.INBOUND,
      status: resolved ? InteractionStatus.RESOLVED : InteractionStatus.OPEN,
      openedAt,
      closedAt: resolved ? new Date(openedAt.getTime() + durationSec * 1000) : undefined,
      disposition: resolved ? disp : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  mkCall(a, '2026-07-10T09:00:00-05:00', 60, true);
  mkCall(a, '2026-07-10T10:00:00-05:00', 120, true);
  mkCall(a, '2026-07-10T20:00:00-05:00', 180, true); // 8pm Cali → pertenece al 07-10
  mkCall(a, '2026-07-10T11:00:00-05:00', 0, false);
  mkCall(b, '2026-07-11T08:00:00-05:00', 300, true);
  mkCall(b, '2026-07-11T09:00:00-05:00', 0, false);
  await em.flush();

  return { agentA: a.id, agentB: b.id, password: 'test1234' };
}
