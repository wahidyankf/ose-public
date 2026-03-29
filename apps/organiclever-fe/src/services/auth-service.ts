import { Context, Effect } from "effect";
import { BackendClient } from "./backend-client";
import type { NetworkError } from "./errors";

export interface AuthTokenResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: string;
}

export interface UserProfile {
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string;
}

export interface AuthServiceInterface {
  readonly googleLogin: (idToken: string) => Effect.Effect<AuthTokenResponse, NetworkError, BackendClient>;
  readonly refresh: (refreshToken: string) => Effect.Effect<AuthTokenResponse, NetworkError, BackendClient>;
  readonly getProfile: (accessToken: string) => Effect.Effect<UserProfile, NetworkError, BackendClient>;
}

export class AuthService extends Context.Tag("AuthService")<AuthService, AuthServiceInterface>() {}

export const AuthServiceLive = AuthService.of({
  googleLogin: (idToken) =>
    Effect.gen(function* () {
      const client = yield* BackendClient;
      const result = yield* client.post("/api/v1/auth/google", { idToken });
      return result as AuthTokenResponse;
    }),

  refresh: (refreshToken) =>
    Effect.gen(function* () {
      const client = yield* BackendClient;
      const result = yield* client.post("/api/v1/auth/refresh", { refreshToken });
      return result as AuthTokenResponse;
    }),

  getProfile: (accessToken) =>
    Effect.gen(function* () {
      const client = yield* BackendClient;
      const result = yield* client.get("/api/v1/auth/me", {
        Authorization: `Bearer ${accessToken}`,
      });
      return result as UserProfile;
    }),
});
