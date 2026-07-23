import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { catalogApi } from '../../api/catalog.api';
import { usersApi } from '../../api/users.api';
import { apiError } from '../../api/client';
import { Card, ErrorState, Field, Select, Spinner } from '../../components/ui';
import InteractionsPanel from '../../components/InteractionsPanel';
import Softphone from './Softphone';

export default function AgentWorkspace() {
  const { user } = useAuth();
  const agentId = user!.id; // agente de la sesión actual

  const { data, loading, error, reload } = useAsync(
    () => Promise.all([catalogApi.dispositions(), catalogApi.availabilities(), usersApi.get(agentId)]),
    [agentId],
  );

  const [reloadKey, setReloadKey] = useState(0);
  const [availError, setAvailError] = useState<string | null>(null);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? 'Error'} onRetry={reload} />;
  const [dispositions, availabilities, me] = data;

  const changeAvailability = async (availabilityId: string) => {
    setAvailError(null);
    try {
      await usersApi.setAvailability(agentId, availabilityId);
      await reload();
    } catch (e) {
      setAvailError(apiError(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
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
          {availError && <div className="mt-2"><ErrorState message={availError} /></div>}
        </Card>

        <Softphone agentId={agentId} onRegistered={() => setReloadKey((k) => k + 1)} />
      </div>

      <Card title="Mis llamadas">
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
