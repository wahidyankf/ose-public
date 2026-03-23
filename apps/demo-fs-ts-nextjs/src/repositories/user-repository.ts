import { eq, like, sql, and, or, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { users } from "@/db/schema";
import type { UserRepository } from "./interfaces";
import type { User, PagedResult } from "@/lib/types";

function rowToUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,
    displayName: row.displayName,
    role: row.role as User["role"],
    status: row.status as User["status"],
    failedLoginAttempts: row.failedLoginAttempts,
    passwordResetToken: row.passwordResetToken,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createUserRepository(db: Database): UserRepository {
  return {
    async create(data) {
      const [row] = await db
        .insert(users)
        .values({
          username: data.username,
          email: data.email,
          passwordHash: data.passwordHash,
          displayName: data.displayName,
        })
        .returning();
      return rowToUser(row!);
    },

    async findByUsername(username) {
      const [row] = await db
        .select()
        .from(users)
        .where(and(eq(users.username, username), isNull(users.deletedAt)));
      return row ? rowToUser(row) : null;
    },

    async findByEmail(email) {
      const [row] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)));
      return row ? rowToUser(row) : null;
    },

    async findById(id) {
      const [row] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), isNull(users.deletedAt)));
      return row ? rowToUser(row) : null;
    },

    async updateStatus(id, status) {
      await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id));
    },

    async updateDisplayName(id, displayName) {
      await db.update(users).set({ displayName, updatedAt: new Date() }).where(eq(users.id, id));
    },

    async updatePassword(id, passwordHash) {
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
    },

    async updatePasswordResetToken(id, token) {
      await db.update(users).set({ passwordResetToken: token, updatedAt: new Date() }).where(eq(users.id, id));
    },

    async incrementFailedAttempts(id) {
      await db
        .update(users)
        .set({
          failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id));
    },

    async resetFailedAttempts(id) {
      await db.update(users).set({ failedLoginAttempts: 0, updatedAt: new Date() }).where(eq(users.id, id));
    },

    async listUsers(page, size, search?) {
      const offset = (page - 1) * size;
      const whereClause = search
        ? and(isNull(users.deletedAt), or(like(users.email, `%${search}%`), like(users.username, `%${search}%`)))
        : isNull(users.deletedAt);

      const [items, [countRow]] = await Promise.all([
        db.select().from(users).where(whereClause).limit(size).offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(whereClause),
      ]);

      return {
        items: items.map(rowToUser),
        total: countRow?.count ?? 0,
        page,
        size,
      } as PagedResult<User>;
    },

    async deleteAll() {
      await db.delete(users);
    },
  };
}
