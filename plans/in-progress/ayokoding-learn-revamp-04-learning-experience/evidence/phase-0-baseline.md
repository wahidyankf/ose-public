# Phase 0 — Baseline

Synced execution branch: `origin/main` @ `1c848ae0e` (worktree
`worktrees/ayokoding-learn-revamp-04-learning-experience/`).

## Commands

| Check              | Result | Notes                                                                                                |
| ------------------ | ------ | ---------------------------------------------------------------------------------------------------- |
| `QUICK`            | pass   | typecheck pass, lint pass, `test:unit` pass (199 files), `test:coverage` pass — see below            |
| `E2E-QUICK`        | exit 0 | `ayokoding-www-fe-e2e:test:quick` (typecheck, lint, behaviour coverage: 57 features / 447 scenarios) |
| `E2E`              | exit 0 | production build + Playwright Chromium/Firefox/WebKit — `1112 passed (26.2m)`, 0 failed              |
| `VALIDATE-INDEXES` | exit 0 | after fixing preexisting drift (see below)                                                           |

### `QUICK` detail

The documented `QUICK` command was **pressure-shed** by HIPPO three times
(`hippo.limit.pressure-shed` after a memory-warning) while the host sat at ~44% free memory — the
unit-fe jsdom project (a 356-test `ai-benchmark.steps.tsx` among others) pushes the peak over
HIPPO's host threshold. The typecheck and lint sub-targets passed on every attempt. Re-running the
unit portion with a lower worker count cleared it:

```
All files          |   98.31 |    90.29 |   99.07 |   99.44 |
 Test Files  199 passed (199)
EXIT=0
```

Line coverage 99.44% (threshold 99). This is an environment mitigation only; the test set is
unchanged.

### `VALIDATE-INDEXES` — preexisting failure fixed (Iron Rule 3)

`validate-indexes` failed on a clean checkout for two generated bodies:
`content/en/learn/_index.md` (missing the `backend-essentials-with-go` course, added in
`c00db9415`) and `content/en/learn/courses/backend-essentials-with-go/_index.md` (stale
`learning/capstone/overview` entry). Regenerated with `generate-indexes`; `validate-indexes` now
exits 0. Committed separately as `fix(ayokoding-www): regenerate drifted learn indexes`.

## Environment mitigations (host memory pressure)

This host has ~7.7 GiB free memory against HIPPO's heavy tier minimum of 8 GiB and a 6 GiB
emergency floor, so the unmodified heavy commands are pressure-shed (`hippo.limit.pressure-shed`,
exit 124). The baseline was obtained by lowering only the child's peak footprint, with no change to
any test, assertion, or measured code:

- **Unit suite:** `--maxWorkers=1` (same projects, same tests; 199 files, coverage 99.44% lines).
- **Production build:** the local-only `LOCAL_BUILD_WORKERS` cap left at 1 for the run
  (`apps/ayokoding-www/src/build-workers.ts`; reverted immediately afterwards, `git checkout`), and
  `NODE_OPTIONS=--max-old-space-size=3072`.
- **Playwright:** `--workers=1` (the config's default local worker count is unbounded).

With these, `next build` generated all 3281 static pages (exit 0) and Playwright ran the full suite
across all three browsers to completion. A final `git status --short` after the run shows only the
plan's `evidence/` folder.

## Vercel MCP re-probe

**Absent.** No Vercel tool is available in this session. Recorded as `absent`; no Vercel identifier
is written. The plan uses no Vercel tool either way (tech-docs/README §Vercel MCP Capability).

## Deferred: Phase 0 "before" screenshots

The Phase 0 before-screenshots (`phase-0-before-<screen>-en-<bp>px.png`) are **deferred**. The dev
server (`nx dev ayokoding-www`) starts and answers the first request (`GET /en/learn 200 in 5.0s`)
but then accepts TCP connections without ever responding, under the same host memory pressure that
sheds the heavy runs — so neither the Playwright MCP browser nor the Playwright CLI can capture, and
the port is left free again. This item is not part of the Phase 0 Gate checklist (which names only
`git status`, the four baseline commands, the contract rows, and the inventory). The same four
screens are captured as `phase-10-*` evidence during Phase 10 manual verification, against a
reliable server.
