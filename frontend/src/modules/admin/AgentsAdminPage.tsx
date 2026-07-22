import { useState, type FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { usersApi } from '../../api/users.api';
import { apiError } from '../../api/client';
import type { Role } from '../../types';
import { Badge, Button, Card, ErrorState, Field, Input, Select, Spinner } from '../../components/ui';

export default function AgentsAdminPage() {
  const { user } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  const { data, loading, error } = useAsync(async () => {
    const me = await usersApi.get(user!.id);
    const list = await usersApi.list({ customerId: me.customer?.id, limit: 100 });
    return { me, list };
  }, [reloadKey]);

  const [form, setForm] = useState({ name: '', email: '', role: 'AGENT' as Role, password: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error ?? 'Error'} />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await usersApi.create(form);
      setForm({ name: '', email: '', role: 'AGENT', password: '' });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setFormError(null);
    try {
      await usersApi.remove(id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setFormError(apiError(err));
    }
  };

  return (
    <div className="space-y-4">
      <Card title={`Organización: ${data.me.customer?.name ?? '—'}`}>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <Field label="Nombre"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Rol">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="AGENT">AGENT</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </Field>
          <Field label="Contraseña"><Input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
          <Button type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear usuario'}</Button>
        </form>
        {formError && <div className="mt-3"><ErrorState message={formError} /></div>}
      </Card>

      <Card title="Usuarios de la organización">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Disponibilidad</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.list.items.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-700">{u.name}</td>
                  <td className="px-3 py-2 text-slate-500">{u.email}</td>
                  <td className="px-3 py-2"><Badge>{u.role}</Badge></td>
                  <td className="px-3 py-2 text-slate-500">{u.availability?.label ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    {u.id !== user!.id && (
                      <Button variant="danger" onClick={() => remove(u.id)}>Eliminar</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
