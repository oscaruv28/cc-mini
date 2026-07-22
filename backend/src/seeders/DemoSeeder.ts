import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcryptjs';
import { Customer } from '../entities/customer.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/enums';

/**
 * Semilla mínima para poder autenticarse:
 *   admin@demo.co  / admin123   (ADMIN)
 *   agente@demo.co / agente123  (AGENT)
 * Idempotente: si el usuario ya existe, solo actualiza su contraseña.
 */
export class DemoSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    let customer = await em.findOne(Customer, { name: 'Banco Demo' });
    if (!customer) {
      customer = em.create(Customer, { name: 'Banco Demo', createdAt: new Date() });
    }

    await this.upsertUser(em, customer, 'Admin Demo', 'admin@demo.co', UserRole.ADMIN, 'admin123');
    await this.upsertUser(em, customer, 'Agente Demo', 'agente@demo.co', UserRole.AGENT, 'agente123');
  }

  private async upsertUser(
    em: EntityManager,
    customer: Customer,
    name: string,
    email: string,
    role: UserRole,
    password: string,
  ): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await em.findOne(User, { email });
    if (existing) {
      existing.passwordHash = passwordHash;
      return;
    }
    em.create(User, { name, email, role, customer, passwordHash, createdAt: new Date() });
  }
}
