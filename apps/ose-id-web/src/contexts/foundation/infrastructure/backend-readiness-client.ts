/**
 * The shell's one outbound read: `GET <backend>/health/ready`, server-side, never proxied.
 *
 * Two rules shape every line below.
 *
 * It is a *reader*, not a proxy. Nothing the backend sends is forwarded: the response is collapsed
 * to one member of {@link BackendReadinessState} — a closed set of three words — before it leaves
 * this module. A body, a header, a status code, a hostname, a correlation value, a thrown error, or
 * a rejected promise has no way out of here, because the only value this module returns is that
 * closed set plus "unreadable".
 *
 * It never throws and never logs. Every failure mode a network read has — refused connection, DNS,
 * TLS, timeout, truncated body, non-JSON body, JSON of the wrong shape, an unknown problem code, an
 * unexpected status — collapses to the same `{ readable: false }`. A caller therefore cannot
 * accidentally surface a reason it was never given, and the `catch` deliberately binds no error.
 */
import type { BackendReadinessResult, BackendReadinessState } from "../domain/service-status";

/** The backend's readiness route, fixed by its published contract. */
export const BACKEND_READINESS_PATH = "/health/ready";

/**
 * How long the shell waits for the backend before calling the read unreadable. A status page that
 * hangs is worse than one that says it could not read: the page is the thing an operator opens
 * *because* something may be wrong, so it must answer on a human timescale even when its dependency
 * does not answer at all.
 */
export const BACKEND_READINESS_TIMEOUT_MS = 2_000;

const UNREADABLE: BackendReadinessResult = { readable: false };

/** The `fetch` shape this module needs, narrowed so a test can supply one without a global. */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export type BackendReadinessProbe = () => Promise<BackendReadinessResult>;

export interface BackendReadinessClientOptions {
  /** Absolute loopback origin of the backend, already validated by the configuration schema. */
  readonly baseUrl: string;
  readonly fetchImpl?: FetchLike;
  readonly timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * The `200` ready body, accepted only in the exact shape the contract publishes. A body that omits
 * a component, renames one, or reports any value other than the two published literals is not a
 * readiness this shell understands, so it is unreadable rather than optimistically treated as ready.
 */
export function interpretReadyBody(body: unknown): BackendReadinessResult {
  if (!isRecord(body) || body["status"] !== "ready") {
    return UNREADABLE;
  }
  const components = body["components"];
  if (!isRecord(components) || components["postgresql"] !== "ready" || components["schema"] !== "compatible") {
    return UNREADABLE;
  }
  return { readable: true, state: "ready" };
}

/**
 * The two problem codes readiness may report. The map is the allowlist: a code outside it — however
 * well-formed — is unreadable, so a future backend code can never reach this page as an unreviewed
 * string.
 */
const STATE_BY_PROBLEM_CODE: ReadonlyMap<string, BackendReadinessState> = new Map([
  ["database_unavailable", "database-unavailable"],
  ["schema_incompatible", "schema-incompatible"],
]);

/**
 * The `503` problem body. Only `code` is read; `title`, `correlationId`, and anything else the body
 * carries are ignored rather than stored, so no free text can travel further than this function.
 */
export function interpretProblemBody(body: unknown): BackendReadinessResult {
  if (!isRecord(body)) {
    return UNREADABLE;
  }
  const code = body["code"];
  const state = typeof code === "string" ? STATE_BY_PROBLEM_CODE.get(code) : undefined;
  return state === undefined ? UNREADABLE : { readable: true, state };
}

/**
 * Builds the probe. `cache: "no-store"` because a cached readiness is a lie with a timestamp: the
 * whole value of this page is that it reports the state the service has now, not the one it had.
 */
export function createBackendReadinessClient(options: BackendReadinessClientOptions): BackendReadinessProbe {
  const fetchImpl: FetchLike = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  const timeoutMs = options.timeoutMs ?? BACKEND_READINESS_TIMEOUT_MS;

  return async () => {
    try {
      const response = await fetchImpl(new URL(BACKEND_READINESS_PATH, options.baseUrl).toString(), {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: "application/json, application/problem+json" },
      });
      if (response.status === 200) {
        return interpretReadyBody(await response.json());
      }
      if (response.status === 503) {
        return interpretProblemBody(await response.json());
      }
      return UNREADABLE;
    } catch {
      // Intentionally unbound: an error object here is exactly the value this surface may not see.
      return UNREADABLE;
    }
  };
}
