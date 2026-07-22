import { Migration } from '@mikro-orm/migrations';

/** Catálogo de disponibilidad del agente + FK en user. */
export class Migration20260722140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "agent_availability" ("id" uuid not null default gen_random_uuid(), "code" varchar(255) not null, "label" varchar(255) not null, "can_take_calls" boolean not null default false, "active" boolean not null default true, constraint "agent_availability_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "agent_availability" add constraint "agent_availability_code_unique" unique ("code");`,
    );

    this.addSql(`alter table "user" add column "availability_id" uuid null;`);
    this.addSql(
      `alter table "user" add constraint "user_availability_id_foreign" foreign key ("availability_id") references "agent_availability" ("id") on update cascade on delete set null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop constraint "user_availability_id_foreign";`);
    this.addSql(`alter table "user" drop column "availability_id";`);
    this.addSql(`drop table if exists "agent_availability" cascade;`);
  }
}
