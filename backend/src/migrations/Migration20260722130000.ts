import { Migration } from '@mikro-orm/migrations';

/** Agrega password_hash a user, para el login JWT. */
export class Migration20260722130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "password_hash" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "password_hash";`);
  }
}
