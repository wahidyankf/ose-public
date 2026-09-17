/**
 * The one environment Playwright's own `webServer` cannot establish for this suite.
 *
 * `webServer` decides a command is ready by probing a URL or a port, and the shell whose backend
 * reports an unavailable database answers `200` on that URL *before* its database is stopped — the
 * stack reaches full readiness first and only then applies its fixture profile. Probing the URL
 * would therefore hand the suite a stack that is still healthy, and the scenario would have to wait
 * for the transition itself. Waiting inside a scenario is how a suite acquires a sleep, a retry, and
 * eventually a flake, so the wait lives here instead: nothing runs until the running system is
 * observably in the state the scenario names.
 *
 * The backend-owned resources (the PostgreSQL container, the migrations, the backend process) are
 * not reimplemented here. They belong to `ose-id-be-e2e`'s local-stack runner, which this file
 * starts as the documented inner runner and stops again through its own signal handling.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { connect } from "node:net";
import {
  BACKEND_UNREADY_BASE_URL,
  BACKEND_UNREADY_STACK_PORTS,
  DATABASE_UNAVAILABLE_STATE_LABEL,
  MANAGES_ENVIRONMENTS,
  UNBOUND_BACKEND_ORIGIN,
} from "./fixtures/environments";

/**
 * Generous because it covers a whole stack coming up from nothing — a container, a published
 * backend, a production web build — not a single request. It exists to turn a hung dependency into
 * a named failure rather than an eternal run.
 */
const STACK_READY_BUDGET_MS = 900_000;
const POLL_INTERVAL_MS = 500;

const LOCAL_STACK_ENTRYPOINT = "apps/ose-id-be-e2e/scripts/local-stack.mjs";

function repositoryRoot(): string {
  return new URL("../..", import.meta.url).pathname;
}

async function portIsFree(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const socket = connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(true);
    });
  });
}

/** True once the shell is serving and states, in words, that its backend's database is unavailable. */
async function reportsAnUnavailableDatabase(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_UNREADY_BASE_URL}/`, { signal: AbortSignal.timeout(2_000) });
    if (response.status !== 200) {
      return false;
    }
    return (await response.text()).includes(DATABASE_UNAVAILABLE_STATE_LABEL);
  } catch {
    return false;
  }
}

async function waitForCondition(
  isSatisfied: () => Promise<boolean>,
  stack: ChildProcess,
  description: string,
): Promise<void> {
  const deadline = Date.now() + STACK_READY_BUDGET_MS;
  while (Date.now() < deadline) {
    if (stack.exitCode !== null || stack.signalCode !== null) {
      throw new Error(`the local stack exited before ${description}`);
    }
    if (await isSatisfied()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`timed out waiting for ${description} within ${STACK_READY_BUDGET_MS}ms`);
}

function stop(stack: ChildProcess): Promise<void> {
  return new Promise<void>((resolve) => {
    if (stack.exitCode !== null || stack.signalCode !== null) {
      resolve();
      return;
    }
    stack.once("exit", () => resolve());
    // The runner cleans up everything it owns on SIGTERM — container, backend, web shell, build
    // output — in the reverse of the order it started them. Killing it outright would leave a
    // container behind, so it is asked to stop and then waited for.
    stack.kill("SIGTERM");
  });
}

export default async function globalSetup(): Promise<(() => Promise<void>) | void> {
  if (!MANAGES_ENVIRONMENTS) {
    return;
  }

  const unboundPort = Number(new URL(UNBOUND_BACKEND_ORIGIN).port);
  if (!(await portIsFree(unboundPort))) {
    throw new Error(
      `port ${unboundPort} must have no listener: the unreachable-backend scenario proves a refused ` +
        "connection, and something is answering there",
    );
  }

  const stack = spawn("node", [LOCAL_STACK_ENTRYPOINT, "--fixture-profile=foundation-postgres-down"], {
    cwd: repositoryRoot(),
    stdio: "inherit",
    env: {
      ...process.env,
      APP_ENV: "test",
      OSE_ID_POSTGRES_PORT: String(BACKEND_UNREADY_STACK_PORTS.postgres),
      OSE_ID_BE_PORT: String(BACKEND_UNREADY_STACK_PORTS.backend),
      OSE_ID_WEB_PORT: String(BACKEND_UNREADY_STACK_PORTS.web),
    },
  });

  try {
    await waitForCondition(reportsAnUnavailableDatabase, stack, "the parallel stack to report an unavailable database");
  } catch (error) {
    await stop(stack);
    throw error;
  }

  return async () => {
    await stop(stack);
  };
}
