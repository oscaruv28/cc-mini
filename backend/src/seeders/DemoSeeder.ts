import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcryptjs';
import { Customer } from '../catalog/customer.entity';
import { User } from '../users/user.entity';
import { Disposition } from '../catalog/disposition.entity';
import { AgentAvailability } from '../catalog/agent-availability.entity';
import { UserRole } from '../users/user.types';

const DISPOSITIONS = [
  ['RESUELTO', 'Resuelto'],
  ['NO_CONTESTA', 'No contesta'],
  ['BUZON', 'Buzón de voz'],
  ['ESCALADO', 'Escalado'],
  ['CLIENTE_COLGO', 'Cliente colgó'],
];

const AVAILABILITIES: [string, string, boolean][] = [
  ['AVAILABLE', 'Disponible', true],
  ['BUSY', 'Ocupado', false],
  ['ON_BREAK', 'En pausa', false],
  ['ACW', 'Trabajo post-llamada', false],
  ['OFFLINE', 'Desconectado', false],
];

/**
 * Semilla idempotente: usuarios demo (login) + catálogos de tipificación y
 * disponibilidad. Reejecutable sin duplicar (busca por code/email).
 */
export class DemoSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const [code, label] of DISPOSITIONS) {
      if (!(await em.findOne(Disposition, { code }))) {
        em.create(Disposition, { code, label, active: true });
      }
    }

    for (const [code, label, canTakeCalls] of AVAILABILITIES) {
      if (!(await em.findOne(AgentAvailability, { code }))) {
        em.create(AgentAvailability, { code, label, canTakeCalls, active: true });
      }
    }
    await em.flush();

    let customer = await em.findOne(Customer, { name: 'Banco Demo' });
    if (!customer) {
      customer = em.create(Customer, { name: 'Banco Demo', createdAt: new Date() });
    }

    const available = await em.findOne(AgentAvailability, { code: 'AVAILABLE' });
    await this.upsertUser(em, customer, 'Admin Demo', 'admin@demo.co', UserRole.ADMIN, 'admin123');
    const agent = await this.upsertUser(em, customer, 'Agente Demo', 'agente@demo.co', UserRole.AGENT, 'agente123');
    if (agent && available) agent.availability = available;

    await em.flush();
  }

  private async upsertUser(
    em: EntityManager,
    customer: Customer,
    name: string,
    email: string,
    role: UserRole,
    password: string,
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await em.findOne(User, { email });
    if (existing) {
      existing.passwordHash = passwordHash;
      return existing;
    }
    return em.create(User, { name, email, role, customer, passwordHash, createdAt: new Date() });
  }
}
