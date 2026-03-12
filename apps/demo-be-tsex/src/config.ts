import { Config, Effect } from "effect";

export interface AppConfig {
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly port: number;
}

export const loadConfig = (): Effect.Effect<AppConfig, never> =>
  Effect.gen(function* () {
    const databaseUrl = yield* Config.withDefault(Config.string("DATABASE_URL"), "sqlite::memory:");
    const jwtSecret = yield* Config.withDefault(
      Config.string("APP_JWT_SECRET"),
      "dev-jwt-secret-at-least-32-chars-long",
    );
    const port = yield* Config.withDefault(Config.integer("PORT"), 8201);
    return { databaseUrl, jwtSecret, port };
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        databaseUrl: "sqlite::memory:",
        jwtSecret: "dev-jwt-secret-at-least-32-chars-long",
        port: 8201,
      }),
    ),
  );
