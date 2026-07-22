import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseInteraction } from './base-interaction.entity';
import { TicketPriority } from './enums';

/** Ticket (petición/incidencia). Comparte ciclo de vida con Call vía BaseInteraction. */
@Entity()
@Index({ properties: ['agent', 'openedAt'] })
@Index({ properties: ['status'] })
@Index({ properties: ['openedAt'] })
export class Ticket extends BaseInteraction {
  @Property()
  subject!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Enum(() => TicketPriority)
  priority: TicketPriority = TicketPriority.MEDIUM;

  @Property({ nullable: true })
  channel?: string;
}
