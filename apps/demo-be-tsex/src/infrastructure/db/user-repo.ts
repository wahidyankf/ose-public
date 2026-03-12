import { Context, Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { SqlError } from "@effect/sql/SqlError";
import type { User, CreateUserData } from "../../domain/user.js";
import { ConflictError } from "../../domain/errors.js";
import type { UserStatus } from "../../domain/types.js";

export interface UserRepositoryApi {
  readonly create: (data: CreateUserData) => Effect.Effect<User, ConflictError | SqlError>;
  readonly findByUsername: (username: string) => Effect.Effect<User | null, SqlError>;
  readonly findByEmail: (email: string) => Effect.Effect<User | null, SqlError>;
  readonly findById: (id: string) => Effect.Effect<User | null, SqlError>;
  readonly updateStatus: (id: string, status: UserStatus) => Effect.Effect<void, SqlError>;
  readonly updateDisplayName: (id: string, displayName: string) => Effect.Effect<void, SqlError>;
  readonly updatePassword: (id: string, passwordHash: string) => Effect.Effect<void, SqlError>;
  readonly incrementFailedAttempts: (id: string) => Effect.Effect<void, SqlError>;
  readonly resetFailedAttempts: (id: string) => Effect.Effect<void, SqlError>;
  readonly listUsers: (
    page: number,
    size: number,
    email?: string,
  ) => Effect.Effect<{ items: User[]; total: number }, SqlError>;
}

export class UserRepository extends Context.Tag("UserRepository")<UserRepository, UserRepositoryApi>() {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(row: any): User {
  return {
    id: row.id as string,
    username: row.username as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    displayName: row.display_name as string,
    role: row.role as User["role"],
    status: row.status as User["status"],
    failedLoginAttempts: row.failed_login_attempts as number,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return {
      create: (data: CreateUserData) =>
        Effect.gen(function* () {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          yield* sql`
            INSERT INTO users (id, username, email, password_hash, display_name, role, status, failed_login_attempts, created_at, updated_at)
            VALUES (${id}, ${data.username}, ${data.email}, ${data.passwordHash}, ${data.displayName}, 'USER', 'ACTIVE', 0, ${now}, ${now})
          `.pipe(
            Effect.catchAll(() =>
              Effect.fail(
                new ConflictError({
                  message: `User with username '${data.username}' or email '${data.email}' already exists`,
                }),
              ),
            ),
          );
          const rows = yield* sql`SELECT * FROM users WHERE id = ${id}`;
          const row = rows[0];
          if (!row) {
            return yield* Effect.fail(new ConflictError({ message: "Failed to create user" }));
          }
          return rowToUser(row);
        }),

      findByUsername: (username: string) =>
        Effect.gen(function* () {
          const rows = yield* sql`SELECT * FROM users WHERE username = ${username}`;
          const row = rows[0];
          return row ? rowToUser(row) : null;
        }),

      findByEmail: (email: string) =>
        Effect.gen(function* () {
          const rows = yield* sql`SELECT * FROM users WHERE email = ${email}`;
          const row = rows[0];
          return row ? rowToUser(row) : null;
        }),

      findById: (id: string) =>
        Effect.gen(function* () {
          const rows = yield* sql`SELECT * FROM users WHERE id = ${id}`;
          const row = rows[0];
          return row ? rowToUser(row) : null;
        }),

      updateStatus: (id: string, status: UserStatus) =>
        Effect.gen(function* () {
          const now = new Date().toISOString();
          yield* sql`UPDATE users SET status = ${status}, updated_at = ${now} WHERE id = ${id}`;
        }),

      updateDisplayName: (id: string, displayName: string) =>
        Effect.gen(function* () {
          const now = new Date().toISOString();
          yield* sql`UPDATE users SET display_name = ${displayName}, updated_at = ${now} WHERE id = ${id}`;
        }),

      updatePassword: (id: string, passwordHash: string) =>
        Effect.gen(function* () {
          const now = new Date().toISOString();
          yield* sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = ${now} WHERE id = ${id}`;
        }),

      incrementFailedAttempts: (id: string) =>
        Effect.gen(function* () {
          const now = new Date().toISOString();
          yield* sql`UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = ${now} WHERE id = ${id}`;
        }),

      resetFailedAttempts: (id: string) =>
        Effect.gen(function* () {
          const now = new Date().toISOString();
          yield* sql`UPDATE users SET failed_login_attempts = 0, updated_at = ${now} WHERE id = ${id}`;
        }),

      listUsers: (page: number, size: number, email?: string) =>
        Effect.gen(function* () {
          const offset = (page - 1) * size;
          if (email !== undefined && email !== "") {
            const countRows = yield* sql`SELECT COUNT(*) as count FROM users WHERE email LIKE ${"%" + email + "%"}`;
            const total = (countRows[0]?.count as number) ?? 0;
            const rows =
              yield* sql`SELECT * FROM users WHERE email LIKE ${"%" + email + "%"} ORDER BY created_at DESC LIMIT ${size} OFFSET ${offset}`;
            return { items: rows.map(rowToUser), total };
          }
          const countRows = yield* sql`SELECT COUNT(*) as count FROM users`;
          const total = (countRows[0]?.count as number) ?? 0;
          const rows = yield* sql`SELECT * FROM users ORDER BY created_at DESC LIMIT ${size} OFFSET ${offset}`;
          return { items: rows.map(rowToUser), total };
        }),
    };
  }),
);
