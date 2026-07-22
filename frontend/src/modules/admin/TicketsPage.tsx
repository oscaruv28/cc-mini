import { useState, type FormEvent } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { usersApi } from '../../api/users.api';
import { catalogApi } from '../../api/catalog.api';
import { interactionsApi } from '../../api/interactions.api';
import { apiError } from '../../api/client';
import { Button, Card, ErrorState, Field, Input, Select, Spinner } from '../../components/ui';
import InteractionsPanel from '../../components/InteractionsPanel';

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
        <InteractionsPanel agents={agents} dispositions={dispositions} lockedType="TICKET" reloadKey={reloadKey} allowStatusChange />
      </Card>
    </div>
  );
}
