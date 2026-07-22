import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiError } from '../../api/client';
import { Button, Field, Input } from '../../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.co');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(user.role === 'ADMIN' ? '/dashboard' : '/agent', { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">CC-Mini · Contact Center</h1>
          <p className="text-sm text-slate-500">Ingresa para continuar</p>
        </div>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Contraseña">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </Button>
        <p className="text-center text-xs text-slate-400">
          Demo: admin@demo.co / admin123 · agente@demo.co / agente123
        </p>
      </form>
    </div>
  );
}
