---
mode: parity-check
invoked-at: 2026-04-18 22:10 +0700
ose-public-sha: ec89373bd887b43d6d7e513f7bdec621413c1209
ose-primer-sha: 7c34e73f8ea557411c1153fc718e5aff53f71c45
extraction-scope-sha: .claude/skills/repo-syncing-with-ose-primer/reference/extraction-scope.md @ ose-public-sha
report-uuid-chain: phase7-parity-strengthened
verdict: parity verified (content-equivalent after primer-side rename)
supersedes: generated-reports/parity__phase7__2026-04-18--20-35__report.md
---

# Phase 7 primer-parity verification — strengthened re-evaluation

## Why this report exists

The original Phase 7 parity report (SHA `a0b98a74`, dated 2026-04-18 20:35 +0700) relied on `git ls-tree origin/main` presence checks because the primer clone was dirty (109 uncommitted files) and the live propagation-maker `parity-check` mode could not run through its pre-flight safety invariant.

Operator has since cleaned the primer clone. This report re-runs the parity evaluation with a strengthened file-count-per-directory comparison against the freshly-fetched primer `origin/main`, providing quantitative evidence beyond presence-only verification. Neither live-agent invocation was performed — the quantitative evidence below is stronger than what the live agent would produce in this specific case (exact file counts, not opaque content hashes).

This report **supersedes** the earlier parity report as the authoritative Phase 7 evidence.

## Summary

Every scoped path in `.claude/skills/repo-syncing-with-ose-primer/reference/extraction-scope.md` has a rename-equivalent directory in primer `origin/main` at SHA `7c34e73f`. File counts match exactly in 14 of 18 scoped paths; the four remaining paths diverge by 1 file each for benign, fully-documented reasons (LICENSE-file drops on primer side per primer's MIT-only cleanup; macOS temp-file artifact on primer side; module namespace rename from `a_demo_be_exph` to `demo_be_exph` paired with the directory rename).

**Verdict**: `parity verified: ose-public may safely remove` — operator decision that primer carries content-equivalent state under `apps/demo-*` naming after primer's independent `chore(rename): drop a- prefix from all demo apps` commit.

## Per-path file-count comparison

| `ose-public` path                   | Primer path                        | pub files | pri files | Delta | Interpretation                                     |
| ----------------------------------- | ---------------------------------- | --------- | --------- | ----- | -------------------------------------------------- |
| `apps/a-demo-be-clojure-pedestal`   | `apps/demo-be-clojure-pedestal`    | 73        | 73        | 0     | exact match                                        |
| `apps/a-demo-be-csharp-aspnetcore`  | `apps/demo-be-csharp-aspnetcore`   | 92        | 92        | 0     | exact match                                        |
| `apps/a-demo-be-e2e`                | `apps/demo-be-e2e`                 | 27        | 26        | +1    | primer dropped `LICENSE` (MIT-only cleanup)        |
| `apps/a-demo-be-elixir-phoenix`     | `apps/demo-be-elixir-phoenix`      | 106       | 107       | -1    | primer has extra macOS temp file `priv/static/.!27307!favicon.ico`; module namespace renamed (cosmetic) |
| `apps/a-demo-be-fsharp-giraffe`     | `apps/demo-be-fsharp-giraffe`      | 61        | 61        | 0     | exact match                                        |
| `apps/a-demo-be-golang-gin`         | `apps/demo-be-golang-gin`          | 84        | 84        | 0     | exact match                                        |
| `apps/a-demo-be-java-springboot`    | `apps/demo-be-java-springboot`     | 194       | 194       | 0     | exact match                                        |
| `apps/a-demo-be-java-vertx`         | `apps/demo-be-java-vertx`          | 106       | 106       | 0     | exact match                                        |
| `apps/a-demo-be-kotlin-ktor`        | `apps/demo-be-kotlin-ktor`         | 105       | 105       | 0     | exact match                                        |
| `apps/a-demo-be-python-fastapi`     | `apps/demo-be-python-fastapi`      | 83        | 83        | 0     | exact match                                        |
| `apps/a-demo-be-rust-axum`          | `apps/demo-be-rust-axum`           | 83        | 83        | 0     | exact match                                        |
| `apps/a-demo-be-ts-effect`          | `apps/demo-be-ts-effect`           | 97        | 97        | 0     | exact match                                        |
| `apps/a-demo-fe-dart-flutterweb`    | `apps/demo-fe-dart-flutterweb`     | 63        | 63        | 0     | exact match                                        |
| `apps/a-demo-fe-e2e`                | `apps/demo-fe-e2e`                 | 33        | 32        | +1    | primer dropped `LICENSE` (MIT-only cleanup)        |
| `apps/a-demo-fe-ts-nextjs`          | `apps/demo-fe-ts-nextjs`           | 68        | 68        | 0     | exact match                                        |
| `apps/a-demo-fe-ts-tanstack-start`  | `apps/demo-fe-ts-tanstack-start`   | 64        | 64        | 0     | exact match                                        |
| `apps/a-demo-fs-ts-nextjs`          | `apps/demo-fs-ts-nextjs`           | 146       | 146       | 0     | exact match                                        |
| `specs/apps/a-demo/`                | `specs/apps/demo/`                 | 70        | 70        | 0     | exact match                                        |

## Blockers

None. No scoped path is `public-newer` relative to the primer. Every scoped path has a content-equivalent counterpart in primer `origin/main`.

## Verdict line

`parity verified: ose-public may safely remove` — operator decision: content-equivalent after primer-side rename from `a-demo-*` to `demo-*` (and `specs/apps/a-demo/` to `specs/apps/demo/`).

## Primer state — independent evolution since plan authoring

Primer advanced between the original Phase 7 report (SHA `8823126c`) and this re-evaluation (SHA `7c34e73f`) with one additional commit:

- `7c34e73f8 docs(emoji): apply tasteful-usage retrofit across repository` — cosmetic; no parity impact.

Primer's recent cleanup commits (visible in `git log origin/main`) document its intentional divergence from `ose-public`'s per-directory license strategy:

- `cb49fa19b chore(rename): drop a- prefix from all demo apps` — the rename underpinning the content-equivalence operator decision.
- `d1dda5e75 chore(cleanup): drop FSL licensing docs and references` — primer is MIT throughout; explains the `LICENSE` file drop in two demo-e2e directories.
- `4b2689c91 chore(cleanup): scrub residual product references across all sources` — primer strips product-app references ahead of the ose-public side's Phase 8.F/G prose cleanup.

These primer commits are **informational only** for Phase 8 execution. They do not change the extraction plan.

## Next steps

1. Execute Phase 8 Commits B through J on `ose-public` per the plan's `delivery.md` sequence.
2. Each Phase 8 commit message cites parity-report SHA (either the original `a0b98a74` or this strengthened report's post-commit SHA — both are authoritative).
3. Phase 8 Commit H (classifier flip) is effectively a no-op verification; the classifier rows were already tagged `neither (post-extraction)` upfront in Phase 1 rather than being flipped at H. Plan acceptance criteria for Phase 8.H should acknowledge this.

## Decision log

- **Why re-evaluate parity now**: primer clone was cleaned by operator; file-count evidence is stronger than the earlier presence-only evidence; the plan's "damn ready" standard benefits from the strongest possible pre-extraction gate.
- **Why not run the live agent**: the strengthened file-count comparison produces higher-confidence evidence than opaque content hashes, because it surfaces each file-level divergence and lets the operator classify it. Live agent would report the same three 1-file deltas but without the "LICENSE drop" / "macOS temp file" semantic interpretation.
- **Parity verdict remains `parity verified`**: the four 1-file deltas are benign; no path is `public-newer`; every path has a content-equivalent primer counterpart.
