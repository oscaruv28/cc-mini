import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcryptjs';
import { Customer } from '../catalog/customer.entity';
import { User } from '../users/user.entity';
import { Disposition } from '../catalog/disposition.entity';
import { Call } from '../calls/call.entity';
import { Ticket } from '../tickets/ticket.entity';
import { InteractionStatus } from '../common/enums';
import { CallDirection } from '../calls/call.types';
import { TicketPriority } from '../tickets/ticket.types';
import { UserRole } from '../users/user.types';
import { DemoSeeder } from './DemoSeeder';

/** Casos realistas (con tildes) para las descripciones de los tickets. */
const TICKET_CASES: [string, string][] = [
  ['No puedo iniciar sesión', 'El cliente no logra ingresar; la cuenta figura bloqueada tras varios intentos fallidos. Se solicitó el reseteo de contraseña.'],
  ['Cobro duplicado', 'El usuario reporta un doble cargo en la factura del mes. Se confirmó el cobro y se escaló al área de facturación para la reversa.'],
  ['La aplicación se cierra sola', 'La app se cierra al abrir la sección de pagos. Se pidió la versión de la aplicación y el modelo del teléfono para reproducir el error.'],
  ['Demora en la atención', 'El cliente se quejó por el tiempo de espera en la línea antes de ser atendido. Se registró la observación para el área de calidad.'],
  ['Solicitud de información', 'El usuario pidió detalles sobre los planes disponibles y sus beneficios. Se le explicaron las opciones y quedó conforme.'],
  ['Error al actualizar datos', 'Al intentar actualizar su dirección, el sistema muestra un error. Se registró el caso para revisión técnica.'],
  ['Reclamo por facturación', 'El cliente indica que el valor cobrado no corresponde con su plan. Se está validando con el histórico de consumo.'],
];

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
      const [subject, description] = pick(TICKET_CASES);
      em.create(Ticket, {
        agent: pick(agents),
        subject,
        description,
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
