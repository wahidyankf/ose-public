import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  decimal,
  bigint,
  customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull().default(""),
  role: varchar("role", { length: 20 }).notNull().default("USER"),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 255 }).notNull().default("system"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: varchar("deleted_by", { length: 255 }),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: varchar("token_hash", { length: 512 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const revokedTokens = pgTable("revoked_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  jti: varchar("jti", { length: 255 }).notNull().unique(),
  userId: uuid("user_id").notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }).notNull().default(""),
  date: date("date", { mode: "string" }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  quantity: decimal("quantity", { precision: 19, scale: 4 }),
  unit: varchar("unit", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 255 }).notNull().default("system"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull().default("system"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: varchar("deleted_by", { length: 255 }),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  expenseId: uuid("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
