import { InteractionStatus } from '../enums';

/**
 * Reglas del ciclo de vida de una interacción (lógica pura, unit-testeable).
 * abierta → en_progreso → resuelta. Sin saltos ni retrocesos.
 * La comparten `calls` y `tickets` (ambos tienen el mismo ciclo de vida).
 */
export const ALLOWED_TRANSITIONS: Record<InteractionStatus, InteractionStatus[]> = {
  [InteractionStatus.OPEN]: [InteractionStatus.IN_PROGRESS],
  [InteractionStatus.IN_PROGRESS]: [InteractionStatus.RESOLVED],
  [InteractionStatus.RESOLVED]: [],
};

export function canTransition(from: InteractionStatus, to: InteractionStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
