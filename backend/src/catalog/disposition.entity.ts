import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Catálogo de tipificación: cómo concluyó una interacción
 * (RESUELTO, NO_CONTESTA, BUZON, ESCALADO...). Administrable.
 */
@Entity()
export class Disposition {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ unique: true })
  code!: string;

  @Property()
  label!: string;

  @Property({ default: true })
  active: boolean = true;
}
