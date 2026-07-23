import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { MetricsQueryDto } from './dto/metrics-query.dto';
import { mapPerAgent, type RawPerAgent } from './metrics.mapper';

interface DailyRow {
  day: string;
  total: number;
}
interface DispRow {
  code: string;
  label: string;
  total: number;
}

/**
 * Métricas operativas. Toda la agregación ocurre en SQL sobre la vista
 * `v_interaction` (nunca se trae todo a memoria). El agrupamiento por día
 * respeta la zona horaria de la operación (UTC-5), no la del servidor:
 * `opened_at AT TIME ZONE <tz>` convierte el instante UTC a la hora local
 * de Colombia antes de truncar por día.
 */
@Injectable()
export class MetricsService {
  private readonly tz = process.env.APP_TZ ?? 'America/Bogota';

  constructor(private readonly em: EntityManager) {}

  async getMetrics(q: MetricsQueryDto, customerId: string) {
    if (new Date(q.from) > new Date(q.to)) {
      throw new BadRequestException('`from` no puede ser posterior a `to`');
    }
    const conn = this.em.getConnection();
    const agentFilter = q.agentId ? 'and v.agent_id = ?' : '';

    // Límites del rango como instantes UTC: [from 00:00, to+1día 00:00) en hora Colombia.
    // Se comparan contra opened_at (timestamptz) usando el índice, sin funciones sobre la columna.
    const perAgentSql = `
      select v.agent_id as "agentId",
             u.name as "agentName",
             count(*)::int as total,
             count(*) filter (where v.status = 'RESOLVED')::int as resolved,
             avg(extract(epoch from (v.closed_at - v.opened_at)))
               filter (where v.status = 'RESOLVED' and v.closed_at is not null) as "avgResolutionSeconds"
      from v_interaction v
      join "user" u on u.id = v.agent_id
      where v.customer_id = ?
        and v.opened_at >= ((?::timestamp) at time zone ?)
        and v.opened_at <  (((?::timestamp) + interval '1 day') at time zone ?)
        ${agentFilter}
      group by v.agent_id, u.name
      order by total desc`;

    const dailySql = `
      select to_char((v.opened_at at time zone ?)::date, 'YYYY-MM-DD') as day,
             count(*)::int as total
      from v_interaction v
      where v.customer_id = ?
        and v.opened_at >= ((?::timestamp) at time zone ?)
        and v.opened_at <  (((?::timestamp) + interval '1 day') at time zone ?)
        ${agentFilter}
      group by day
      order by day`;

    // Desglose por tipificación (incluye "Sin tipificar" con left join).
    const dispSql = `
      select coalesce(d.code, 'SIN_TIPIFICAR') as code,
             coalesce(d.label, 'Sin tipificar') as label,
             count(*)::int as total
      from v_interaction v
      left join disposition d on d.id = v.disposition_id
      where v.customer_id = ?
        and v.opened_at >= ((?::timestamp) at time zone ?)
        and v.opened_at <  (((?::timestamp) + interval '1 day') at time zone ?)
        ${agentFilter}
      group by 1, 2
      order by total desc`;

    const perAgentParams: unknown[] = [customerId, q.from, this.tz, q.to, this.tz];
    if (q.agentId) perAgentParams.push(q.agentId);

    const dailyParams: unknown[] = [this.tz, customerId, q.from, this.tz, q.to, this.tz];
    if (q.agentId) dailyParams.push(q.agentId);

    const dispParams: unknown[] = [customerId, q.from, this.tz, q.to, this.tz];
    if (q.agentId) dispParams.push(q.agentId);

    const [perAgentRows, dailyRows, dispRows] = await Promise.all([
      conn.execute<RawPerAgent[]>(perAgentSql, perAgentParams),
      conn.execute<DailyRow[]>(dailySql, dailyParams),
      conn.execute<DispRow[]>(dispSql, dispParams),
    ]);

    const perAgent = mapPerAgent(perAgentRows);
    const dailyVolume = dailyRows.map((r) => ({ day: r.day, total: Number(r.total) }));
    const byDisposition = dispRows.map((r) => ({
      code: r.code,
      label: r.label,
      total: Number(r.total),
    }));

    return {
      range: { from: q.from, to: q.to, timezone: this.tz },
      perAgent,
      dailyVolume,
      byDisposition,
    };
  }
}
