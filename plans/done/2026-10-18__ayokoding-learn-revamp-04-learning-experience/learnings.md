<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->

# Learnings: ayokoding-learn-revamp-04-learning-experience

## Phase 12 triage (2026-10-18, resume execution)

- **Standalone serve setup (EWT-001): symlinks for `.next/static`+`public`, absolute
  `AYOKODING_WEB_MANIFESTS_DIR`** — DISCARDED with reason: the E2E target already owns its server
  lifecycle in `playwright.config.ts` (copies assets itself); manual serving is not a repo flow, and
  the working invocation is recorded in `delivery.md`'s EWT-001 note. No durable surface would act on
  this automatically.
- **`convention-emoji` pre-commit gate vs generated `search-data.json`** — REPORTED without plan
  authorization (handoff: user progress updates + worktree `local-tmp` execution ledger, 2026-10-18).
  Every `ayokoding-www` build regenerates the gitignored index containing a real-content emoji, failing
  the gate until the file is removed; plans 05–14 will hit the same trip. No `plans/ideas/` two-pager:
  not authorized. Sanitized: no secret content (build-output path + public lint rule only).
- **Lesson-corpus sweep sharding (4 files for worker parallelism)** — DISCARDED with reason: preserved
  in the shard structure, helper docs, and code comments; no repo-wide rule change proposed (sharding
  is this corpus's answer, not a general mandate).
- **Nx build `inputs` must include env vars that change outputs** — DISCARDED with reason: landed in
  `apps/ayokoding-www/project.json` and recorded in `delivery.md`'s fix-batch note; nothing further to
  route.
- **Missing Playwright browser binaries in fresh envs** — DISCARDED with reason: the tool's own error
  message names the exact `playwright install` command (self-directing); no durable surface needed.

## README follow-ups (reported to the user 2026-10-18, not done here)

- Path rail still only on course landing pages, not inner lesson pages (context bar covers orientation).
- Stale `canonical-content-tree-shape.md` claim (direct `.md` required per folder; `courses/`, `paths/`,
  and now `learn/` render without one).
- No cross-browser progress export/import (decision 38a).
- Plus resume deferrals (owner-approved 2026-10-18): UWT-003/010/011 copy churn → follow-up copy plan;
  UWT-005/006/007/008/013/014 → owning plans.
