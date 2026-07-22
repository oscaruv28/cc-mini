import { Migration } from '@mikro-orm/migrations';

/**
 * Recrea v_interaction incluyendo customer_id (vía el agente), para aislar
 * las consultas de interacciones y métricas por empresa.
 */
export class Migration20260722150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`drop view if exists "v_interaction";`);
    this.addSql(`create view "v_interaction" as
      select c.id, 'CALL' as type, c.status, c.agent_id, u.customer_id, c.disposition_id, c.opened_at, c.closed_at
        from "call" c join "user" u on u.id = c.agent_id
      union all
      select t.id, 'TICKET' as type, t.status, t.agent_id, u.customer_id, t.disposition_id, t.opened_at, t.closed_at
        from "ticket" t join "user" u on u.id = t.agent_id;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop view if exists "v_interaction";`);
    this.addSql(`create view "v_interaction" as
      select "id", 'CALL' as type, "status", "agent_id", "disposition_id", "opened_at", "closed_at" from "call"
      union all
      select "id", 'TICKET' as type, "status", "agent_id", "disposition_id", "opened_at", "closed_at" from "ticket";`);
  }
}
