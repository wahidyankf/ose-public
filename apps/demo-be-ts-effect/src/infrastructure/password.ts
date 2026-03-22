import { Context, Effect, Layer } from "effect";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export interface PasswordServiceApi {
  readonly hash: (password: string) => Effect.Effect<string, never>;
  readonly verify: (password: string, hash: string) => Effect.Effect<boolean, never>;
}

export class PasswordService extends Context.Tag("PasswordService")<PasswordService, PasswordServiceApi>() {}

export const PasswordServiceLive = Layer.succeed(PasswordService, {
  hash: (password: string) => Effect.promise(() => bcrypt.hash(password, SALT_ROUNDS)),

  verify: (password: string, hash: string) => Effect.promise(() => bcrypt.compare(password, hash)),
});
