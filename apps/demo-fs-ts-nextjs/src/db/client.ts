import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://demo_fs_nextjs:demo_fs_nextjs@localhost:5432/demo_fs_nextjs";

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;

let migrated = false;

export async function ensureMigrations(): Promise<void> {
  if (migrated) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "username" varchar(50) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "display_name" varchar(255),
        "role" varchar(20) DEFAULT 'USER' NOT NULL,
        "status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
        "failed_login_attempts" integer DEFAULT 0 NOT NULL,
        "password_reset_token" varchar(255),
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "created_by" varchar(255) DEFAULT 'system',
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_by" varchar(255) DEFAULT 'system',
        "deleted_at" timestamp with time zone,
        "deleted_by" varchar(255),
        CONSTRAINT "users_username_unique" UNIQUE("username"),
        CONSTRAINT "users_email_unique" UNIQUE("email")
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "expenses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "amount" numeric(19, 4) NOT NULL,
        "currency" varchar(3) NOT NULL,
        "category" varchar(100) NOT NULL,
        "description" varchar(500) NOT NULL,
        "date" date NOT NULL,
        "type" varchar(10) NOT NULL,
        "quantity" numeric(19, 4),
        "unit" varchar(20),
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "token_hash" varchar(255) NOT NULL,
        "expires_at" timestamp with time zone NOT NULL,
        "revoked" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "revoked_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "jti" varchar(255) NOT NULL,
        "user_id" uuid NOT NULL,
        "revoked_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "revoked_tokens_jti_unique" UNIQUE("jti")
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "attachments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "expense_id" uuid NOT NULL,
        "filename" varchar(255) NOT NULL,
        "content_type" varchar(100) NOT NULL,
        "size" bigint NOT NULL,
        "data" "bytea" NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    // Add FK constraints if they don't exist (ignore errors for idempotency)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "attachments" ADD CONSTRAINT "attachments_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "revoked_tokens" ADD CONSTRAINT "revoked_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    migrated = true;
  } catch (e) {
    console.error("Migration error:", e);
    migrated = true;
  }
}
