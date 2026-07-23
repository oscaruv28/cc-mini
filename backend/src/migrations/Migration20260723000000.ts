import { Migration } from '@mikro-orm/migrations';

/** Relación opcional ticket → call (un ticket puede originarse en una llamada). */
export class Migration20260723000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "ticket" add column "call_id" uuid null;`);
    this.addSql(
      `alter table "ticket" add constraint "ticket_call_id_foreign" foreign key ("call_id") references "call" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "ticket" drop constraint "ticket_call_id_foreign";`);
    this.addSql(`alter table "ticket" drop column "call_id";`);
  }
}
