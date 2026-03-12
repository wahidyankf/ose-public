import { Context, Effect, Layer } from "effect";
import { SignJWT, jwtVerify, exportJWK, generateSecret } from "jose";
import { UnauthorizedError } from "../domain/errors.js";
import type { Role } from "../domain/types.js";

export interface JwtClaims {
  readonly sub: string;
  readonly username: string;
  readonly role: Role;
  readonly jti: string;
  readonly tokenType: "access" | "refresh";
}

export interface JwtServiceApi {
  readonly signAccess: (userId: string, username: string, role: Role) => Effect.Effect<string, never>;
  readonly signRefresh: (userId: string) => Effect.Effect<string, never>;
  readonly verify: (token: string) => Effect.Effect<JwtClaims, UnauthorizedError>;
  readonly getJwks: () => Effect.Effect<object, never>;
}

export class JwtService extends Context.Tag("JwtService")<JwtService, JwtServiceApi>() {}

export const makeJwtService = (secret: string): JwtServiceApi => {
  const secretBytes = new TextEncoder().encode(secret);
  let cachedJwks: object | null = null;

  return {
    signAccess: (userId: string, username: string, role: Role) =>
      Effect.promise(async () => {
        const jti = crypto.randomUUID();
        return new SignJWT({
          username,
          role,
          jti,
          tokenType: "access",
        })
          .setProtectedHeader({ alg: "HS256" })
          .setSubject(userId)
          .setIssuedAt()
          .setExpirationTime("15m")
          .sign(secretBytes);
      }),

    signRefresh: (userId: string) =>
      Effect.promise(async () => {
        const jti = crypto.randomUUID();
        return new SignJWT({
          jti,
          tokenType: "refresh",
        })
          .setProtectedHeader({ alg: "HS256" })
          .setSubject(userId)
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(secretBytes);
      }),

    verify: (token: string) =>
      Effect.tryPromise({
        try: async () => {
          const { payload } = await jwtVerify(token, secretBytes);
          return {
            sub: payload.sub as string,
            username: (payload.username ?? "") as string,
            role: (payload.role ?? "USER") as Role,
            jti: (payload.jti ?? payload["jti"]) as string,
            tokenType: (payload.tokenType ?? "access") as "access" | "refresh",
          };
        },
        catch: () => new UnauthorizedError({ reason: "Invalid or expired token" }),
      }),

    getJwks: () =>
      Effect.promise(async () => {
        if (cachedJwks) return cachedJwks;
        const key = await generateSecret("HS256");
        const jwk = await exportJWK(key);
        cachedJwks = { keys: [{ ...jwk, use: "sig", alg: "HS256" }] };
        return cachedJwks;
      }),
  };
};

export const JwtServiceLive = (secret: string) => Layer.succeed(JwtService, makeJwtService(secret));
