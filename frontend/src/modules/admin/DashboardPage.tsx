import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { metricsApi } from '../../api/metrics.api';
import { fmtDuration, pct } from '../../utils/format';
import { Card, ErrorState, Field, Input, Spinner } from '../../components/ui';

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function DashboardPage() {
  const now = new Date();
  const [from, setFrom] = useState(iso(new Date(now.getTime() - 14 * 864e5)));
  const [to, setTo] = useState(iso(now));

  const { data, loading, error, reload } = useAsync(() => metricsApi.get({ from, to }), [from, to]);
  const maxDaily = data ? Math.max(1, ...data.dailyVolume.map((d) => d.total)) : 1;

  return (
    <div className="space-y-4">
      <Card title="Rango de fechas (UTC-5)">
        <div className="flex flex-wrap gap-3">
          <Field label="Desde"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="Hasta"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && !loading && (
        <>
          <Card title="Métricas por agente">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Agente</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Resueltas</th>
                    <th className="px-3 py-2">Tasa</th>
                    <th className="px-3 py-2">Tiempo prom. resolución</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perAgent.map((a) => (
                    <tr key={a.agentId} className="border-t border-slate-100">
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
