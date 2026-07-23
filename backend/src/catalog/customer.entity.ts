import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { User } from '../users/user.entity';

/** Empresa cliente de WeKall (el "tenant") que usa el contact center. */
@Entity()
export class Customer {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property()
  name!: string;

  /** NIT/identificador de la empresa. */
  @Property({ nullable: true })
  documentId?: string;

  @Property({ columnType: 'timestamptz' })
  createdAt: Date = new Date();

  @OneToMany(() => User, (user) => user.customer)
  users = new Collection<User>(this);
}
