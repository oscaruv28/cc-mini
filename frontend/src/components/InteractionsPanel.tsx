import { useMemo, useState } from 'react';
import { interactionsApi, type InteractionFilters } from '../api/interactions.api';
import { apiError } from '../api/client';
import { useAsync } from '../hooks/useAsync';
import { fmtDateTime, fmtDuration } from '../utils/format';
import type { Disposition, InteractionRow, InteractionStatus } from '../types';
import { Badge, Button, ErrorState, Select, Spinner } from './ui';

const NEXT: Partial<Record<InteractionStatus, InteractionStatus>> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
};

interface Props {
  lockedAgentId?: string;
  agents: { id: string; name: string }[];
  dispositions: Disposition[];
  reloadKey?: number;
  /** El agente avanza el estado (flujo operativo). El admin solo edita la tipificación. */
  allowStatusChange?: boolean;
  /** Fija el tipo (p. ej. módulo de Tickets) y oculta el filtro de tipo. */
  lockedType?: 'CALL' | 'TICKET';
  /** Rango de fechas fijo (para cruzar con las métricas del dashboard). */
  from?: string;
  to?: string;
  /** Si se pasa, cada fila muestra "Ver" para abrir el detalle. */
  onSelect?: (row: InteractionRow) => void;
}

export default function InteractionsPanel({
  lockedAgentId,
  agents,
  dispositions,
  reloadKey = 0,
  allowStatusChange = false,
  lockedType,
  from,
  to,
  onSelect,
}: Props) {
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [agentId, setAgentId] = useState('');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const limit = 10;

  const agentName = useMemo(() => new Map(agents.map((a) => [a.id, a.name])), [agents]);

  const filters: InteractionFilters = {
    page,
    limit,
    ...(lockedAgentId ? { agentId: lockedAgentId } : agentId ? { agentId } : {}),
    ...(status ? { status: status as InteractionStatus } : {}),
    ...(lockedType ? { type: lockedType } : type ? { type: type as 'CALL' | 'TICKET' } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };

  const { data, loading, error, reload } = useAsync(
    () => interactionsApi.list(filters),
    [status, type, agentId, page, lockedAgentId, lockedType, from, to, reloadKey],
  );

  const act = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setActionError(apiError(e));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="w-40">
          <option value="">Estado: todos</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
        </Select>
        {!lockedType && (
          <Select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }} className="w-40">
            <option value="">Tipo: todos</option>
            <option value="CALL">CALL</option>
            <option value="TICKET">TICKET</option>
          </Select>
        )}
        {!lockedAgentId && (
          <Select value={agentId} onChange={(e) => { setPage(1); setAgentId(e.target.value); }} className="w-48">
            <option value="">Agente: todos</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        )}
      </div>

      {actionError && <ErrorState message={actionError} />}
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && !loading && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Estado</th>
                  {!lockedAgentId && <th className="px-3 py-2">Agente</th>}
                  <th className="px-3 py-2">Apertura</th>
                  <th className="px-3 py-2">Cierre</th>
                  <th className="px-3 py-2">Duración</th>
                  <th className="px-3 py-2">Tipificación</th>
                  {onSelect && <th className="px-3 py-2">Detalle</th>}
                </tr>
              </thead>
              <tbody>
                {data.items.map((it: InteractionRow) => (
                  <tr key={it.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{it.type}</td>
                    <td className="px-3 py-2">
                      {allowStatusChange && NEXT[it.status] ? (
                        <button
                          type="button"
                          title={`Clic para pasar a ${NEXT[it.status]}`}
                          className="inline-flex items-center gap-1 rounded hover:opacity-80"
                          onClick={() => act(() => interactionsApi.changeStatus(it.type, it.id, NEXT[it.status]!))}
                        >
                          <Badge>{it.status}</Badge>
                          <span className="text-xs font-medium text-indigo-600">→ {NEXT[it.status]}</span>
                        </button>
                      ) : (
                        <Badge>{it.status}</Badge>
                      )}
                    </td>
                    {!lockedAgentId && <td className="px-3 py-2">{agentName.get(it.agentId) ?? '—'}</td>}
                    <td className="px-3 py-2 text-slate-500">{fmtDateTime(it.openedAt)}</td>
                    <td className="px-3 py-2 text-slate-500">{fmtDateTime(it.closedAt)}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {it.type === 'CALL' ? fmtDuration(it.durationSec ?? null) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        className="w-40"
                        value={it.dispositionId ?? ''}
                        onChange={(e) => e.target.value && act(() => interactionsApi.tipify(it.type, it.id, e.target.value))}
                      >
                        <option value="">Sin tipificar</option>
                        {dispositions.map((d) => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </Select>
                    </td>
                    {onSelect && (
                      <td className="px-3 py-2">
                        <button className="text-xs font-medium text-indigo-600 underline" onClick={() => onSelect(it)}>
                          Ver
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr><td colSpan={(lockedAgentId ? 6 : 7) + (onSelect ? 1 : 0)} className="px-3 py-6 text-center text-slate-400">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{data.total} interacciones · página {data.page}/{data.pages || 1}</span>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
