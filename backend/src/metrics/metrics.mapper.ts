export interface RawPerAgent {
  agentId: string;
  agentName: string;
  total: number | string;
  resolved: number | string;
  avgResolutionSeconds: number | string | null;
}

export interface PerAgentMetric {
  agentId: string;
  agentName: string;
  total: number;
  resolved: number;
  resolutionRate: number;
  avgResolutionSeconds: number | null;
}

/**
 * Convierte las filas crudas de la agregación SQL en métricas por agente.
 * Lógica pura (sin BD): tasa = resueltas/total, tiempo promedio redondeado.
 */
export function mapPerAgent(rows: RawPerAgent[]): PerAgentMetric[] {
  return rows.map((r) => {
    const total = Number(r.total);
    const resolved = Number(r.resolved);
    const avg =
      r.avgResolutionSeconds == null ? null : Math.round(Number(r.avgResolutionSeconds));
    return {
      agentId: r.agentId,
      agentName: r.agentName,
      total,
      resolved,
      resolutionRate: total ? Number((resolved / total).toFixed(4)) : 0,
      avgResolutionSeconds: avg,
    };
  });
}
