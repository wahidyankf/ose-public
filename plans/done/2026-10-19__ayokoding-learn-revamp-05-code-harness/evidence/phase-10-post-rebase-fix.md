# Phase 10 Addendum — Post-Rebase Fixture Drift Fix (2026-10-19)

After the delivery commit was rebased onto `origin/main` (`daeaef9d9`),
`ayokoding-cli:test:unit` went red in
`TestSyncCleanCoursePasses` and `TestSyncWriteRepairsStaleFences`:
two fenced code blocks in
`tests/testdata/courses/green-python/learning/lessons/hello.md`
(`ex-03-env`, `ex-04-immutable`) were missing the blank line the
`sync --write` normalizer emits after the module docstring, so the
in-fixture bytes no longer matched the CLI output byte-for-byte
(expected `..."""\n\nwith open...`, fixture had `..."""\nwith open...`).

Fix: added the blank line in both fences (fixture-only change, no
product or assertion change). Verified with
`go test -count=1 ./internal/adapters/cli/ ./internal/adapters/content/
./internal/application/ ./internal/domain/...` — all packages `ok`.
`affected -t test:quick,typecheck,lint` green after the fix.

Note: the drift predates the rebase window (the normalizer always
emitted the blank line); the rebase only surfaced it by re-running
the gates on the final tree. No requirement or scenario impact:
markdown-file-sync scenarios remain bound and green (§2 of
`phase-10-audit.md`).

## Same-window follow-ups (2026-10-19)

1. The `want` constant for `the source file in the course is unchanged`
   (`tests/bdd/steps_test.go`) still mirrored the pre-fix `sticky.py`
   bytes (no blank line after the docstring) while the fixture file
   carries the blank line, so the determinism scenario
   (`determinism.feature:27`) failed post-fix. Updated the constant to
   the fixture bytes (added `"\n"`); no assertion weakened — the
   scenario still proves the run cannot mutate the course file.
   `CLI-INTEGRATION` re-run: 64/64 scenarios green.
2. `SMOKE` (`examples check --all` over `tests/testdata/toolchain-smoke`)
   reported 3 `ayokoding.sync.mismatch` findings in the same drift
   class (gcc + windows-static fences showed 4-space indent vs 2-space
   `main.c`/`hello.c`; postgres fence showed the old single-line
   `params` form vs the refactored multi-line `query.py`).
   Normalized with the product itself
   (`examples sync --write --content .../toolchain-smoke`), which
   touched exactly those 3 lesson files (diff reviewed: fence←code
   only). SMOKE re-run: exit 0, 35 passed, 0 failed,
   27 of 27 applicable courses covered; leftover `docker ps` /
   `docker network ls` headers only.
3. `CLI-E2E` (`test-e2e.sh`) exit 0 and `CLI-BEHAVIOUR`
   (`ayokoding-cli:test:coverage`, four adapters) `Successfully ran`
   re-confirmed on the final tree after the Docker Desktop restart +
   toolchain image rebuild (9 derived rebuilt via
   `toolchains build`, 15 official pulled by digest).

## CI red on PR #720 — root-caused and fixed (2026-10-19)

PR CI failed 4 checks; 3 shared one root cause, 1 was independent:

1. `apps/ayokoding-cli/.gitignore` carried a bare `coverage/` rule
   (meant for the `coverage-gate.sh` output dir) and the root
   `.gitignore` `# Testing` section carries another. Both also match
   the source packages `internal/domain/coverage/` and
   `tests/coverage/` (5 `.go` files: the coverage domain, its test,
   and the threshold helper `main.go`/`doc.go`/test that
   `coverage-gate.sh` itself runs via `go run ./tests/coverage`).
   Locally every gate passed because the files exist on disk; CI's
   clean checkout lacked them, so `check.go`'s
   `internal/domain/coverage` import failed (`Go quality gate`,
   `Plan AyoKoding examples check`, summary `Quality gate`).
   Fix: anchored the module rule to `/coverage/` and re-included the
   two source packages (`!internal/domain/coverage/`,
   `!tests/coverage/`); the root JS-testing rule is untouched and
   both output dirs (`apps/ayokoding-cli/coverage/`,
   `apps/ayokoding-www/coverage/`) stay ignored (verified with
   `git check-ignore`). All 5 files committed here; `gofmt`/`go vet`
   clean.
2. `Repository policy`: `format-staged` flagged
   `evidence/phase-5-plan-app.md` (two list-continuation lines at
   3-space indent; prettier wants 1). Fixed with `prettier --write`
   on that file only (whitespace-only diff), then swept every other
   `.md` in the push range with `prettier --check` — all clean (one
   apparent hit was the deleted pre-move backlog path).
