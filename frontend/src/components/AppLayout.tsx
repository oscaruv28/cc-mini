import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAsync } from '../hooks/useAsync';
import { usersApi } from '../api/users.api';
import { AvailabilityBulb, AVAILABILITY_CHANGED } from './AvailabilityBulb';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const isAgent = user?.role === 'AGENT';

  // Disponibilidad del agente en sesión (para el bombillito del header).
  const { data: me, reload } = useAsync(
    () => (isAgent && user ? usersApi.get(user.id) : Promise.resolve(null)),
    [user?.id, isAgent],
  );

  // Se mantiene en sync cuando el agente cambia su estado en el workspace.
  useEffect(() => {
    const onChange = () => reload();
    window.addEventListener(AVAILABILITY_CHANGED, onChange);
    return () => window.removeEventListener(AVAILABILITY_CHANGED, onChange);
  }, [reload]);

  const links =
    user?.role === 'ADMIN'
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/interactions', label: 'Interacciones' },
          { to: '/tickets', label: 'Tickets' },
          { to: '/agents', label: 'Agentes' },
        ]
      : [{ to: '/agent', label: 'Mi workspace' }];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-indigo-600">CC-Mini</span>
            <nav className="flex gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-medium ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-slate-500">
              {isAgent && (
                <AvailabilityBulb code={me?.availability?.code} label={me?.availability?.label} />
              )}
              {user?.name} · <span className="font-medium text-slate-700">{user?.role}</span>
            </span>
            <button onClick={logout} className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
