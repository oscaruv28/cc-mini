const TZ = 'America/Bogota';

export const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-CO', { timeZone: TZ }) : '—';

export function fmtDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export const pct = (rate: number) => `${(rate * 100).toFixed(1)}%`;
