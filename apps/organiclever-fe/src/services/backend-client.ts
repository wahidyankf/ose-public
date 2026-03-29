import { Context, Effect } from "effect";
import type { NetworkError } from "./errors";

export interface BackendClientService {
  readonly get: (path: string, headers?: Record<string, string>) => Effect.Effect<unknown, NetworkError>;
  readonly post: (
    path: string,
    body: unknown,
    headers?: Record<string, string>,
  ) => Effect.Effect<unknown, NetworkError>;
}

export class BackendClient extends Context.Tag("BackendClient")<BackendClient, BackendClientService>() {}
