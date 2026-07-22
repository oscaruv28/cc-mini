import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    ghost: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          {title && <h2 className="font-semibold text-slate-800">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span>⚠ {message}</span>
      {onRetry && (
        <button className="font-medium underline" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
};

export function Badge({ children }: { children: string }) {
  const style = STATUS_STYLES[children] ?? 'bg-slate-100 text-slate-600';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{children}</span>;
}
