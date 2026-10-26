# Docker to Podman across ose-public

> **Status:** In Progress. The runtime migration is being executed under this plan.

Depends-on: []

Replace Docker as the operational container runtime throughout `ose-public` with rootless Podman.
Use `podman-compose` as the explicit Compose provider. The result must support local development,
container-backed tests, AyoKoding's example runner, and the existing image-publishing workflows
without requiring Docker Engine, Docker Desktop, Docker Compose, or Buildx.

This prepares the repository for later infrastructure work. Moving hosting from Vercel to Tencent
and Cloudflare is a separate future plan in `ose-private`; this plan makes no hosting change.

## Scope and boundaries

- Migrate development commands, supported Compose stacks, backend test dependencies, CI, image
  builds and publishing, `ayokoding-cli`, toolchain checks, cleanup, rules, specifications, and docs.
- Require rootless operation on Ubuntu and in CI. macOS uses a rootless Podman Machine connection.
  An unsupported host stops with an actionable diagnostic; it never silently switches to rootful.
- Preserve application behavior, ports, locales, GHCR image names/tags, and current deployment
  triggers. Preserve Dockerfile syntax, `.dockerignore`, and `docker.io` registry references where
  compatible; these are formats or registries, not a dependency on the Docker runtime.
- Leave all AyoKoding lesson content, code examples, run specifications, and expected outputs
  unchanged. The runner and its own test fixtures remain in scope.
- Preserve existing Docker data and unrelated running workloads. Do not uninstall Docker, prune
  the machine, adopt a production orchestrator, or rebuild unsupported historical stack scaffolds.

## Required plan order

This plan finishes before [the Phoenix rewrite](../../in-progress/ayokoding-app-web/README.md)
resumes. Phoenix then finishes before remaining work in every live AyoKoding Learn Revamp plan
06–14, including [plan 10](../../in-progress/ayokoding-learn-revamp-10-legacy-unique-migration/README.md).
Existing course-series dependencies remain. Ferret remains independent.

The [plan-order graph](../../README.md#plan-order), each live plan's `Depends-on` declaration,
and its execution narrative carry the same ordering. Passing a prerequisite never resumes another
paused session automatically.

## Read the plan

- [Business requirements](./brd.md) — the reason for this migration and its business boundaries.
- [Product requirements](./prd.md) — maintainer journeys and observable acceptance criteria.
- [Technical design](./tech-docs.md) — current contracts, decisions, impact, verification, and recovery.
- [Delivery checklist](./delivery.md) — ordered actions, gates, evidence, and final delivery.
- [Learnings](./learnings.md) — execution observations and their eventual durable destinations.

## Execution-state awareness

The 2026-10-26 read-only worktree inspection found Phoenix paused in Phase 0, without a Phoenix
implementation, and substantial partially delivered plan-10 work. The precise revisions and the
compatibility implications are recorded in [Current state](./tech-docs.md#current-state).

Those worktrees are evidence sources only. This plan does not merge, copy, reset, clean, or execute
their uncommitted output. Their owners reconcile the new runtime when their plans resume.
