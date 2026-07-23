import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { InteractionStatus } from '../enums';
import { User } from '../../users/user.entity';
import { Disposition } from '../../catalog/disposition.entity';

/**
 * Clase base abstracta: reúne los campos de ciclo de vida comunes a `Call` y
 * `Ticket`. NO es una tabla (MikroORM la hereda en cada entidad concreta, que
 * sí tiene su propia tabla con estas columnas). No usa herencia de tabla.
 */
@Entity({ abstract: true })
export abstract class BaseInteraction {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Enum(() => InteractionStatus)
  status: InteractionStatus = InteractionStatus.OPEN;

  /** Agente asignado (User con rol AGENT) que la atiende/crea. */
  @ManyToOne(() => User)
  agent!: User;

  /** Tipificación: cómo concluyó. Se fija al resolver. */
  @ManyToOne(() => Disposition, { nullable: true })
  disposition?: Disposition;

  @Property({ columnType: 'timestamptz' })
  openedAt: Date = new Date();

  /** Solo se llena al pasar a RESOLVED. */
  @Property({ columnType: 'timestamptz', nullable: true })
  closedAt?: Date;

  @Property({ columnType: 'timestamptz' })
  createdAt: Date = new Date();

  @Property({ columnType: 'timestamptz', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
