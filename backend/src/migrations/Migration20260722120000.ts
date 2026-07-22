import { Migration } from '@mikro-orm/migrations';

/**
 * Migración inicial del núcleo: customer, user, disposition, call, ticket
 * (+ índices y FKs) y la vista de solo lectura v_interaction que unifica
 * call+ticket para las consultas de métricas.
 */
export class Migration20260722120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "customer" ("id" uuid not null default gen_random_uuid(), "name" varchar(255) not null, "document_id" varchar(255) null, "created_at" timestamptz not null, constraint "customer_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "disposition" ("id" uuid not null default gen_random_uuid(), "code" varchar(255) not null, "label" varchar(255) not null, "active" boolean not null default true, constraint "disposition_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "disposition" add constraint "disposition_code_unique" unique ("code");`,
    );

    this.addSql(
      `create table "user" ("id" uuid not null default gen_random_uuid(), "name" varchar(255) not null, "email" varchar(255) not null, "role" text check ("role" in ('ADMIN', 'AGENT')) not null, "customer_id" uuid not null, "created_at" timestamptz not null, constraint "user_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "user" add constraint "user_email_unique" unique ("email");`,
    );

    this.addSql(
      `create table "ticket" ("id" uuid not null default gen_random_uuid(), "status" text check ("status" in ('OPEN', 'IN_PROGRESS', 'RESOLVED')) not null default 'OPEN', "agent_id" uuid not null, "disposition_id" uuid null, "opened_at" timestamptz not null, "closed_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "subject" varchar(255) not null, "description" text null, "priority" text check ("priority" in ('LOW', 'MEDIUM', 'HIGH')) not null default 'MEDIUM', "channel" varchar(255) null, constraint "ticket_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "ticket_opened_at_index" on "ticket" ("opened_at");`);
    this.addSql(`create index "ticket_status_index" on "ticket" ("status");`);
    this.addSql(
      `create index "ticket_agent_id_opened_at_index" on "ticket" ("agent_id", "opened_at");`,
    );

    this.addSql(
      `create table "call" ("id" uuid not null default gen_random_uuid(), "status" text check ("status" in ('OPEN', 'IN_PROGRESS', 'RESOLVED')) not null default 'OPEN', "agent_id" uuid not null, "disposition_id" uuid null, "opened_at" timestamptz not null, "closed_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "direction" text check ("direction" in ('INBOUND', 'OUTBOUND')) not null, "duration_sec" int null, "phone_number" varchar(255) null, constraint "call_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "call_opened_at_index" on "call" ("opened_at");`);
    this.addSql(`create index "call_status_index" on "call" ("status");`);
    this.addSql(
      `create index "call_agent_id_opened_at_index" on "call" ("agent_id", "opened_at");`,
    );

    this.addSql(
      `alter table "user" add constraint "user_customer_id_foreign" foreign key ("customer_id") references "customer" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "ticket" add constraint "ticket_agent_id_foreign" foreign key ("agent_id") references "user" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "ticket" add constraint "ticket_disposition_id_foreign" foreign key ("disposition_id") references "disposition" ("id") on update cascade on delete set null;`,
    );
    this.addSql(
      `alter table "call" add constraint "call_agent_id_foreign" foreign key ("agent_id") references "user" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "call" add constraint "call_disposition_id_foreign" foreign key ("disposition_id") references "disposition" ("id") on update cascade on delete set null;`,
    );

    // Vista de solo lectura: superficie unificada que leen las métricas.
    this.addSql(`create view "v_interaction" as
      select "id", 'CALL' as "type", "status", "agent_id", "disposition_id", "opened_at", "closed_at" from "call"
      union all
      select "id", 'TICKET' as "type", "status", "agent_id", "disposition_id", "opened_at", "closed_at" from "ticket";`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop view if exists "v_interaction";`);
    this.addSql(`drop table if exists "call" cascade;`);
    this.addSql(`drop table if exists "ticket" cascade;`);
    this.addSql(`drop table if exists "user" cascade;`);
    this.addSql(`drop table if exists "disposition" cascade;`);
    this.addSql(`drop table if exists "customer" cascade;`);
  }
}
