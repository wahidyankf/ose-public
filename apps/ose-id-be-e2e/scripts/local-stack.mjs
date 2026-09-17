#!/usr/bin/env node
/**
 * The one OSE ID foundation local-stack entrypoint. It starts an owned PostgreSQL container,
 * applies migrations, starts one or two backend instances, and starts the web shell — in that
 * dependency order — then blocks until signaled and stops everything it started in exactly the
 * reverse order. Every owned resource carries this invocation's run ID, and cleanup only ever
 * touches resources this invocation itself started: never a broader Docker/process pattern, and
 * never another concurrent invocation's resources.
 *
 * The stage order and cleanup-reversal rule this script follows are the executable specification
 * proved in apps/ose-id-be/src/OseId.Domain/LocalStack/LifecyclePlan.cs
 * (`StoppableStages = ["postgres", "backend", "web"]`). A change to one must change the other.
 *
 * Usage:
 *   node apps/ose-id-be-e2e/scripts/local-stack.mjs [--fixture-profile=<name>] [--instances=1|2] [--validate-only]
 *
 * Fixture profiles (these reach full readiness first, then apply the named transition):
 *   foundation-ready          (default) stay ready; block until signaled.
 *   foundation-postgres-down  stop the owned PostgreSQL container after readiness, then block.
 *   foundation-backend-down   stop the first backend instance after readiness, then block.
 *
 * Fixture profiles that fail on the way up, so a test can drive the failure paths deterministically
 * instead of waiting out a real multi-minute readiness budget (see READINESS_FAILURE_STAGE_BY_PROFILE):
 *   foundation-backend-readiness-fails  fail the first backend's readiness wait the moment that
 *                                       instance has been spawned, then clean up and exit 1.
 *   foundation-web-readiness-fails      fail the web readiness wait the moment the web process has
 *                                       been spawned, then clean up and exit 1.
 *
 * Ports resolve through the repo-wide `flag > env var > fallback` contract (see
 * libs/ts-env-loader/src/port-resolver.ts): OSE_ID_POSTGRES_PORT (default 5438),
 * OSE_ID_BE_PORT (default 8501), OSE_ID_WEB_PORT (default 3500). A parallel invocation — another
 * developer, another E2E run — supplies its own env vars to avoid colliding with these documented
 * manual-development defaults; this script never allocates ports for itself.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, open, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { resolvePort } from "../../../libs/ts-env-loader/src/port-resolver.ts";

const REPO_ROOT = path.resolve(process.cwd());
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const POSTGRES_IMAGE = "postgres:17-alpine";
const OWNERSHIP_LABEL = "ose-id-local-stack-run";
const CONTAINER_PREFIX = "ose-id-local-stack-pg-";
const DATABASE_NAME = "ose_id";
const MIGRATOR_ROLE = "ose_id_migrator";
const APPLICATION_ROLE = "ose_id_app";

const STARTUP_BUDGET_MS = {
    postgres: 120_000,
    backend: 60_000,
    web: 60_000,
};

/**
 * The testing seam for the failure window between "this stage's process has been spawned" and
 * "this stage reported itself ready": the named stage's readiness wait fails immediately, with its
 * process already spawned and owned, exactly as a genuine readiness failure leaves it. A test
 * proving that window's cleanup must not manufacture it by racing a real STARTUP_BUDGET_MS
 * (a minute or more per stage, and timing-dependent either way); it names the profile and gets the
 * same state deterministically. The profiles are inert for every other run: an unlisted name —
 * including the default — leaves both readiness waits polling for the real transition.
 */
const READINESS_FAILURE_STAGE_BY_PROFILE = new Map([
    ["foundation-backend-readiness-fails", "backend"],
    ["foundation-web-readiness-fails", "web"],
]);

function option(argv, name, fallback) {
    const prefix = `--${name}=`;
    const found = argv.find((arg) => arg.startsWith(prefix));
    return found === undefined ? fallback : found.slice(prefix.length);
}

function flag(argv, name) {
    return argv.includes(`--${name}`);
}

function log(runId, message) {
    process.stdout.write(`[local-stack ${runId}] ${message}\n`);
}

function runCommand(command, args, { input, timeoutMs = 60_000, env = process.env, cwd = REPO_ROOT } = {}) {
    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(command, args, {
            stdio: ["pipe", "pipe", "pipe"],
            env,
            cwd,
        });

        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk) => {
            stdout += chunk;
        });
        child.stderr.on("data", (chunk) => {
            stderr += chunk;
        });

        const timer = setTimeout(() => {
            child.kill("SIGKILL");
            rejectPromise(new Error(`${command} ${args.join(" ")} exceeded ${timeoutMs}ms`));
        }, timeoutMs);

        child.on("error", (error) => {
            clearTimeout(timer);
            rejectPromise(error);
        });
        child.on("exit", (exitCode) => {
            clearTimeout(timer);
            resolvePromise({ exitCode: exitCode ?? -1, stdout, stderr: stdout + stderr });
        });

        if (input !== undefined) {
            child.stdin.write(input);
        }
        child.stdin.end();
    });
}

/**
 * Volta's "node" shim on PATH does not exec-replace itself with the pinned interpreter; it spawns
 * the real node as a separate, independently-PID'd process, so a plain `spawn("node", ...)` here
 * hands back the shim's PID, not the process that will register `SIGTERM`/`SIGINT` handlers.
 * `stopProcess()`'s `child.kill("SIGTERM")` then signals the shim (which dies with the signal's raw
 * default disposition) while the real interpreter it launched — and every port/child it owns —
 * runs on, orphaned. Resolving the pinned interpreter's real path once up front, the same way
 * `apps/ose-id-be-e2e/steps/LocalStackRunnerProcess.cs` does for its own "node" spawn, makes the
 * captured PID the one the signal actually needs to reach.
 */
async function resolveNodeExecutable() {
    try {
        const result = await runCommand("volta", ["which", "node"], { timeoutMs: 5_000 });
        const resolved = result.stdout.trim();
        return result.exitCode === 0 && resolved.length > 0 ? resolved : "node";
    } catch {
        // No Volta on PATH (e.g. a non-Volta CI image): the plain command name is the interpreter
        // itself there, so the shim-detachment problem this resolves does not apply.
        return "node";
    }
}

async function isPortFree(port) {
    return new Promise((resolvePromise) => {
        const probe = net.createServer();
        probe.once("error", () => resolvePromise(false));
        probe.once("listening", () => probe.close(() => resolvePromise(true)));
        probe.listen(port, "127.0.0.1");
    });
}

async function waitUntil(predicate, budgetMs, intervalMs = 250) {
    const deadline = Date.now() + budgetMs;
    // Bounded polling observes a real state transition; it is never a retry of a failed
    // assertion, and it always fails loudly once the budget is spent rather than looping forever.
    while (Date.now() < deadline) {
        if (await predicate()) {
            return true;
        }
        await delay(intervalMs);
    }
    return false;
}

async function httpReady(url) {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
        return response.status === 200;
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------------------------------------------

async function startPostgres(runId, port) {
    const containerName = `${CONTAINER_PREFIX}${runId}`;
    const superuserPassword = randomBytes(16).toString("hex");
    const migratorPassword = randomBytes(16).toString("hex");
    const applicationPassword = randomBytes(16).toString("hex");

    const run = await runCommand(
        "docker",
        [
            "run",
            "--detach",
            "--name",
            containerName,
            "--label",
            `${OWNERSHIP_LABEL}=${runId}`,
            "--publish",
            `127.0.0.1:${port}:5432`,
            "--env",
            `POSTGRES_PASSWORD=${superuserPassword}`,
            "--env",
            "POSTGRES_DB=postgres",
            POSTGRES_IMAGE,
        ],
        { timeoutMs: 300_000 },
    );
    if (run.exitCode !== 0) {
        throw new Error(`starting the owned PostgreSQL container failed: ${run.stderr.trim()}`);
    }

    // From this point, a real container exists and must be removed on any failure below: leaving
    // it behind would make this run's own setup failure someone else's leaked resource to find.
    try {
        // The official image's entrypoint runs a temporary postgres instance to apply init scripts,
        // stops it, then starts the real one. A readiness probe can succeed against the temporary
        // instance moments before its socket disappears and the real instance takes over — under
        // concurrent container startups (heavier Docker-daemon load, more jitter) that window can
        // still fall *after* the probe and land on one of the setup statements below, not just on the
        // probe itself. Retrying every statement run during startup — not only the first probe — on
        // the specific "the connection/socket is gone" failure class (never on a real SQL error) is
        // what closes the gap instead of narrowing it.
        const setupDeadline = Date.now() + STARTUP_BUDGET_MS.postgres;

        const ready = await waitUntil(
            async () =>
                (await execPsql(containerName, superuserPassword, "postgres", "SELECT 1;", 15_000)).exitCode === 0,
            STARTUP_BUDGET_MS.postgres,
        );
        if (!ready) {
            throw new Error(
                `the owned PostgreSQL container did not accept connections within ${STARTUP_BUDGET_MS.postgres}ms`,
            );
        }

        // Each statement below is retried and its "already exists" success check applied
        // independently, never combined into one multi-statement call: execPsql runs with
        // ON_ERROR_STOP=1, so a retry that hits "already exists" on an earlier statement — because a
        // prior connection-raced attempt already committed it before dying — aborts the rest of that
        // same psql invocation right there. A combined block would then silently skip a later
        // statement such as CREATE DATABASE, while psqlDuringStartup's "already exists" match still
        // reports the whole call as success.
        await psqlDuringStartup(
            containerName,
            superuserPassword,
            "postgres",
            `CREATE ROLE ${MIGRATOR_ROLE} LOGIN PASSWORD '${migratorPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;`,
            setupDeadline,
        );
        await psqlDuringStartup(
            containerName,
            superuserPassword,
            "postgres",
            `CREATE ROLE ${APPLICATION_ROLE} LOGIN PASSWORD '${applicationPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;`,
            setupDeadline,
        );
        await psqlDuringStartup(
            containerName,
            superuserPassword,
            "postgres",
            `CREATE DATABASE ${DATABASE_NAME} OWNER ${MIGRATOR_ROLE};`,
            setupDeadline,
        );
        await psqlDuringStartup(
            containerName,
            superuserPassword,
            DATABASE_NAME,
            `REVOKE ALL ON DATABASE ${DATABASE_NAME} FROM PUBLIC;
       REVOKE ALL ON SCHEMA public FROM PUBLIC;
       GRANT CONNECT ON DATABASE ${DATABASE_NAME} TO ${MIGRATOR_ROLE};
       GRANT CONNECT ON DATABASE ${DATABASE_NAME} TO ${APPLICATION_ROLE};`,
            setupDeadline,
        );
    } catch (error) {
        await stopPostgres(containerName).catch(() => {});
        await removePostgres(containerName).catch(() => {});
        throw error;
    }

    return {
        containerName,
        migratorConnectionString: connectionString(port, MIGRATOR_ROLE, migratorPassword),
        applicationConnectionString: connectionString(port, APPLICATION_ROLE, applicationPassword),
    };
}

function connectionString(port, user, password) {
    return `Host=127.0.0.1;Port=${port};Database=${DATABASE_NAME};Username=${user};Password=${password};Timeout=10;Command Timeout=10`;
}

// Matches only the connection-establishment failures the official image's temp-instance/
// real-instance startup transition produces: the temp instance's socket disappearing,
// connections being refused before the real instance is listening, postgres reporting it is
// mid-transition, or the temp instance forcibly closing an already-connected client when it is
// told to shut down. Never a query/permission error, so a genuine SQL mistake still fails
// immediately instead of being retried away.
const CONNECTION_RACE_PATTERN =
    /No such file or directory|Connection refused|the database system is (starting up|shutting down)|terminating connection due to administrator command|server closed the connection unexpectedly|connection to server was lost/i;

// A retried startup statement reporting "already exists" is a success, not a conflict: on a
// container this run just created, with fixed role/database names, only this same call's own
// earlier attempt could have created them already — most likely after committing but before its
// result reached the client across the connection the temp/real transition just severed.
const ALREADY_DONE_PATTERN = /already exists/i;

async function execPsql(containerName, superuserPassword, database, sql, timeoutMs) {
    return runCommand(
        "docker",
        [
            "exec",
            "--interactive",
            "--env",
            `PGPASSWORD=${superuserPassword}`,
            containerName,
            "psql",
            "--username",
            "postgres",
            "--dbname",
            database,
            "--no-psqlrc",
            "--quiet",
            "--tuples-only",
            "--no-align",
            "--set",
            "ON_ERROR_STOP=1",
        ],
        { input: sql, timeoutMs },
    );
}

/**
 * Runs a statement during the postgres startup window, retrying only while `deadline` has not
 * passed and the failure is the documented temp-instance/real-instance connection race — the same
 * bounded-wait-for-a-real-state-transition contract `waitUntil` already uses, applied to every
 * startup statement instead of only the first readiness probe.
 */
async function psqlDuringStartup(containerName, superuserPassword, database, sql, deadline) {
    for (;;) {
        const result = await execPsql(containerName, superuserPassword, database, sql, 15_000);
        if (result.exitCode === 0) {
            return;
        }
        const stderr = result.stderr.trim();
        if (ALREADY_DONE_PATTERN.test(stderr)) {
            return;
        }
        if (Date.now() >= deadline || !CONNECTION_RACE_PATTERN.test(stderr)) {
            throw new Error(`psql against the owned PostgreSQL container failed: ${stderr}`);
        }
        await delay(250);
    }
}

async function stopPostgres(containerName) {
    await runCommand("docker", ["stop", "--time", "5", containerName], { timeoutMs: 30_000 });
}

async function removePostgres(containerName) {
    await runCommand("docker", ["rm", "--force", "--volumes", containerName], { timeoutMs: 30_000 });
}

// ---------------------------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------------------------

async function runMigration(migratorConnectionString) {
    const migratorProject = path.join(REPO_ROOT, "apps", "ose-id-be", "src", "OseId.Migrator", "OseId.Migrator.csproj");
    const result = await runCommand("dotnet", ["run", "--project", migratorProject], {
        env: { ...process.env, OSE_ID_MIGRATION_CONNECTION: migratorConnectionString },
        timeoutMs: 120_000,
    });
    if (result.exitCode !== 0) {
        throw new Error(`the migration stage failed: ${result.stderr.trim()}`);
    }
}

// ---------------------------------------------------------------------------------------------
// Backend
// ---------------------------------------------------------------------------------------------

/**
 * Everything the backend stage writes to disk lives under this one directory scoped to this run's
 * ID, never a bare shared path: two concurrent invocations from the same checkout must never
 * overwrite the executable an already-running instance is still serving from, nor each other's
 * build state. One run-scoped root is also one thing for cleanup to remove.
 */
function backendRunDirectory(runId) {
    return path.join(REPO_ROOT, "apps", "ose-id-be", "dist", "local-stack", runId);
}

function backendPublishDirectory(runId) {
    return path.join(backendRunDirectory(runId), "publish");
}

function backendArtifactsDirectory(runId) {
    return path.join(backendRunDirectory(runId), "artifacts");
}

/**
 * `-o` scopes only the published output. The build that produces it also reads and writes MSBuild's
 * intermediate and binary output — including the implicit restore's `project.assets.json` — and
 * those sit at fixed `obj/`/`bin/` paths inside each project directory, shared by every concurrent
 * invocation from this checkout. `ArtifactsPath` is what run-scopes them: it relocates both, laying
 * out one `obj/<project>/` and `bin/<project>/` subdirectory per project underneath.
 *
 * Not `BaseIntermediateOutputPath`: MSBuild propagates a command-line property to every referenced
 * project, so a single value there points OseId.Host, OseId.Domain, OseId.Application, and
 * OseId.Infrastructure at one shared intermediate directory, where their generated `AssemblyInfo.cs`
 * files and `project.assets.json` collide and the build fails outright (CS0579). `ArtifactsPath`
 * propagates the same way but keeps each project in its own subdirectory, which is the property
 * designed for exactly this relocation.
 */
async function publishBackend(runId) {
    const project = path.join(REPO_ROOT, "apps", "ose-id-be", "src", "OseId.Host", "OseId.Host.csproj");
    const output = backendPublishDirectory(runId);
    const result = await runCommand(
        "dotnet",
        [
            "publish",
            project,
            "-c",
            "Release",
            "-o",
            output,
            `--property:ArtifactsPath=${backendArtifactsDirectory(runId)}`,
        ],
        { timeoutMs: 180_000 },
    );
    if (result.exitCode !== 0) {
        throw new Error(`publishing ose-id-be failed: ${result.stderr.trim()}`);
    }
    return path.join(output, "OseId.Host.dll");
}

function startBackend(entryPoint, port, applicationConnectionString) {
    // `inherit`: an unread pipe would eventually back-pressure and hang a long-running
    // server once its own buffered output exceeded the OS pipe size. Inheriting also
    // gives a developer running `serve` interactively the backend's live diagnostics.
    const child = spawn("dotnet", [entryPoint], {
        stdio: "inherit",
        env: {
            ...process.env,
            OSE_RUNTIME_MODE: "Local",
            OSE_ID_BE_PORT: String(port),
            OSE_ID_CONNECTION: applicationConnectionString,
        },
    });
    return { process: child, origin: `http://127.0.0.1:${port}` };
}

async function waitForBackendReady(origin, { failImmediately = false } = {}) {
    if (failImmediately) {
        throw new Error(`ose-id-be at ${origin} did not become ready (forced by --fixture-profile)`);
    }
    const ready = await waitUntil(() => httpReady(`${origin}/health/ready`), STARTUP_BUDGET_MS.backend);
    if (!ready) {
        throw new Error(`ose-id-be at ${origin} did not become ready within ${STARTUP_BUDGET_MS.backend}ms`);
    }
}

// ---------------------------------------------------------------------------------------------
// Web shell
// ---------------------------------------------------------------------------------------------

/**
 * Next's own build output, scoped to this run's ID and nested inside the already-ignored
 * `.next/`, never the bare `.next/` every ordinary build uses: two concurrent invocations from
 * the same checkout must never let one's rebuild overwrite the files another is still serving.
 */
function webDistDir(runId) {
    return path.join(".next", "local-stack-runs", runId);
}

const WEB_TSCONFIG_PATH = path.join(REPO_ROOT, "apps", "ose-id-web", "tsconfig.json");
const WEB_TSCONFIG_LOCK_PATH = `${WEB_TSCONFIG_PATH}.lock`;
const TSCONFIG_LOCK_BUDGET_MS = 10_000;
const TSCONFIG_LOCK_POLL_MS = 50;

/**
 * apps/ose-id-web/tsconfig.json is a single file every concurrent local-stack invocation shares
 * (Next's own TypeScript-setup verification appends to it, keyed by distDir). An exclusive-create
 * lock file (`open(path, "wx")` fails atomically if the file already exists) serializes
 * read-modify-write access across invocations, so one run's cleanup can never lose or corrupt
 * another still-live run's own entries to a lost update.
 */
async function withWebTsconfigLock(action) {
    const start = Date.now();
    for (;;) {
        let handle;
        try {
            handle = await open(WEB_TSCONFIG_LOCK_PATH, "wx");
        } catch (error) {
            if (error.code !== "EEXIST") {
                throw error;
            }
            if (Date.now() - start > TSCONFIG_LOCK_BUDGET_MS) {
                throw new Error(`timed out waiting for the web tsconfig lock at ${WEB_TSCONFIG_LOCK_PATH}`);
            }
            await delay(TSCONFIG_LOCK_POLL_MS);
            continue;
        }
        try {
            return await action();
        } finally {
            await handle.close();
            await rm(WEB_TSCONFIG_LOCK_PATH, { force: true });
        }
    }
}

/**
 * Next's own TypeScript-setup verification (triggered by the custom `OSE_ID_WEB_DIST_DIR` this
 * runner sets) permanently appends this run's two `include` entries to the tracked tsconfig.json
 * and never removes them itself. Strip only THIS run's own two entries — never a broader
 * `local-stack-runs/` pattern — so a concurrently-running separate invocation's still-active
 * entries are never touched.
 *
 * Next's writer also reformats the whole file into one array element per line, which Prettier
 * would otherwise collapse onto a single line wherever it fits within the repo's print width.
 * Reformatting with the repo's own Prettier after the content edit undoes that drive-by
 * reformatting too, so a build+cleanup cycle leaves this tracked file byte-identical to its
 * pre-run content, not just equivalent in its `include` entries.
 */
async function pruneWebTsconfigEntries(runId) {
    const distDir = webDistDir(runId).split(path.sep).join("/");
    const ownEntries = new Set([`${distDir}/types/**/*.ts`, `${distDir}/dev/types/**/*.ts`]);
    await withWebTsconfigLock(async () => {
        let raw;
        try {
            raw = await readFile(WEB_TSCONFIG_PATH, "utf8");
        } catch (error) {
            if (error.code === "ENOENT") {
                return;
            }
            throw error;
        }
        const tsconfig = JSON.parse(raw);
        if (!Array.isArray(tsconfig.include)) {
            return;
        }
        const filtered = tsconfig.include.filter((entry) => !ownEntries.has(entry));
        if (filtered.length === tsconfig.include.length) {
            return;
        }
        tsconfig.include = filtered;
        await writeFile(WEB_TSCONFIG_PATH, `${JSON.stringify(tsconfig, null, 2)}\n`, "utf8");
        const formatted = await runCommand("npx", ["--no", "--", "prettier", "--write", WEB_TSCONFIG_PATH], {
            timeoutMs: 30_000,
        });
        if (formatted.exitCode !== 0) {
            throw new Error(`formatting tsconfig.json failed: ${formatted.stderr.trim()}`);
        }
    });
}

async function buildWeb(runId) {
    const result = await runCommand("npx", ["--no", "--", "next", "build"], {
        timeoutMs: 300_000,
        cwd: path.join(REPO_ROOT, "apps", "ose-id-web"),
        env: { ...process.env, OSE_ID_WEB_DIST_DIR: webDistDir(runId) },
    });
    if (result.exitCode !== 0) {
        throw new Error(`building ose-id-web failed: ${result.stderr.trim()}`);
    }
}

/**
 * The web child is itself a launch chain (this wrapper -> `node_modules/.bin/next`'s own
 * `#!/usr/bin/env node` shebang -> Volta's `node` shim again), and a shim anywhere in that chain
 * can still fork away a grandchild `signalOwned` cannot name directly (see `resolveNodeExecutable`
 * for the first, directly-spawned link this only partly protects against). `detached: true` makes
 * this process the leader of a fresh process group instead of joining this script's own, so
 * `signalOwned` can reach that whole group with one negative-PID signal regardless of how many
 * shim layers forked underneath it.
 */
function startWeb(port, runId, nodeExecutable) {
    const wrapper = path.join(REPO_ROOT, "scripts", "next-with-port.mjs");
    const child = spawn(
        nodeExecutable,
        [wrapper, "start", "--env", "OSE_ID_WEB_PORT", "--default", "3500", "--port", String(port)],
        {
            cwd: path.join(REPO_ROOT, "apps", "ose-id-web"),
            // See startBackend: an unread pipe would eventually hang this long-running server.
            stdio: "inherit",
            env: { ...process.env, OSE_RUNTIME_MODE: "Local", OSE_ID_WEB_DIST_DIR: webDistDir(runId) },
            detached: true,
        },
    );
    return { process: child, origin: `http://127.0.0.1:${port}`, detached: true };
}

async function waitForWebReady(origin, { failImmediately = false } = {}) {
    if (failImmediately) {
        throw new Error(`ose-id-web at ${origin} did not become ready (forced by --fixture-profile)`);
    }
    const ready = await waitUntil(() => httpReady(origin), STARTUP_BUDGET_MS.web);
    if (!ready) {
        throw new Error(`ose-id-web at ${origin} did not become ready within ${STARTUP_BUDGET_MS.web}ms`);
    }
}

// ---------------------------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------------------------

/**
 * Signals an owned process. A handle started with `detached: true` is the leader of its own new
 * process group (its group ID equals its own PID), so signalling the *negative* PID reaches that
 * whole group — every descendant a shim or wrapper in its launch chain forked away under a PID
 * this module never captured (see `startWeb`'s own comment), not only the one PID `spawn()`
 * returned. A handle left attached shares this script's own process group, so it is signalled
 * directly; `-pid` there would target this script's own group, signalling itself.
 */
function signalOwned(handle, signal) {
    try {
        if (handle.detached) {
            process.kill(-handle.process.pid, signal);
        } else {
            handle.process.kill(signal);
        }
    } catch {
        // The process (or its whole group) already exited between the liveness check the caller
        // made and this signal; nothing left to signal is not a failure.
    }
}

/**
 * Stops an owned process and waits for it to actually exit, escalating to SIGKILL if it
 * outlives the grace period. "Stopping the runner leaves no owned process" is a claim about
 * the process table at the moment cleanup finishes, not about a signal having been sent.
 */
function stopProcess(handle, graceMs = 10_000) {
    return new Promise((resolvePromise) => {
        if (handle === undefined || handle.process.exitCode !== null || handle.process.signalCode !== null) {
            resolvePromise();
            return;
        }

        const escalate = setTimeout(() => signalOwned(handle, "SIGKILL"), graceMs);
        handle.process.once("exit", () => {
            clearTimeout(escalate);
            resolvePromise();
        });
        signalOwned(handle, "SIGTERM");
    });
}

/**
 * Removes one run-scoped build-output directory, reporting a failure the same way a failed stage
 * teardown is reported: never replacing or hiding the original failure that triggered cleanup.
 */
async function removeRunOutput(runId, label, directory) {
    try {
        await rm(directory, { recursive: true, force: true });
    } catch (error) {
        process.stderr.write(`[local-stack ${runId}] cleanup of ${label} failed: ${error.message}\n`);
    }
}

async function main() {
    const argv = process.argv.slice(2);
    const fixtureProfile = option(argv, "fixture-profile", "foundation-ready");
    const rawInstanceCount = option(argv, "instances", "1");
    const instanceCount = Number(rawInstanceCount);
    const validateOnly = flag(argv, "validate-only");
    const runId = randomBytes(6).toString("hex");
    const runDirectory = await mkdtemp(path.join(tmpdir(), "ose-id-local-stack-"));

    const postgresPort = resolvePort({ envVar: "OSE_ID_POSTGRES_PORT", fallback: 5438 });
    const backendPort = resolvePort({ envVar: "OSE_ID_BE_PORT", fallback: 8501 });
    const webPort = resolvePort({ envVar: "OSE_ID_WEB_PORT", fallback: 3500 });

    // Step 1: validate tools, ports, and output paths before anything is owned. A collision on a
    // port this run would bind is refused here, never removed: this run does not own it.
    if (!Number.isInteger(instanceCount) || instanceCount < 1 || instanceCount > 2) {
        process.stderr.write(`[local-stack ${runId}] --instances must be 1 or 2, got: ${rawInstanceCount}\n`);
        await rm(runDirectory, { recursive: true, force: true });
        process.exitCode = 1;
        return;
    }

    for (const tool of ["docker", "dotnet", "npx", "node"]) {
        const found = await runCommand(process.platform === "win32" ? "where" : "which", [tool], { timeoutMs: 10_000 });
        if (found.exitCode !== 0) {
            process.stderr.write(`[local-stack ${runId}] required tool not found on PATH: ${tool}\n`);
            await rm(runDirectory, { recursive: true, force: true });
            process.exitCode = 1;
            return;
        }
    }

    const nodeExecutable = await resolveNodeExecutable();

    // A two-instance run binds a second backend on backendPort + 1; that port is exactly as much
    // this run's responsibility to validate up front as the three base ports are.
    const portsToValidate = [
        ["postgres", postgresPort],
        ["backend", backendPort],
        ["web", webPort],
    ];
    if (instanceCount === 2) {
        portsToValidate.push(["backend", backendPort + 1]);
    }
    for (const [label, port] of portsToValidate) {
        if (!(await isPortFree(port))) {
            process.stderr.write(
                `[local-stack ${runId}] port collision: ${label} port ${port} is already bound. ` +
                    "Another local-stack instance, or an unrelated process, owns it; this run refuses to touch it.\n",
            );
            await rm(runDirectory, { recursive: true, force: true });
            process.exitCode = 1;
            return;
        }
    }

    if (validateOnly) {
        log(runId, `validated: postgres=${postgresPort} backend=${backendPort} web=${webPort}`);
        await rm(runDirectory, { recursive: true, force: true });
        return;
    }

    const owned = { postgres: undefined, backends: [], web: undefined };
    // Every flag below flips the moment the thing it guards can exist on disk, never after the
    // step that uses it succeeded. A stage's build output is written before its process starts,
    // and its process is spawned before its readiness wait returns, so a failure anywhere in that
    // window leaves real resources behind that a "this stage reached readiness" flag would never
    // mention — and nothing else in the repo ever removes these run-scoped paths.
    let backendPublishStarted = false;
    let webBuildStarted = false;
    let signaled = false;

    const cleanup = async () => {
        // Cleanup order is still LifecyclePlan.CleanupOrder's: StoppableStages reversed, web before
        // backend before postgres. What it is restricted to is what this run actually owns, not how
        // far readiness got: a process spawned moments before its readiness wait threw is owned and
        // must be stopped, or it outlives this run holding its port against the next invocation's
        // collision guard. Ownership is prefix-closed (no web without backends, none without
        // postgres), so the stage list below is exactly CleanupOrder(<stages owned>) — derived from
        // what exists rather than from a success counter.
        const stages = [
            ["postgres", owned.postgres !== undefined],
            ["backend", owned.backends.length > 0],
            ["web", owned.web !== undefined],
        ]
            .filter(([, isOwned]) => isOwned)
            .map(([stage]) => stage)
            .reverse();
        for (const stage of stages) {
            try {
                if (stage === "web") {
                    await stopProcess(owned.web);
                } else if (stage === "backend") {
                    await Promise.all(owned.backends.map((backend) => stopProcess(backend)));
                } else {
                    await stopPostgres(owned.postgres.containerName);
                    await removePostgres(owned.postgres.containerName);
                }
                log(runId, `${stage} stopped`);
            } catch (error) {
                // A cleanup error is reported for its own stage and never replaces or hides the
                // original failure that triggered cleanup in the first place.
                process.stderr.write(`[local-stack ${runId}] cleanup of ${stage} failed: ${error.message}\n`);
            }
        }

        // Build output goes only after every owned process is stopped: an instance still running
        // is still serving from the directory it was published into.
        if (webBuildStarted) {
            await removeRunOutput(runId, "web-dist", path.join(REPO_ROOT, "apps", "ose-id-web", webDistDir(runId)));
            // `next build` appends this run's tsconfig entries early, so they outlive a build that
            // fails and a start/readiness step that fails after it; they must still be pruned.
            try {
                await pruneWebTsconfigEntries(runId);
            } catch (error) {
                process.stderr.write(`[local-stack ${runId}] cleanup of web-tsconfig failed: ${error.message}\n`);
            }
        }
        if (backendPublishStarted) {
            await removeRunOutput(runId, "backend-output", backendRunDirectory(runId));
        }
        await rm(runDirectory, { recursive: true, force: true });
        log(runId, "cleanup complete");
    };

    const onSignal = (signal) => {
        if (signaled) {
            return;
        }
        signaled = true;
        log(runId, `received ${signal}; stopping`);
        cleanup()
            .then(() => process.exit(0))
            .catch((error) => {
                process.stderr.write(`[local-stack ${runId}] cleanup failed: ${error.message}\n`);
                process.exit(1);
            });
    };
    process.on("SIGINT", () => onSignal("SIGINT"));
    process.on("SIGTERM", () => onSignal("SIGTERM"));

    const readinessFailureStage = READINESS_FAILURE_STAGE_BY_PROFILE.get(fixtureProfile);

    try {
        // Step 3: PostgreSQL.
        owned.postgres = await startPostgres(runId, postgresPort);
        log(runId, "postgres ready");

        // Step 4: migrations, with the migration role, stopping immediately on failure.
        await runMigration(owned.postgres.migratorConnectionString);

        // Step 5: one or two backend instances, application credentials, poll /health/ready.
        backendPublishStarted = true;
        const entryPoint = await publishBackend(runId);
        const backendPorts = instanceCount >= 2 ? [backendPort, backendPort + 1] : [backendPort];
        for (const port of backendPorts) {
            // Sequential by design: each instance must answer ready before the next starts,
            // so a second instance's failure never gets confused with the first's.
            const backend = startBackend(entryPoint, port, owned.postgres.applicationConnectionString);
            owned.backends.push(backend);
            await waitForBackendReady(backend.origin, { failImmediately: readinessFailureStage === "backend" });
        }
        log(runId, `backend ready (${owned.backends.map((backend) => backend.origin).join(", ")})`);

        // Step 6: the web shell.
        webBuildStarted = true;
        await buildWeb(runId);
        owned.web = startWeb(webPort, runId, nodeExecutable);
        await waitForWebReady(owned.web.origin, { failImmediately: readinessFailureStage === "web" });
        log(runId, `web ready (${owned.web.origin})`);

        // Fixture profiles apply their transition only after full readiness is observed.
        if (fixtureProfile === "foundation-postgres-down") {
            await stopPostgres(owned.postgres.containerName);
            log(runId, "postgres stopped (fixture profile)");
        } else if (fixtureProfile === "foundation-backend-down") {
            await stopProcess(owned.backends[0]);
            log(runId, "backend stopped (fixture profile)");
        } else if (fixtureProfile !== "foundation-ready") {
            throw new Error(`unknown --fixture-profile: ${fixtureProfile}`);
        }
    } catch (error) {
        process.stderr.write(`[local-stack ${runId}] failed: ${error.message}\n`);
        await cleanup();
        process.exitCode = 1;
        return;
    }

    // Step 7: block until a signal ends the run; the handlers above run cleanup and exit.
    await new Promise(() => {});
}

await main();
