import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { catalogApi } from '../../api/catalog.api';
import { usersApi } from '../../api/users.api';
import { interactionsApi } from '../../api/interactions.api';
import { apiError } from '../../api/client';
import { Button, Card, ErrorState, Field, Input, Select, Spinner } from '../../components/ui';
import InteractionsPanel from '../../components/InteractionsPanel';

export default function AgentWorkspace() {
  const { user } = useAuth();
  const agentId = user!.id;

  const { data, loading, error, reload } = useAsync(
    () => Promise.all([catalogApi.dispositions(), catalogApi.availabilities(), usersApi.get(agentId)]),
    [agentId],
  );

  const [count, setCount] = useState(5);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? 'Error'} onRetry={reload} />;
  const [dispositions, availabilities, me] = data;

  const simulate = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await interactionsApi.simulate(agentId, count);
      setMsg(`Se generaron ${res.created} llamadas.`);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const changeAvailability = async (availabilityId: string) => {
    try {
      await usersApi.setAvailability(agentId, availabilityId);
      await reload();
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Mi disponibilidad">
          <Field label="Estado actual">
            <Select value={me.availability?.id ?? ''} onChange={(e) => changeAvailability(e.target.value)}>
              <option value="" disabled>Selecciona…</option>
              {availabilities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} {a.canTakeCalls ? '(puede atender)' : ''}
                </option>
              ))}
            </Select>
          </Field>
        </Card>

        <Card title="Simular llamada">
          <div className="flex items-end gap-2">
            <Field label="Cantidad">
              <Input type="number" min={1} max={500} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-24" />
            </Field>
            <Button onClick={simulate} disabled={busy}>{busy ? 'Generando…' : 'Simular'}</Button>
          </div>
          {msg && <p className="mt-2 text-sm text-slate-500">{msg}</p>}
        </Card>
      </div>

      <Card title="Mis interacciones">
        <InteractionsPanel
          lockedAgentId={agentId}
          agents={[{ id: agentId, name: me.name }]}
          dispositions={dispositions}
          reloadKey={reloadKey}
          allowStatusChange
          lockedType="CALL"
        />
      </Card>
    </div>
  );
}
