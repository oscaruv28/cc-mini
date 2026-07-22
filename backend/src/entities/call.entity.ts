import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { BaseInteraction } from './base-interaction.entity';
import { CallDirection } from './enums';

/** Llamada. Comparte ciclo de vida con Ticket vía BaseInteraction. */
@Entity()
@Index({ properties: ['agent', 'openedAt'] })
@Index({ properties: ['status'] })
@Index({ properties: ['openedAt'] })
export class Call extends BaseInteraction {
  @Enum(() => CallDirection)
  direction!: CallDirection;

  @Property({ nullable: true })
  durationSec?: number;

  @Property({ nullable: true })
  phoneNumber?: string;
}
