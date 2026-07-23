/** Evento global que dispara el workspace al cambiar la disponibilidad; el header lo escucha. */
export const AVAILABILITY_CHANGED = 'availability-changed';

/** Color del bombillito según el código de disponibilidad del agente. */
const BULB_COLOR: Record<string, string> = {
  AVAILABLE: 'text-emerald-500',
  BUSY: 'text-red-500',
  ON_BREAK: 'text-amber-500',
  ACW: 'text-indigo-500',
  OFFLINE: 'text-slate-400',
};

/**
 * Bombillito de disponibilidad: un ícono de bombillo teñido con el color que
 * corresponde al estado del agente (verde = disponible). Cuando está AVAILABLE
 * "brilla" con un leve resplandor. `title` muestra la etiqueta al pasar el mouse.
 */
export function AvailabilityBulb({
  code,
  label,
  size = 16,
}: {
  code?: string | null;
  label?: string | null;
  size?: number;
}) {
  const color = BULB_COLOR[code ?? ''] ?? 'text-slate-300';
  const glow = code === 'AVAILABLE';
  return (
    <span
      title={label ?? 'Sin estado'}
      aria-label={`Disponibilidad: ${label ?? 'sin estado'}`}
      className={`inline-flex shrink-0 ${color} ${glow ? 'drop-shadow-[0_0_4px_currentColor]' : ''}`}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.763-1.957 1.815-2.825A6 6 0 0010 1z" />
        <path d="M8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
      </svg>
    </span>
  );
}
