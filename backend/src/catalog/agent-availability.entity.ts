import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Catálogo de disponibilidad del agente (AVAILABLE, BUSY, ON_BREAK, OFFLINE...).
 * `canTakeCalls` codifica la regla de si el sistema puede asignarle llamadas.
 */
@Entity()
export class AgentAvailability {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ unique: true })
  code!: string;

  @Property()
  label!: string;

  @Property({ default: false })
  canTakeCalls: boolean = false;

  @Property({ default: true })
  active: boolean = true;
}
