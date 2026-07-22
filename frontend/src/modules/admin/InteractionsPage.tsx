import { useAsync } from '../../hooks/useAsync';
import { usersApi } from '../../api/users.api';
import { catalogApi } from '../../api/catalog.api';
import { Card, ErrorState, Spinner } from '../../components/ui';
import InteractionsPanel from '../../components/InteractionsPanel';

export default function InteractionsPage() {
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([usersApi.list({ role: 'AGENT', limit: 100 }), catalogApi.dispositions()]),
    [],
  );

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? 'Error'} onRetry={reload} />;
  const [agentsPage, dispositions] = data;
  const agents = agentsPage.items.map((u) => ({ id: u.id, name: u.name }));

  return (
    <Card title="Interacciones (todos los agentes)">
      <InteractionsPanel agents={agents} dispositions={dispositions} />
    </Card>
  );
}
