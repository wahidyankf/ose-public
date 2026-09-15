# Owned Stack Lifecycle and Cleanup

## Runner Responsibilities

The OSE ID runner is the single owner of local dependency orchestration. Nx exposes the user-facing
target; implementation may use repository-standard scripts and Compose under `ose-id-be-e2e`, but
consumers call the public target/contract rather than private scripts.

## Input Validation

Before creating a child resource:

- resolve and verify the repository root without embedding an absolute host path;
- require explicit local/test runtime mode;
- validate a sanitized unique stack ID;
- parse explicit scoped port variables and reject invalid, privileged, duplicate, occupied, or non-
  loopback binding where forbidden;
- verify built artifacts, Compose/runtime tools, migration inputs, and fixture manifest schema;
- reject production credentials, real personal data, and unsupported provider/deployment settings; and
- detect an existing ownership manifest and classify recover/resume/refuse safely.

## Ownership Manifest

Create the manifest before children. It records only sanitized identifiers:

- runner version and stack ID;
- process IDs plus verified executable/start token needed to avoid PID-reuse deletion;
- Compose project/container/network/volume names;
- loopback ports and temporary directory;
- public descriptor path and private material path classification;
- startup stage/readiness and cleanup disposition; and
- primary/cleanup exit statuses.

Never trust a user-controlled broad path, glob, unresolved environment variable, `~`, home, repository
root, or `/` as a cleanup target. Revalidate ownership and target containment before each destructive
operation.

## Startup Order

1. Write manifest and restrictive temp directory.
2. Generate synthetic key/client/fixture material.
3. Start PostgreSQL and Mailpit with exact pinned images, unique names, loopback ports, health checks.
4. Start fake Google provider and wait for discovery/JWKS readiness.
5. Run migrations with the migration role; seed via supported setup boundary.
6. Start backend A and B using least-privilege role and shared state/key configuration.
7. Compare backend health/readiness, issuer, and public key view.
8. Start web A and B using shared session/key state and backend proxy endpoint.
9. Start deterministic backend and web proxies.
10. Verify full public readiness and publish allowlisted descriptor atomically.
11. Run tests or hold for local use while monitoring child exits.

A bounded readiness loop observes state and exits on deadline or child failure. It does not rerun a failed
operation or hide a crash.

## Failure Reporting

Report the earliest causal stage, child identity, exit status, readiness observation, and sanitized log
path. Do not flood output with downstream failures after an upstream dependency fails. Cleanup errors are
reported separately and never replace the primary status.

## Unconditional Cleanup

Run cleanup on success, test failure, child crash, termination signal, and startup failure:

1. stop accepting new proxy traffic;
2. stop web and backend children gracefully, then use bounded escalation only for owned verified PIDs;
3. stop fake provider and Mailpit/PostgreSQL through exact ownership names;
4. bring the exact Compose project down with its owned volumes/orphans;
5. remove only contained temp/private/public descriptor files;
6. verify process, port, container, network, volume, message, and temp-path absence;
7. record cleanup disposition and return the primary status.

Cleanup is idempotent. A second call observes absence and succeeds without broadening targets. Concurrent
runner tests prove one manifest cannot remove another stack.

## Recovery

If the runner finds an interrupted manifest, it validates resource identities and offers only documented
safe recovery: inspect, clean exact owned resources, or refuse with diagnosis. It never assumes a PID,
container prefix, or port belongs to the stack without matching manifest evidence.

## Local Secrets and Evidence

Private keys, passwords, client secrets, tokens, cookies, codes, and capabilities live only in restrictive
temp files and are deleted. Evidence may contain public discovery/JWKS, sanitized headers/statuses, opaque
synthetic IDs, instance markers, and ownership names. Test failure screenshots/traces must be scrubbed or
discarded if they include secrets.
