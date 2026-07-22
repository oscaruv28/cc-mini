import { Entity, Enum, Property } from '@mikro-orm/core';
import { InteractionStatus, InteractionType } from './enums';

/**
 * Entidad virtual (solo lectura) mapeada a la vista `v_interaction`.
 * Es el modelo de LECTURA unificado: listar interacciones y métricas leen de
 * aquí, sin unir `call`+`ticket` en cada consulta. No genera tabla.
 */
@Entity({ expression: 'select * from v_interaction' })
export class InteractionView {
  @Property({ type: 'uuid' })
  id!: string;

  @Enum(() => InteractionType)
  type!: InteractionType;

  @Enum(() => InteractionStatus)
  status!: InteractionStatus;

  @Property({ type: 'uuid' })
  agentId!: string;

  @Property({ type: 'uuid' })
  customerId!: string;

  @Property({ type: 'uuid', nullable: true })
  dispositionId?: string;

  @Property({ columnType: 'timestamptz' })
  openedAt!: Date;

  @Property({ columnType: 'timestamptz', nullable: true })
  closedAt?: Date;
}
