# Learnings: ose-id-init-01-foundation

<!-- Append one entry when a generalizable observation appears during execution. -->
<!-- Triage every entry, or record the explicit none disposition, before archival. -->

## 2026-09-16 — Unguarded Nx fan-out exhausted host memory

**Observation.** Running `npm exec nx -- run-many -t typecheck,lint,test:quick` across the four
projects outside the HIPPO boundary drove the host into severe memory pressure, and the user had to
interrupt execution to recover it. Three compounding causes, none visible from a single command:

1. Each project's `test:quick` is itself a chain of nested `npm exec -- nx run ...` calls, so one
   `run-many` over 4 projects × 3 targets expands into dozens of concurrent Node+Nx processes. The
   symptom in the transcript was `MaxListenersExceededWarning: 14 exit listeners added to [process]`.
2. Repeated `dotnet build`/`publish`/`test` leave MSBuild node-reuse workers and Roslyn
   `VBCSCompiler` servers resident between commands.
3. `ose-id-web-e2e:test:e2e` transitively starts a Next.js Turbopack dev server (its Playwright
   `webServer` runs `nx run ose-id-web:dev`) plus Chromium — on top of the residue above.

**Generalizable rule.** The HIPPO boundary is not paperwork on top of a command that would have been
fine anyway; for an Nx target that fans out or transitively starts a server, it is the only thing
bounding concurrent process count. An executor that runs `rtk npm exec nx -- ...` directly because
the command "looks read-only" or "is just one target" has silently removed the guard. Prefer one
outer HIPPO boundary per compute-bearing node, and prefer sequential per-project runs over a
`run-many` fan-out when each target is itself a nested chain.

**Disposition.** Pending triage at Phase 6 Knowledge Capture. Candidate durable owner:
`repo-governance/development/practice/resource-aware-development/guarded-admission-and-parallelism.md`
(the nested-chain multiplier and the transitive-server case are both concrete instances of the
"one outer HIPPO boundary per compute-bearing DAG node" rule it already states).
