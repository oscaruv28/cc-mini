/**
 * Verificación de aceptación end-to-end contra la API en ejecución.
 *   node scripts/verify.mjs
 *
 * Mapea cada requisito del enunciado a una prueba de API, genera un masivo de
 * llamadas y compara las métricas de la API contra la verdad de la base de
 * datos (SQL directo por docker exec). Requiere la app en :3000 y el
 * contenedor cc-mini-db-1 arriba.
 */
import { execSync } from 'node:child_process';

const BASE = 'http://localhost:3000/api';
const DB = 'cc-mini-db-1';
const TZ = 'America/Bogota';
const results = [];
const ok = (name, cond, extra = '') =>
  results.push({ name, pass: !!cond, extra });

const sql = (q) =>
  execSync(`docker exec ${DB} psql -U cc_mini -d cc_mini -t -A -F"|" -c "${q.replace(/"/g, '\\"')}"`)
    .toString()
    .trim();

async function api(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* 204 */
  }
  return { status: res.status, data };
}

const ymd = (d) => d.toISOString().slice(0, 10);

async function main() {
  // ---- login ----
  const login = await api('POST', '/auth/login', {
    body: { email: 'admin@demo.co', password: 'admin123' },
  });
  ok('AUTH: login admin → token', login.status === 200 && login.data?.access_token);
  const token = login.data.access_token;

  // ---- seguridad ----
  ok('AUTH: endpoint protegido sin token → 401', (await api('GET', '/interactions')).status === 401);

  // ---- agentes disponibles ----
  const users = await api('GET', '/users?role=AGENT&limit=50', { token });
  const agents = users.data.items;
  ok('USERS: hay agentes para asignar', agents.length > 0);
  const agentId = agents[0].id;

  // ---- REQ 1: crear interacción con agente y apertura ----
  const call = await api('POST', '/interactions/calls', {
    token,
    body: { agentId, direction: 'INBOUND', phoneNumber: '+573001234567' },
  });
  ok('REQ1: crear llamada (201, OPEN, con openedAt)',
    call.status === 201 && call.data.status === 'OPEN' && !!call.data.openedAt);
  const ticket = await api('POST', '/interactions/tickets', {
    token, body: { agentId, subject: 'Verify', priority: 'HIGH' },
  });
  ok('REQ1: crear ticket (201)', ticket.status === 201);
  const callId = call.data.id;

  // ---- REQ 2: transiciones de estado + closedAt ----
  const t1 = await api('PATCH', `/interactions/calls/${callId}/status`, { token, body: { status: 'IN_PROGRESS' } });
  ok('REQ2: OPEN → IN_PROGRESS', t1.status === 200 && t1.data.status === 'IN_PROGRESS');
  const t2 = await api('PATCH', `/interactions/calls/${callId}/status`, { token, body: { status: 'RESOLVED' } });
  ok('REQ2: IN_PROGRESS → RESOLVED con closedAt', t2.status === 200 && t2.data.status === 'RESOLVED' && !!t2.data.closedAt);
  const bad = await api('PATCH', `/interactions/tickets/${ticket.data.id}/status`, { token, body: { status: 'RESOLVED' } });
  ok('REQ2: transición inválida OPEN → RESOLVED → 409', bad.status === 409);

  // ---- REQ 3: listar con filtros + paginación ----
  const listResolved = await api('GET', '/interactions?status=RESOLVED&limit=5', { token });
  ok('REQ3: filtro status=RESOLVED (solo resueltas)',
    listResolved.data.items.every((i) => i.status === 'RESOLVED'));
  ok('REQ3: paginación (limit=5 respeta tamaño + meta)',
    listResolved.data.items.length <= 5 && typeof listResolved.data.total === 'number' && typeof listResolved.data.pages === 'number');
  const listAgent = await api('GET', `/interactions?agentId=${agentId}&limit=3`, { token });
  ok('REQ3: filtro por agente', listAgent.data.items.every((i) => i.agentId === agentId));

  // ---- REQ 7: errores / entradas inválidas ----
  ok('REQ7: agente inexistente → 400',
    (await api('POST', '/interactions/calls', { token, body: { agentId: '00000000-0000-0000-0000-000000000000', direction: 'INBOUND' } })).status === 400);
  ok('REQ7: body inválido (falta direction) → 400',
    (await api('POST', '/interactions/calls', { token, body: { agentId } })).status === 400);
  ok('REQ7: id no-uuid → 400',
    (await api('PATCH', '/interactions/calls/no-uuid/status', { token, body: { status: 'IN_PROGRESS' } })).status === 400);
  ok('REQ7: rango invertido en métricas → 400',
    (await api('GET', '/metrics?from=2026-12-31&to=2026-01-01', { token })).status === 400);

  // ---- MASIVO ----
  console.log('\nGenerando masivo (400 por agente)...');
  for (const a of agents) {
    await api('POST', '/interactions/calls/simulate', { token, body: { agentId: a.id, count: 400 } });
  }

  // ---- REQ 4/5/6: métricas + correctitud vs BD ----
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 864e5);
  const range = `from=${ymd(from)}&to=${ymd(to)}`;
  const metrics = await api('GET', `/metrics?${range}`, { token });
  const m = metrics.data;
  ok('REQ4: métricas responde con perAgent y dailyVolume',
    Array.isArray(m.perAgent) && Array.isArray(m.dailyVolume));
  ok('REQ4: tasa de resolución = resueltas/total (coherente)',
    m.perAgent.every((p) => Math.abs(p.resolutionRate - (p.total ? p.resolved / p.total : 0)) < 1e-3));
  const sumAgents = m.perAgent.reduce((s, p) => s + p.total, 0);
  const sumDaily = m.dailyVolume.reduce((s, d) => s + d.total, 0);
  ok('COHERENCIA: Σ perAgent.total == Σ dailyVolume.total', sumAgents === sumDaily, `${sumAgents} vs ${sumDaily}`);

  // Verdad de BD con la MISMA lógica de zona horaria y rango:
  const lower = `(('${ymd(from)}'::timestamp) at time zone '${TZ}')`;
  const upper = `((('${ymd(to)}'::timestamp)+interval '1 day') at time zone '${TZ}')`;
  const rows = sql(
    `select v.agent_id, count(*), count(*) filter (where v.status='RESOLVED') ` +
    `from v_interaction v where v.opened_at >= ${lower} and v.opened_at < ${upper} group by v.agent_id`,
  );
  const truth = new Map();
  for (const line of rows.split('\n').filter(Boolean)) {
    const [id, total, resolved] = line.split('|');
    truth.set(id, { total: +total, resolved: +resolved });
  }
  let allMatch = true;
  const diffs = [];
  for (const p of m.perAgent) {
    const t = truth.get(p.agentId);
    if (!t || t.total !== p.total || t.resolved !== p.resolved) {
      allMatch = false;
      diffs.push(`${p.agentName}: API(${p.total}/${p.resolved}) vs DB(${t?.total}/${t?.resolved})`);
    }
  }
  ok('CORRECTITUD: métricas por agente API == BD', allMatch, diffs.join('; '));

  const dbTotal = +sql(`select count(*) from v_interaction v where v.opened_at >= ${lower} and v.opened_at < ${upper}`);
  ok('CORRECTITUD: total del rango API == BD', sumAgents === dbTotal, `API ${sumAgents} vs DB ${dbTotal}`);

  // ---- reporte ----
  console.log('\n──────── RESULTADOS ────────');
  let passed = 0;
  for (const r of results) {
    console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.extra ? '  [' + r.extra + ']' : ''}`);
    if (r.pass) passed++;
  }
  console.log(`────────────────────────────\n${passed}/${results.length} pruebas OK`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
