---
description: "Steps 1-4: read the error, blast radius, reproduce, trace to root cause."
when_to_use: "Use when starting to investigate a CI blocker."
---

# The Investigation Process (Steps 1-4)

## Step 1: Read the Error

Read the full error output. Not just the summary line -- the full stack trace, the full lint output, the full test failure message. The root cause is in the details.

## Step 2: Identify the Blast Radius

Determine which projects are affected:

```bash
# See which projects are affected by your changes (test:quick internally chains
# types/lint -> test:unit -> every applicable static test:coverage:*; see Nx Target Standards)
npx nx affected -t test:quick --dry-run
```

If a project you did not modify is failing, it is a preexisting issue. Your changes did not cause it, but you are responsible for fixing it because you discovered it.

## Step 3: Reproduce the Failure

Reproduce the failure in isolation to confirm it is preexisting:

```bash
# Run the specific failing target for the specific project
npx nx run <project>:typecheck
npx nx run <project>:lint
npx nx run <project>:test:quick
npx nx run <project>:test:behaviour:coverage
```

## Step 4: Trace to Root Cause

Common root causes of preexisting CI failures:

| Symptom                                                        | Common Root Cause                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type errors in a project you did not touch                     | A shared library changed its types without updating consumers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Lint errors in generated code                                  | The codegen target needs to run before lint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Test failures with stale snapshots                             | Snapshots need updating after a dependency upgrade                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Import resolution failures                                     | A dependency was added to one project but not another                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Coverage threshold failure                                     | A recent commit removed tests without replacing them                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Spec-coverage failure                                          | A command was added without a corresponding Gherkin scenario                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| F# analyzer/lint passes locally, fails in CI                   | Local `obj/` predates a newly added `.fs` file (or a cached/skipped `typecheck`), so the design-time compile list silently excludes it -- `dotnet build` before trusting a local `lint` pass; CI is the sole authority for G-Research analyzer diagnostics                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| A gate or test fails in the primary checkout while CI is green | Local-only contamination, not a defect in `origin/main`. Three known causes: stale `dist/` build output (use `--skip-nx-cache`; a plain build reports "outputs match the cache" and refreshes nothing, and the .NET apphost launcher is byte-identical across builds, so hashing it proves nothing -- stat the DLLs); a nested worktree, which filesystem-walking gates count as a second copy of every tracked file while `git status` stays clean; and a gitignored build artifact carrying a `project.json`, which Nx discovers because project discovery does not read `.gitignore`. Reproduce inside a worktree or read CI first -- contamination only ever adds findings, so a green local run still counts |
