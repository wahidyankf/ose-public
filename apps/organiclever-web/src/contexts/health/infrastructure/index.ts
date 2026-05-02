// health context — infrastructure layer published API.
// Consumers import from this barrel; private files inside this layer
// are not part of the public surface.

export { BackendClient } from "./backend-client";
export type { BackendClientService } from "./backend-client";
export { NetworkError, ApiError } from "./errors";
export { BackendClientLive } from "./backend-client-live";
export { createBackendClientTest } from "./backend-client-test";
export type { MockResponses } from "./backend-client-test";
