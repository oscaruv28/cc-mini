import { useState, type FormEvent } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { usersApi } from '../../api/users.api';
import { catalogApi } from '../../api/catalog.api';
import { interactionsApi } from '../../api/interactions.api';
import { apiError } from '../../api/client';
import { Badge, Button, Card, ErrorState, Field, Input, Select, Spinner } from '../../components/ui';
import InteractionsPanel from '../../components/InteractionsPanel';
import { fmtDateTime } from '../../utils/format';
import type { TicketDetail } from '../../types';

/**
 * Módulo de Tickets (admin): el admin abre un ticket y lo asigna a un agente,
 * que lo atenderá/resolverá. Debajo, el listado de tickets (solo tipo TICKET).
 */
export default function TicketsPage() {
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([usersApi.list({ role: 'AGENT', limit: 100 }), catalogApi.dispositions()]),
    [],
  );

  const [form, setForm] = useState({ agentId: '', subject: '', description: '', priority: 'MEDIUM' });
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailErr, setDetailErr] = useState<string | null>(null);

  const openDetail = async (id: string) => {
    setDetailErr(null);
    try {
      setDetail(await interactionsApi.getTicket(id));
    } catch (e) {
      setDetailErr(apiError(e));
    }
  };

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? 'Error'} onRetry={reload} />;
  const [agentsPage, dispositions] = data;
  const agents = agentsPage.items.map((u) => ({ id: u.id, name: u.name }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await interactionsApi.createTicket(form);
      setForm({ agentId: '', subject: '', description: '', priority: 'MEDIUM' });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Abrir ticket">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <Field label="Asunto">
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          </Field>
          <Field label="Agente asignado">
            <Select value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })} required className="w-48">
              <option value="" disabled>Selecciona…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridad">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </Select>
          </Field>
          <Field label="Descripción">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-64" />
          </Field>
          <Button type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear ticket'}</Button>
        </form>
        {formError && <div className="mt-3"><ErrorState message={formError} /></div>}
      </Card>

      <Card title="Tickets">
        {detailErr && <div className="mb-2"><ErrorState message={detailErr} /></div>}
        <InteractionsPanel
          agents={agents}
          dispositions={dispositions}
          lockedType="TICKET"
          reloadKey={reloadKey}
          allowStatusChange
          onSelect={(row) => openDetail(row.id)}
        />
      </Card>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-800">{detail.subject}</h3>
              <Badge>{detail.status}</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
              <div><dt className="text-slate-400">Agente</dt><dd className="text-slate-700">{detail.agent?.name ?? '—'}</dd></div>
              <div><dt className="text-slate-400">Prioridad</dt><dd className="text-slate-700">{detail.priority}</dd></div>
              <div><dt className="text-slate-400">Canal</dt><dd className="text-slate-700">{detail.channel ?? '—'}</dd></div>
              <div><dt className="text-slate-400">Tipificación</dt><dd className="text-slate-700">{detail.disposition?.label ?? 'Sin tipificar'}</dd></div>
              <div><dt className="text-slate-400">Apertura</dt><dd className="text-slate-700">{fmtDateTime(detail.openedAt)}</dd></div>
              <div><dt className="text-slate-400">Cierre</dt><dd className="text-slate-700">{fmtDateTime(detail.closedAt ?? null)}</dd></div>
            </dl>
            <div className="mt-4">
              <div className="text-sm text-slate-400">Descripción — qué sucedió</div>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {detail.description || 'Sin descripción'}
              </p>
            </div>
            <div className="mt-5 text-right">
              <Button variant="ghost" onClick={() => setDetail(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
