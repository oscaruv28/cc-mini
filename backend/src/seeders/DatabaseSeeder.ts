import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcryptjs';
import { Customer } from '../entities/customer.entity';
import { User } from '../entities/user.entity';
import { Disposition } from '../entities/disposition.entity';
import { Call } from '../entities/call.entity';
import { Ticket } from '../entities/ticket.entity';
import { CallDirection, InteractionStatus, TicketPriority, UserRole } from '../entities/enums';
import { DemoSeeder } from './DemoSeeder';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
/** Fecha aleatoria en los últimos 14 días (cualquier hora → cruza medianoche). */
const randomOpened = () => new Date(Date.now() - randInt(0, 14 * 24 * 3600) * 1000);

/**
 * Seed principal (`npm run seed`). Idempotente:
 * - Catálogos + usuarios demo (vía DemoSeeder) + agentes extra.
 * - Cientos de interacciones (llamadas y tickets) SOLO si aún no hay ninguna,
 *   repartidas entre agentes, con estados ponderados y fechas que cruzan medianoche.
 */
export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.call(em, [DemoSeeder]);

    const customer = await em.findOne(Customer, { name: 'Banco Demo' });
    if (!customer) return;

    const extra: [string, string][] = [
      ['Marta Gómez', 'marta@demo.co'],
      ['Pedro Niño', 'pedro@demo.co'],
      ['Carlos Ruiz', 'carlos@demo.co'],
    ];
    const hash = await bcrypt.hash('secret123', 10);
    for (const [name, email] of extra) {
      if (!(await em.findOne(User, { email }))) {
        em.create(User, { name, email, role: UserRole.AGENT, customer, passwordHash: hash, createdAt: new Date() });
      }
    }
    await em.flush();

    // Bulk solo si no hay interacciones (idempotencia).
    if ((await em.count(Call)) > 0 || (await em.count(Ticket)) > 0) return;

    const agents = await em.find(User, { role: UserRole.AGENT });
    const dispositions = await em.find(Disposition, { active: true });
    const priorities = [TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH];
    const channels = ['web', 'app', 'email', 'whatsapp'];

    const rollStatus = () => {
      const r = Math.random();
      return r < 0.7 ? InteractionStatus.RESOLVED : r < 0.9 ? InteractionStatus.IN_PROGRESS : InteractionStatus.OPEN;
    };

    for (let i = 0; i < 400; i++) {
      const opened = randomOpened();
      const status = rollStatus();
      const dur = randInt(20, 900);
      em.create(Call, {
        agent: pick(agents),
        direction: Math.random() < 0.5 ? CallDirection.INBOUND : CallDirection.OUTBOUND,
        phoneNumber: '+57' + randInt(3000000000, 3299999999),
        status,
        openedAt: opened,
        closedAt: status === InteractionStatus.RESOLVED ? new Date(opened.getTime() + dur * 1000) : undefined,
        disposition: status === InteractionStatus.RESOLVED && dispositions.length ? pick(dispositions) : undefined,
        durationSec: dur,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    for (let i = 0; i < 150; i++) {
      const opened = randomOpened();
      const status = rollStatus();
      const dur = randInt(120, 3600);
      em.create(Ticket, {
        agent: pick(agents),
        subject: `Ticket #${i + 1}`,
        description: 'Incidencia generada por el seed',
        priority: pick(priorities),
        channel: pick(channels),
        status,
        openedAt: opened,
        closedAt: status === InteractionStatus.RESOLVED ? new Date(opened.getTime() + dur * 1000) : undefined,
        disposition: status === InteractionStatus.RESOLVED && dispositions.length ? pick(dispositions) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await em.flush();
  }
}
