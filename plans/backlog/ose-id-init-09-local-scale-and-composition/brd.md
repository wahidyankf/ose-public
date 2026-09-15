# Business Requirements — OSE ID Init 09 Local Scale and Composition

## Business Goal

Make the locally complete OSE ID platform reliable to run, replace, and compose so downstream products
integrate one real identity dependency rather than reimplementing authentication or relying on a fragile
single process.

## Problem

Calling a service “stateless” is not proof. Login, provider correlation, consent, keys, sessions,
revocation, rate limits, passkeys/MFA, and admin writes can accidentally depend on whichever process
handled the first request. Separately, a dependent app will drift if it copies startup, ports, fixtures,
or cleanup scripts. This plan turns those architecture claims into deterministic local behavior.

## Business Outcomes

1. A login or admin journey can start through instance A and complete through instance B without affinity.
2. Stopping one web/backend instance during an in-flight flow does not lose valid shared state or
   authorize inconsistently.
3. Signing/encryption/public key views and protected session data stay consistent across instances.
4. One command owns the complete local OSE ID dependency graph and leaves no resource after every exit path.
5. A dependent-app runner can start OSE ID through a versioned contract, register synthetic client/context
   fixtures, consume public connection metadata, and tear down ownership safely.
6. OSE LMS receives an executable prerequisite instead of duplicating identity lifecycle logic.
7. Local completeness does not imply production deployment or production HA.

## Affected Roles

| Role                     | Need                                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| OSE ID developer         | Start one trustworthy complete stack and diagnose the first failed dependency.  |
| Downstream app developer | Compose OSE ID through a stable contract without copying private scripts.       |
| Test author              | Get isolated fixtures, ports, readiness, logs, and cleanup for parallel runs.   |
| Security reviewer        | Prove instance replacement, key consistency, revocation, and no debug fallback. |
| Repository maintainer    | Prevent leaked containers/processes/ports/volumes and configuration drift.      |

## Success Measures

- Automated no-affinity E2E proves backend A→B and web A→B handoff for authorization, Google callback,
  passkey/MFA continuation, company-admin mutation, consent/token, and revocation; it stops A before completion.
- Both instances publish one issuer/JWKS view and validate data protected by either instance.
- Two clean full-stack runs and forced failure/interrupt runs leave no owned process, container, network,
  volume, port, temp file, message, or raw secret.
- The runner supports collision-checked overrides and concurrent unique stack IDs without cross-cleanup.
- Contract tests prove a synthetic dependent runner receives only allowlisted public metadata and cannot
  bypass OSE ID when it is unavailable.
- LMS plan execution remains blocked until this plan's delivered-head terminal audit passes.

## Options and Tradeoffs

| Option                                                  | Benefits                                             | Costs and risks                                                       | Decision     |
| ------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- | ------------ |
| Shared-state services plus disposable process instances | Honest horizontal-scale seam and deterministic proof | More shared-store operations and concurrency design                   | **Selected** |
| Sticky sessions                                         | Simpler hidden state                                 | Masks correctness defects and complicates replacement                 | Rejected     |
| Add Redis now                                           | Familiar distributed state/cache                     | Adds second state system without measurement or operational plan      | Rejected     |
| Copy runner into each app                               | Local autonomy                                       | Guaranteed lifecycle/config/security drift                            | Rejected     |
| Deploy to Kubernetes as proof                           | Exercises real orchestration                         | Blocked infra and mixes product completion with production operations | Deferred     |

## Risks and Controls

| Risk                               | Consequence                          | Control                                                                |
| ---------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| Process-local state remains hidden | Intermittent login/admin failures    | Instance-tagged no-affinity routes, kill-and-continue tests            |
| Shared key divergence              | Invalid cookies/tokens after handoff | One persisted key provider and cross-instance protect/unprotect proof  |
| Cleanup deletes others' resources  | Developer data loss                  | Unique stack ID plus explicit ownership manifest and target validation |
| Runner stdout leaks secrets        | Credential compromise                | Public descriptor only; private values in restrictive temp directory   |
| Readiness masks crash              | Flaky or hanging CI                  | Bounded event-driven polling and immediate child-exit propagation      |
| Local proof overstated             | Unsafe production assumption         | Explicit non-goals and later Kubernetes/HA/deployment plan gates       |

## Licensing and Deployment Boundary

OSE-authored source/docs inherit root MIT. Mailpit and every other third-party runtime/test component keep
their own license and exact-version notice; the runner must not imply that root MIT relicenses them.

No deployment artifact is delivered. A later production plan is blocked at minimum on the private
Kubernetes plan `start-infra-04-deploy-tencent-lighthouse-k3s-cluster`, then-current platform handoff
gates, and production-specific key/email/database/backup/observability/security decisions.
