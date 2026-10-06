---
description: "Closed fast-gate composition with static coverage and no higher-layer runtime"
when_to_use: "Use when wiring or auditing test:quick and its lifecycle surfaces."
---

# Mandatory `test:quick` Composition and Gate Surfaces

An owner project's sequential `test:quick` runs:

1. `typecheck` when applicable;
2. `lint`;
3. `test:unit`; and
4. every applicable static `test:coverage:*` validator, directly or through `test:coverage`.

Composite testing targets use `nx:run-commands` with object-form commands, an explicit
`"forwardAllArgs": false` on every command and on the options object, and `"parallel": false`.
Invoke sibling targets as `npm exec -- nx run <project>:<target>`. Keep cache and input declarations
explicit and use `cwd` only when the underlying command is project-relative. This selector is the
Nx 22-compatible equivalent of BeaverNest's Nx 23 `run -p <project> -t <target>` form.

The Unit invocation collects native line coverage and hard-fails below 99%. An explicitly
enumerated boundary adapter may leave the Unit denominator only when it is wholly a resource,
process, generated-code, or static-data boundary and named Integration or E2E runtime proof
exercises it. Keep exclusions to named files or narrow functions; broad path globs, mixed core-logic
exclusions, and boundary code without higher-layer proof fail the gate.

A dedicated E2E project's quick target omits Unit runtime and runs its applicable static validators.
Every coverage target must stay deterministic and must not execute or depend on `test:unit`,
`test:integration`, or `test:e2e`. Runtime Unit may produce and enforce native code-coverage data as
part of its own invocation; static coverage validators neither produce nor consume runtime proof.
This is an intentional compatibility difference from the BeaverNest command-shape reference,
whose `test:coverage:*` targets execute tests and whose quick target is not cached: OSE adopts its
command structure, but retains static-only coverage targets and cache-correct quick inputs.

Pre-commit runs staged deterministic checks only, and pre-push runs only its declared gates; neither
runs quick. The PR workflow's language jobs run affected quick targets with explicitly bounded
project parallelism while preserving each project's ordered quick composition. No hook or PR/main job
may reach Integration or E2E runtime. Developers select
impacted higher-layer scenarios manually; scheduled/full-quality CI runs complete applicable
Integration and E2E suites.
