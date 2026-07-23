import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { catalogApi } from '../../api/catalog.api';
import { usersApi } from '../../api/users.api';
import { apiError } from '../../api/client';
import { Card, ErrorState, Field, Select, Spinner } from '../../components/ui';
import InteractionsPanel from '../../components/InteractionsPanel';
import { AvailabilityBulb, AVAILABILITY_CHANGED } from '../../components/AvailabilityBulb';
import Softphone from './Softphone';

export default function AgentWorkspace() {
  const { user } = useAuth();
  const agentId = user!.id; // agente de la sesión actual

  const { data, loading, error, reload } = useAsync(
    () =>
      Promise.all([
        catalogApi.dispositions(),
        catalogApi.availabilities(),
        usersApi.get(agentId),
        usersApi.list({ role: 'AGENT', limit: 100 }),
      ]),
    [agentId],
  );

  const [reloadKey, setReloadKey] = useState(0);
  const [availError, setAvailError] = useState<string | null>(null);
  const [avFilter, setAvFilter] = useState('');

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? 'Error'} onRetry={reload} />;
  const [dispositions, availabilities, me, team] = data;

  const changeAvailability = async (availabilityId: string) => {
    setAvailError(null);
    try {
      await usersApi.setAvailability(agentId, availabilityId);
      await reload();
      // Avisa al header (bombillito del agente en sesión) para que se refresque.
      window.dispatchEvent(new Event(AVAILABILITY_CHANGED));
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

        <Softphone
          agentId={agentId}
          dispositions={dispositions}
          onRegistered={() => setReloadKey((k) => k + 1)}
        />
      </div>

      <Card title="Disponibilidad del equipo">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-slate-500">Filtrar por disponibilidad:</span>
          <Select value={avFilter} onChange={(e) => setAvFilter(e.target.value)} className="w-52">
            <option value="">Todas</option>
            {availabilities.map((a) => (
              <option key={a.id} value={a.code}>{a.label}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {team.items
            .filter((u) => !avFilter || u.availability?.code === avFilter)
            .map((u) => (
            <div key={u.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <AvailabilityBulb code={u.availability?.code} label={u.availability?.label} />
              <span className="flex-1 font-medium text-slate-700">
                {u.name}{u.id === agentId && <span className="text-slate-400"> (tú)</span>}
              </span>
              <span className="text-xs text-slate-500">{u.availability?.label ?? 'Sin estado'}</span>
            </div>
          ))}
        </div>
      </Card>

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
