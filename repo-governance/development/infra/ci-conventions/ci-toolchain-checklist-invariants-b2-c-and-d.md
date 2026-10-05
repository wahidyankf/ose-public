---
description: "Fast-gate, static-coverage, and canonical-command invariants"
when_to_use: "Use when checking lifecycle execution or the Rhino command surface."
---

# Toolchain Checklist — Test Execution Boundaries and Command Surfaces

## Invariant B2 — Closed Fast Gates

Pre-commit runs staged deterministic checks only. Pre-push and PR/main run affected
`test:quick --parallel=1`. Quick includes every applicable static `test:coverage:*` validator and
Unit runtime for each behaviour owner. Integration/E2E runtime is unreachable directly or
transitively from hooks, PR/main gates, quick, and coverage validators.

Developers run impacted higher-layer scenarios manually. Scheduled/manual full-quality CI runs all
static validators, complete Integration, then complete unfiltered E2E. Each path fails closed.

## Invariant C — Rhino Hexagonal Architecture

Domain code remains I/O-free; application code depends on injected ports; infrastructure owns
filesystem, process, environment, and network adapters; CLI entry points delegate to application
use cases. Unit tests replace every infrastructure dependency. Integration may exercise local
adapters but no external network; public-process proof belongs to E2E.

## Invariant D — Canonical Command Surface

Callers use the canonical `rhino {group} {verb} [{noun}]` form. Do not reintroduce deprecated
`validate:*` aliases or testing-contract compatibility commands. `gate list` and `gate validate`
remain authoritative for the unrelated generic gate registry.
