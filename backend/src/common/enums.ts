/**
 * Enums compartidos por más de un módulo (calls, tickets, la vista de lectura y
 * las métricas). Los enums propios de un dominio viven junto a su módulo:
 * `CallDirection` en `calls/call.types.ts`, `TicketPriority` en
 * `tickets/ticket.types.ts`, `UserRole` en `users/user.types.ts`.
 */

/** Distingue el tipo de interacción en el read model unificado (`v_interaction`). */
export enum InteractionType {
  CALL = 'CALL',
  TICKET = 'TICKET',
}

/** Ciclo de vida común a llamadas y tickets. */
export enum InteractionStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}
