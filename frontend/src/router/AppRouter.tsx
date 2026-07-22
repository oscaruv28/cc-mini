import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import AppLayout from '../components/AppLayout';
import LoginPage from '../modules/auth/LoginPage';
import AgentWorkspace from '../modules/agent/AgentWorkspace';
import DashboardPage from '../modules/admin/DashboardPage';
import InteractionsPage from '../modules/admin/InteractionsPage';
import TicketsPage from '../modules/admin/TicketsPage';
import AgentsAdminPage from '../modules/admin/AgentsAdminPage';
import type { Role } from '../types';

function Protected() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'ADMIN' ? '/dashboard' : '/agent'} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protected />}>
        <Route index element={<HomeRedirect />} />
        <Route path="agent" element={<AgentWorkspace />} />
        <Route path="dashboard" element={<RequireRole role="ADMIN"><DashboardPage /></RequireRole>} />
        <Route path="interactions" element={<RequireRole role="ADMIN"><InteractionsPage /></RequireRole>} />
        <Route path="tickets" element={<RequireRole role="ADMIN"><TicketsPage /></RequireRole>} />
        <Route path="agents" element={<RequireRole role="ADMIN"><AgentsAdminPage /></RequireRole>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
