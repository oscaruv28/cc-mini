import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import request from 'supertest';
import { createApp, seed } from './utils/bootstrap';

describe('CC-Mini API (e2e)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let token: string;
  let agentA: string;

  beforeAll(async () => {
    ({ app, orm } = await createApp());
    const s = await seed(orm);
    agentA = s.agentA;
    http = app.getHttpServer();
    const res = await request(http)
      .post('/api/auth/login')
      .send({ email: 'admin@test.co', password: 'test1234' });
    token = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = <T extends request.Test>(r: T): T => r.set('Authorization', `Bearer ${token}`) as T;

  // ---- Auth ----
  it('login OK devuelve token', () => {
    expect(token).toBeDefined();
  });

  it('login con credenciales inválidas → 401', () =>
    request(http).post('/api/auth/login').send({ email: 'admin@test.co', password: 'nope' }).expect(401));

  it('endpoint protegido sin token → 401', () => request(http).get('/api/interactions').expect(401));

  // ---- Métricas (seed determinista, datos prístinos) ----
  it('métricas por agente son exactas', async () => {
    const res = await auth(request(http).get('/api/metrics?from=2026-07-01&to=2026-07-31')).expect(200);
    const uno = res.body.perAgent.find((p: { agentName: string }) => p.agentName === 'Agente Uno');
    const dos = res.body.perAgent.find((p: { agentName: string }) => p.agentName === 'Agente Dos');

    expect(uno).toMatchObject({ total: 4, resolved: 3, avgResolutionSeconds: 120 });
    expect(uno.resolutionRate).toBeCloseTo(0.75);
    expect(dos).toMatchObject({ total: 2, resolved: 1, avgResolutionSeconds: 300 });
    expect(dos.resolutionRate).toBeCloseTo(0.5);
  });

  it('volumen por día respeta UTC-5 (8pm Cali cuenta ese día)', async () => {
    const res = await auth(request(http).get('/api/metrics?from=2026-07-01&to=2026-07-31')).expect(200);
    const byDay = Object.fromEntries(res.body.dailyVolume.map((d: { day: string; total: number }) => [d.day, d.total]));
    // La llamada de las 20:00 del 10 (01:00Z del 11) DEBE quedar en el 10, no el 11.
    expect(byDay['2026-07-10']).toBe(4);
    expect(byDay['2026-07-11']).toBe(2);
  });

  // ---- Listado con filtros ----
  it('lista filtrada por estado devuelve solo ese estado', async () => {
    const res = await auth(request(http).get('/api/interactions?status=OPEN&limit=50')).expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.every((i: { status: string }) => i.status === 'OPEN')).toBe(true);
  });

  it('paginación expone metadata', async () => {
    const res = await auth(request(http).get('/api/interactions?limit=2&page=1')).expect(200);
    expect(res.body.items.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pages');
  });

  // ---- Ciclo de vida (mutaciones, al final) ----
  it('ciclo de vida: crea OPEN, rechaza salto, avanza y fija closedAt', async () => {
    const created = await auth(request(http).post('/api/interactions/calls'))
      .send({ agentId: agentA, direction: 'INBOUND' })
      .expect(201);
    const id = created.body.id;
    expect(created.body.status).toBe('OPEN');

    // salto inválido OPEN → RESOLVED
    await auth(request(http).patch(`/api/interactions/calls/${id}/status`)).send({ status: 'RESOLVED' }).expect(409);
    // avance válido
    await auth(request(http).patch(`/api/interactions/calls/${id}/status`)).send({ status: 'IN_PROGRESS' }).expect(200);
    const resolved = await auth(request(http).patch(`/api/interactions/calls/${id}/status`)).send({ status: 'RESOLVED' }).expect(200);
    expect(resolved.body.closedAt).toBeTruthy();
  });

  it('crear con agente inexistente → 400', () =>
    auth(request(http).post('/api/interactions/calls'))
      .send({ agentId: '00000000-0000-0000-0000-000000000000', direction: 'INBOUND' })
      .expect(400));
});
