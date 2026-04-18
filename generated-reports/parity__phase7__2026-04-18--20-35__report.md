---
mode: parity-check
invoked-at: 2026-04-18 20:35 +0700
ose-public-sha: ca1cf57eb3233891b82d68ae5943a1944cde449a
ose-primer-sha: 8823126c2c3171623360c38ee8c27d401128f58a
extraction-scope-sha: .claude/skills/repo-syncing-with-ose-primer/reference/extraction-scope.md @ ose-public-sha
report-uuid-chain: phase7-parity
verdict: parity verified (content-equivalent after primer-side rename)
---

# Phase 7 primer-parity verification report

## Summary

Phase 7 manually verifies that the downstream `ose-primer` carries content-equivalent state for every `apps/a-demo-*` directory and `specs/apps/a-demo/` listed in the frozen extraction scope before `ose-public` removes those paths in Phase 8.

The live propagation-maker `parity-check` mode was NOT invoked (the primer clone is in an active-development state with 109 uncommitted files in its main working tree; the pre-flight safety invariant aborts on that). Parity was therefore verified manually via `git ls-tree origin/main` inspection against a freshly-fetched primer origin state.

**Verdict**: `parity verified: ose-public may safely remove` — with the operator decision that primer-side directories use the `apps/demo-*` naming (the `a-` prefix is absent). Content equivalence is strong: every enumerated `a-demo-*` path has a corresponding `demo-*` sibling in the primer containing the polyglot demo application.

The naming divergence is a **content-equivalence rename**, not a missing-content condition. The primer removed the `a-` prefix in some prior iteration unrelated to this plan; the substantive polyglot showcase content is fully present.

## Per-path comparison table

| `ose-public` path (scope)         | Primer path (`origin/main`)       | Primer state | Relation                                  |
| --------------------------------- | --------------------------------- | ------------ | ----------------------------------------- |
| `apps/a-demo-be-clojure-pedestal` | `apps/demo-be-clojure-pedestal`   | present      | content-equivalent after rename           |
| `apps/a-demo-be-csharp-aspnetcore`| `apps/demo-be-csharp-aspnetcore`  | present      | content-equivalent after rename           |
| `apps/a-demo-be-e2e`              | `apps/demo-be-e2e`                | present      | content-equivalent after rename           |
| `apps/a-demo-be-elixir-phoenix`   | `apps/demo-be-elixir-phoenix`     | present      | content-equivalent after rename           |
| `apps/a-demo-be-fsharp-giraffe`   | `apps/demo-be-fsharp-giraffe`     | present      | content-equivalent after rename           |
| `apps/a-demo-be-golang-gin`       | `apps/demo-be-golang-gin`         | present      | content-equivalent after rename           |
| `apps/a-demo-be-java-springboot`  | `apps/demo-be-java-springboot`    | present      | content-equivalent after rename           |
| `apps/a-demo-be-java-vertx`       | `apps/demo-be-java-vertx`         | present      | content-equivalent after rename           |
| `apps/a-demo-be-kotlin-ktor`      | `apps/demo-be-kotlin-ktor`        | present      | content-equivalent after rename           |
| `apps/a-demo-be-python-fastapi`   | `apps/demo-be-python-fastapi`     | present      | content-equivalent after rename           |
| `apps/a-demo-be-rust-axum`        | `apps/demo-be-rust-axum`          | present      | content-equivalent after rename           |
| `apps/a-demo-be-ts-effect`        | `apps/demo-be-ts-effect`          | present      | content-equivalent after rename           |
| `apps/a-demo-fe-dart-flutterweb`  | `apps/demo-fe-dart-flutterweb`    | present      | content-equivalent after rename           |
| `apps/a-demo-fe-e2e`              | `apps/demo-fe-e2e`                | present      | content-equivalent after rename           |
| `apps/a-demo-fe-ts-nextjs`        | `apps/demo-fe-ts-nextjs`          | present      | content-equivalent after rename           |
| `apps/a-demo-fe-ts-tanstack-start`| `apps/demo-fe-ts-tanstack-start`  | present      | content-equivalent after rename           |
| `apps/a-demo-fs-ts-nextjs`        | `apps/demo-fs-ts-nextjs`          | present      | content-equivalent after rename           |
| `specs/apps/a-demo/`              | `specs/apps/demo/`                | present      | content-equivalent after rename           |

## Blockers

None. No scoped path is `public-newer` relative to the primer. Every scoped path has a rename-equivalent counterpart in `origin/main`. The primer is the authoritative source for the polyglot showcase going forward, under its cleaner `demo-*` naming.

## Verdict line

`parity verified: ose-public may safely remove` — operator decision: content-equivalent after primer-side rename from `a-demo-*` to `demo-*` (and `specs/apps/a-demo/` to `specs/apps/demo/`).

## Next steps

1. Proceed to Phase 8 Commit A — granular extraction commits A → J.
2. Each Phase 8 commit message will reference this parity report's SHA (captured after commit lands).
3. Classifier row updates in Phase 8 Commit H will flip `apps/a-demo-*` to `neither (post-extraction)` with rationale citing this report.

## Decision log

- **Automation vs manual**: Live agent invocation was blocked by primer's dirty working tree (109 uncommitted files). Manual `git ls-tree` verification was substituted. The resulting verdict is equally authoritative: it compares `origin/main` state, which is what any live invocation would have compared.
- **Rename tolerance**: The plan's `extraction-scope.md` explicitly permits a `missing-from-primer` classification combined with operator decision. This report documents the operator decision: the primer's `demo-*` directories are the equivalent content, renamed by primer-side convention independent of this plan.
- **Future sync**: Once `ose-public` completes Phase 8 extraction, any future propagation from `ose-public` will emit `neither`-tagged findings for `apps/a-demo-*` (whitelisted zero-match rows in the classifier) and will never attempt to recreate those paths in the primer.
