# Technical Design — Code Harness

This directory is the plan's single technical form. Read the companions in order. Each one is
self-contained enough for a junior engineer to implement its part.

| File                                                                                           | What it covers                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [001-architecture.md](./001-architecture.md)                                                   | System context, containers, and components (C4); the `examples check` sequence; inert behaviour                    |
| [002-cli-project-and-hippo-parity.md](./002-cli-project-and-hippo-parity.md)                   | Project layout, command tree, streams and exit statuses, Nx targets, `behaviour-coverage.json`, HIPPO parity table |
| [003-run-yaml-contract.md](./003-run-yaml-contract.md)                                         | Units, the `run.yaml` field guide and data model, runtime view, anchor grammar, sync findings, opt-in              |
| [004-content-layout-and-migration-contract.md](./004-content-layout-and-migration-contract.md) | Today's measured layout, and the M1–M11 migration contract for plans 06–13                                         |
| [005-runners-and-toolchain-catalog.md](./005-runners-and-toolchain-catalog.md)                 | Catalog schema and entries, images, container invocation, double run, supervisor statuses, static mode             |
| [006-determinism-and-simulation.md](./006-determinism-and-simulation.md)                       | What the harness enforces and cannot enforce; the S1–S9 simulation convention; prior art                           |
| [007-ci-and-nx-targets.md](./007-ci-and-nx-targets.md)                                         | `ayokoding-www:examples:check`, the PR jobs, the reusable workflow, the monthly run, scheduled CLI tests           |
| [008-testing-and-manual-verification.md](./008-testing-and-manual-verification.md)             | Test layers, the fake container CLI, fixture courses, the manual CLI checklist                                     |
| [009-decision-records.md](./009-decision-records.md)                                           | D1–D21 with alternatives, prior art, trade-offs, consequences, and revisit triggers                                |
| [010-file-impact.md](./010-file-impact.md)                                                     | Root-relative file-impact tree with `[N]`/`[E]`/`[D]`/`[G]` markers                                                |
| [011-rule-and-docs-impact.md](./011-rule-and-docs-impact.md)                                   | Rules HC1–HC8, placement, exact text changes, both-ways enforcement proof, docs propagation                        |

## Summary

1. **Tool.** `apps/ayokoding-cli` is a Go 1.26.1 + Cobra CLI. It has a pure deterministic core
   (`internal/domain`, `internal/application`) held to 99% coverage and HIPPO's linter set or
   stricter. It has godog unit, integration, and E2E adapters.
2. **Contract.**
   - A unit is an example, kata, or capstone folder with a strict `run.yaml` (`ayokoding.run/v1`).
   - A lesson block is anchored to its file by the existing bold-path line, and must match it byte
     for byte.
   - A course opts in with its first `run.yaml`, and is then all-or-nothing.
3. **Runners.**
   - One container per run, from a digest-pinned image.
   - No network, read-only root, a non-root user, a cleared environment, resource limits, and a
     timeout.
   - Each run executes twice and the outputs are compared.
   - Services (PostgreSQL 18, Neo4j 2026.09) run on an internal network.
   - Platform-bound code uses static validators.
4. **Simulation.** Teaching code in the course follows S1–S9: a single-threaded event loop, a
   virtual clock, one seeded generator, at least 32 seeds, a fixed output contract, and replay
   through `AYOKODING_SEED`.
5. **CI.**
   - `ayokoding-www:examples:check` runs affected opted-in courses in the PR gate.
   - It runs every opted-in course, in four shards, monthly and whenever the toolchain catalog
     changes.
   - With no opted-in course it is a no-op that exits 0.
6. **Rules.** One new skill module (HC1–HC7), a gate-adapter section (HC8), and a one-sentence
   change in each of the four tutorial gates. Plus the Nx, workflow-naming, CLI-tier, and adapter
   records.

## Cross-Plan Handoffs

| To                                       | Work handed over                                                                                                                                             | Done when                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Plans 06–13                              | Apply the M1–M11 migration contract ([004](./004-content-layout-and-migration-contract.md#migration-contract-for-plans-0613)) to every course each plan owns | Each owned course is opted in, covered, and green; the plan saves the coverage JSON |
| Plans 11–13                              | Fix the 1,124 lesson-to-file mismatches and 167 missing-file anchors in the 25 affected courses as part of M6                                                | `examples sync` exits 0 for those courses                                           |
| Plan 13                                  | End with harness coverage at 100% of applicable courses (series table)                                                                                       | `examples coverage --min-percent 100` exits 0 on `main`                             |
| Plan 14                                  | The end-state gate: `examples coverage --min-percent 100` plus a green `examples check --all` on the same commit                                             | Both exit 0 before plan 14 archives                                                 |
| Any content plan needing a new toolchain | Add it under [Adding a Toolchain](./005-runners-and-toolchain-catalog.md#adding-a-toolchain)                                                                 | The toolchain smoke passes and the PR's full run is green                           |

Plan 02 offered an optional `ayokoding-cli paths core` subcommand. This plan declines it (D18), so
plan 02's handoff row closes as "declined".

## Corpus Disposition

No corpus. This plan has no `syllabus/` or other corpus folder; everything durable lands in
`apps/ayokoding-cli`, `specs/apps/ayokoding/cli`, and the rule homes in
[011](./011-rule-and-docs-impact.md).

## Vercel MCP Capability

- **In scope:** no reader-visible change. `apps/ayokoding-www/project.json` and the README change,
  but Vercel builds only from the `prod-ayokoding-www` branch, and no app source or content file
  changes.
- **Planning-time probe (2026-10-09, authoring session):** the authoring agent had no Vercel MCP
  tools, so the server is treated as **absent**. The plan uses no Vercel tool and needs no deploy.
