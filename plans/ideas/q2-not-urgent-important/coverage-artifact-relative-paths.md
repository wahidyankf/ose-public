# Keep Generated Coverage Artifacts Path-Independent

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: generated .NET and Rust coverage files bake the absolute path of whichever checkout
last ran the suite, so a second clone dirties the tree on `test:quick` — per-project `.gitignore`
entries already neutralize both known instances, leaving only a standing guard and an index check.

> Demoted from a full `backlog/` plan to a two-pager on 2026-08-05. The plan folder carried the
> standard five documents — `README.md`, `brd.md`, `prd.md`, `tech-docs.md`, and `delivery.md` (a
> single-phase, `worktree-to-pr` investigation-and-fix checklist with a two-clause gate) — plus an
> empty `learnings.md`. The problem statement, the gitignore-versus-relative-paths decision, and the
> out-of-scope list survive here; the phase table, Gherkin, persona, and user story were cut.
> Relocated from beaver-nest/plans/ideas/coverage-artifact-relative-paths.md on 2026-08-06 by plan-ideas-grooming.
>
> Resolved 2026-09-02, via `ose-public#440`: the promotion signal fired — `libs/fsharp-crane-core`
> and `libs/fsharp-env-loader` landed tracked `tests/unit/coverage.json` carrying a local
> `/Users/<maintainer>/.../adopt-beavernest-test-automation/...` prefix, caught by that PR's `pr-leak-review`
> (machine-specific-absolute-path). Applied the proposed direction as-is: added a root-level
> `coverage.json` rule to `.gitignore` (next to `coverage/`/`coverage.xml`) and `git rm --cached` the
> two tracked files. No relative-path emission work needed; the ignore-it remedy the repo had already
> converged on was sufficient.

## Problem / context

A coverage tool that writes absolute filesystem paths into a committed output file makes that file
environment-specific. The learning surfaced during the `baseerah-repo-reset` Phase 0 baseline
`test:quick` sweep: running the suite from a different checkout regenerated the artifact with local
paths and produced an 11-line diff carrying zero information about any code change, reverted with
`git checkout --` as out of that plan's scope. In a workspace where `ose-public`, the private sibling, and
`beaver-nest` all sit side by side under one parent directory, plus per-plan worktrees, that noise
erodes trust in `git status`.

Re-verifying in this repo on 2026-08-05 changed the picture substantially — **most known instances
are already neutralized** — though a 2026-08-18 re-check found one of those findings overstated:

- The file the original plan named, `libs/fsharp-crane-core/tests/unit/coverage.json`, **does exist
  here** — re-checked 2026-08-18 by the `repo-clean-up` plan, which corrects the 2026-08-05 reading
  that no `fsharp-crane-core` was present. `libs/` holds `fsharp-crane-core`, `fsharp-env-loader`,
  `ts-env-loader`, `web-ui`, and `web-ui-token`. Whether that instance is already `.gitignore`d is
  an open question this two-pager should settle before promotion.
- The class did transfer to the F# backend. `apps/beaver-nest-be/tests/unit/coverage.json` exists
  on disk (2,802 bytes) and contains 5 absolute paths, every one of them rooted at a
  `.../ose-projects/baseerah/...` prefix — the repository's pre-rebrand directory name, so the copy
  on disk predates the rename and has not been regenerated in this checkout since.
- That exact path is already ignored, at `apps/beaver-nest-be/.gitignore` line 4
  (`tests/unit/coverage.json`). The generator is `coverlet.msbuild` 8.0.1 (alongside
  `coverlet.collector` 8.0.1) declared in `BeaverNestBe.UnitTests.fsproj`, driven by
  `nx run beaver-nest-be:test:coverage`, which runs `dotnet test` with
  `/p:CollectCoverage=true /p:Threshold=90 /p:ThresholdType=line`. Coverlet's default output format
  is JSON, written next to the test project — hence the filename.
- A second instance of the same class exists: `apps/rhino-cli/lcov.info` carries 124 absolute
  `SF:` source paths under the same stale `baseerah` prefix, and is likewise already ignored by
  `apps/rhino-cli/.gitignore`.

What is **not** fixed is the generality. The root `.gitignore` ignores `coverage/`, `coverage.html`,
`.coverage`, and `coverage.xml` (annotated "AltCover default output") — but neither `coverage.json`
nor `lcov.info`. Both live instances are covered only by hand-written nested `.gitignore` files that
the next project to add coverage must remember to write.

## Why now

The cost of acting is near zero and shrinking, because the hard part is done: two per-project ignore
rules already exist and no tooling consumes either artifact. A repo-wide grep for `coverage.json`
outside `plans/`, `node_modules/`, and build output finds only `.prettierignore`, the two `.gitignore`
entries, and Nx terminal-output cache logs; BeaverNest's now-retired
`specs:behavior:coverage` target invoked rhino-cli with no `--unit-report` flags, so no gate ingested
the JSON. That means the remaining
work is a cheap generalization done while the context is fresh, before a third .NET or Rust project
lands and re-introduces the same trap by omission.

## Prior art / precedents

- **The originating plan** — where the 11-line phantom diff was observed and deliberately deferred.
  [baseerah-repo-reset](https://github.com/wahidyankf/beaver-nest/blob/main/plans/done/2026-07-31__baseerah-repo-reset/README.md)
- **The rebrand that dated the evidence** — explains why both artifacts still carry a `baseerah`
  path prefix. [beaver-nest-rebrand](https://github.com/wahidyankf/beaver-nest/blob/main/plans/done/2026-08-01__beaver-nest-rebrand/README.md)
- **`apps/rhino-cli/.gitignore`** — the in-repo precedent for the ignore-it remedy, applied to
  `lcov.info` and `lcov_spec.info` alongside `target/` and `*.profraw`.
  [rhino-cli gitignore](https://github.com/wahidyankf/beaver-nest/blob/main/apps/rhino-cli/.gitignore)
- **Build-artifact sweeper convention** — establishes that generated output is regenerable and never
  belongs in a commit, which is the principle this idea extends to coverage files.
  [build-artifact-sweeper](https://github.com/wahidyankf/beaver-nest/blob/main/repo-governance/development/infra/build-artifact-sweeper.md)
- **Coverlet's `UseSourceLink` option and .NET's `DeterministicSourcePaths`** — the upstream
  mechanism for emitting portable rather than machine-local source paths, the alternative remedy the
  repo did not take. [coverlet](https://github.com/coverlet-coverage/coverlet)

## Proposed direction (sketch)

Ratify the remedy the repo has already converged on — do not track generated coverage output — and
make it structural rather than per-project:

- Lift `coverage.json` and `lcov.info` into the root `.gitignore` next to the existing `coverage.xml`
  and `coverage/` rules, so a new project inherits the protection instead of re-deriving it.
- Confirm the two existing artifacts are genuinely absent from the git index, not merely ignored —
  an ignore rule added after a file was committed does not untrack it.
- Keep relative-path emission in reserve. If a future CI job ever needs to publish coverage to an
  external service, revisit `/p:UseSourceLink=true` and `DeterministicSourcePaths` then, on the
  merits of that use case.
- While there, consider declaring the artifact as an Nx `outputs` entry on `test:coverage`, which
  today sets `cache: true` and `inputs` but declares no outputs.

## Rough scope & non-goals

In scope: root-level ignore rules covering the generated coverage artifact filenames; a one-time
index check for the two known files; a short note recording the decision so the next project does not
re-litigate it.

Out of scope, carried forward from the source plan:

- Any change to the .NET project's own test content or its coverage thresholds — the 90% line
  threshold on `beaver-nest-be:test:coverage` stays exactly as it is.
- Retroactively rewriting existing coverage history.

## Risks & open questions

- Is `apps/beaver-nest-be/tests/unit/coverage.json` still present in the git index despite the
  ignore rule? (open — this pass deliberately ran no git command, and the stale pre-rebrand paths in
  the on-disk copy are exactly the symptom a still-tracked file would show. This is the single
  highest-value question and it is cheap to settle with one `git ls-files` invocation.)
- Gitignore versus relative-path emission was the source plan's central undecided question. It is
  now effectively answered by revealed preference — both instances are ignored — but nothing records
  that as a decision, so a future contributor could reasonably re-open it. (open, but low stakes)
- Does broadening the ignore to a bare `coverage.json` pattern risk swallowing a legitimate
  hand-authored file of that name? (open — no such file exists today, but a narrower path-anchored
  pattern may be the safer form.)
- Scope creep beyond the two known artifacts was a stated risk in the source plan. The 2026-08-05
  scan bounds it: exactly two instances, both already ignored, no third .NET or Rust coverage output
  found under `apps/` or `libs/`. This risk is now largely retired.

## What success looks like + promotion signal

Success: running the coverage suite from any checkout path produces zero coverage-artifact entries in
`git status`, and the guarantee comes from a root-level rule rather than from each project
remembering to write its own. The decision to ignore rather than normalize is written down once.

Promotion signal — promote to a full plan only if the index check shows
`apps/beaver-nest-be/tests/unit/coverage.json` is still tracked, or if a third project lands a
tracked coverage artifact. Absent either trigger, this is a few lines in the root `.gitignore` plus a
recorded decision, and it should be folded into the next unrelated tooling-hygiene change rather than
carried as a plan of its own.
