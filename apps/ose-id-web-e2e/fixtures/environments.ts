/**
 * The three running environments this suite observes, and the one place their addresses are named.
 *
 * The status shell reports what the backend tells it, so a scenario about "the backend is ready" and
 * a scenario about "the backend cannot answer" are scenarios about two different running systems,
 * not two different requests to one. Each therefore gets its own shell, on its own port, with its
 * own backend situation established before any test runs — never a state a test manufactures
 * mid-run, which is the shape flakiness takes in a suite like this.
 */

/** Set when this suite owns the lifecycle of the environments below rather than being pointed at them. */
export const MANAGES_ENVIRONMENTS = process.env["WEB_BASE_URL"] === undefined;

function environmentUrl(override: string, fallbackPort: number): string {
  return process.env[override] ?? `http://127.0.0.1:${fallbackPort}`;
}

/** Ports for the managed environments. The ready stack keeps the registered local defaults. */
export const READY_STACK_PORTS = { postgres: 5438, backend: 8501, web: 3500 } as const;

/** A parallel stack, on its own ports, whose PostgreSQL is stopped once it has been fully ready. */
export const BACKEND_UNREADY_STACK_PORTS = { postgres: 5439, backend: 8502, web: 3502 } as const;

/** The shell whose backend cannot be reached at all. */
export const BACKEND_UNREACHABLE_WEB_PORT = 3501;

/**
 * A loopback origin no OSE service reserves and this suite never binds. Pointing a shell here is how
 * "the backend is unreachable" is established as a property of the running process rather than
 * something a test arranges after the fact: the connection is refused because nothing is listening,
 * which is exactly what a stopped backend leaves behind.
 */
export const UNBOUND_BACKEND_ORIGIN = "http://127.0.0.1:8599";

/** The fully ready stack: web shell, backend, PostgreSQL, and a compatible schema. */
export const READY_BASE_URL = process.env["WEB_BASE_URL"] ?? `http://127.0.0.1:${READY_STACK_PORTS.web}`;

/** A shell whose backend answers, and answers that a dependency stops it from serving. */
export const BACKEND_UNREADY_BASE_URL = environmentUrl("WEB_UNREADY_BASE_URL", BACKEND_UNREADY_STACK_PORTS.web);

/** A shell whose backend does not answer at all. */
export const BACKEND_UNREACHABLE_BASE_URL = environmentUrl("WEB_UNREACHABLE_BASE_URL", BACKEND_UNREACHABLE_WEB_PORT);

/** The word the shell uses for a database its backend reports it cannot reach. */
export const DATABASE_UNAVAILABLE_STATE_LABEL = "Unavailable";
