import { Migration } from '@mikro-orm/migrations';

/**
 * Recrea v_interaction añadiendo duration_sec (duración de la llamada).
 * Las llamadas la tienen; los tickets no (null), pues no aplica.
 */
export class Migration20260723130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`drop view if exists "v_interaction";`);
    this.addSql(`create view "v_interaction" as
      select c.id, 'CALL' as type, c.status, c.agent_id, u.customer_id, c.disposition_id, c.opened_at, c.closed_at, c.duration_sec
        from "call" c join "user" u on u.id = c.agent_id
      union all
      select t.id, 'TICKET' as type, t.status, t.agent_id, u.customer_id, t.disposition_id, t.opened_at, t.closed_at, null::int as duration_sec
        from "ticket" t join "user" u on u.id = t.agent_id;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop view if exists "v_interaction";`);
    this.addSql(`create view "v_interaction" as
      select c.id, 'CALL' as type, c.status, c.agent_id, u.customer_id, c.disposition_id, c.opened_at, c.closed_at
        from "call" c join "user" u on u.id = c.agent_id
      union all
      select t.id, 'TICKET' as type, t.status, t.agent_id, u.customer_id, t.disposition_id, t.opened_at, t.closed_at
        from "ticket" t join "user" u on u.id = t.agent_id;`);
  }
}
