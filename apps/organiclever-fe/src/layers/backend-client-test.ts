import { Effect, Layer } from "effect";
import { BackendClient } from "@/services/backend-client";

export type MockResponses = {
  get?: (path: string) => unknown;
  post?: (path: string, body: unknown) => unknown;
};

export function createBackendClientTest(responses: MockResponses = {}) {
  return Layer.succeed(
    BackendClient,
    BackendClient.of({
      get: (path, _headers) => Effect.succeed(responses.get ? responses.get(path) : undefined),

      post: (path, body, _headers) => Effect.succeed(responses.post ? responses.post(path, body) : undefined),
    }),
  );
}
