import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { metricsApi } from '../../api/metrics.api';
import { catalogApi } from '../../api/catalog.api';
import { fmtDuration, pct } from '../../utils/format';
import { Card, ErrorState, Field, Input, Spinner } from '../../components/ui';
import InteractionsPanel from '../../components/InteractionsPanel';

const iso = (d: Date) => d.toISOString().slice(0, 10);

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{hint}</div>
    </div>
  );
}

export default function DashboardPage() {
  const now = new Date();
  const [from, setFrom] = useState(iso(new Date(now.getTime() - 14 * 864e5)));
  const [to, setTo] = useState(iso(now));
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  const { data, loading, error, reload } = useAsync(() => metricsApi.get({ from, to }), [from, to]);
  const dispA = useAsync(() => catalogApi.dispositions(), []);
  const dispositions = dispA.data ?? [];

  const maxDaily = data ? Math.max(1, ...data.dailyVolume.map((d) => d.total)) : 1;

  // KPIs agregados del equipo (para interpretar el panorama).
  const totalInteractions = data ? data.perAgent.reduce((s, a) => s + a.total, 0) : 0;
  const totalResolved = data ? data.perAgent.reduce((s, a) => s + a.resolved, 0) : 0;
  const globalRate = totalInteractions ? totalResolved / totalInteractions : 0;
  const weighted = data
    ? data.perAgent.reduce(
        (acc, a) =>
          a.avgResolutionSeconds != null
            ? { sum: acc.sum + a.avgResolutionSeconds * a.resolved, n: acc.n + a.resolved }
            : acc,
        { sum: 0, n: 0 },
      )
    : { sum: 0, n: 0 };
  const avgResolution = weighted.n ? weighted.sum / weighted.n : null;

  return (
    <div className="space-y-4">
      <Card title="Rango de fechas (zona horaria Colombia, UTC-5)">
        <div className="flex flex-wrap gap-3">
          <Field label="Desde"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="Hasta"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && !loading && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Interacciones" value={String(totalInteractions)} hint="Llamadas + tickets en el rango" />
            <Kpi label="Resueltas" value={String(totalResolved)} hint="En estado RESOLVED" />
            <Kpi label="Tasa de resolución" value={pct(globalRate)} hint="Resueltas ÷ total" />
            <Kpi label="Tiempo prom. resolución" value={fmtDuration(avgResolution)} hint="Promedio de (cierre − apertura)" />
          </div>

          <Card title="Por agente">
            <p className="mb-2 text-xs text-slate-400">Haz clic en un agente para ver sus interacciones y comprobar los números.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Agente</th>
                    <th className="px-3 py-2" title="Llamadas + tickets">Total</th>
                    <th className="px-3 py-2" title="En estado RESOLVED">Resueltas</th>
                    <th className="px-3 py-2" title="Resueltas ÷ total">Tasa</th>
                    <th className="px-3 py-2" title="Promedio de cierre − apertura de las resueltas">Tiempo prom. resolución</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perAgent.map((a) => (
                    <tr
                      key={a.agentId}
                      onClick={() => setSelected({ id: a.agentId, name: a.agentName })}
                      className={`cursor-pointer border-t border-slate-100 hover:bg-indigo-50 ${
                        selected?.id === a.agentId ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-slate-700">{a.agentName}</td>
                      <td className="px-3 py-2">{a.total}</td>
                      <td className="px-3 py-2">{a.resolved}</td>
                      <td className="px-3 py-2">{pct(a.resolutionRate)}</td>
                      <td className="px-3 py-2">{fmtDuration(a.avgResolutionSeconds)}</td>
                    </tr>
                  ))}
                  {data.perAgent.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">Sin datos en el rango</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {selected && (
            <Card title={`Interacciones de ${selected.name} · ${from} a ${to}`}>
              <p className="mb-2 text-xs text-slate-400">
                El total de abajo debe coincidir con la fila del agente; filtra por estado RESOLVED para comprobar las resueltas.
              </p>
              <InteractionsPanel
                lockedAgentId={selected.id}
                agents={[{ id: selected.id, name: selected.name }]}
                dispositions={dispositions}
                from={from}
                to={to}
              />
            </Card>
          )}

          <Card title="Por tipificación">
            {data.byDisposition.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos en el rango</p>
            ) : (
              <div className="space-y-1.5">
                {(() => {
                  const maxDisp = Math.max(1, ...data.byDisposition.map((d) => d.total));
                  return data.byDisposition.map((d) => (
                    <div key={d.code} className="flex items-center gap-3 text-sm">
                      <span className="w-40 shrink-0 text-slate-600">{d.label}</span>
                      <div className="h-4 flex-1 rounded bg-slate-100">
                        <div
                          className="h-4 rounded bg-indigo-500"
                          style={{ width: `${(d.total / maxDisp) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right font-medium text-slate-700">
                        {d.total} · {pct(d.total / totalInteractions)}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </Card>

          <Card title="Volumen de interacciones por día">
            {data.dailyVolume.length === 0 ? (
              <p className="text-sm text-slate-400">Sin datos en el rango</p>
            ) : (
              <div className="flex h-48 items-end gap-1 overflow-x-auto">
                {data.dailyVolume.map((d) => (
                  <div key={d.day} className="flex min-w-8 flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.total}`}>
                    <span className="text-xs text-slate-400">{d.total}</span>
                    <div className="w-full rounded-t bg-indigo-500" style={{ height: `${(d.total / maxDaily) * 100}%` }} />
                    <span className="text-[10px] text-slate-400">{d.day.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
