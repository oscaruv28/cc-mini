import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { UserRole } from './user.types';
import { Customer } from '../catalog/customer.entity';
import { AgentAvailability } from '../catalog/agent-availability.entity';

/**
 * Miembro del equipo de soporte de una empresa (`Customer`).
 * ADMIN revisa métricas; AGENT atiende/crea interacciones.
 */
@Entity()
export class User {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Enum(() => UserRole)
  role!: UserRole;

  /** Hash bcrypt de la contraseña. `hidden` para que nunca se serialice. */
  @Property({ hidden: true, nullable: true })
  passwordHash?: string;

  @ManyToOne(() => Customer)
  customer!: Customer;

  /** Disponibilidad actual del agente (nullable; aplica a agentes). */
  @ManyToOne(() => AgentAvailability, { nullable: true })
  availability?: AgentAvailability;

  @Property({ columnType: 'timestamptz' })
  createdAt: Date = new Date();
}
