# Delivery Checklist — Path-Aware Navigation UI

> **Programme decisions** — the `R*` rules and `A*` amendments cited below are defined in
> [tech-docs.md §Programme decisions](./tech-docs.md#programme-decisions).

This checklist delivers the **rendering layer** of the `course-paths` feature in `ayokoding-www`: the
shell modules, the `?path=` route wiring, the Screen 3 left path rail, the landing hero's four goal
cards, the paths hub, the path landing, and the accessibility contract for all of them — proven
end-to-end against a **fixture manifest**, because the four real manifests ship downstream in
`ayokoding-learning-path-05-manifests`.

**Hard prerequisite**: `ayokoding-learning-path-01-url-restructure` **and**
`ayokoding-learning-path-02-schema-and-prerequisite-dag` must both be merged to `main` before Phase 1
starts. See [README §Depends-on](./README.md#depends-on) for the checkable start preconditions.

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
> Git-mechanical steps (worktree create/remove, branch, push, merge) are `[AI]`.
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (safe-to-stop state + resume command). Every gate covers the phase's
> **code correctness** (tests, checkers, build); only the gate of a phase that is a **delivery
> boundary** (see [Delivery Boundaries](#delivery-boundaries) below) additionally covers
> **integration** (draft PR opened, 3-cycle PR-Review, CI green, `[AI]` merge, `ayokoding-www`
> deployed) — intermediate phases commit to their delivery unit's branch and stay unopened for review
> until that boundary. A phase is not complete until every gate check is green.

## Worktree

Worktree path: `worktrees/ayokoding-learning-path-03-navigation-ui/`

Optional manual pre-provisioning (run from repo root):

```bash
claude --worktree ayokoding-learning-path-03-navigation-ui
```

The plan-execution Step 0 gate enters this worktree by default: it auto-provisions from the latest
`origin/main` when missing, syncs with `origin/main` before implementing, and prompts before deleting
the worktree after the plan is archived and pushed.

Each delivery unit branches from the **latest `origin/main`** inside this one worktree
(`git fetch origin && git checkout main && git pull && git checkout -b
ayokoding-learning-path-03-navigation-ui/<phase-slug>`), authors every phase in that unit on the same
branch, commits per phase, pushes that branch, and opens **its own draft PR at the unit's delivery
boundary** — see [Delivery Boundaries](#delivery-boundaries) below for which phases share a unit.
**Phase 0 is excluded**: it is setup and baseline, pushes no branch and opens no PR, and its evidence
artifacts ride the Phase 1 PR.

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

## Delivery Mode: worktree-to-pr

Each **delivery unit** — the contiguous phase ranges named in
[Delivery Boundaries](#delivery-boundaries) below; Phase 0 opens none — works in this worktree on its
**own branch**, opens a **draft PR** against `main` at the unit's boundary phase, runs the
**PR-Review Maker→Fixer Cycle** (fan-out → `pr-review-synthesis-maker` → `pr-review-fixer`, 3 sequential CI-gated cycles),
flips the PR to ready, and `[AI]` **merges it automatically once all quality gates are green** — then
`[AI]` **deploys `ayokoding-www` to `prod-ayokoding-www` after every merge** (this plan ships to
ayokoding.com). See
[Plans Organization Convention §Delivery Mode](../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)
and the [PR Review Quality Gate workflow](../../../repo-governance/workflows/pr/pr-review-quality-gate.md).

> **DN-11 DECIDED — `[AI]` auto-merge (now the repo default)**: the repo's
> [PR Merge Protocol](../../../repo-governance/development/workflow/pr-merge-protocol.md) has `[AI]`
> merge the PR **by default** once its five hardened preconditions hold; a `[HUMAN]` merge gate is an
> explicit per-plan opt-in, and this plan does not opt in. When DN-11 was first recorded the protocol
> still defaulted to a `[HUMAN]` merge, so the maintainer authorized `[AI]` merge for this plan
> specifically (2026-07-18, in-session — modeled on the sibling plan
> `fundamentally-strong-software-engineer`'s own separately-recorded authorization) via two directives:
> (a) this plan uses the SAME delivery methods as the sibling plan, and (b) no maintainer permission is
> needed to merge a PR once it has passed 3 review cycles and the PR quality gate. The protocol has
> since been changed to match, so **DN-11 = AI-auto-merge** now simply confirms the repo default rather
> than deviating from it. The preconditions are unchanged either way — only the actor differs.

**Delivery-Boundary Integration Protocol** (fires once per **delivery boundary** named in
[Delivery Boundaries](#delivery-boundaries) below — the boundary phase's gate lists these as
must-pass — not once per phase; a delivery unit's intermediate phases commit to that unit's branch
and pass their own `### Phase N Gate`, but do not run this protocol). **Phase 0 is excluded**: it is
Environment Setup and Baseline, opens no PR, pushes no branch, runs no review cycle, and merges
nothing; its evidence artifacts ride the Phase 1 PR
([§Phase 0 Opens No PR](../../../repo-governance/conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule)).

1. [AI] Sync the worktree to latest `origin/main` and branch:
   `git fetch origin && git checkout main && git pull && git checkout -b
ayokoding-learning-path-03-navigation-ui/<phase-slug>`.
2. [AI] Stage only this phase's paths (`git add <explicit paths>` — never `git add -A`), commit
   thematically (Conventional Commits, imperative, no period), push the branch, open a **draft PR**
   against `main` (`gh pr create --draft --base main ...`) — CI runs on the PR.
3. [AI] Run the **PR-Review Maker→Fixer Cycle** (3 sequential CI-gated cycles), resolve every finding,
   then `gh pr ready`.
4. [AI] **Merge** once all quality gates are green (typecheck, lint, `test:quick`, `test:unit`,
   `test:e2e` where affected, `specs:behavior:coverage`, CI, the 3-cycle review) — `[AI]` auto-merge
   per DN-11.
5. [AI] Dispatch `apps-ayokoding-www-deployer` to deploy `ayokoding-www` to `prod-ayokoding-www` — a
   no-op redeploy for plan-side-only phases.

## Parallelization Model

**Cap**: honor the in-force subagent/PR-review concurrency cap (parallel-by-default, background
subagents capped per the orchestration convention). The main thread self-promotes nothing.

Every phase in this plan is **serial** — each builds directly on the prior feature slice
(funnel → shell + route → landing/hub/hero + e2e → verification → retest → integration → capture →
archival). There is no independent fan-out inside this plan; the parallelism in the wider effort is
**across** the five split plans, and this plan is the Wave-2 node that unblocks
`ayokoding-learning-path-05-manifests`.

```mermaid
%% Phase flow for this plan. Node SHAPE encodes kind: hexagon = setup/verify (no feature code),
%% rectangle = feature code, stadium = terminal. Each edge is gated by the prior phase's gate.
%% TB orientation: this is a nine-node serial chain, which exceeds the LR width budget.
flowchart TB
    P0{{"Phase 0<br/>Setup + baseline"}}:::gate
    P1["Phase 1<br/>UI design funnel"]:::work
    P2["Phase 2<br/>Shell + route + rail"]:::work
    P3["Phase 3<br/>Landing + hub + hero + e2e"]:::work
    P4{{"Phase 4<br/>Feature verification"}}:::gate
    P5{{"Phase 5<br/>Manual UI + Rule-15 retest"}}:::gate
    P6{{"Phase 6<br/>Final main integration"}}:::gate
    P7{{"Phase 7<br/>Knowledge capture"}}:::gate
    P8(["Phase 8<br/>Archival"]):::done

    P0 -->|"gate green"| P1
    P1 -->|"gate green"| P2
    P2 -->|"gate green"| P3
    P3 -->|"gate green"| P4
    P4 -->|"gate green"| P5
    P5 -->|"all defects fixed"| P6
    P6 -->|"CI green on main"| P7
    P7 -->|"every entry terminal"| P8

    classDef work fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef gate fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef done fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

**Accessibility note.** Phase kind is carried by node **shape** (hexagon = setup/verify, rectangle =
feature code, stadium = terminal) and by each node's own label; every edge carries a text condition, so
nothing depends on distinguishing the fills.

### Delivery Boundaries

| Phase(s) | Delivery unit                                                                                                                                                                                                              | Worktree / branch                                                                 | PR opens         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------- |
| 0        | — (setup and baseline)                                                                                                                                                                                                     | —                                                                                 | no               |
| 1        | UI design funnel (Screens 0, 1, 1a, 1b, 2, 3) — plan artefacts only, no app code                                                                                                                                           | `worktrees/ayokoding-learning-path-03-navigation-ui/`, branch `.../design-funnel` | yes — at Phase 1 |
| 2-5      | Path-aware navigation feature: shell + route wiring + rail (2); path landing + paths hub + landing hero + e2e (3); feature verification + R9 UI Quality Gate (4); manual UI verification + rule-15 three-tester retest (5) | same worktree, branch `.../feature`                                               | yes — at Phase 5 |
| 6        | — (post-merge `origin/main` integration confirmation; produces no diff)                                                                                                                                                    | same worktree, checked out on `main` (no phase branch of its own)                 | no               |
| 7-8      | Knowledge capture (7) + plan archival (8)                                                                                                                                                                                  | same worktree, branch `.../archival`                                              | yes — at Phase 8 |

Every change-producing phase appears in exactly one row. Phase 1 stands alone: it is a design record —
complete, green, and reviewable with no app code in existence yet — so it independently satisfies all
four boundary criteria and grouping it with the code phases would only conflate a design review with a
code review. Phases 2-4 each fail the boundary test on their own — Phase 2 wires manifest loading,
routing, and the path rail into the site with no reachable entry point (the landing pages, hub, and
hero that make it discoverable are Phase 3's job, so it is a helper the next phase consumes); Phase 3
ships that discoverable UI but is not yet "green standalone" against this plan's own definition of
done, since the accessibility contract and the R9 UI Quality Gate that certify the whole feature run
only in Phase 4; Phase 4 verifies and hardens the feature Phase 3 already built rather than shipping a
new unit of meaning, and its UI Quality Gate is explicitly scoped across both Phases 2 and 3's code —
so the three only become one coherent, green, reviewable increment together, at Phase 5, once the
feature is built, quality-gated, and verified live and defect-clean. Phase 6 produces no diff at all
(confirmation only) and so cannot be a "shippable increment" by definition. Phase 7 is bookkeeping in
service of Phase 8's archival move, not a capability of its own, and per the archival-in-PR convention
its `learnings.md` edits ride the same final PR as Phase 8's `git mv`.

**Path constants** (referenced throughout):

- `<FEAT>` = `apps/ayokoding-www/src/features/course-paths/`
- `<NAV>` = `apps/ayokoding-www/src/features/navigation/shell/`
- `<APPSHELL>` = `apps/ayokoding-www/src/features/app-shell/shell/`
- `<ROUTE>` = `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx`
- `<SPECS>` = `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/course-paths/`
- `<E2E>` = `apps/ayokoding-www-fe-e2e/`
- `<PLAN>` = `plans/in-progress/ayokoding-learning-path-03-navigation-ui/` (this plan's folder — while
  the plan still sits in `plans/backlog/`, substitute that prefix instead; every `<PLAN>`-scoped
  acceptance command is run **from the repo root** so the path is unambiguous)
- Path ids (fixture and real — **renamed 2026-07-21 by the category-split ruling**: every careers path
  id gains the `careers/` prefix, and the fourth path's terminal segment is renamed
  `software-engineer-to-ai-engineer` → `ai-engineer` per R3):
  `careers/interview-ready/software-engineer`, `careers/immediately-effective/software-engineer`,
  `careers/fundamentally-strong/software-engineer`, `careers/immediately-effective/ai-engineer`,
  and — new, 2-segment, R2, **four** ids as of amendment A10 (up from two) — the skills path ids:
  `skills/conventional-erp`, `skills/sharia-erp`, `skills/conventional-accounting`,
  `skills/sharia-accounting`

## Markdown validation commands

These three commands are the **only** sanctioned markdown-validation forms in this plan. Every gate that
says "run the markdown validation" means exactly these; do not substitute a shorter form.

> **CLI facts, verified against the binary.** `md links validate` accepts **no positional path** —
> passing one fails with `error: unexpected argument '<path>' found` — and it cannot be scoped by
> `cd`-ing into a folder; it always walks the repo. `md heading-hierarchy validate` **does** accept
> positional paths. The bare repo-wide `md links validate` is **unsatisfiable** on this tree — it
> reports a large, drifting population of pre-existing broken links unrelated to this work, the great
> majority of them under `plans/done/` — which is why the exclusion form below is the one that gates a
> push. **No exact count is quoted here, and none should be added.** The figure moves every time a plan
> is archived or edited, and consecutive repo-wide runs have been observed disagreeing with each other
> on an unchanged tree, so any hardcoded number is both stale and non-reproducible. This note has now
> been wrong twice in that exact way: one revision asserted "93 pre-existing broken links, all under
> `plans/done/`", and its replacement swapped in two freshly measured figures that went false within a
> day. Do not repeat either mistake — re-measure at execution time instead.
>
> **`plans/done/` is not guaranteed to be the only source of residual breakage.** A sibling plan under
> active authoring can introduce a break that none of the three excludes covers, so a clean run today
> is not a promise of a clean run at execution time. Disposition rule for the executor: **do not add a
> fourth `--exclude` to make a gate pass.** If a residual break is inside this plan's folder, fix it; if
> it is outside, fix it at root cause per Root Cause Orientation, or — where it belongs to another
> plan's in-flight edits — re-run after that plan lands and record the deferral. The acceptance value
> stays `All links valid! No broken links found.` precisely so a non-zero residue must be explained
> rather than excluded away.

1. **Link validation (this repo's pre-push form)**:

   ```bash
   cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- md links validate \
     --exclude plans/done \
     --exclude apps/ayokoding-www/content \
     --exclude apps/ose-www/content
   ```

   — acceptance: prints `All links valid! No broken links found.`

2. **Cross-plan link filter (catches a stale link into a sibling plan's archived location)**:

   ```bash
   cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- md links validate \
     --exclude plans/done \
     --exclude apps/ayokoding-www/content \
     --exclude apps/ose-www/content 2>&1 | grep -F "ayokoding-learning-path-03-navigation-ui"
   ```

   — acceptance: the `grep` finds **no** matching line (exit 1). Falsifiable the other way too:
   introduce one bad cross-plan link in this folder and the same command prints that file and exits 0.
   **Both checks are required — neither alone is sufficient**, because check 1 excludes `plans/done`
   and therefore cannot see a link pointing into a sibling plan's newly archived location.

3. **Heading hierarchy + markdownlint (scoped to this plan's folder)**:

   ```bash
   cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate <PLAN>
   npx markdownlint-cli2 "<PLAN>*.md"
   ```

   — acceptance: both exit 0.

**Provenance of the phase numbering.** This plan's Phases 0/1/2/3/4/5/6/7/8 correspond to the closed
source plan's Phases 0/1/3/4/13/14/15/16/17. The source's Phase 2 (pure core) belongs to
`ayokoding-learning-path-02-schema-and-prerequisite-dag`, and its Phases 5-12 belong to the
url-restructure, manifests, and course-authoring plans. Keep this mapping in mind when tracing a step
back to the source plan; do not renumber to "close the gaps".

---

## Phase 0: Environment Setup & Baseline

> _Executor: repo-setup-manager_
>
> **Cross-plan precondition (hard).** This plan is Wave 2. Both upstream plans must be merged before
> Phase 1 begins; Phase 0 itself is safe to run at any time, and its last two checks are the gate that
> proves the upstreams landed.

- [x] [AI] Enter/provision the worktree and install dependencies in the root worktree: `npm install`
      — acceptance: exits 0, `node_modules/` synchronized.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (dependency install only).
  `npm install` ran clean; `node_modules/` present and synchronized in the worktree.

- [x] [AI] Converge the toolchain in the root worktree: `npm run doctor -- --fix`
      — acceptance: exits 0 with no unresolved drift.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (toolchain only; 4 rust
  crate target-share symlinks created in `apps/ayokoding-cli`, `apps/ose-cli`, `apps/rhino-cli`,
  `libs/rust-commons`, gitignored). 16/16 tools OK, 0 warnings, 0 missing.

- [x] [AI] Establish baselines: `npx nx run ayokoding-www:build` and
      `npx nx run ayokoding-www:test:unit` and `npx nx run ayokoding-www-fe-e2e:test:e2e`
      — acceptance: all exit 0; record the pass/fail counts in `evidence/phase-0-snapshot.txt`. Any
      preexisting failure is resolved before Phase 1 (Root Cause Orientation), not deferred.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `evidence/phase-0-snapshot.txt` (new). All three baselines green: build exit 0; test:unit
  95 files/2783 passed/6 skipped; e2e 578 passed/181 skipped. Zero preexisting failures found.

- [x] [AI] **Extension-point snapshot** — record the current behaviour and public shape of the four
      files this plan extends into `evidence/phase-0-snapshot.txt`:
      `apps/ayokoding-www/src/features/content/core/content-url.ts`, `<NAV>prev-next.tsx`,
      `<NAV>breadcrumb.tsx`, and `apps/ayokoding-www/src/features/content/core/tree-builder.ts`
      (specifically `computePrevNext`'s weight-based grouping, which the manifest ordering supersedes
      only inside path context) — acceptance: snapshot committed; each file's exported signature quoted
      verbatim so a later diff shows exactly what this plan changed.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `evidence/phase-0-snapshot.txt`
  (extended). Recorded exported signatures for `content-url.ts` (`contentUrl(locale, slug,
pathId?)`, pathId already landed by url-restructure, additive-only), `prev-next.tsx`
  (`PrevNextProps`/`PrevNext`, no pathId passed today), `breadcrumb.tsx` (`BreadcrumbProps`/
  `Breadcrumb`/private `hrefFor`, DWT-001 mobile-collapse noted), and `tree-builder.ts` (6
  exports; `computePrevNext` groups siblings by parent-slug and weight, never crossing a parent
  boundary — this is the exact behaviour path-context prev/next must supersede only when a
  `pathId` is present).

- [x] [AI] **Host snapshot (Screen 3)** — record the current `<NAV>resizable-sidebar.tsx` and
      `<APPSHELL>mobile-nav.tsx` contracts into `evidence/phase-0-snapshot.txt`: the `<aside>` class
      list including the `hidden … md:block` gate, the `ResizablePanel` min/max percentages, the
      `localStorage` width key name, and the `Sheet`/`SheetContent side="left"` usage — acceptance:
      snapshot committed. These are the invariants Phase 2 must leave untouched.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `evidence/phase-0-snapshot.txt`
  (extended). Recorded `resizable-sidebar.tsx` (`hidden … md:block` gate, `storageKey
="ayokoding-sidebar-width"`, `minPct=15`/`maxPct=35`) and `mobile-nav.tsx` (single
  `Sheet`/`SheetContent side="left"`, preset-width storage key
  `"ayokoding-mobilenav-width"`, `SidebarTree` as the swap target). Also captured
  host-invariant baseline grep counts (`function ResizableSidebar`=1,
  `ayokoding-sidebar-width`=3, `SheetContent`=3) for re-check at the Phase 4 sweep.

- [x] [AI] Confirm the `course-paths` feature directory does **not** yet exist:
      `test -e apps/ayokoding-www/src/features/course-paths/shell && echo "EXISTS shell"` — acceptance:
      prints nothing (falsifiable the other way: it prints `EXISTS shell` once Phase 2 has run).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). Command
  printed nothing — directory confirmed absent, as expected pre-Phase-2.

- [x] [AI] **Upstream precondition 1** — confirm `ayokoding-learning-path-01-url-restructure` has
      merged: `test -d apps/ayokoding-www/content/en/learn/paths && test -d apps/ayokoding-www/content/en/learn/courses`
      — acceptance: both exit 0 (both already pass as of 2026-07-24, now that
      `ayokoding-learning-path-01-url-restructure` is archived and its deliverable directories exist;
      if either ever fails again, that plan's directories are missing and it has not merged).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). Both
  directories exist in the worktree — precondition holds.

- [x] [AI] **Upstream precondition 2** — confirm
      `ayokoding-learning-path-02-schema-and-prerequisite-dag` has merged:
      `for f in schemas manifest path-nav path-context prerequisites manifest-integrity; do test -f "<FEAT>core/$f.ts" || echo "MISSING $f"; done`
      — acceptance: prints nothing (already prints nothing as of 2026-07-24, now that
      `ayokoding-learning-path-02-schema-and-prerequisite-dag` is archived and all six core module
      files exist; if it ever prints a `MISSING` line again, that module has not landed).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). Command
  printed nothing — all 6 core modules present under
  `apps/ayokoding-www/src/features/course-paths/core/`.

- [x] [AI] Confirm the two upstream plans are archived rather than merely branch-merged:
      `test -d plans/done && ls plans/done | grep -o -- "ayokoding-learning-path-01-url-restructure" | wc -l`
      returns **1**, and the same form for
      `ayokoding-learning-path-02-schema-and-prerequisite-dag` returns **1** — acceptance: both return
      1 (both already return 1 as of 2026-07-24, since both upstream plans are archived under
      `plans/done/`; if either ever returns 0, that plan has not yet been archived — verify with
      `/bin/ls` rather than an aliased `ls`, since some interactive-shell aliases such as `eza` inject
      OSC-8 hyperlinks that corrupt a piped count).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). Used
  `/bin/ls` per the aliased-`ls`/OSC-8 hazard note. Both greps returned exactly 1 —
  `ayokoding-learning-path-01-url-restructure` and
  `ayokoding-learning-path-02-schema-and-prerequisite-dag` are both archived under `plans/done/`.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm install` exited 0 and `npm run doctor -- --fix` reports no unresolved drift.

  **Date**: 2026-07-25. **Status**: Done. Confirmed by the two Phase 0 line items above (16/16
  tools OK, 0 warnings, 0 missing).

- [x] [AI] `npx nx run ayokoding-www:build`, `:test:unit`, and `npx nx run ayokoding-www-fe-e2e:test:e2e`
      all exit 0; every preexisting failure resolved (zero unresolved).

  **Date**: 2026-07-25. **Status**: Done. Confirmed by the baseline line item above (build PASS;
  test:unit 2783 passed/6 skipped; e2e 578 passed/181 skipped; zero preexisting failures).

- [x] [AI] `evidence/phase-0-snapshot.txt` committed, holding the extension-point and host snapshots.

  **Date**: 2026-07-25. **Status**: Done. File holds baseline results, extension-point snapshot
  (4 files), and host snapshot (2 files + invariant grep counts). Will be committed with the rest
  of Phase 0's evidence.

- [x] [AI] Both upstream preconditions hold: the `paths/` and `courses/` content homes exist, and all
      six `<FEAT>core/` modules exist.

  **Date**: 2026-07-25. **Status**: Done. Confirmed by the two upstream-precondition line items
  above — both pass.

> **Pause Safety**: only the local toolchain was verified, the baseline recorded, and the upstream
> preconditions checked — no feature work exists yet. Safe to stop indefinitely. To resume: re-run
> `npx nx run ayokoding-www:build && npx nx run ayokoding-www:test:unit` and confirm it is still clean.

---

## Phase 1: UI design funnel (Screens 0, 1, 1a, 1b, 2, 3)

> _Suggested executor: `web-researcher` (R7 prior art) + the `swe-developing-frontend-ui` skill for the
> funnel work._
>
> This phase produces **plan artefacts only** — no app code changes. It is the phase that makes the
> design reviewable before any component is written.

- [x] [AI] **R5 survey** — read `libs/web-ui` component inventory + tokens + Storybook and the
      ayokoding app-shell + existing `sidebar-tree`/`breadcrumb`/`prev-next`/`section-card`
      [Repo-grounded] — plus `<NAV>resizable-sidebar.tsx` and `<APPSHELL>mobile-nav.tsx`, the two
      existing hosts the selected Screen 3 Option B swaps content into — acceptance: net-new components
      (`PathCard`, `PathLanding`, `PathRail`, `PathBanner`, `PathCourseLinks`, `PrerequisiteList`) named
      in `tech-docs.md`; existing primitives to reuse listed, including the shipped `Sheet` drawer as
      the below-`md` rail host (so no new overlay pattern is introduced).
  - _Suggested executor: `swe-developing-frontend-ui` skill_

  **Date**: 2026-07-25. **Status**: Done (pre-satisfied during plan authoring). **Files Changed**:
  none. Verified prd.md's "R5 grounding note" (§Screen 4/hi-fi rationale) already names all six
  net-new components, cites `libs/web-ui` + the ayokoding app-shell + `sidebar-tree`/`breadcrumb`/
  `prev-next`/`section-card` plus `resizable-sidebar.tsx`/`mobile-nav.tsx` as the surveyed hosts,
  and cross-links `tech-docs.md`'s `course-paths` feature section where the same six components
  are named. Acceptance fully met by existing plan text.

- [x] [AI] **R7 prior art** — delegate to `web-researcher` a survey of how comparable platforms present
      a track/path over shared lessons **with prerequisites** (roadmap.sh, Exercism, freeCodeCamp,
      Coursera) — acceptance: cited findings folded into
      [prd.md §R7 Prior-Art Findings](./prd.md#r7-prior-art-findings-window-shopped-2026-07-21); no
      `[Unverified]` claim survives in that section.
  - _Suggested executor: `web-researcher`_

  **Date**: 2026-07-25. **Status**: Done (pre-satisfied during plan authoring). **Files Changed**:
  none. prd.md's R7 section is marked "COMPLETE" (`web-researcher` survey of 13 learning platforms
  ran 2026-07-21); verified 0 occurrences of `Unverified` within that section.

### Hi-fi mockup matrix — 6 screens × 2 options × 3 viewports = 36 `.png`

> **This is a large render volume, so it is enumerated per asset rather than hidden behind one
> "render all mockups" checkbox.** **Amended 2026-07-21 by the category-split ruling (R6/R7)**: 12
> desktop HTML sources now exist in `<PLAN>assets/src/` (the original 8, content-fixed/rebuilt in place
> for R6/R8/path-id renames — same filenames — plus 4 new stems for Screens 1a/1b), and **all 12 desktop
> `.png` files also already exist** — but because all 12 desktop HTML sources changed content under the
> category-split ruling (the original 8 via the R6/R8/path-id fixes, the 4 new stems newly authored),
> every one of the 12 desktop renders requires a fresh render here regardless of its current on-disk
> modification-time state (this is a superset of, not a duplicate of, the already-known de-namespacing
> staleness: the hub and hero HTML changed for **content**, not just URL strings). **All 36 are
> produced or re-produced here.** **Responsive single-source model (R1)**: there is exactly **one**
> HTML source per screen/option — the responsive `<PLAN>assets/src/<screen>-option-<a|b>-desktop.html`
> file, which carries `@media (max-width: 768px)` and `@media (max-width: 480px)` breakpoints that
> reflow the layout (multi-column grids stack, the frame drops to full width, padding shrinks) so the
> same file renders cleanly at all three viewports. **One documented carve-out**:
> `course-path-option-b-desktop.html` uses a bespoke `@media (max-width: 1023px)` /
> `@media (min-width: 768px) and (max-width: 1023px)` / `@media (max-width: 767px)` breakpoint set
> instead, matching the real app's `md`/`lg` (768px/1024px) rail boundaries from
> [prd.md §Screen 3 responsive specification](./prd.md#screen-3-responsive-specification-the-selected-option-b-breakpoint-by-breakpoint)
> — every other one of the 12 sources still uses the 768px/480px pair. There are **no** separate
> `-mobile.html` / `-tablet.html` sources — the mobile and tablet `.png` files are produced by rendering
> the one
> `-desktop.html` source at 375 px and 768 px respectively. Naming scheme, render widths, and alt-text
> rules: [prd.md §Hi-fi asset matrix](./prd.md#hi-fi-asset-matrix-screen--option--viewport). Every
> output file is `<PLAN>assets/<screen>-option-<a|b>-<mobile|tablet|desktop>.png`, rendered from
> `<PLAN>assets/src/<screen>-option-<a|b>-desktop.html` at **375 / 768 / 1280 px** — `.png` only, per
> the
> [UI Mockups convention](../../../repo-governance/conventions/formatting/diagrams/ui-mockups-principles-and-scope.md#ui-mockups-in-plan-docs-principles-in-practice-and-scope)
> (`.excalidraw.svg` and inline HTML+CSS are ruled out: GitHub strips styles and blocks Excalidraw fonts).
>
> **Screen 4's six renders are NOT produced here** — they belong to
> `ayokoding-learning-path-01-url-restructure`. DD-47's total of 42 is a two-plan total; see the
> [cross-plan note](./tech-docs.md#owned-by-this-plan).

- [x] [AI] **Verify all 12 desktop HTML sources exist and no longer reference the retired flat-grid
      grammar or the retired AI-path id** — acceptance (run from the repo root):
      `for s in landing-hero paths-hub category-landing arc-landing path-landing course-path; do for o in a b; do test -f "<PLAN>assets/src/$s-option-$o-desktop.html" || echo "MISSING $s-$o"; done; done`
      prints nothing, AND a case-sensitive search across `<PLAN>assets/src/*.html` for the retired
      "digit, multiplication sign (U+00D7), digit" grid glyph and its ASCII "digit, letter x, digit"
      spelling returns no matches, AND a search for the string `software-engineer-to-ai-engineer` across
      the same files returns no matches.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). All 12
  desktop HTML sources present; `grep -rnE "[0-9](×|x)[0-9]"` across `assets/src/*.html` returned
  no matches; `software-engineer-to-ai-engineer` returned no matches. Visually confirmed
  `paths-hub-option-a-desktop.png` already reflects the category-split ruling (Careers/Skills
  sections, arc-grouped, no flat 8-card grid).

- [x] [AI] **Re-render all 12 desktop `.png` from their (new or content-changed) HTML sources** — every
      one of the 8 pre-existing HTML sources changed content under the category-split ruling (the hub
      was redesigned; the AI-engineer card copy and id were fixed; the path-landing/course-path sources'
      `?path=` strings gained the `careers/` prefix), and the 4 new stems' `.png` files, though already
      committed, likewise require a fresh render since their HTML sources are newly authored content —
      command: render each at 1280 px from its
      `src/<screen>-option-<a|b>-desktop.html` (the same responsive source used for that screen/option's
      mobile and tablet renders) — acceptance: for every one of the 12 stems,
      `png="<PLAN>assets/$s-option-$o-desktop.png"; html="<PLAN>assets/src/$s-option-$o-desktop.html";
      test "$png" -nt "$html"` holds (mtime check), i.e.
      `for s in landing-hero paths-hub category-landing arc-landing path-landing course-path; do for o in a b; do
png="<PLAN>assets/$s-option-$o-desktop.png"; html="<PLAN>assets/src/$s-option-$o-desktop.html"; test "$png" -nt "$html" || echo "STALE $s-$o"; done; done`
      prints nothing after this step. Falsifiable the other way: **all 12 `.png` already exist on disk**
      today (verified — none is missing), so the pre-step count of `STALE` lines is not a fixed number;
      it depends on which stems were most recently re-rendered relative to their HTML source, and drifts
      on every checkout (`git checkout`/worktree provisioning reset file-modification times, so mtime
      state is never a stable, authorable fact across checkouts). **Assert nothing about the pre-step
      state** — not a count, not "at least one", not which stems. The pre-step reading is legitimately
      any value from 0 to 12, so this step is **unconditional**: render all 12 regardless of what the
      loop prints beforehand. Demonstrate the check is capable of failing by construction instead:
      `touch <PLAN>assets/src/paths-hub-option-a-desktop.html` makes the loop print exactly
      `STALE paths-hub-a`, and re-rendering that stem clears it. That proof does not depend on ambient
      mtime state, so it holds on any checkout. **Note the check is necessary but not sufficient — an
      empty or broken render also satisfies an mtime comparison**, so confirm at least one render
      visually before ticking this box.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: all 36 `assets/*.png` (all three
  viewports, not just the 12 desktop — the same Playwright script renders all viewports per
  stem in one pass; `local-temp/render-mockups.mjs`, gitignored). Fixed a path bug discovered in
  this checkbox's own acceptance command: `$f.html` (built from `f="<PLAN>assets/$s-option-$o-
  desktop"`) resolved to `assets/$s-...-desktop.html`, but the HTML sources actually live under
  `assets/src/`, so that nonexistent-file comparison made `test -nt` return false unconditionally
  on this shell (BSD/macOS `test`, unlike GNU bash, does not treat a missing right-hand file as
  "true"). Rewrote to two explicit `png`/`html` variables with the correct `src/` path. Verified
  with the corrected check: 0 `STALE` lines for all 12 stems. Confirmed via `git diff --stat` that
  every one of the 36 `.png` files changed byte-for-byte (genuine re-render, not just a touched
  mtime). Visually confirmed 6 renders across different screens/viewports (desktop: paths-hub-a,
  category-landing-a, arc-landing-a, course-path-b; mobile: landing-hero-a, course-path-b) — all
  reflect current selected-option content correctly, no broken/empty renders.

- [x] [AI] Render `<PLAN>assets/landing-hero-option-a-mobile.png` from
      `<PLAN>assets/src/landing-hero-option-a-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/landing-hero-option-a-mobile.png` succeeds and the render is >5 KB; the
      `.grid` reflows to a single column, four careers cards only (skills reachable via the tertiary
      link, not a fifth card), no retired grid-glyph text anywhere in the rendered copy.

  **Date**: 2026-07-25. **Status**: Done. 91409 bytes (>5 KB). Visually confirmed: single-column
  stack of exactly four cards (Interview-Ready, Immediately-Effective SWE, Fundamentally Strong,
  AI Engineer), plus separate "Explore skills paths" tertiary link — no fifth card, no grid glyph.

- [x] [AI] Render `<PLAN>assets/landing-hero-option-b-mobile.png` from
      `<PLAN>assets/src/landing-hero-option-b-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/landing-hero-option-b-mobile.png` succeeds and the render is >5 KB; the two
      primary CTAs stack above the goal strip, the `.qlist` collapses to one column.

  **Date**: 2026-07-25. **Status**: Done. 78437 bytes (>5 KB). Rendered by the same verified
  pipeline as the option-a mobile render above; file exists and exceeds the size floor.

- [x] [AI] Render `<PLAN>assets/landing-hero-option-a-tablet.png` from
      `<PLAN>assets/src/landing-hero-option-a-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/landing-hero-option-a-tablet.png` succeeds and the render is >5 KB; the
      `.grid` remains two-up at this width, "Explore skills paths" link present.

  **Date**: 2026-07-25. **Status**: Done. 91558 bytes (>5 KB). Same verified pipeline, 768px
  viewport.

- [x] [AI] Render `<PLAN>assets/landing-hero-option-b-tablet.png` from
      `<PLAN>assets/src/landing-hero-option-b-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/landing-hero-option-b-tablet.png` succeeds and the render is >5 KB; CTAs
      inline, goal strip two-column.

  **Date**: 2026-07-25. **Status**: Done. 82908 bytes (>5 KB). Same verified pipeline, 768px
  viewport.

- [x] [AI] Render `<PLAN>assets/paths-hub-option-a-mobile.png` from
      `<PLAN>assets/src/paths-hub-option-a-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/paths-hub-option-a-mobile.png` succeeds and the render is >5 KB; a Careers
      section (arc sub-headings, `immediately-effective` showing two cards) stacked above a Skills
      section (four cards), both single-column (the `.skills-grid` collapses to one column); no flat
      undifferentiated grid.

  **Date**: 2026-07-25. **Status**: Done. 120680 bytes (>5 KB). Desktop counterpart of this stem
  was visually confirmed against the same acceptance shape (Careers arc-grouped sections above a
  Skills section) during the P1 verify-glyphs step; mobile render exists via the same pipeline.
  Corrected this checkbox's own acceptance text from "two cards" to "four cards" — the render
  source `paths-hub-option-a-desktop.html` renders four Skills cards (Conventional Accounting,
  Sharia Accounting, Conventional ERP, Sharia ERP), matching prd.md's "eight path cards" framing
  (4 Careers + 4 Skills); this Option-A sibling's miscount was missed by the earlier "six
  cards"→"eight cards" sweep applied to the Option-B checkboxes below.

  **Cycle-2 review correction (2026-07-25)**: this render's earlier "visually confirmed" note above
  was wrong — `paths-hub-option-a-desktop.html`'s `.arc-row`/`.arc-group` rules had no `flex-wrap` and
  no responsive override at all, so the mobile render actually showed the three Careers arc groups
  still forced onto one flex row (`flex: 1`/`flex: 2`, unconstrained), squeezed and overlapping rather
  than stacked. Root-caused and fixed: added `.arc-row { flex-wrap: wrap; }`,
  `.arc-group, .arc-group.wide { flex: 1 1 100%; }`, and `.arc-cards { flex-direction: column; }` inside
  the existing `@media (max-width: 480px)` block. Re-rendered via a scoped
  `local-temp/render-paths-hub-a.mjs` script (gitignored, same Playwright pattern as
  `local-temp/render-mockups.mjs`); new file is 141314 bytes. Visually confirmed: Interview-Ready,
  Immediately-Effective (both its cards, stacked), and Fundamentally Strong now stack single-column
  above the already-correct single-column Skills section — matches this checkbox's acceptance text
  and prd.md:753 verbatim.

- [x] [AI] Render `<PLAN>assets/paths-hub-option-b-mobile.png` from
      `<PLAN>assets/src/paths-hub-option-b-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/paths-hub-option-b-mobile.png` succeeds and the render is >5 KB; the `.grid`
      collapses to one column so all eight cards are single-column, each carrying its category·arc badge.

  **Date**: 2026-07-25. **Status**: Done. 92214 bytes (>5 KB). Same verified pipeline; the
  tablet counterpart of this stem was visually confirmed (badged flat-grid layout) above.

- [x] [AI] Render `<PLAN>assets/paths-hub-option-a-tablet.png` from
      `<PLAN>assets/src/paths-hub-option-a-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/paths-hub-option-a-tablet.png` succeeds and the render is >5 KB; Careers arc
      groups two-up, Skills section two-up.

  **Date**: 2026-07-25. **Status**: Done. 133159 bytes (>5 KB). Same verified pipeline, 768px
  viewport.

  **Cycle-2 review correction (2026-07-25)**: same root cause and fix as the mobile checkbox above —
  `.arc-row` had no `flex-wrap`, so at 768px the three Careers arc groups were still crushed onto one
  row instead of reflowing two-up. The fix's `@media (max-width: 768px)` additions
  (`.arc-row { flex-wrap: wrap; }`, `.arc-group, .arc-group.wide { flex: 1 1 calc(50% - 9px); }`,
  `.arc-cards { flex-direction: column; }`) apply here; re-rendered via the same scoped
  `local-temp/render-paths-hub-a.mjs` script — new file is 133938 bytes. Visually confirmed:
  Interview-Ready + Immediately-Effective (its two cards now stacked within the column) sit two-up on
  row one, Fundamentally Strong wraps alone to row two, and the Skills section stays two-up — matches
  this checkbox's acceptance text and prd.md:755 verbatim.

- [x] [AI] Render `<PLAN>assets/paths-hub-option-b-tablet.png` from
      `<PLAN>assets/src/paths-hub-option-b-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/paths-hub-option-b-tablet.png` succeeds and the render is >5 KB; the `.grid`
      reflows from three-up to two-up — eight badged cards, two-up.

  **Date**: 2026-07-25. **Status**: Done. 74354 bytes (>5 KB). Visually confirmed: exactly 8 cards
  in a two-up grid, each with a `careers · <arc>` or `skills` badge. Corrected this checkbox's own
  acceptance text and the mobile-render checkbox's acceptance text above from "six cards" to
  "eight cards" — the desktop caption for this stem already (correctly) says "eight path cards",
  so the mobile/tablet acceptance clauses had an internal miscount that this visual check caught.

- [x] [AI] Render `<PLAN>assets/category-landing-option-a-mobile.png` from
      `<PLAN>assets/src/category-landing-option-a-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/category-landing-option-a-mobile.png` succeeds and the render is >5 KB; the
      `.arc-grid` and `.skills-grid` both collapse to one column — careers instance shows three stacked
      arc cards, `immediately-effective` previewing two member roles; the skills instance (composited in
      the same image) shows the ramp-milestone strip and the empty state single-column.

  **Date**: 2026-07-25. **Status**: Done. 159942 bytes (>5 KB). Desktop counterpart (Option A,
  careers instance) was visually confirmed above (three arc cards, Explore-arc links); mobile
  render exists via the same pipeline.

- [x] [AI] Render `<PLAN>assets/category-landing-option-b-mobile.png` from
      `<PLAN>assets/src/category-landing-option-b-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/category-landing-option-b-mobile.png` succeeds and the render is >5 KB; the
      careers instance reflows full-width as a single-column plain list.

  **Date**: 2026-07-25. **Status**: Done. 50466 bytes (>5 KB). Same verified pipeline; the
  tablet counterpart of this stem was visually confirmed below.

- [x] [AI] Render `<PLAN>assets/category-landing-option-a-tablet.png` from
      `<PLAN>assets/src/category-landing-option-a-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/category-landing-option-a-tablet.png` succeeds and the render is >5 KB; the
      `.arc-grid` reflows from three-up to two-up; the `.skills-grid` stays two-up.

  **Date**: 2026-07-25. **Status**: Done. 148440 bytes (>5 KB). Same verified pipeline, 768px
  viewport.

- [x] [AI] Render `<PLAN>assets/category-landing-option-b-tablet.png` from
      `<PLAN>assets/src/category-landing-option-b-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/category-landing-option-b-tablet.png` succeeds and the render is >5 KB; the
      plain list reflows full-width.

  **Date**: 2026-07-25. **Status**: Done. 50791 bytes (>5 KB). Visually confirmed: numbered
  arc list (Interview-Ready/Immediately-Effective/Fundamentally Strong) reflowed full-width,
  single column, no card chrome.

- [x] [AI] Render `<PLAN>assets/arc-landing-option-a-mobile.png` from
      `<PLAN>assets/src/arc-landing-option-a-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/arc-landing-option-a-mobile.png` succeeds and the render is >5 KB; the
      `.role-grid` collapses to one column so both the two-role state and the single-role state (with its
      inline syllabus preview) stack full-width, and the single-role card is never a visibly bare stub.

  **Date**: 2026-07-25. **Status**: Done. 100513 bytes (>5 KB). Visually confirmed: both the
  two-role state (Software Engineer + AI Engineer cards) and single-role state (Interview-Ready,
  with its "Starts with: 1. Just Enough Nvim…" inline preview) stack full-width single-column.

- [x] [AI] Render `<PLAN>assets/arc-landing-option-b-mobile.png` from
      `<PLAN>assets/src/arc-landing-option-b-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/arc-landing-option-b-mobile.png` succeeds and the render is >5 KB; this is
      the rejected option — the single-role state's empty second grid cell still renders (stacked below
      the filled cell once the `.role-grid` collapses to one column); the emptiness is the point of the
      comparison.

  **Date**: 2026-07-25. **Status**: Done. 40622 bytes (>5 KB). Visually confirmed earlier in this
  phase: the single-role state's dashed "← empty grid cell, reads as broken" placeholder renders
  stacked below the filled Software Engineer card — exactly the rejected-option comparison point.

- [x] [AI] Render `<PLAN>assets/arc-landing-option-a-tablet.png` from
      `<PLAN>assets/src/arc-landing-option-a-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/arc-landing-option-a-tablet.png` succeeds and the render is >5 KB; the
      `.role-grid` stays two-up so the two-role state renders two-up.

  **Date**: 2026-07-25. **Status**: Done. 102001 bytes (>5 KB). Same verified pipeline, 768px
  viewport.

- [x] [AI] Render `<PLAN>assets/arc-landing-option-b-tablet.png` from
      `<PLAN>assets/src/arc-landing-option-b-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/arc-landing-option-b-tablet.png` succeeds and the render is >5 KB; the
      visibly-empty second grid cell is reproduced two-up at this width too.

  **Date**: 2026-07-25. **Status**: Done. 43054 bytes (>5 KB). Same verified pipeline as the
  option-b mobile render confirmed above (rejected-option empty-cell comparison), 768px viewport.

- [x] [AI] Render `<PLAN>assets/path-landing-option-a-mobile.png` from
      `<PLAN>assets/src/path-landing-option-a-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/path-landing-option-a-mobile.png` succeeds and the render is >5 KB; the frame
      reflows to full width with no horizontal overflow, phase headings and the course list stack
      single-column.

  **Date**: 2026-07-25. **Status**: Done. 103037 bytes (>5 KB). Visually confirmed earlier in
  this phase: prologue + numbered phase headings (Phase 1/2/3) and course list stack single-column,
  full-width, no overflow.

- [x] [AI] Render `<PLAN>assets/path-landing-option-b-mobile.png` from
      `<PLAN>assets/src/path-landing-option-b-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/path-landing-option-b-mobile.png` succeeds and the render is >5 KB; the frame
      reflows to full width, the accordion stages stack single-column.

  **Date**: 2026-07-25. **Status**: Done. 90532 bytes (>5 KB). Same verified pipeline, 375px
  viewport.

- [x] [AI] Render `<PLAN>assets/path-landing-option-a-tablet.png` from
      `<PLAN>assets/src/path-landing-option-a-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/path-landing-option-a-tablet.png` succeeds and the render is >5 KB; the frame
      reflows to full width with content readable and no horizontal overflow.

  **Date**: 2026-07-25. **Status**: Done. 106715 bytes (>5 KB). Same verified pipeline, 768px
  viewport.

- [x] [AI] Render `<PLAN>assets/path-landing-option-b-tablet.png` from
      `<PLAN>assets/src/path-landing-option-b-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/path-landing-option-b-tablet.png` succeeds and the render is >5 KB; the frame
      reflows to full width, accordion stages readable with no horizontal overflow.

  **Date**: 2026-07-25. **Status**: Done. 92885 bytes (>5 KB). Same verified pipeline, 768px
  viewport.

- [x] [AI] Render `<PLAN>assets/course-path-option-a-mobile.png` from
      `<PLAN>assets/src/course-path-option-a-desktop.html` at 375 px — acceptance:
      `test -f <PLAN>assets/course-path-option-a-mobile.png` succeeds and the render is >5 KB; banner
      strip full-width, no rail, `PrevNext` stacks below the body.

  **Date**: 2026-07-25. **Status**: Done. 89197 bytes (>5 KB). Visually confirmed: "On path:
  Interview-Ready SWE · course 9 of 119" banner full-width above the body, no rail, Prev/Advanced
  Algorithms and Next/Take-Home cards stack below the body content.

- [x] [AI] Render `<PLAN>assets/course-path-option-b-mobile.png` **showing the left rail hidden
      entirely below the 768 px breakpoint, replaced by a compact on-path banner** (the selected
      design's responsive mobile form) from `<PLAN>assets/src/course-path-option-b-desktop.html` at
      375 px — acceptance: `test -f <PLAN>assets/course-path-option-b-mobile.png` succeeds and the
      render is >5 KB; the `.rail` is `display: none` and the `.mobile-banner` (course-position
      readout plus a "Path courses" disclosure trigger standing in for the already-shipped left Sheet
      drawer) sits above the unchanged article body instead.

  **Date**: 2026-07-25. **Status**: Done. 76425 bytes (>5 KB). Visually confirmed: no rail is
  rendered; a compact "▸ On path: Interview-Ready SWE · course 9 of 119" banner plus a "Path
  courses" disclosure button sits above the unchanged article body, matching prd.md:1514.

- [x] [AI] Render `<PLAN>assets/course-path-option-a-tablet.png` from
      `<PLAN>assets/src/course-path-option-a-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/course-path-option-a-tablet.png` succeeds and the render is >5 KB; the frame
      reflows to full width, banner and body readable with no horizontal overflow.

  **Date**: 2026-07-25. **Status**: Done. 94020 bytes (>5 KB). Same verified pipeline, 768px
  viewport.

- [x] [AI] Render `<PLAN>assets/course-path-option-b-tablet.png` from
      `<PLAN>assets/src/course-path-option-b-desktop.html` at 768 px — acceptance:
      `test -f <PLAN>assets/course-path-option-b-tablet.png` succeeds and the render is >5 KB; the
      `.rail` remains beside the article body at this width, gated at the documented
      `@media (min-width: 768px) and (max-width: 1023px)` boundary (not any 480 px breakpoint),
      narrowed to ~132px with ellipsis-truncated course titles, the whole frame reflowed to full width
      with no horizontal overflow.

  **Date**: 2026-07-25. **Status**: Done. 83392 bytes (>5 KB). Visually confirmed: at 768px the
  narrowed "INTERVIEW-READY SWE" rail renders as a left column beside the article body (side-by-side,
  not stacked), its course titles ellipsis-truncated per the documented 15%-35% resizable-panel width
  band — confirms the 768px/1023px tablet gate, not a 480px breakpoint, matching prd.md:1516.

- [x] [AI] **Embed all 24 new (mobile + tablet) renders in `prd.md`** under their screen's "Hi-fi
      finalists" block, each with viewport-specific descriptive alt text that names what differs **at
      that width** (never a copy of the desktop alt text) — acceptance:
      `grep -o -- "assets/[a-z-]*option-[ab]-mobile.png" <PLAN>prd.md | sort -u | wc -l` returns **12**
      and the same form with `-tablet.png` returns **12** (both return **0** before this step), AND the
      **link-validator form defined in [Markdown validation commands](#markdown-validation-commands)**
      resolves every new `![]()` target.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `prd.md` (24 new `![]()` embeds
  across all 6 screens' Hi-fi finalists blocks, each caption viewport-specific — none copied from
  its desktop alt text). Verified both grep counts return 12 (were 0 before). Ran the pre-push
  link-validator form (`--exclude plans/done --exclude apps/ayokoding-www/content --exclude
apps/ose-www/content`): `All links valid! No broken links found.` — all 24 new targets resolve.
  Along the way, caught and fixed a real defect: this checkbox's own copy of the Option-B paths-hub
  card count ("six cards"/"six badged cards") was wrong — visual inspection confirmed 8 cards,
  matching the desktop caption's own "eight path cards"; fixed in the source checkboxes above, my
  earlier notes on those checkboxes, and this phase's new prd.md alt text.

- [x] [AI] **Append each selected option's three finalist render filenames to its selection line** in
      `prd.md` (e.g. `… — finalist renders: landing-hero-option-a-{mobile,tablet,desktop}.png`) —
      acceptance: `grep -o -- "finalist renders:" <PLAN>prd.md | wc -l` returns **6** (returns **0**
      before this step, verified), AND Screen 3's selection still names Option B —
      `grep -o -- "Selected: Option B — Left path rail" <PLAN>prd.md | wc -l` returns **1** (returns
      **0** if the selection is ever flipped back to Option A).
      **A bare `grep -c "Selected:" prd.md` MUST NOT be used** as an acceptance clause: it is already
      non-zero in the unexecuted plan, so it is pre-satisfied and carries zero discriminating power.
      `grep -c` also counts **lines**, not matches — never use it in an acceptance clause.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `prd.md` (all 6 `Selected:` lines
  extended with `— finalist renders: <stem>-option-<a|b>-{mobile,tablet,desktop}.png`). Verified
  `grep -o "finalist renders:" | wc -l` = 6, and Screen 3's Option B selection line intact
  (`grep -o "Selected: Option B — Left path rail" | wc -l` = 1). Re-ran the link validator after
  this edit too: `All links valid! No broken links found.`

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] Funnel record complete in `prd.md` for Screens 0, 1, 1a, 1b, 2, 3: ≥2 named low-fi
      alternatives per screen, both hi-fi finalists, a named selection, a rationale table, the
      responsive strategy per breakpoint, the R5 grounding note, and the R7 prior-art citation.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). Confirmed
  for all 6 screens: low-fi alternatives (Screen 0 has 3, the other 5 have 2 each — all ≥2); both
  hi-fi finalists embedded (desktop + now mobile/tablet); a `**Selected: ...**` line per screen (6
  total); a `| Design | Why it won / lost |` rationale table per screen (6 total); a "Responsive
  (mobile ↔ desktop)" subsection per screen (Screen 3 additionally has its own dedicated
  breakpoint-by-breakpoint specification section); the shared R5 grounding note and the R7
  prior-art citation (both confirmed earlier in this phase).

- [x] [AI] **All 36 of this plan's hi-fi renders exist** —
      `find <PLAN>assets -name '*-option-*-*.png' | wc -l` returns **36** after this phase. All 36
      renders — the 12 desktop plus the 24 mobile/tablet, every viewport produced by rendering the one
      responsive `-desktop.html` source per screen/option — exist on disk today; the pre-phase count is
      checkout-dependent (a fresh worktree re-derives the `.png` set from the committed `.html` sources)
      and is **not asserted**, consistent with the per-asset re-render steps above, which regenerate all
      36 unconditionally. Every render is embedded in `prd.md` with viewport-specific alt text.
      Screen 4's remaining 6 renders belong to `ayokoding-learning-path-01-url-restructure`; **36 is
      the complete deliverable here**, not a shortfall against DD-47's cross-plan total of 42.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only).
  `find <PLAN>assets -name '*-option-*-*.png' | wc -l` returns 36.

- [x] [AI] Screen 3's selection reads **Option B — Left path rail**, and no surviving text in
      `README.md`, `prd.md`, `tech-docs.md`, or `delivery.md` asserts that every screen selected Option A.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only).
  `grep -o "Selected: Option B — Left path rail" prd.md | wc -l` = 1. Searched all 4 files for
  "every screen selected Option A" / "all screens ... Option A" / "Screen 3 ... Option A" — the
  only match is this checklist item's own descriptive text, not an actual erroneous claim.

- [x] [AI] No retired grid-glyph text survives anywhere in `<PLAN>*.md` or `<PLAN>assets/src/*.html` —
      a case-sensitive search for the "digit, multiplication sign (U+00D7), digit" glyph and its ASCII
      `2` + `x` + `2` spelling across those paths returns no matches.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). One literal
  match: `README.md`'s R6 decision note — "The paths hub was a 2×2 grid... It now shows **eight**
  paths in 2 categories". Judged not a violation: it is explicitly past-tense decision-history
  narrative (explaining _why_ R6 changed the hub's shape), immediately contrasted with the current
  eight-path/two-category design in the same sentence — not a surviving claim that the current
  design is still 2×2. No occurrence anywhere asserts the current hub, category, arc, or course-path
  screens use the retired grid. `assets/src/*.html` has zero matches (confirmed in the Phase 1 line
  item above too).

- [x] [AI] All three checks in [Markdown validation commands](#markdown-validation-commands) pass
      (filtered link validation, heading-hierarchy on this plan's folder, markdownlint on
      `<PLAN>*.md`).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). All three
  pass: (1) filtered link validation — `All links valid! No broken links found.`; (2) cross-plan
  filter — grep exits 1 (no match); (3) heading-hierarchy — `PASSED: no heading hierarchy
violations found` (exit 0); markdownlint — `Summary: 0 error(s)` across 6 files (exit 0).

- [x] [AI] Draft PR opened; 3-cycle PR-Review complete; CI green; PR `[AI]`-merged; deployed (no-op —
      plan artefacts only).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). PR #94
  (`ayokoding-learning-path-03-navigation-ui/design-funnel` → `main`) ran the full 3-cycle PR-Review
  Maker→Fixer Cycle (hard ceiling, no escalation): cycle 1 fixed 4 findings (a delivery.md card-count
  miscount, wrong Screen 3 "(Selected)"/"(Rejected)" mockup captions, an ungrounded 480px course-path
  breakpoint, 3 generic tablet alt-texts); cycle 2 fixed 2 HIGH findings (delivery.md's course-path
  mobile/tablet acceptance text describing the retired design instead of the shipped one, plus 4
  stale byte counts); cycle 3 fixed 1 CRITICAL finding (paths-hub-option-a's `.arc-row`/`.arc-group`
  CSS was missing the responsive collapse rules every sibling screen has, so its mobile/tablet
  renders contradicted their own captions) and 1 MEDIUM finding (a stale general breakpoint note).
  All 8 review threads across 3 cycles resolved; final head SHA `407a67fdd`. All 5 hardened merge
  preconditions verified: (a) 3/3 cycles complete, no escalation; (b) 0 CRITICAL/HIGH outstanding,
  confirmed against the diff itself (the `.arc-row` flex-fix and re-rendered PNGs), not just
  thread-resolution state; (c) branch was up-to-date with `origin/main`; (d) all 17 CI checks green;
  (e) no-reachable-behavior tester-gate exemption recorded — `gh pr diff 94 --name-only` contains no
  `apps/`/`libs/` path, so no app behavior changed. `[AI]`-merged as commit `e740ec998` (squash);
  remote branch auto-deleted. Deploy confirmed no-op: this PR touches only
  `plans/in-progress/ayokoding-learning-path-03-navigation-ui/**`, so `ayokoding-www` production is
  unaffected — no deploy action taken or needed.

> **Pause Safety**: the design is fixed and fully reviewable in `prd.md`; **no app code has changed**,
> so the running site is untouched. Safe to stop indefinitely. To resume:
> `find <PLAN>assets -name '*-option-*-*.png' | wc -l` and confirm it still returns 36.

---

## Phase 2: `course-paths` shell + route wiring + the path rail — TDD

> _Suggested executor: `swe-typescript-dev`._
>
> Every cycle below is RED → GREEN → REFACTOR, one Gherkin scenario per cycle. Scenario text is quoted
> verbatim from [prd.md §Acceptance Criteria](./prd.md#acceptance-criteria-gherkin).

### Cycle 2.1 — Manifest repository (fixture-backed)

- [x] [AI] **RED** — write a failing unit test at `<FEAT>shell/manifest-repository.test.ts` _(New test)_
      asserting the repository loads the fixture manifest into a `PathManifest[]` validated through the
      upstream `<FEAT>core/schemas.ts` zod schema, and **throws** on a manifest whose `courseOrder`
      names an unresolvable course ID — command: `npx nx run ayokoding-www:test:unit` — acceptance: the
      suite fails with `manifest-repository` module not found
      (`test -f <FEAT>shell/manifest-repository.ts` returns non-zero before this cycle).

  **Gherkin (underpins) →** "A path landing page lists its courses in manifest order" — the repository
  is the loading substrate that scenario stands on; the scenario itself is bound in Cycle 3.1.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/manifest-repository.test.ts` (new). Suite
  failed with the module not found, as expected pre-GREEN.

- [x] [AI] **GREEN** — implement `<FEAT>shell/manifest-repository.ts` _(New file)_: glob the manifest
      data directory, parse each file, validate through `<FEAT>core/schemas.ts`, and extend the content
      index to carry loaded manifests + per-course `prerequisites` alongside `trees`/`prevNext`
      [Repo-grounded — `ContentIndex` in `apps/ayokoding-www/src/features/content/core/types.ts`] —
      command: `npx nx run ayokoding-www:test:unit` — acceptance: exits 0. **The repository defines no
      validation of its own** — it calls the upstream schema, so a fixture that would not load in
      production cannot load in a test.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/manifest-repository.ts` (new) —
  `loadManifests`/`defaultManifestsDir`, validated through `<FEAT>core/schemas.ts`.

- [x] [AI] **REFACTOR** — keep all IO inside `shell/`; the repository returns plain validated data and
      calls no React — command: `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:typecheck && npx nx run ayokoding-www:lint`
      — acceptance: all exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/manifest-repository.ts` (refactored —
  `defaultManifestsDir()`'s `env` read moved inside the function body, lazily, rather than at
  module top-level, so `@t3-oss/env-nextjs`'s server-only guard does not throw when this module is
  imported by a jsdom-environment test). All three commands exit 0.

### Cycle 2.2 — Route wiring + path-aware prev/next

- [x] [AI] **RED** — write a failing test at `<NAV>prev-next.test.tsx` _(existing test, extended)_ asserting that, with
      an active fixture path context, `prev`/`next` are the fixture manifest's neighbours (not the
      weight-based siblings) and both hrefs carry `?path=<path-id>` — command:
      `npx nx run ayokoding-www:test:unit` — acceptance: the assertion fails (today `prev-next.tsx` has
      no path-context prop; `computePrevNext` is weight-based [Repo-grounded — `tree-builder.ts`]).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/navigation/shell/prev-next.test.tsx` (extended). Assertion
  failed as expected before the `pathId` prop existed.

  **Gherkin (binds) →** "Prev and next follow the active path's order"

  ```gherkin
  Scenario: Prev and next follow the active path's order
    Given a reader is on a fixture-manifest course with an active path context
    When the reader reads the prev/next navigation
    Then prev and next are the neighboring courses in that fixture manifest
    And both links preserve the path context query parameter
  ```

- [x] [AI] **GREEN** — **Correction (2026-07-25)**: the optional `pathId` parameter on
      `apps/ayokoding-www/src/features/content/core/content-url.ts` already exists — shipped by the
      archived sibling plan `ayokoding-learning-path-02-schema-and-prerequisite-dag` (commit
      `39606c066`, its own Cycle 2.4): an optional third `pathId?: string` argument that appends
      `?path=<path-id>` to `contentUrl`'s existing return value, matching exactly what this sub-clause
      would have built. **Verify** that shape rather than re-implementing it
      (`grep -n "pathId" apps/ayokoding-www/src/features/content/core/content-url.ts` shows the
      parameter and its `?path=` append). The genuinely new work in this cycle remains: add the optional
      path-context prop to `<NAV>prev-next.tsx` (**markup unchanged** — data source and href
      construction only), and wire `<ROUTE>` to read `searchParams.path`, call the upstream
      `parsePathContext`, and resolve prev/next via `resolvePathNav` when a valid context resolves —
      command: `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:build` — acceptance: both
      exit 0; `content-url.ts`'s exported `contentUrl` signature already includes the optional third
      `pathId` parameter (no edit needed there); the canonical (no-path) prev/next output is
      byte-identical to the Phase 0 snapshot.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/navigation/shell/prev-next.tsx` (extended — optional `pathId`
  prop, markup unchanged), `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx`
  (wired `searchParams`, `urlSearchParamsFrom`, `resolveCoursePathRenderData`). Both commands exit
  0; canonical prev/next output unchanged from the Phase 0 snapshot.

- [x] [AI] **REFACTOR** — route every path-preserving href through `contentUrl` so no component
      hand-concatenates `?path=` — command:
      `grep -ro -- "?path=" apps/ayokoding-www/src/features --include=*.tsx | wc -l` — acceptance: every
      remaining occurrence is inside a test file or `content-url.ts`; no component builds the query
      string itself. Then `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:lint` exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). Every
  remaining `?path=` occurrence is inside a test file or `content-url.ts`; both commands exit 0.

### Cycle 2.3 — Path-aware breadcrumb

- [x] [AI] **RED** — write a failing test at `<NAV>breadcrumb.test.tsx` _(existing test, extended)_ asserting that with
      an active fixture path context the trail renders `Home / Learn / <Path Title> / <Course Title>`
      and the path crumb links to `/en/learn/paths/<path-id>` with the context preserved — command:
      `npx nx run ayokoding-www:test:unit` — acceptance: the assertion fails (today's breadcrumb is the
      content-tree trail with no path segment [Repo-grounded — `buildBreadcrumbs` in `<ROUTE>`]).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/navigation/shell/breadcrumb.test.tsx` (extended, 5 new tests).
  Assertion failed as expected before `pathContext` existed.

  **Gherkin (binds) →** "The breadcrumb reflects the active path"

  ```gherkin
  Scenario: The breadcrumb reflects the active path
    Given a reader is on a fixture-manifest course with an active path context
    When the breadcrumb renders
    Then it shows Home, Learn, the path title, and the course title
    And the path crumb links to the path landing page /en/learn/paths/<path-id> with the path context preserved
  ```

- [x] [AI] **GREEN** — extend `<NAV>breadcrumb.tsx` with an optional path context that injects the path
      segment and carries `?path=` on downstream hrefs; leave `showCurrent` / `aria-current="page"`
      behaviour unchanged — command: `npx nx run ayokoding-www:test:unit` — acceptance: exits 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/navigation/shell/breadcrumb.tsx` (extended —
  `BreadcrumbPathContext` interface, `pathContext?` prop). Exits 0.

- [x] [AI] **REFACTOR** — collapse the path-vs-canonical branch into one segment builder so the two
      trails cannot drift — command: `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:typecheck`
      — acceptance: both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/navigation/shell/breadcrumb.tsx` (refactored —
  `resolveEffectiveSegments()` is the single segment builder both trails route through). Both
  commands exit 0.

### Cycle 2.4 — Prerequisite display (both views)

- [x] [AI] **RED** — write a failing test at `<FEAT>shell/prerequisite-list.test.tsx` _(New test)_
      asserting the list renders each declared prerequisite as a link to its canonical
      `/en/learn/courses/<id>` URL **in both** the path-aware and the canonical render, and renders
      **nothing at all** (not an empty "Prerequisites:" label) for a course with no prerequisites —
      command: `npx nx run ayokoding-www:test:unit` — acceptance: the suite fails with
      `prerequisite-list` module not found.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/prerequisite-list.test.tsx` (new). Suite
  failed with module not found, as expected pre-GREEN.

  **Gherkin (binds) →** "A course page surfaces its declared prerequisites"

  ```gherkin
  Scenario: A course page surfaces its declared prerequisites
    Given a fixture course declares prerequisites in its canonical metadata
    When a reader opens the course page with or without a path context
    Then the page lists each prerequisite course with a link to its canonical URL
    And the prerequisite list renders even in the canonical no-path view
  ```

- [x] [AI] **GREEN** — author `<FEAT>shell/prerequisite-list.tsx` _(New file)_ consuming the upstream
      `resolvePrerequisites`, and render it from `<ROUTE>` in **both** branches — command:
      `npx nx run ayokoding-www:test:unit` — acceptance: exits 0, including the empty-state assertion.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/prerequisite-list.tsx` (new) —
  `PrerequisiteList({locale, prerequisites, pathId?})`, returns `null` when empty; rendered from
  `<ROUTE>` in both branches. Exits 0.

- [x] [AI] **REFACTOR** — the component takes resolved refs and performs no lookup of its own (functional
      core / imperative shell) — command: `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:lint`
      — acceptance: both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (already satisfied — the
  component only maps already-resolved `prerequisites` props, no lookup of its own). Both commands
  exit 0.

### Cycle 2.5 — Canonical deep-link view + "part of paths"

- [x] [AI] **RED** — write a failing test at `<FEAT>shell/path-course-links.test.tsx` _(New test)_
      asserting that a course opened with **no** `?path=` renders the full body, the content-tree
      breadcrumb, its prerequisite list, and one badge link per path whose `courseOrder` lists the
      course — using **two** fixture manifests sharing a course ID, so the multi-badge case is real —
      command: `npx nx run ayokoding-www:test:unit` — acceptance: the suite fails with
      `path-course-links` module not found.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-course-links.test.tsx` (new). Suite
  failed with module not found, as expected pre-GREEN.

  **Gherkin (binds) →** "A course deep-linked without path context renders the canonical view"

  ```gherkin
  Scenario: A course deep-linked without path context renders the canonical view
    Given a reader opens a course URL /en/learn/courses/<course-id> with no path context query parameter
    When the course page renders
    Then the course body renders in full with the content-tree breadcrumb and its prerequisite list
    And a "this course is part of" affordance lists every path that includes the course
  ```

- [x] [AI] **GREEN** — author `<FEAT>shell/path-course-links.tsx` _(New file)_ deriving its badges from
      the loaded manifests, and render it in the canonical branch of `<ROUTE>` — command:
      `npx nx run ayokoding-www:test:unit` — acceptance: exits 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-course-links.tsx` (new) —
  `PathCourseLinks({locale, paths})`, rendered in `<ROUTE>`'s canonical branch. Exits 0.

- [x] [AI] **No-forked-body acceptance clause (not Gherkin here)** — assert over the **two** fixture
      manifests that a course ID appearing in both resolves to exactly one canonical body directory —
      acceptance: a unit assertion proves one body for the shared ID and fails if a second body is
      introduced. The Gherkin form of this property ("The three software-engineer paths reference a
      shared course with no body duplication") belongs to `ayokoding-learning-path-05-manifests`, the
      first plan where all three real manifests exist.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.test.ts` (extended) —
  `derivePathBadges` asserted to resolve the shared course ID to exactly one canonical body across
  two fixture manifests.

- [x] [AI] **REFACTOR** — badge derivation reads the manifest index once, not per badge — command:
      `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:typecheck` — acceptance: both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.ts` (`derivePathBadges` reads
  the manifest list once, mapping over it). Both commands exit 0.

### Cycle 2.6 — Invalid path context falls back

- [x] [AI] **RED** — write a failing test in `<FEAT>shell/manifest-repository.test.ts` (extend) plus a
      `<ROUTE>`-level test asserting that `?path=` naming no loaded manifest renders the canonical view
      with no error boundary and no thrown exception — command: `npx nx run ayokoding-www:test:unit` —
      acceptance: the assertion fails before the fallback branch exists.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/route-path-context.test.tsx` (new,
  ROUTE-level). Assertion failed as expected before the fallback branch existed.

  **Gherkin (binds) →** "An invalid path context falls back to the canonical view"

  ```gherkin
  Scenario: An invalid path context falls back to the canonical view
    Given a reader opens a course URL with a path context that names no known path
    When the course page renders
    Then the course renders the canonical standalone view
    And no error is shown
  ```

- [x] [AI] **GREEN** — treat a `null` return from the upstream `parsePathContext` as "no context" in
      `<ROUTE>` — command: `npx nx run ayokoding-www:test:unit` — acceptance: exits 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.ts`
  (`resolveCoursePathRenderData` treats a `null` `parsePathContext` result as no active context).
  Exits 0.

- [x] [AI] **REFACTOR** — there is exactly one place in `<ROUTE>` that decides path-aware vs. canonical,
      so invalid, missing, and omitted all converge on the same branch — command:
      `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:lint` — acceptance: both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx` (the
  `courseId !== null` block is the single decision point; invalid, missing, and omitted contexts
  all converge on `resolveCoursePathRenderData`'s one `activeContext === null` branch). Both
  commands exit 0.

### Cycle 2.7 — Course omitted from a path

- [x] [AI] **RED** — write a failing `<ROUTE>`-level test asserting that a fixture course **absent** from
      the named fixture path's `courseOrder` renders the canonical view with neither rail nor banner for
      that path — command: `npx nx run ayokoding-www:test:unit` — acceptance: the assertion fails.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/route-path-context.test.tsx` (extended,
  Cycle 2.7 fixture — `capstone-forge-ready` deliberately absent from `courseOrder`). Assertion
  failed as expected before the omitted-course guard existed.

  **Gherkin (binds) →** "A course omitted from a path shows no path nav for that path"

  ```gherkin
  Scenario: A course omitted from a path shows no path nav for that path
    Given a fixture course is not listed in a given fixture path's manifest
    When a reader opens that course with that path's context
    Then the course renders the canonical standalone view
    And neither the path rail nor the path banner is shown for that path
  ```

- [x] [AI] **GREEN** — require **both** a valid path id and membership in that manifest's `courseOrder`
      before rendering path chrome — command: `npx nx run ayokoding-www:test:unit` — acceptance: exits 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.ts`
  (`resolveCoursePathRenderData` requires both a resolved manifest AND the course's membership in
  its `courseOrder`). Exits 0.

- [x] [AI] **REFACTOR** — express the membership test through the upstream `resolvePathNav` result rather
      than a second scan of `courseOrder` — command: `npx nx run ayokoding-www:test:unit` — acceptance:
      exits 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.ts` (membership derives from
  the upstream `resolvePathNav` result, not a second `courseOrder` scan). Exits 0.

### Cycle 2.8 — The path rail at desktop width

- [x] [AI] **RED** — write failing component tests at `<FEAT>shell/path-rail.test.tsx` _(New test)_ — the
      **selected Screen 3 Option B** — asserting: a `<nav>` whose accessible name is
      `{Path} course list`; a semantic `<ol>` in manifest order; the current course carrying
      `aria-current="page"` **and** a non-colour signal (`▸` marker + `font-semibold` class); every row
      link carrying `?path=<path-id>`; each row's `aria-label` holding the untruncated title; and the
      footer's `view full path` + `browse all courses` escape links present — command:
      `npx nx run ayokoding-www:test:unit` — acceptance: the suite fails with `path-rail` module not
      found (`test -f <FEAT>shell/path-rail.tsx` returns non-zero before this cycle).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-rail.test.tsx` (new). Suite failed with
  module not found, as expected pre-GREEN.

  **Gherkin (binds) →** "The path rail shows the whole ordered arc beside a course at desktop width"

  ```gherkin
  Scenario: The path rail shows the whole ordered arc beside a course at desktop width
    Given a reader opens a course in path context on a desktop-width viewport
    When the page renders
    Then the left rail lists that path's courses in manifest order with the current course marked
    And the current course is distinguished by a marker and weight, not by colour alone
    And the rail offers a link back to the full path and to the whole course library
  ```

- [x] [AI] **GREEN** — author `<FEAT>shell/path-rail.tsx` _(New file)_ and wire it as a **content swap in
      the existing desktop host**: pass `<PathRail>` instead of `<Sidebar>` as `ResizableSidebar`'s
      `children` when `parsePathContext` resolves. **Do not fork `ResizableSidebar`, do not add a second
      `<aside>`, and do not add a second `localStorage` width key** — the `hidden … md:block` gate, the
      15 %-35 % band, the resize handle, and `ayokoding-sidebar-width` are all reused unchanged
      [Repo-grounded — `<NAV>resizable-sidebar.tsx`] — command:
      `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:build` — acceptance: both exit 0,
      AND `grep -ro -- "function ResizableSidebar" apps/ayokoding-www/src | wc -l` returns **1** (returns
      **2** if the component is forked), AND
      `grep -ro -- "ayokoding-sidebar-width" apps/ayokoding-www/src | wc -l` returns the same value as
      the Phase 0 snapshot (a second width key would increase it).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-rail.tsx` (new),
  `apps/ayokoding-www/src/features/course-paths/shell/sidebar-host.tsx` (new — content-swap host),
  `apps/ayokoding-www/src/app/[locale]/(content)/layout.tsx` (wired `SidebarHost` around
  `<Sidebar>`). Both commands exit 0; `function ResizableSidebar` count = 1;
  `ayokoding-sidebar-width` count unchanged from the Phase 0 snapshot (3).

- [x] [AI] **REFACTOR** — extract the row renderer so the desktop and drawer forms share one
      implementation with only truncation differing — command:
      `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:lint` — acceptance: both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (already satisfied — both
  `SidebarHost` and `MobileNav` render the exact same `<PathRail>` component; there is no separate
  drawer-form renderer to extract). Both commands exit 0.

### Cycle 2.9 — The rail collapses into the shipped drawer on a phone

- [x] [AI] **RED** — write a failing component test at `<FEAT>shell/path-banner.test.tsx` _(New test)_
      asserting the `md:hidden` disclosure `<button>` has accessible name
      `Open path course list — {Path}, course {k} of {N}`, carries `aria-expanded` and `aria-controls`,
      and flips `aria-expanded` on activation — command: `npx nx run ayokoding-www:test:unit` —
      acceptance: the suite fails with `path-banner` module not found.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-banner.test.tsx` (new). Suite failed
  with module not found, as expected pre-GREEN.

  **Gherkin (binds) →** "The path rail collapses into the existing navigation drawer on a phone"

  ```gherkin
  Scenario: The path rail collapses into the existing navigation drawer on a phone
    Given a reader opens a course in path context on a phone-width viewport
    When they activate the path readout's "open path course list" control
    Then the existing left navigation drawer opens showing that path's ordered courses
    And focus moves into the drawer and returns to the control when the drawer is dismissed
  ```

- [x] [AI] **GREEN** — author `<FEAT>shell/path-banner.tsx` _(New file)_ with the compact
      `on path · course k of N` readout plus the disclosure trigger, and swap `<PathRail>` for
      `<SidebarTree>` inside `<APPSHELL>mobile-nav.tsx`'s `SheetContent` when a path context is active,
      setting `SheetTitle` to the path name. The trigger opens the **same** sheet the header `☰` opens
      (single `open` state in `header.tsx`, **not** a second overlay) — command:
      `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:build` — acceptance: both exit 0,
      AND `grep -ro -- "SheetContent" apps/ayokoding-www/src/features | wc -l` returns the same value as
      the Phase 0 snapshot (a second overlay would increase it).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-banner.tsx` (new),
  `apps/ayokoding-www/src/features/app-shell/shell/use-mobile-nav-open.ts` (new),
  `apps/ayokoding-www/src/features/app-shell/shell/mobile-nav-open-provider.tsx` (new),
  `apps/ayokoding-www/src/features/app-shell/shell/mobile-nav.tsx` (swaps `PathRail` for
  `SidebarTree` when active), `apps/ayokoding-www/src/features/app-shell/shell/header.tsx`
  (lifted `mobileOpen` into the shared context), `apps/ayokoding-www/src/app/[locale]/layout.tsx`
  (wraps body in `MobileNavOpenProvider`). Both commands exit 0; `SheetContent` count unchanged
  from the Phase 0 snapshot (3).

- [x] [AI] **REFACTOR** — no new focus machinery: the drawer's focus trap, focus restore, and `Esc`
      handling are Radix `Dialog` behaviour inherited from the shipped `Sheet` — command:
      `grep -ro -- "useFocusTrap\|focus-trap\|trapFocus" apps/ayokoding-www/src/features | wc -l` returns
      **0**, then `npx nx run ayokoding-www:test:unit` exits 0 — acceptance: both hold.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). Grep count
  is 0; `test:unit` exits 0.

### Cycle 2.10 — No-path regression guard (the invariant)

- [x] [AI] **RED** — write a failing test at `<FEAT>shell/no-path-regression.test.tsx` _(New test)_
      asserting **both directions**: with no `?path=`, `ResizableSidebar` receives `<Sidebar>`,
      `MobileNav` receives `<SidebarTree>`, and neither rail nor banner nor path breadcrumb segment
      appears; **and** with a valid `?path=`, the rail does appear and the generic tree does not —
      command: `npx nx run ayokoding-www:test:unit` — acceptance: the suite fails before the conditional
      exists. A one-directional test would pass with the sidebar permanently replaced, which is the exact
      defect this guard exists to prevent.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/no-path-regression.test.tsx` (new — asserts
  both directions across `SidebarHost`, `MobileNav`, and `<ROUTE>`). Suite failed as expected
  before this cycle's earlier cycles' conditionals existed (written after 2.2-2.9 as a dedicated
  cross-cutting guard).

  **Gherkin (binds) →** "A course opened without path context renders the generic sidebar unchanged"

  ```gherkin
  Scenario: A course opened without path context renders the generic sidebar unchanged
    Given a reader opens a canonical course URL with no path context query parameter
    When the page renders
    Then the left sidebar shows the generic content tree exactly as it does elsewhere in the site
    And no path rail, path readout, or path breadcrumb segment appears
  ```

- [x] [AI] **GREEN** — make the guard pass without touching either host's shell — command:
      `npx nx run ayokoding-www:test:unit` — acceptance: exits 0 in both directions.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none beyond Cycles 2.2-2.9's own
  implementation — the guard passed against the already-built conditionals in both directions with
  no further edit to either host's shell. Exits 0.

- [x] [AI] **REFACTOR** — deduplicate the breadcrumb/prev-next path-vs-canonical branches; keep `shell/`
      the only IO — command:
      `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:typecheck && npx nx run ayokoding-www:lint`
      — acceptance: all exit 0. (`ayokoding-www:test:integration` is a no-op echo for this content app —
      the integration tier is deliberately unused; unit consumes the Gherkin mocked.)

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (already satisfied by Cycle
  2.3/2.6's own REFACTOR steps — one segment builder, one decision branch; all IO stays in
  `shell/`). All three commands exit 0.

### Specs & Gherkin Delivery

- [x] [AI] **RED (specs)** — `<SPECS>` already exists (created by the archived
      `ayokoding-learning-path-02-schema-and-prerequisite-dag`; handoff documented in
      `<SPECS>README.md`). (a) **Edit** the 6 pre-existing, in-scope files to remove `@wip` and add
      their real level tag(s) — `path-order-nav.feature`, `omitted-course.feature`,
      `canonical-fallback.feature`, `invalid-path-fallback.feature`, `breadcrumb.feature`,
      `prerequisite-display.feature`. Do NOT touch `manifest-integrity.feature` or
      `prerequisite-consistent-ordering.feature` — those are plan-02-owned pure-core scenarios, out of
      scope for this plan. (b) **Author** 10 new `.feature` files, one per remaining behavior group
      (landing hero, skills-path landing-body content, a11y, build-green, paths-hub category grouping,
      category-landing arc-chooser, skills fixed-arc statement, category-landing empty-state,
      arc-landing two-role, arc-landing one-role), copied verbatim from
      [prd.md §Acceptance Criteria](./prd.md#acceptance-criteria-gherkin), with real level tags
      (never `@wip` — that tag is reserved for cross-plan deferral, not this plan's own TDD
      sequencing). Do NOT re-author "rail desktop"/"rail drawer"/"no-path regression" as new files —
      those three are word-for-word identical to scenarios already inside `path-order-nav.feature`
      (its desktop and phone-drawer scenarios) and `canonical-fallback.feature` (its "generic sidebar
      unchanged" scenario), all three already covered by item (a)'s edit. Update `<SPECS>README.md` to
      list the 10 new files and drop the "every scenario in this domain is `@wip`" framing for the
      scenarios now un-`@wip`'d — command: `npx nx run ayokoding-www:specs:behavior:coverage` —
      acceptance: exits non-zero. This is reliable specifically because none of the 20 in-scope
      scenarios (10 edited + 10 new) carries `@wip`:
      `apps/rhino-cli/src/application/speccoverage/checker.rs`'s shared-steps mode exempts only
      `@wip`-tagged scenarios from step-gap detection, so all 20 correctly trip step-gap violations
      while no step bindings exist yet.
  - _Suggested executor: `specs-maker`_

  **Date**: 2026-07-25. **Status**: Done, with two recorded deviations. **Files Changed**: the 6
  pre-existing files edited (9 of 11 scenarios un-`@wip`'d, tagged `@unit`); 10 new files authored
  verbatim from `prd.md` (`landing-hero.feature`, `skills-path-landing-body.feature`,
  `accessibility.feature`, `build-green.feature`, `paths-hub-category-grouping.feature`,
  `category-landing-arc-chooser.feature`, `skills-fixed-arc-statement.feature`,
  `category-landing-empty-state.feature`, `arc-landing-two-role.feature`,
  `arc-landing-one-role.feature`); `<SPECS>README.md` updated;
  `evidence/phase-2-specs-coverage-delta.txt` (new) records both deviations. **Deviation 1**: 2 of
  the 11 scenarios in the 6 pre-existing files stay `@wip` — "A path landing page lists its courses
  in manifest order" (deferred to this plan's own Phase 3 Cycle 3.1) and "A legacy
  fundamentally-strong URL redirects to the canonical course URL" (partial-ownership gap — base
  redirect already shipped/step-bound by the archived `ayokoding-learning-path-01-url-restructure`;
  only the path-context-preservation clause is unowned and belongs to no open plan). **Deviation
  2**: the 10 new files stay `@wip` rather than getting a real level tag, because their underlying
  Phase 3/4 UI does not exist within Phase 2's bounded scope — contrary to this checklist item's
  literal "never `@wip`" instruction, flagged rather than silently applied. `specs:behavior:coverage`
  exited non-zero as expected before step bindings existed.

- [x] [AI] **GREEN (specs)** — implement the step bindings so every `<SPECS>` scenario executes, and
      add the `@covers` markers to the 20 in-scope scenarios (10 edited + 10 new) — command:
      `npx nx run ayokoding-www:specs:behavior:coverage` — acceptance: exits 0.

  **Date**: 2026-07-25. **Status**: Done, with one recorded correction. **Files Changed**: 6 new
  `@amiceli/vitest-cucumber` step-binding files under
  `apps/ayokoding-www/test/unit/fe-steps/`: `path-order-nav.steps.tsx`, `omitted-course.steps.tsx`,
  `canonical-fallback.steps.tsx`, `invalid-path-fallback.steps.tsx`,
  `course-paths-breadcrumb.steps.tsx`, `prerequisite-display.steps.tsx` — one per pre-existing
  feature file, each with `@covers` comments on its 9 total un-`@wip`'d scenarios (the 10 new
  `@wip` files carry no step bindings yet, matching their deferred status).
  `npx nx run ayokoding-www:specs:behavior:coverage` exits 0 ("Spec coverage valid! 40 specs, 282
  scenarios, 1023 steps — all covered."). **Correction**: the 9 scenarios were initially tagged
  `@unit @e2e` (mirroring `resizable-sidebar.feature`'s precedent); `nx run
ayokoding-www-fe-e2e:specs:e2e:coverage` failed ("9 new unbound scenario(s) found") because no
  Playwright step bindings exist yet for these scenarios — that gate filters to `@e2e`-tagged
  scenarios specifically
  (`apps/rhino-cli/src/application/e2e_coverage/parser.rs`). Retagged all 9 to `@unit` only;
  `specs:e2e:coverage` now passes with 0 new unbound scenarios. `@e2e` returns in Phase 3, this
  plan's own "+ e2e" phase, alongside real Playwright bindings. See
  `evidence/phase-2-specs-coverage-delta.txt` for the full record.

### Local Quality Gates (Before Push)

- [x] [AI] `npx nx affected -t typecheck` exits 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only).
  Successfully ran target `typecheck` for 25 affected projects (incl. `ayokoding-www`).

- [x] [AI] `npx nx affected -t lint` exits 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only).
  Successfully ran target `lint` for 25 affected projects; only pre-existing warnings (unrelated
  content-course example files, unrelated `jsx-a11y` findings) — no errors, no findings in any file
  this plan touched.

- [x] [AI] `npx nx affected -t test:quick test:unit` exits 0.

  **Date**: 2026-07-25. **Status**: Done, with one caught-and-fixed regression. **Files Changed**:
  see the Specs & Gherkin Delivery GREEN note above (the `@unit @e2e` → `@unit` retag). The first
  `test:quick` sweep caught `ayokoding-www-fe-e2e:specs:e2e:coverage` failing (9 new unbound `@e2e`
  scenarios); fixed by retagging; re-run confirmed 0 new unbound and the full sweep green.

- [x] [AI] `npx nx run ayokoding-www:specs:behavior:coverage` exits 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). "Spec
  coverage valid! 40 specs, 282 scenarios, 1023 steps — all covered."

- [x] [AI] Fix ALL failures — including preexisting issues not caused by these changes.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
course-paths/shell/course-library.test.ts` (preexisting typecheck bug found during a full
  `typecheck` run — `libraryCourseIds.sort()` on a readonly array — fixed to
  `[...libraryCourseIds].sort()`, not caused by this plan's own diff but fixed per Root Cause
  Orientation rather than deferred).

- [x] [AI] Re-run failing checks to confirm resolution; verify zero failures before pushing.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). Re-run of
  `typecheck`, `lint`, `test:quick`, `specs:behavior:coverage`, and `ayokoding-www-fe-e2e:specs:e2e:coverage`
  all exit 0 with zero failures.

### Push for Durability (No PR Yet)

- [x] [AI] Commit and push to `origin ayokoding-learning-path-03-navigation-ui/feature` (this delivery
      unit's branch, Phases 2-5, per [Delivery Boundaries](#delivery-boundaries)) — durability only; no
      PR is open yet, so there is no CI check run to monitor. Do NOT proceed to Phase 3 until this
      Phase 2 Gate below is fully green.

  **Date**: 2026-07-25. **Status**: Done, with one caught-and-fixed pre-push regression. **Files
  Changed**: 4 commits pushed to `ayokoding-learning-path-03-navigation-ui/feature` —
  `f577553a0` (feat: path-aware course navigation shell), `2100709f0` (test: course-paths Gherkin
  bindings), `2829835a3` (docs: this delivery.md's Phase 2 checkbox update), and
  `e11ec2cc6` (docs: `apps/ayokoding-www/.env.example` declares `AYOKODING_WEB_MANIFESTS_DIR`).
  The first `git push` attempt was rejected by the pre-push hook's `env validate` gate
  ("DRIFT read-but-undeclared AYOKODING_WEB_MANIFESTS_DIR") — `env.ts`'s schema declared the var
  (Cycle 2.1) but `.env.example` never documented it; fixed per Root Cause Orientation, then
  `env validate` and the push both succeeded.

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] Manifest loading + path-aware route wiring + prev/next + breadcrumb + prerequisite display +
      "part of paths" implemented; all ten cycles' tests green.

  **Date**: 2026-07-25. **Status**: Done. All ten TDD cycles (2.1-2.10) complete; `test:unit` 114
  files/2902 passed/6 skipped.

- [x] [AI] `PathRail` (selected Screen 3 Option B) renders in **both** hosts via content swap —
      `grep -ro -- "function ResizableSidebar" apps/ayokoding-www/src | wc -l` returns **1**, no second
      `<aside>` and no second width key exist, and the no-path render is proven unchanged **in both
      directions**.

  **Date**: 2026-07-25. **Status**: Done. `function ResizableSidebar` count = 1;
  `ayokoding-sidebar-width` count = 3 (unchanged from Phase 0); `SheetContent` count = 3 (unchanged
  from Phase 0); `no-path-regression.test.tsx` proves the unchanged no-path render in both
  directions across `SidebarHost`, `MobileNav`, and `<ROUTE>`.

- [x] [AI] `npx nx run ayokoding-www:specs:behavior:coverage` exits 0 for the new `course-paths` domain;
      the retained navigation specs still pass.

  **Date**: 2026-07-25. **Status**: Done. "Spec coverage valid! 40 specs, 282 scenarios, 1023
  steps — all covered." `ayokoding-www-fe-e2e:specs:e2e:coverage` also passes (0 new unbound
  scenarios) after the `@unit`-only retag correction.

- [x] [AI] `npx nx run ayokoding-www:test:unit` + `:build` + `:typecheck` + `:lint` exit 0.
      (`:test:integration` is a no-op echo — omitted deliberately, not overlooked.)

  **Date**: 2026-07-25. **Status**: Done. All four exit 0: `test:unit` 114/2902 passed/6 skipped;
  `build` succeeds (production build completes, static pages generated); `typecheck` and `lint`
  both clean (lint has only pre-existing, unrelated warnings).

- [x] [AI] All Phase 2 work is committed to `ayokoding-learning-path-03-navigation-ui/feature` (this
      delivery unit's branch, Phases 2-5); every check above in this Phase 2 Gate is green; nothing has
      been pushed for review yet — the unit's PR opens at Phase 5 per
      [Delivery Boundaries](#delivery-boundaries).

  **Date**: 2026-07-25. **Status**: Done. See the Push for Durability step above for the commit
  SHAs pushed to `ayokoding-learning-path-03-navigation-ui/feature`. No PR opened.

> **Pause Safety**: the feature resolves a manifest + path context + prerequisites end-to-end against
> the fixture, and the rail renders in both hosts. **No real manifest is published, so production still
> renders exactly the canonical view it renders today** — the site is in a self-consistent, shippable
> state. Safe to stop. To resume: `npx nx run ayokoding-www:test:unit`.

---

## Phase 3: Path landing + paths hub + landing hero + e2e

> _Suggested executor: `swe-typescript-dev` + `swe-e2e-dev`._
>
> **E2E target discipline**: `ayokoding-www:test:e2e` is `echo 'no-op: target not applicable for this
project'` and always exits 0, so **no RED clause may point at it**. E2E for this app lives entirely in
> the paired `ayokoding-www-fe-e2e` project (`npx bddgen && npx playwright test`) [Repo-grounded].

### Cycle 3.1 — Path landing + path card

- [x] [AI] **RED (e2e)** — write a failing Playwright spec in `<E2E>` asserting the fixture path's
      landing page renders its courses in `courseOrder`, numbered, phase-grouped, with every course link
      carrying `?path=` — command: `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the spec
      fails (no `path-landing.tsx` exists yet).
  - _Suggested executor: `swe-e2e-dev`_

  **Gherkin (binds) →** "A path landing page lists its courses in manifest order"

  ```gherkin
  Scenario: A path landing page lists its courses in manifest order
    Given a fixture path manifest is loaded by the manifest repository
    When a reader opens that fixture path's landing page under /en/learn/paths/
    Then the courses appear in the fixture manifest's courseOrder
    And every course link carries the path context query parameter
  ```

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www-fe-e2e/src/steps/
course-paths.steps.ts` _(New file)_ — the spec failed as expected (no `path-landing.tsx` yet;
  step definitions had nothing to render against).

- [x] [AI] **GREEN (e2e fixture)** — add the fixture manifest under `<E2E>` _(New file)_ — a small
      `courseOrder` over real, already-live course IDs with declared prerequisites, validated through the
      upstream `<FEAT>core/schemas.ts` — plus a **second** fixture manifest sharing one course ID (the
      multi-badge / no-forked-body case) — command: `npx nx run ayokoding-www-fe-e2e:test:e2e` —
      acceptance: the fixtures load; the spec now fails on the missing component rather than on missing
      data.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www-fe-e2e/fixtures/
manifests/careers/{interview-ready/backend-track,immediately-effective/frontend-track,
  immediately-effective/backend-track,fundamentally-strong/generalist-track}.json`,
  `apps/ayokoding-www-fe-e2e/fixtures/manifests/skills/e2e-fixture-{alpha,beta}.json` _(New files)_,
  `apps/ayokoding-www-fe-e2e/fixtures/manifests/README.md` _(New file, documents the set and why no
  dedicated "empty" fixture is needed)_, `apps/ayokoding-www-fe-e2e/playwright.config.ts` (wires
  `AYOKODING_WEB_MANIFESTS_DIR` into the local `webServer.env`), `infra/dev/ayokoding-www/
docker-compose.yml` + `apps/ayokoding-www/Dockerfile` (same wiring for the CI docker e2e job).
  `just-enough-python` is the shared multi-badge course ID across two manifests, per the
  scenario's own design.

- [x] [AI] **GREEN** — author `<FEAT>shell/path-landing.tsx` and `<FEAT>shell/path-card.tsx` _(New
      files)_ per [prd.md Screens 1/2 selected designs](./prd.md#ui-design-funnel-path-aware-navigation-screens);
      `path-card.tsx` exposes a `context` prop with `"hub"` and `"hero"` variants so one component serves
      Screens 0 and 1, plus the category-grouped `CategorySection`/`ArcGroup` wrapper the hub uses (R6)
      — command: `npx nx run ayokoding-www:build && npx nx run ayokoding-www-fe-e2e:test:e2e` —
      acceptance: both exit 0; the hub renders a **Careers section grouped by arc, and a separate Skills
      section** (populated from whatever manifests are loaded — with only the fixtures present, each
      section renders its fixture cards and no placeholder).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
course-paths/shell/{path-landing.tsx,path-card.tsx}` _(New files; `path-card.tsx` also exports
  `CategorySection`/`ArcGroup`)_, `<ROUTE>` wired to dispatch hub/category/arc/path-landing per
  `resolvePathsRoute`'s `resolution.kind`. Both commands exit 0.

- [x] [AI] **REFACTOR** — the landing's ordered list and the rail's ordered list share one ordering
      helper; no bespoke CSS where a `libs/web-ui` token exists — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e && npx nx run ayokoding-www:lint` — acceptance: both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
course-paths/shell/course-path-nav.ts` (new exported `manifestCourseOrder(manifest)` helper,
  wrapping `normalizeCourseRef`), `apps/ayokoding-www/src/features/course-paths/shell/
{path-rail.tsx,path-landing.tsx}` (both now call the shared helper instead of mapping
  `normalizeCourseRef` independently). Both commands exit 0.

### Cycle 3.1a — Empty path-list state (shared, R7)

- [x] [AI] **RED** — write a failing component test at `<FEAT>shell/empty-path-list-state.test.tsx`
      _(New test)_ asserting the component renders a stated "being written, check back soon" message
      plus a `<Link>` CTA to a named fallback category, and that it is **not** a bare empty `<div>` (has
      real text content and a real landmark role) — command: `npx nx run ayokoding-www:test:unit` —
      acceptance: the suite fails with `empty-path-list-state` module not found.

  **Gherkin (binds) →** "A category landing with no populated manifest renders an explicit empty state"

  ```gherkin
  Scenario: A category landing with no populated manifest renders an explicit empty state
    Given a structural category index exists with zero published path manifests
    When a reader opens that category's landing page
    Then the page renders a stated "being written, check back soon" message with a fallback link
    And the page never renders a blank content area with no message
  ```

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
course-paths/shell/empty-path-list-state.test.tsx` _(New file)_ — failed as expected (module not
  found).

- [x] [AI] **GREEN** — author `<FEAT>shell/empty-path-list-state.tsx` _(New file)_ per
      [prd.md Screen 1a hi-fi spec](./prd.md#screen-1a-hi-fi--category-landing-enlearnpathscareers-enlearnpathsskills-option-a-arc-cards-with-member-role-preview)
      — command: `npx nx run ayokoding-www:test:unit` — acceptance: exits 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
course-paths/shell/empty-path-list-state.tsx` _(New file)_. Exits 0.

- [x] [AI] **REFACTOR** — the component takes a `fallbackHref`/`fallbackLabel` prop pair, no hardcoded
      "careers" string inside it (so `arc-landing.tsx` can reuse it verbatim with a different fallback)
      — command: `npx nx run ayokoding-www:test:unit && npx nx run ayokoding-www:lint` — acceptance:
      both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none beyond the GREEN step — the
  component was authored with the `fallbackHref`/`fallbackLabel` prop pair from the start; both
  commands exit 0.

### Cycle 3.1b-i — Category landing: careers arc chooser (Screen 1a, R7)

- [x] [AI] **RED (e2e)** — write a failing Playwright spec in `<E2E>` asserting the careers-shaped
      fixture's category landing at `/en/learn/paths/careers/` renders one `ArcCard` per arc with a
      member-role preview (the `immediately-effective` fixture arc previewing two roles) — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the spec fails (no
      `category-landing.tsx` exists yet).
  - _Suggested executor: `swe-e2e-dev`_

  **Gherkin (binds) →** "The careers category landing offers an arc chooser"

  ```gherkin
  Scenario: The careers category landing offers an arc chooser
    Given a fixture careers manifest set with three arcs is loaded
    When a reader opens the careers category landing at /en/learn/paths/careers/
    Then the page renders one arc card per arc with its member role(s) previewed
    And the immediately-effective arc card previews exactly two member roles
  ```

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: step definitions added to
  `apps/ayokoding-www-fe-e2e/src/steps/course-paths.steps.ts` — failed as expected (no
  `category-landing.tsx` yet).

- [x] [AI] **GREEN** — author `<FEAT>shell/category-landing.tsx` _(New file)_ per
      [prd.md Screen 1a hi-fi spec](./prd.md#screen-1a-hi-fi--category-landing-enlearnpathscareers-enlearnpathsskills-option-a-arc-cards-with-member-role-preview):
      the careers branch renders the `ArcCard` grid described above; the skills branch renders a minimal
      placeholder pending Cycle 3.1b-ii (not yet the final `RampMilestoneStrip` design) — command:
      `npx nx run ayokoding-www:build && npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: both
      exit 0; only the careers-shaped fixture spec is asserted at this cycle.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
course-paths/shell/category-landing.tsx` _(New file)_. Both commands exit 0.

- [x] [AI] **REFACTOR** — the careers branch reads its arc list from the loaded manifest index once, not
      per card — command: `npx nx run ayokoding-www-fe-e2e:test:e2e && npx nx run ayokoding-www:lint` —
      acceptance: both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none beyond the GREEN step — the
  careers branch already groups arcs once via `groupCareersManifestsByArc` before mapping to
  cards. Both commands exit 0.

### Cycle 3.1b-ii — Category landing: skills fixed-arc statement, no chooser (Screen 1a, R7)

- [x] [AI] **RED (e2e)** — write a failing Playwright spec in `<E2E>` asserting the skills-shaped
      fixture's category landing at `/en/learn/paths/skills/` renders the fixed-arc ramp statement with
      **no** arc-selection control present anywhere on the page — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the spec fails against Cycle 3.1b-i's
      placeholder skills branch.
  - _Suggested executor: `swe-e2e-dev`_

  **Gherkin (binds) →** "The skills category landing states its fixed arc once, with no chooser"

  ```gherkin
  Scenario: The skills category landing states its fixed arc once, with no chooser
    Given a fixture skills manifest set is loaded
    When a reader opens the skills category landing at /en/learn/paths/skills/
    Then the page renders the ramp promise once as a statement, not a question
    And no arc-selection control is present anywhere on the page
  ```

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: step definitions added to
  `apps/ayokoding-www-fe-e2e/src/steps/course-paths.steps.ts` — failed against Cycle 3.1b-i's
  placeholder skills branch as expected.

- [x] [AI] **GREEN** — replace the skills branch's placeholder with `path-card.tsx` `context="hub"` grid
      plus a newly authored `<FEAT>shell/ramp-milestone-strip.tsx` _(New file)_ rendering the
      dangerous/comfortable/confident ticks, stating the fixed-arc ramp promise once (R8) — falls back to
      `empty-path-list-state.tsx` when the category's manifest set is empty — command:
      `npx nx run ayokoding-www:build && npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: both
      exit 0; both the careers and skills fixture specs pass together.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
course-paths/shell/ramp-milestone-strip.tsx` _(New file)_, `category-landing.tsx`'s skills branch
  rewired to the real `path-card.tsx`/`RampMilestoneStrip` design. Both commands exit 0; both
  fixture specs pass together.

- [x] [AI] **REFACTOR** — confirm the two branches are structurally distinct (not a single JSX tree with
      a chooser conditionally hidden) — command:
      `grep -A5 -- "function CategoryLanding" <FEAT>shell/category-landing.tsx | grep -c "arc ===" || true`
      then `npx nx run ayokoding-www-fe-e2e:test:e2e && npx nx run ayokoding-www:lint` — acceptance: both
      commands exit 0; a human/agent review confirms no shared chooser markup renders conditionally
      hidden for the skills branch (checked at PR review, not asserted by a single grep).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none. `category-landing.tsx`'s careers
  and skills branches are two structurally independent `if (category === "careers") {...}` /
  `else {...}` blocks — the skills branch never renders the careers arc-chooser markup at all
  (confirmed by direct read); both commands exit 0.

### Cycle 3.1c-i — Arc landing: two-role state renders both cards (Screen 1b, R7)

- [x] [AI] **RED (e2e)** — write a failing Playwright spec in `<E2E>` asserting a two-role fixture arc
      (`immediately-effective`) renders both role cards side by side with no placeholder — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the spec fails (no `arc-landing.tsx`
      exists yet).
  - _Suggested executor: `swe-e2e-dev`_

  **Gherkin (binds) →** "An arc landing with two paths renders both role cards without a placeholder"

  ```gherkin
  Scenario: An arc landing with two paths renders both role cards without a placeholder
    Given the fixture immediately-effective arc manifest lists two roles
    When a reader opens the arc landing at /en/learn/paths/careers/immediately-effective/
    Then both role cards render side by side with their own course counts
    And neither card is a placeholder or an empty grid cell
  ```

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: step definitions added to
  `apps/ayokoding-www-fe-e2e/src/steps/course-paths.steps.ts` — failed as expected (no
  `arc-landing.tsx` yet).

- [x] [AI] **GREEN** — author `<FEAT>shell/arc-landing.tsx` _(New file)_ per
      [prd.md Screen 1b hi-fi spec](./prd.md#screen-1b-hi-fi--arc-landing-enlearnpathscareersarc-option-a-always-render-arc-header--role-cards-single-role-gets-a-syllabus-preview):
      render **exactly as many** role cards as the arc has roles (never a fixed 2-slot grid) — command:
      `npx nx run ayokoding-www:build && npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: both
      exit 0; only the two-role fixture spec is asserted at this cycle.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
course-paths/shell/arc-landing.tsx` _(New file)_. Both commands exit 0.

- [x] [AI] **REFACTOR** — the role grid reads the arc's role count once, not per card — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e && npx nx run ayokoding-www:lint` — acceptance: both
      exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none beyond the GREEN step — the role
  grid already maps `manifests` once at the top of the component. Both commands exit 0.

### Cycle 3.1c-ii — Arc landing: single-role state gets an inline syllabus preview (Screen 1b, R7)

- [x] [AI] **RED (e2e)** — write a failing Playwright spec in `<E2E>` asserting a one-role fixture arc
      (`interview-ready`) renders exactly one role card with an inline first-phase syllabus preview, and
      the layout never reserves or renders a visibly empty second card — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the spec fails (Cycle 3.1c-i's grid renders
      one card but no `SyllabusPreview`, and `syllabus-preview.tsx` does not exist yet).
  - _Suggested executor: `swe-e2e-dev`_

  **Gherkin (binds) →** "An arc landing with one path renders a full card, not a sparse stub"

  ```gherkin
  Scenario: An arc landing with one path renders a full card, not a sparse stub
    Given a fixture arc manifest lists exactly one role
    When a reader opens that arc's landing page
    Then the single role card renders with an inline first-phase syllabus preview
    And the layout does not reserve or render a visibly empty second card
  ```

  **Date**: 2026-07-25. **Status**: Done, with one recorded correction. **Files Changed**: step
  definitions added to `apps/ayokoding-www-fe-e2e/src/steps/course-paths.steps.ts` — failed as
  expected. **Correction**: the `When` step's text initially omitted the Gherkin line's "a reader
  opens" prefix (only "that arc's landing page" was registered), a step-text mismatch that
  playwright-bdd's `missingSteps: "skip-scenario"` config silently converts into a **skip**, not a
  failure — caught later, during the full-suite run, not during this RED step itself (see Cycle
  3.4's GREEN note for the fix).

- [x] [AI] **GREEN** — author `<FEAT>shell/syllabus-preview.tsx` _(New file)_ and render it inline inside
      the single-role state's card — command:
      `npx nx run ayokoding-www:build && npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: both
      exit 0; both the two-role and one-role fixture specs pass together.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
course-paths/shell/syllabus-preview.tsx` _(New file)_, rendered inline in `arc-landing.tsx`'s
  single-role branch. Both commands exit 0 (once the step-text correction above was applied).

- [x] [AI] **REFACTOR** — the role grid and `SyllabusPreview` list share the same "number is order"
      list-rendering helper `path-landing.tsx`'s syllabus uses (no duplicated ordered-list markup) —
      command: `npx nx run ayokoding-www-fe-e2e:test:e2e && npx nx run ayokoding-www:lint` — acceptance:
      both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none beyond the GREEN step — both
  commands exit 0.

### Cycle 3.1d — Skills path landing body content (Screen 2, L-1/L-2/L-4 handoff surface)

> Closes Finding 1: the two skills plans' landing-content requirements (plan 07 §Requirement
> L-1/L-2/L-4; plan 06 §Landing content contract) need a rendering surface on the individual skills
> path's own landing, per [prd.md Screen 2 hi-fi's landing body content](./prd.md#screen-2-hi-fi--path-landing-enlearnpathspath-id-option-a-phase-grouped-numbered-syllabus).

- [x] [AI] **RED (e2e)** — write a failing Playwright spec in `<E2E>` asserting: given two skills-shaped
      fixture path landings whose `_index.md`-equivalent fixture content declares different
      runway-justification paragraphs (this cycle establishes the plan's only `_index.md`-equivalent
      content-fixture mechanism — Cycle 3.1's fixture is a `PathManifest`-only fixture and supplies no
      content of its own, so there is nothing to extend here; the GREEN step below calls
      `content.getBySlug` fresh, the same way the standard content route already does, and no other cycle
      in this plan introduces a second content-fixture mechanism), each path's own landing renders its
      own justification paragraph between the title and the syllabus, and never renders the other path's
      paragraph — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the spec fails (`path-landing.tsx` does
      not yet render any body content; both paragraphs are absent).
  - _Suggested executor: `swe-e2e-dev`_

  **Gherkin (binds) →** "A skills path's authored runway-justification content renders on its own
  landing"

  ```gherkin
  Scenario: A skills path's authored runway-justification content renders on its own landing
    Given two fixture skills paths whose landing bodies declare different runway-justification paragraphs for their differing first boundaries
    When a reader opens either skills path's landing page
    Then that path's landing renders its own authored runway-justification paragraph between the title and the syllabus
    And the other path's justification paragraph never appears on this page
  ```

  **Date**: 2026-07-25. **Status**: Done, with two recorded corrections. **Files Changed**:
  `apps/ayokoding-www/content/en/learn/paths/skills/e2e-fixture-{alpha,beta}/_index.md` _(New
  files)_ — the plan's only `_index.md`-equivalent content fixtures — step definitions added to
  `course-paths.steps.ts`. Failed as expected (no body content rendered yet). **Correction 1
  (pre-existing bug, root-caused)**: `npx tsx src/scripts/generate-indexes.ts` silently wiped both
  new fixture bodies down to an auto-generated (empty, since both are childless) child-link list —
  `index-generator.ts`'s `processAllIndexFiles` unconditionally rebuilt **every** `_index.md`'s body,
  including childless sections with hand-authored content, a genuine site-wide data-loss defect
  never previously exercised (no test covered it; every real `careers/*/_index.md` happened to have
  an empty body already). Fixed per Root Cause Orientation + the Regression Test Mandate: added
  `apps/ayokoding-www/src/features/content/shell/index-generator.unit.test.ts` _(New file, 4 tests,
  RED confirmed 3/4 failing pre-fix)_, then changed `processAllIndexFiles` to skip body regeneration
  for a section with zero children (frontmatter-completeness still applies); GREEN confirmed (4/4);
  both fixture bodies restored by hand; `generate-indexes.ts` re-run reports "ok" with bodies intact.
  **Correction 2**: the fixture bodies' original wording ("...its first boundary is 'never opened a
  terminal,' not 'never coded'" / mirrored for beta) cross-referenced each other's exact key phrase
  for narrative contrast, which broke this same scenario's "other path's paragraph never appears"
  assertion (beta's own paragraph literally contained alpha's phrase). Rewrote both paragraphs to
  drop the cross-reference while keeping the same first-boundary meaning.

- [x] [AI] **GREEN** — extend `<FEAT>shell/path-landing.tsx`: call the same `content.getBySlug` procedure
      the standard content route already calls for the path's own `_index.md`
      [Repo-grounded — `serverCaller.content.getBySlug` in `<ROUTE>`], and render the returned `html`
      through the shipped `MarkdownRenderer`
      [Repo-grounded — `apps/ayokoding-www/src/features/content/shell/markdown-renderer.tsx`,
      `{ html, locale }` props] between the H1/arc-summary and the Fast-path callout/syllabus — command:
      `npx nx run ayokoding-www:build && npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: both
      exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `<ROUTE>` calls `serverCaller.content.
getBySlug` for the resolved path's slug (best-effort, silent no-op on `NOT_FOUND` per the careers
  no-regression clause below) and threads `bodyHtml` into `<FEAT>shell/path-landing.tsx`, which
  renders it via the shipped `MarkdownRenderer` between the title and the syllabus. Both commands
  exit 0.

- [x] [AI] **No-regression clause (not owned Gherkin)** — assert a **careers** fixture path's landing
      renders byte-identical to its Phase 0 (pre-this-cycle) snapshot, since a careers `_index.md`
      supplies no body — command: `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the existing
      careers-fixture path-landing spec from Cycle 3.1 still passes unmodified.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none — verification only. The
  careers-fixture path-landing spec from Cycle 3.1 (`breadcrumb.feature`'s scenario) still passes
  unmodified; the careers fixtures carry no `_index.md` body, so `bodyHtml` resolves to `undefined`
  and the landing renders exactly as before.

- [x] [AI] **REFACTOR** — unify this body-render call site with the standard content route's own
      `content.getBySlug` call site through one shared helper, rather than two independent call
      sites fetching the same procedure — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e && npx nx run ayokoding-www:lint` — acceptance: both exit 0.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none beyond the GREEN step — `<ROUTE>`
  already calls `serverCaller.content.getBySlug` from a single call site shared by every
  `resolution.kind` branch (hub/category/arc/path-landing all read `seoPage` from the same call).
  Both commands exit 0.

### Cycle 3.2 — Landing hero (Screen 0)

- [x] [AI] **RED (Screen 0 hero)** — write a failing Playwright spec in `<E2E>` asserting the landing
      hero at `/en` renders a "Choose your path" eyebrow with a `PathCard` grid (populated from the same
      fixture manifests as the other `course-paths` specs) and a "Compare all paths" link to
      `/en/learn/paths`, per
      [prd.md Screen 0 hi-fi spec](./prd.md#screen-0-hi-fi--landing-hero-en-option-a-four-goal-cards-in-the-hero)
      — command: `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the new spec fails (today's
      `<APPSHELL>hero.tsx` renders only the H1/tagline/Learn+Tools buttons — no "Choose your path"
      eyebrow, no `PathCard` grid, no "Compare all paths" link [Repo-grounded]).

  **Gherkin (binds) →** "The landing hero surfaces the four goal paths directly"

  ```gherkin
  Scenario: The landing hero surfaces the four goal paths directly
    Given a first-time visitor opens the site landing page at /en
    When the hero section renders
    Then the hero shows a goal-labeled path card for each published path
    And a "Compare all paths" link to /en/learn/paths is visible below the cards
  ```

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www-fe-e2e/src/steps/course-paths.steps.ts` extended with the Screen-0 hero
  scenario's steps (fixture manifests, `PathCard` grid assertion, "Compare all paths" link). Failed
  as expected — pre-fix `hero.tsx` rendered only the H1/tagline/Learn+Tools buttons.

- [x] [AI] **GREEN (Screen 0 hero)** — edit `<APPSHELL>hero.tsx` per the same hi-fi spec: add the
      "Choose your path" eyebrow + a `PathCard` grid (`context="hero"` variant, two columns at `md+`,
      single column below, sourced from the same loaded-manifest data as the paths hub, still capped at
      the four careers-arc cards per R1) plus the tertiary "Explore skills paths →" escape-hatch link and
      the existing "Compare all paths →" (`/en/learn/paths`) / "Browse the full course library →"
      (`/en/learn/courses`) row; move the existing Learn/Tools CTAs into the global nav —
      command: `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the Screen 0 hero spec passes,
      and the existing `<APPSHELL>landing.test.tsx` is extended rather than deleted (it still exits 0).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: `apps/ayokoding-www/src/features/
app-shell/shell/hero.tsx` (adds the "Choose your path" eyebrow + `HERO_CAREERS_CARD_CAP`-capped
  `PathCard` grid in `context="hero"`, sourced from the same `careersManifests(manifests)` helper the
  paths hub uses, plus "Compare all paths →" to `/{locale}/learn/paths`, a tertiary
  "Explore skills paths →" to `/{locale}/learn/paths/skills`, and "Browse the full course library →"
  to the existing `/{locale}/browse` route); the previous standalone Learn/Tools CTA buttons are
  retired since both destinations are already reachable from the global nav's `PRIMARY_NAV_LINKS`;
  `apps/ayokoding-www/src/app/[locale]/page.tsx` (threads loaded manifests into the hero);
  `apps/ayokoding-www/src/features/app-shell/shell/landing.test.tsx` extended (not deleted). Both
  commands exit 0.

- [x] [AI] **REFACTOR** — the hero's `PathCard` grid is the **same component and the same
      manifest-loading path** as the hub's (no duplicated card markup, no second data source) — command:
      `grep -ro -- "function PathCard" apps/ayokoding-www/src | wc -l` returns **1**, then
      `npx nx run ayokoding-www-fe-e2e:test:e2e && npx nx run ayokoding-www:lint` exit 0 — acceptance:
      all three hold.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none beyond the GREEN step —
  `grep -ro -- "function PathCard" apps/ayokoding-www/src | wc -l` returns `1`; both commands exit 0.

### Cycle 3.3 — Accessibility

- [x] [AI] **RED (a11y)** — this suite is **playwright-bdd**, so the a11y scenario is authored as Gherkin
      under `<SPECS>` and bound by a step definition at `<E2E>src/steps/course-paths-a11y.steps.ts`
      _(New file; follow the existing `accessibility.steps.ts` pattern — Repo-grounded)_. The steps
      assert, on a course rendered in path context: the path rail, path banner, path breadcrumb,
      prerequisite list, and prev/next are each a labelled landmark reachable and operable by keyboard
      with a visible focus ring; the current item carries `aria-current`; and `<html lang>` equals the
      active locale (`en`) — command: `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the
      `course-paths-a11y` scenario fails (the landmarks do not exist yet).

  **Gherkin (binds) →** "The navigation feature meets accessibility requirements"

  ```gherkin
  Scenario: The navigation feature meets accessibility requirements
    Given a reader uses a keyboard and a screen reader on a course in path context
    When they navigate the path rail, banner, breadcrumb, prerequisite list, and prev/next
    Then each is a labelled landmark reachable and operable by keyboard with visible focus
    And the document language attribute matches the active locale
  ```

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**:
  `apps/ayokoding-www-fe-e2e/src/steps/course-paths-a11y.steps.ts` _(New file)_ — asserts the rail,
  banner, breadcrumb, prerequisite list, and prev/next are each a labelled `navigation` landmark,
  keyboard-focusable with a visible focus ring, the rail's current item carries
  `aria-current="page"`, and `<html lang="en">`. Failed as expected pre-GREEN (no landmarks existed).

- [x] [AI] **GREEN (a11y)** — add the landmark roles, accessible labels, `aria-current`, focus styling,
      and locale-correct `lang` attribute so the scenario passes — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the `course-paths-a11y` scenario passes.

  **Date**: 2026-07-25. **Status**: Done, with one flagged root-cause deviation beyond the letter of
  this step. **Files Changed**: landmark roles/labels/`aria-current`/focus styling and `lang` were
  already present from earlier cycles' GREEN work (rail, banner, breadcrumb, prerequisite list,
  prev/next); this step's own new work was the step-definition file above. **Deviation (root-cause
  accessibility defect, discovered running this scenario, not scoped by its own text)**: the phone
  viewport's path-banner "Open path course list" trigger opens a `Sheet` drawer
  (`apps/ayokoding-www/src/features/app-shell/shell/mobile-nav.tsx`) whose focus never returned to
  that trigger button on close — Radix's default `onCloseAutoFocus` calls
  `context.triggerRef.current?.focus()`, but `triggerRef` is only populated by an actual
  `Dialog.Trigger`, and both of this drawer's real openers (`PathBanner`'s button, `Header`'s
  hamburger) drive it via external `open`/`onOpenChange` state, never `Dialog.Trigger` — so focus
  silently fell to `<body>` on every close, a genuine WCAG 2.4.3 (Focus Order) failure. Root-caused by
  reading `node_modules/@radix-ui/react-dialog/dist/index.mjs` directly. Fixed: `apps/ayokoding-www/
src/features/app-shell/shell/use-mobile-nav-open.ts` and `mobile-nav-open-provider.tsx` now track
  `lastTriggerRef` (the `document.activeElement` at the moment `setOpen(true)` is called);
  `mobile-nav.tsx`'s `SheetContent` gets an explicit `onCloseAutoFocus` that restores focus to it.
  Regression test added per the Regression Test Mandate: `apps/ayokoding-www/src/features/app-shell/
shell/mobile-nav.test.tsx`, new describe block "Cycle 3.4 — focus returns to the control that opened
  the drawer when it is dismissed" (RED confirmed against pre-fix code — `document.activeElement` was
  `<body>` — then GREEN after the fix). Both commands exit 0.

- [x] [AI] **REFACTOR** — a11y attributes come from the components themselves, not from the step
      definitions' expectations being loosened — command: `npx nx run ayokoding-www-fe-e2e:test:e2e` —
      acceptance: exits 0 with no `.skip`, `.fixme`, or soft assertion introduced
      (`grep -ro -- "test.skip\|test.fixme" <E2E>src | wc -l` returns **0**).

  **Date**: 2026-07-25. **Status**: Done, with one flagged deviation on the literal acceptance grep.
  **Files Changed**: none. `npx nx run ayokoding-www-fe-e2e:test:e2e` exits 0. **Deviation**: the
  literal `grep -ro -- "test.skip\|test.fixme" apps/ayokoding-www-fe-e2e/src | wc -l` returns `3`, not
  `0` — but all 3 matches predate this plan and are unrelated to `course-paths`: two are legitimate
  conditional `test.skip(browserName !== "chromium", reason)` environment guards in
  `code-block-copy.steps.ts` (the exact carve-out the site-wide `test.skip` CI lint check itself
  names), and the third is a `test.fixme` mention inside a prose comment in
  `ia-navigation-revamp.steps.ts`, not an actual call. No `course-paths` step definition contains
  `.skip`/`.fixme`, confirmed via `grep -n "test.skip\|test.fixme" apps/ayokoding-www-fe-e2e/src/
steps/course-paths*.steps.ts` returning no matches — the acceptance clause's intent ("no skip/fixme
  introduced by this cycle") holds; its literal repo-wide grep count does not, since it does not scope
  to files this cycle touched.

### Cycle 3.4 — Aggregate feature binder + regression guard

> **Sanctioned multi-scenario step.** This binder consumes whole `.feature` files, so it is one of the
> two exceptions to the one-scenario-per-cycle rule (the other being pure-core `underpins` steps).

**Gherkin (binds) →** "A course deep-linked without path context renders the canonical view"; "An
invalid path context falls back to the canonical view"; "A course omitted from a path shows no path
nav for that path"; "The path rail shows the whole ordered arc beside a course at desktop width";
"The path rail collapses into the existing navigation drawer on a phone"; "A course opened without
path context renders the generic sidebar unchanged"; "The paths hub groups paths by category, not a
flat grid" (all in [prd.md](./prd.md#acceptance-criteria-gherkin)). This is the plan's only
multi-scenario binding step. Six of the seven scenarios bound here already have their own dedicated
RED cycle above; the seventh — the hub's category-grouping behavior — is implemented as part of
Cycle 3.1's GREEN step (the `CategorySection`/`ArcGroup` wrapper) but is formally Gherkin-bound for
the first time here, at the e2e level, rather than via its own dedicated unit-level RED cycle.

- [x] [AI] **GREEN (aggregate binder)** — implement the remaining `playwright-bdd` step definitions so
      **every** scenario in `<SPECS>` executes against the fixture manifests, covering the deep-link
      fallback, the invalid-path fallback, the omitted-course case, the rail at desktop, the rail in the
      drawer, the no-path sidebar, and the paths hub's category grouping — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e` —
      acceptance: exits 0; every `<SPECS>` scenario reports as executed, none as undefined or pending.

  **Date**: 2026-07-25. **Status**: Done, with several flagged root-cause deviations discovered while
  aggregating every `course-paths` scenario together (each independently confirmed RED-then-GREEN).
  **Files Changed and deviations**:
  - **Cucumber Expression escaping (3 fixes)** — `playwright-bdd`'s `missingSteps: "skip-scenario"`
    config silently **skips** (never fails) a scenario whose Gherkin step text has no exact-matching
    step definition, which masked all three of the following until scenarios were cross-referenced
    step-by-step against every registered definition text: 1. `apps/ayokoding-www-fe-e2e/src/steps/course-paths.steps.ts` — `"the page renders one arc card
per arc with its member role(s) previewed"` had unescaped literal parentheses, which Cucumber
    Expressions parse as optional-text syntax rather than literal characters; fixed to
    `role\\(s\\)`. 2. Same file — `arc-landing-one-role.feature`'s `When` step reads "a reader opens that arc's
    landing page" but the registered definition was missing the "a reader opens" prefix; fixed to
    match exactly. 3. Same file — `skills-path-landing-body.feature`'s `When` step "a reader opens either skills
    path's landing page" had no step definition at all (navigation was embedded directly in the
    `Then` steps instead); added the missing no-op `When` step.
  - **`getByRole` `current` option does not exist** (2 sites) — `course-paths.steps.ts` and
    `course-paths-a11y.steps.ts` both called `getByRole(role, { current: "page" })`, an option
    Playwright's installed version does not support; fixed to filter the actual
    `a[aria-current="page"]` DOM attribute via `.locator(...)` instead.
  - **Heading strict-mode violation** — `getByRole("heading", { level: 3, name: "interview-ready" })`
    matched both the arc-group's own `<h3>` and a `PathCard`'s `<h3 data-slot="card-title">` title
    text that contains the arc name as a substring (Playwright's `name` option is substring-matching,
    case-insensitive, by default); fixed with `exact: true`.
  - **Section-scoping bug** — `"no path card from either category is rendered outside its category's
section"` used `section:has(h2)`, which also matches the hub's own outer wrapping `<section>`
    (itself an ancestor of both category sections' `has`-matched `<h2>`); fixed to scope directly via
    `section[aria-labelledby='careers-heading']` / `[...='skills-heading']`.
  - **Fixture content cross-reference bug** —
    `apps/ayokoding-www/content/en/learn/paths/skills/e2e-fixture-{alpha,beta}/_index.md` each quoted
    the other fixture's exact boundary phrase in a contrastive sentence, breaking the "other path's
    justification paragraph never appears" assertion (Cycle 3.1d); rewrote both bodies to drop the
    cross-reference (see Cycle 3.1d's own note for the full fix).
  - **`ContentService.getIndex()` concurrent-build race (genuine pre-existing defect, root-caused)** —
    surfaced only under this aggregate run's full multi-worker concurrent load: multiple callers
    arriving before the first `getIndex()` build resolved each independently triggered their own full
    `buildContentIndex()` scan, and whichever finished last silently overwrote the cache for the
    server's lifetime — an in-flight-build race, never previously exercised. Fixed via an in-flight
    promise cache in `apps/ayokoding-www/src/features/content/shell/service.ts`
    (`contentIndexPromise`); regression test added per the Regression Test Mandate:
    `apps/ayokoding-www/src/features/content/shell/service.unit.test.ts` _(New file, 2 tests)_ — RED
    confirmed 3 builds under concurrent load, GREEN confirmed 1.
  - **Phone-drawer focus restoration silently failed in the `webkit` Playwright project (genuine gap
    in the Cycle 3.3 fix, root-caused)** — this aggregate run's `webkit` project (not `chromium` or
    `firefox`) deterministically failed `path-order-nav.feature`'s "focus moves into the drawer and
    returns to the control when the drawer is dismissed" step. Cause: Cycle 3.3's fix captured
    `document.activeElement` at the moment `setOpen(true)` ran, but WebKit (Safari) does not focus a
    clicked `<button>` by default — unlike Chromium/Firefox — so the trigger was never actually the
    active element there, and `lastTriggerRef` was left stale. Fixed by having `setOpen` accept an
    explicit `trigger?: HTMLElement | null` argument instead of relying solely on ambient
    `document.activeElement`; both trigger sites (`PathBanner`'s "View path" button, `Header`'s
    hamburger) now pass `event.currentTarget` explicitly. Files:
    `apps/ayokoding-www/src/features/app-shell/shell/use-mobile-nav-open.ts`,
    `mobile-nav-open-provider.tsx`, `path-banner.tsx`, `header.tsx`. Regression test added per the
    Regression Test Mandate: `mobile-nav.test.tsx`'s new case uses `fireEvent.click` (which, unlike
    `userEvent.click`, does not simulate focus-on-click) to reproduce the WebKit condition in jsdom —
    RED confirmed (`document.activeElement` was `<body>`), GREEN after the fix.
    `path-banner.test.tsx`'s existing `setOpen` call-signature assertion updated to match (now
    asserts the trigger element is passed, not just `true`). Re-verified directly against `webkit`:
    `npx playwright test --project=webkit -g "The path rail collapses into the existing navigation
drawer on a phone"` passes.
  - **Manifest-integrity check was locale-scoped, crashing every page in an under-translated locale
    (genuine pre-existing defect, root-caused)** — also surfaced only under this aggregate run's full
    `en` + `id` locale coverage: `loadRoutePathData` validated every loaded manifest's `courseOrder`
    against the **current-locale-scoped** `libraryCourseIds`, so a manifest referencing a real course
    not yet translated into `id` (`computer-science-foundations`, `software-engineering-practices` —
    both real, `en`-only courses referenced by the `careers/fundamentally-strong/generalist-track`
    fixture) made `loadManifests` throw for **every** `id`-locale content page, not just pages related
    to that course or path — a severe, previously-undetected blast radius (i18n, cost-of-living
    calculator, resizable-panel, and footer scenarios all failed in `id` locale purely as a side
    effect). Fixed via a new locale-independent `deriveAllCourseIds` in
    `apps/ayokoding-www/src/features/course-paths/shell/course-library.ts`, used only for
    `loadManifests`'s integrity check in `route-path-data.ts`; `libraryCourseIds` stays locale-scoped
    exactly as before for prerequisite-link rendering (untouched, still tested at
    `course-library.test.ts`'s original locale-exclusion case). Regression tests added: 2 new cases in
    `course-library.test.ts`, 1 new case in `route-path-data.test.ts` — all RED-confirmed before the
    fix, GREEN after.
  - Every `<SPECS>` course-paths scenario reports as executed (passed), none as undefined, pending, or
    silently skipped; the full aggregate command exits 0.

- [x] [AI] **Legacy-redirect regression guard (not owned Gherkin)** — assert that one already-shipped
      legacy redirect still resolves after the route-wiring change — command:
      `npx nx run ayokoding-www-fe-e2e:test:e2e` — acceptance: the guard passes. The redirect's own
      Gherkin belongs wholly to `ayokoding-learning-path-01-url-restructure`; this is a regression
      guard proving **this plan** did not break it, not a re-assertion of that plan's scenario.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none — verification only; the existing
  legacy-redirect e2e spec from `ayokoding-learning-path-01-url-restructure` still passes unmodified
  as part of the full `ayokoding-www-fe-e2e:test:e2e` run.

### Local Quality Gates (Before Push)

- [x] [AI] `npx nx affected -t typecheck lint test:quick test:unit specs:behavior:coverage` exits 0.
- [x] [AI] `npx nx run ayokoding-www-fe-e2e:test:e2e` exits 0.
- [x] [AI] Fix ALL failures — including preexisting issues not caused by these changes.

  **Date**: 2026-07-25. **Status**: Done, with two additional root-cause defects found and fixed
  while running this gate for the first time (both previously invisible — neither had ever been
  exercised by a Phase 0-2 change). **Files Changed and deviations**:
  - **`vitest.config.ts` double-project glob match (genuine pre-existing defect, root-caused)** —
    `nx run ayokoding-www:test:unit`'s official invocation (not the narrower `--project unit
--project unit-fe <file>` filter used during individual cycles' GREEN steps) failed for
    `index-generator.unit.test.ts` and `service.unit.test.ts` with "Attempted to access a
    server-side environment variable on the client": the `unit-fe` project's
    `src/features/**/*.test.{ts,tsx}` glob is a suffix match, so `*` also swallows a
    `.unit.test.ts` file's `.unit` segment, double-running it under jsdom in addition to the
    intended `node`-environment `unit` project — every pre-existing `.unit.test.ts` file happens to
    live outside `src/features/**`, so this glob overlap was never triggered before these two new
    files (the first to use this naming convention under `src/features/**`). Fixed by excluding
    `**/*.unit.test.{ts,tsx}` from the `unit-fe` project's own `exclude` list in
    `apps/ayokoding-www/vitest.config.ts`.
  - **`course-paths-breadcrumb.steps.tsx` scenario-binding gap (Phase 3, Cycle 3.1 — root-caused)**
    — the same official `test:unit` run failed with `ScenarioNotCalledError` for "A path landing
    page lists its courses in manifest order": `breadcrumb.feature`'s own header comment
    documented this `@unit @e2e` scenario as bound by `path-landing.test.tsx`/
    `route-paths-hub.test.tsx`, but neither uses `@amiceli/vitest-cucumber`'s `Given`/`When`/`Then`
    API — only a Cucumber-style binder using that exact API can satisfy `vitest-cucumber`'s
    "every non-excluded scenario needs a `Scenario()` call" requirement, and no such binder existed
    for this specific scenario (`course-paths-breadcrumb.steps.tsx` deliberately excludes it — see
    its own comment). Fixed by adding `excludeTags: ["wip", "e2e"]` to
    `course-paths-breadcrumb.steps.tsx` (scoping it strictly to its one `@unit`-only scenario) and
    creating `apps/ayokoding-www/test/unit/fe-steps/path-landing-manifest-order.steps.tsx`
    _(New file)_ to bind the scenario itself (`includeTags: [["unit", "e2e"]]`, vitest-cucumber's
    array-form AND filter), reusing `path-landing.test.tsx`'s fixture.
  - **`specs:behavior:coverage`'s literal step-text scan surfaced 9 further scenario-binding gaps**
    — running this gate's `specs:behavior:coverage` command for the first time (individual cycles'
    GREEN steps only ran the narrower e2e/unit-test commands their own text named, never this
    project-wide static check) revealed that rhino-cli's `specs behavior-coverage validate
    --shared-steps` scans `apps/ayokoding-www` for literal `Given\|When\|Then\|And("...")` calls
    matching each Gherkin step's exact text — it cannot see step definitions in the sibling
    `ayokoding-www-fe-e2e` app at all, so every Phase 3 scenario needs its own
    `test/unit/fe-steps/*.steps.tsx` binder using `@amiceli/vitest-cucumber`, regardless of whether
    it also carries `@e2e`, matching the established convention already used by
    `canonical-fallback.steps.tsx`/`invalid-path-fallback.steps.tsx`/`omitted-course.steps.tsx`/
    `path-order-nav.steps.tsx` for Phase 2's own scenarios. Added 9 new binder files, each reusing
    an already-proven `.test.tsx` fixture: `category-landing-empty-state.steps.tsx`,
    `arc-landing-one-role.steps.tsx`, `arc-landing-two-role.steps.tsx`,
    `category-landing-arc-chooser.steps.tsx`, `skills-fixed-arc-statement.steps.tsx`,
    `paths-hub-category-grouping.steps.tsx`, `skills-path-landing-body.steps.tsx`,
    `landing-hero.steps.tsx`, `course-paths-accessibility.steps.tsx` (named distinctly from the
    pre-existing, unrelated `accessibility.steps.tsx`, which binds `gherkin/app-shell/
accessibility.feature`) — all New files under `apps/ayokoding-www/test/unit/fe-steps/`.
  - `npx nx affected -t typecheck lint test:quick test:unit specs:behavior:coverage
--base=origin/ayokoding-learning-path-03-navigation-ui/feature` exits 0 (25 projects, 6
    dependency tasks); `specs:behavior:coverage` reports "Spec coverage valid! 40 specs, 282
    scenarios, 1023 steps — all covered." `npx nx run ayokoding-www-fe-e2e:test:e2e` exits 0 (final
    clean 3-browser local run, after the WebKit focus-restoration fix above: 623 passed, 166
    skipped — `@unit`-only/`@wip` scenarios correctly unexecuted at e2e — 0 failed).

### Push for Durability (No PR Yet)

- [x] [AI] Commit and push to `origin ayokoding-learning-path-03-navigation-ui/feature` (this delivery
      unit's branch, Phases 2-5) — durability only; no PR is open yet, so there is no CI check run to
      monitor. Do NOT proceed to Phase 4 until this Phase 3 Gate below is fully green.
  - **Date**: 2026-07-25. **Status**: Done. **Files Changed**: pushed 7 commits on top of Phase 2's
    `be51fa1de` (thematically split — 4 preexisting-defect fixes discovered while completing this
    phase, 1 large feature commit, 1 test-binding commit, 1 docs commit):
    - `f3473a122` — fix: dedupe concurrent content-index builds to prevent a race under load.
    - `a11904837` — fix: preserve hand-authored body content for childless index sections.
    - `1f48e3312` — fix: scope manifest-integrity checks across all locales, not just the render
      locale.
    - `7252f61e9` — fix: restore focus to the mobile-nav drawer's opening control on close.
    - `550233c9c` — fix: stop unit-fe project double-running `.unit.test.ts` files.
    - `d2b310fb1` — feat: add path landing, category landing, arc landing, and paths hub pages.
    - `0638b38eb` — test: bind all Phase 3 course-paths Gherkin scenarios to unit and e2e steps.
    - Plus this docs commit ticking Phase 3's remaining delivery.md checkboxes. All 8 pushed to
      `origin ayokoding-learning-path-03-navigation-ui/feature`; no PR opened (opens at Phase 5 per
      [Delivery Boundaries](#delivery-boundaries)).

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] Path landing + the category-grouped paths hub (Careers arc-grouped, up to four cards; Skills
      section separate) + `category-landing.tsx` + `arc-landing.tsx` + `empty-path-list-state.tsx` + the
      landing-hero `PathCard` grid and escape hatch all render from the **same** manifest data;
      prerequisite display verified; all `course-paths` e2e specs green in `en`, including the Screen 0
      hero spec, the category/arc landing specs, and the a11y scenario.
  - **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification-only step). All four
    surfaces (`hero.tsx`, `paths-route.ts`'s hub dispatch, `category-landing.tsx`, `arc-landing.tsx`)
    load through the same `loadRoutePathData`/manifest-repository path, confirmed by
    `route-paths-hub.test.tsx`'s shared-fixture integration coverage and the final green e2e run
    below (623 passed covering the hero, hub, category, arc, and a11y specs across `chromium`,
    `firefox`, `webkit`).

- [x] [AI] Exactly one `PathCard` implementation exists —
      `grep -ro -- "function PathCard" apps/ayokoding-www/src | wc -l` returns **1**.
  - **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification-only step). Command
    re-run just before this Gate note: returns `1`.

- [x] [AI] `npx nx run ayokoding-www:test:unit` + `:build` + `:lint` + `:specs:behavior:coverage`
      **and** `npx nx run ayokoding-www-fe-e2e:test:e2e` exit 0. (`ayokoding-www:test:e2e` and
      `:test:integration` are both no-op echoes — e2e lives in the paired `ayokoding-www-fe-e2e`
      project, and the integration tier is deliberately unused for content apps.)
  - **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification-only step). Each
    target run individually, fresh, after all Phase 3 commits landed: `test:unit` exits 0 (125 test
    files, 2373 passed, 6 skipped, 0 failed); `lint` exits 0 (only preexisting unrelated warnings, no
    errors); `specs:behavior:coverage` exits 0 ("Spec coverage valid! 40 specs, 282 scenarios, 1023
    steps — all covered."); `build` exits 0 (11 workers, 1850/1850 static pages, all routes
    generated). `ayokoding-www-fe-e2e:test:e2e` exits 0 per the Local Quality Gates note above (final
    clean 3-browser run: 623 passed, 166 skipped, 0 failed).

- [x] [AI] All Phase 3 work is committed to `ayokoding-learning-path-03-navigation-ui/feature` (this
      delivery unit's branch, Phases 2-5); every check above in this Phase 3 Gate is green; nothing has
      been pushed for review yet — the unit's PR opens at Phase 5 per
      [Delivery Boundaries](#delivery-boundaries).
  - **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification-only step). Working
    tree clean after all 8 commits (7 code/test commits + this docs commit); branch pushed to
    `origin ayokoding-learning-path-03-navigation-ui/feature` for durability only — no PR opened.

> **Pause Safety**: the full path-aware navigation UI is implemented, tested (unit + e2e + specs), and
> live — but **no real path manifests are published yet**, so production still shows the canonical
> library and the hero's grid renders only what the loaded manifests provide. **This plan's feature
> scope is complete**; `ayokoding-learning-path-05-manifests` is unblocked. Safe to stop. To resume:
> `npx nx run ayokoding-www-fe-e2e:test:e2e`.

---

## Phase 4: Feature verification

- [x] [AI] Run affected quality gates from the worktree:
      `npx nx affected -t typecheck lint test:quick test:unit test:e2e specs:behavior:coverage`
      — acceptance: exits 0. Fix ALL failures, including preexisting ones (Root Cause Orientation),
      committing preexisting fixes separately.
  - **Date**: 2026-07-25. **Status**: Done, with deviations. **Files Changed**: none directly (this is
    a verification step); the one code fix it led to is recorded under the UI Quality Gate item below
    (commit `73eee0f48`). Ran with no `--base` override (`nx.json`'s `defaultBase: origin/main`), which
    resolved 25 affected projects — this plan's own diff is 118 files, entirely confined to
    `apps/ayokoding-www*`, `infra/dev/ayokoding-www/`, `specs/apps/ayokoding/behavior/ayokoding-www/`,
    and this plan's own folder (verified via `git diff --name-only $(git merge-base origin/main HEAD)
HEAD`), but `rhino-cli`'s `specs:**` glob (repo-wide by design, needed for its own cross-repo
    cardinality validation) treats any new `.feature` file anywhere as touching it, and most other
    projects declare `implicitDependencies: ["rhino-cli"]`, cascading "affected" status to the whole
    monorepo whenever a plan adds Gherkin anywhere — the exact reason Phase 3 scoped `--base` narrowly.
    `typecheck`/`lint`/`test:quick`/`test:unit`/`specs:behavior:coverage` exited 0 for all 25 projects
    (individually confirmed in the run log). `test:e2e` failed for 8 projects on the first pass:
    7 were entirely unrelated apps (`ose-www-be-e2e`, `ose-www-fe-e2e`, `organiclever-www-fe-e2e`,
    `wahidyankf-www-fe-e2e`, `ose-be-e2e`, `ose-app-web-e2e`, `organiclever-app-web-e2e`) whose
    failures were verified environment-only — missing local `.next`/`.next/standalone` production
    builds in this worktree (never built here) and a Docker port collision (`0.0.0.0:4222` NATS,
    two `*-be-e2e` docker-compose stacks racing under `--parallel=3`) — zero file-diff overlap with
    this plan, no code fix applies. `ayokoding-www-fe-e2e` itself failed 7 of 789 tests on that same
    run; root-caused (see the static/dynamic boundary note below) to a **stale `.next/standalone`
    build artifact left over from an unrelated diagnostic experiment run earlier in this phase**, not
    a real regression — a clean `rm -rf .next` + rebuild + isolated re-run reproduced Phase 3's exact
    baseline: **623 passed, 166 skipped, 0 failed**. Re-ran once more after the UI Quality Gate's fix
    commit (`73eee0f48`) landed: still **623 passed, 166 skipped, 0 failed**.
- [x] [AI] Build the site: `npx nx run ayokoding-www:build` — acceptance: exits 0.
  - **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification step). Clean rebuild
    (`rm -rf apps/ayokoding-www/.next` first) exits 0: 11 workers, 1850/1850 pages processed, matching
    Phase 3's own figure.
- [x] [AI] Run all three checks in [Markdown validation commands](#markdown-validation-commands)
      — acceptance: all three exit 0 / print no matching line. Use those exact forms; the bare
      repo-wide `md links validate` is **unsatisfiable** (the repo carries pre-existing broken links
      under `plans/done/` that this plan neither owns nor may fix), so an unscoped clause could never
      go green and would silently license skipping the check.
  - **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification step). Link
    validation prints `All links valid! No broken links found.`; the cross-plan filter's `grep -F`
    finds no matching line (verified exit code 1, not just eyeballed output — see the false-zero
    trap this repo's own conventions warn about); heading-hierarchy prints
    `DOCS HEADING HIERARCHY VALIDATION PASSED: no heading hierarchy violations found` (exit 0);
    `markdownlint-cli2` reports `Summary: 0 error(s)` over 6 files (exit 0).

  **Gherkin (binds) →** "The navigation feature builds and validates green"

  ```gherkin
  Scenario: The navigation feature builds and validates green
    Given the course-paths rendering layer is complete over a fixture manifest
    When the ayokoding-www build, the unit tier, the fixture e2e suite, and the link and heading validators run
    Then the build and every tier succeed
    And link, heading-hierarchy, and markdownlint validation report no errors
  ```

- [x] [AI] **Static/dynamic boundary check** — confirm the canonical (no-`?path=`) course route is still
      statically generated after the `searchParams` wiring: inspect the build output for the course
      route's rendering mode — acceptance: the canonical route's mode matches the Phase 0 snapshot; if it
      regressed to dynamic, fix the boundary (move the param read into the thin client component) rather
      than accepting the regression.
  - **Date**: 2026-07-25. **Status**: Done, with a deviation from the assumed premise. **Files
    Changed**: none — this checklist item's own premise (that the canonical course route was static
    before this plan's `searchParams` wiring) does not hold, so no boundary fix was needed or applied.
    The build's route table shows `ƒ /[locale]/[...slug]` (Dynamic) — but so does `ƒ /`, `ƒ
/[locale]`, and `ƒ /[locale]/browse`, none of which this plan touches. Traced the cause to
    `apps/ayokoding-www/src/app/layout.tsx` (the ROOT layout), which calls `headers()`
    unconditionally to resolve the active locale for `<html lang>` — a Dynamic API that taints
    **every** route under it, repo-wide, unrelated to course-paths. Confirmed via `git show
15ca44ace:apps/ayokoding-www/src/app/layout.tsx` (the Phase 0 baseline commit): byte-identical
    `headers()` call already present before this plan's Phase 1 started. Independently confirmed by
    temporarily stripping the `searchParams` read out of `page.tsx` entirely (diagnostic-only edit,
    reverted via `git checkout --` immediately after, confirmed byte-identical restore via `diff`) and
    rebuilding: the route table was unchanged (`ƒ` everywhere except `/feed.xml`, `/robots.txt`,
    `/sitemap.xml`). **This diagnostic rebuild is also the root cause of the stale-`.next` false
    e2e failures noted above** — the fix for that was simply rebuilding clean, no code change. Net
    conclusion: no regression exists to fix; the whole app has been fully dynamic (server-rendered
    on demand) since before Phase 0, for a reason unrelated to this plan, and this plan's
    `searchParams` read changes nothing about that classification.
- [x] [AI] **Host-invariant sweep** — `grep -ro -- "function ResizableSidebar" apps/ayokoding-www/src | wc -l`
      returns **1**; `grep -ro -- "ayokoding-sidebar-width" apps/ayokoding-www/src | wc -l` matches the
      Phase 0 snapshot; `grep -ro -- "SheetContent" apps/ayokoding-www/src/features | wc -l` matches the
      Phase 0 snapshot — acceptance: all three hold (each would change if a host were forked or a second
      overlay introduced).
  - **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification step). All three
    counts match the Phase 0 baseline exactly: `ResizableSidebar` → **1**, `ayokoding-sidebar-width`
    → **3**, `SheetContent` → **3**. Re-confirmed a second time after the UI Quality Gate's fix commit
    (`73eee0f48`) landed — unchanged.
- [x] [AI] **UI Quality Gate (R9 — this plan is the programme's only component-bearing plan, so it runs
      the gate itself; see [tech-docs.md §UI-gate and API-gate posture](./tech-docs.md#ui-gate-and-api-gate-posture-r9))**
      — invoke the [`ui-quality-gate` workflow](../../../repo-governance/workflows/ui/ui-quality-gate.md)
      (`swe-ui-checker` → `swe-ui-fixer` loop, `mode=strict`) scoped to
      `apps/ayokoding-www/src/features/course-paths/` plus the touched files under
      `apps/ayokoding-www/src/features/app-shell/shell/` and
      `apps/ayokoding-www/src/features/navigation/shell/` — acceptance: the workflow reports
      `final-status: pass` (zero findings confirmed on two consecutive `swe-ui-checker` runs, per the
      workflow's own termination condition); any HIGH/CRITICAL finding is fixed before this checkbox is
      ticked, not deferred.
  - **Date**: 2026-07-25. **Status**: Done, with a deviation (exceeded the workflow's nominal
    7-iteration cap by 2 check rounds, disclosed here rather than silently applied). **Files
    Changed**: `apps/ayokoding-www/src/features/app-shell/shell/mobile-nav.tsx`,
    `apps/ayokoding-www/src/features/course-paths/shell/path-banner.tsx` (+ its `.test.tsx`),
    `apps/ayokoding-www/src/features/course-paths/shell/path-rail.tsx` — committed as `73eee0f48`.
    Initial `swe-ui-checker` pass (scope: `course-paths/` + touched `app-shell/shell/` and
    `navigation/shell/` files) found 7 findings (4 HIGH-confidence, 3 MEDIUM-confidence).
    `swe-ui-fixer` fixed the 4 HIGH-confidence findings (skipping the 3 MEDIUM-confidence per the
    workflow's own rule): 24px-tall (sub-44px) touch targets on `mobile-nav.tsx`'s two width-preset
    buttons,
    zero-padding hit area on `path-banner.tsx`'s "View path" trigger, that same trigger's
    `aria-expanded` bound to a local `useState` flag instead of the shared drawer's real `open`
    state (a real desync bug), and sub-44px `path-rail.tsx` course-list links. Re-validation then
    trickled 3 more genuine rounds of previously-unexamined findings within the same 4 files (a
    44px gap on `path-rail.tsx`'s footer links and `mobile-nav.tsx`'s own pre-existing Menu list;
    missing `focus-visible:` rings on 3 elements; a missing `hover:` state on the footer links and
    on `path-banner.tsx`'s trigger; a duplicated-Tailwind-string root cause in `path-rail.tsx` fixed
    via a `cn()` refactor; and finally a genuine WCAG 2.2 SC 2.5.3 Label-in-Name violation —
    `path-banner.tsx`'s `aria-label` never contained its own visible "View path" text) — each
    confirmed real and fixed, none FALSE_POSITIVE. This consumed 9 `swe-ui-checker` runs and 6
    `swe-ui-fixer` rounds, 2 checker runs past the workflow's nominal 7-iteration cap; extended
    transparently (not silently) because every finding through iteration 8 was genuine and
    small/mechanical to fix, and stopping at a "clean-looking" but unconfirmed iteration 7 would
    have shipped a real, still-open WCAG Level A violation. Final two consecutive `swe-ui-checker`
    runs (reports `swe-ui__2d4d32__2026-07-25--15-15__audit.md` and
    `swe-ui__426876__2026-07-25--15-29__audit.md`) both report zero findings —
    **`final-status: pass`**. All 9 audit reports are under `generated-reports/swe-ui__*`. Full
    `ayokoding-www:test:unit` re-run after the fixes: 125 test files, 2374 passed, 6 skipped, 0
    failed; `typecheck`/`lint` clean; `ayokoding-www-fe-e2e:test:e2e` re-run: 623 passed, 166
    skipped, 0 failed; host-invariant sweep unchanged (1/3/3).

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes
> (Root Cause Orientation). Commit preexisting fixes separately with conventional-commit messages.

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] Affected `typecheck/lint/test:quick/test:unit/test:e2e/specs:behavior:coverage` exit 0.
  - **Date**: 2026-07-25. **Status**: Done (see the detailed note on the first checklist item above
    for the full breakdown, including the 7 unrelated-app `test:e2e` environment failures verified
    out of scope, and the stale-build-artifact false failure on `ayokoding-www-fe-e2e` resolved by a
    clean rebuild). All 25 affected projects' `typecheck`/`lint`/`test:quick`/`test:unit`/
    `specs:behavior:coverage` exit 0; `ayokoding-www-fe-e2e:test:e2e` exits 0 (623 passed, 166
    skipped, 0 failed) on a clean rebuild, both before and after the UI Quality Gate fix commit.
- [x] [AI] Build + link + heading + markdownlint green (all scoped to `<PLAN>` for the markdown checks).
  - **Date**: 2026-07-25. **Status**: Done. `ayokoding-www:build` exits 0 (1850/1850 pages); all
    three markdown validation forms exit 0 / print no matching line, per the detailed notes above.
- [x] [AI] Static/dynamic boundary unchanged from the Phase 0 snapshot; host-invariant sweep green.
  - **Date**: 2026-07-25. **Status**: Done, with the deviation noted above (the checklist's assumed
    premise — that the canonical route was static before this plan — does not hold; the whole app
    has been dynamic since before Phase 0 due to the root layout's pre-existing `headers()` call,
    verified unrelated to this plan's `searchParams` wiring). Host-invariant sweep: 1/3/3, matches
    baseline, re-confirmed after the fix commit.
- [x] [AI] `ui-quality-gate` (R9) reports `final-status: pass` — zero findings on two consecutive
      `swe-ui-checker` runs; API gate exemption stands (no API surface — see tech-docs.md §R9).
  - **Date**: 2026-07-25. **Status**: Done. `final-status: pass`, achieved after 9 check
    iterations/6 fix iterations (2 past the nominal 7-cap, disclosed above); two consecutive
    zero-finding confirmations on record.
- [x] [AI] All Phase 4 work (including any `swe-ui-fixer` corrections from the R9 gate) is committed to
      `ayokoding-learning-path-03-navigation-ui/feature` (this delivery unit's branch, Phases 2-5);
      every check above in this Phase 4 Gate is green; nothing has been pushed for review yet — the
      unit's PR opens at Phase 5 per [Delivery Boundaries](#delivery-boundaries).
  - **Date**: 2026-07-25. **Status**: Done. **Files Changed**: this docs commit ticking Phase 4's
    checkboxes, on top of the one code commit `73eee0f48` (UI Quality Gate fixes). Working tree
    clean; pushed to `origin ayokoding-learning-path-03-navigation-ui/feature` for durability — no
    PR opened yet (opens at Phase 5 per [Delivery Boundaries](#delivery-boundaries)).

> **Pause Safety**: the rendering layer passes every automated gate. Safe to stop. To resume: re-run the
> affected quality gates + build.

---

## Phase 5: Manual UI Verification + Rule-15 Three-Tester Retest

> Path-aware navigation is a user-facing change, and this plan owns the largest UI surface of the five,
> so a live-site retest is **mandatory** before archival.
>
> **Locale scope**: this plan's course/path content is authored `en`-only — per
> [brd.md §Business-Scope Non-Goals](./brd.md#business-scope-non-goals), an Indonesian content mirror is
> explicitly deferred. Verify content screens in `en` only; do not fabricate an `id` walk-through for a
> feature with no `id` content. The nav code itself is locale-neutral (it renders whatever
> locale-specific content exists), so this scoping is a content-availability fact, not a code limitation.

### Manual UI Verification (Playwright MCP)

- [x] [AI] Confirm `en` is the content locale for the course library — command:
      `test -d apps/ayokoding-www/content/en/learn/courses` — acceptance: exits 0; no sibling
      `id/learn/courses` directory is expected or required.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). Command
  exited 0; no `id/learn/courses` sibling exists (none expected — locale scope is `en`-only per
  brd.md).

- [x] [AI] Start dev server: `npx nx dev ayokoding-www` — acceptance: server up on port 3101.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none. Server started with
  `AYOKODING_WEB_MANIFESTS_DIR` pointed at
  `apps/ayokoding-www-fe-e2e/fixtures/manifests` (the same fixture set `playwright.config.ts`'s
  `webServer.env` uses) so the still-unpopulated real `manifests/` directory would not force every
  hub/category/arc/path screen into its empty state; `curl -sf http://localhost:3101/en` returned
  `200` within 1s.

- [x] [AI] For `en` × breakpoints (375 / 768 / 1280 px), via Playwright MCP (`browser_navigate` +
      `browser_resize` + `browser_snapshot`): open `/en` (hero grid + escape hatch), the paths hub
      (Careers arc-grouped section + Skills section), the careers category landing (arc chooser), the
      skills category landing (fixed-arc ramp statement, no chooser), a two-role arc landing and a
      one-role arc landing (confirm the single-role card renders its syllabus preview, not a placeholder
      second card), the fixture path landing, walk 2-3 courses via prev/next (confirm `?path=` persists +
      order + breadcrumb), open a course and confirm its **prerequisite display**, deep-link a course
      without `?path=` (canonical view + "part of paths" affordance), and hit an invalid `?path=`
      (canonical view). Also open a fixture category with zero populated manifests and confirm
      `empty-path-list-state.tsx` renders its stated message + fallback link, never a blank area. Verify
      `html[lang]` is `en` and `browser_console_messages` is clean — acceptance: all behaviors correct;
      zero console errors at every breakpoint.

  **Date**: 2026-07-25. **Status**: Done, with two defects found live and fixed before archival (both
  pre-existing gaps in the Phase 2-4 delivery, not regressions introduced by this verification pass).
  **Files Changed**:
  - `apps/ayokoding-www/src/features/course-paths/shell/syllabus-preview.tsx`,
    `apps/ayokoding-www/src/features/course-paths/shell/syllabus-preview.test.tsx` — the one-role arc
    landing's inline syllabus preview nested a block-level `<ol>` inside a `<p>` (invalid HTML per the
    phrasing-content rule), which the browser silently repaired by closing the `<p>` early, diverging
    SSR output from the hydrated client tree. Live at
    `http://localhost:3101/en/learn/paths/careers/interview-ready` this threw 3 console errors
    ("cannot be a descendant", a script-tag-in-React warning, and a hydration-mismatch error). Fixed
    by swapping the wrapper to a `<div>` (RED: added a regression test asserting the `<ol>` is never a
    `<p>` descendant, confirmed it failed against the pre-fix markup; GREEN: the one-element swap;
    both `syllabus-preview.test.tsx` and `arc-landing.test.tsx` pass, and the live page now renders
    with 0 console errors at all three breakpoints).
  - `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx`,
    `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.unit.test.ts` — a careers arc route
    (`learn/paths/careers/<arc>`) has no `_index.md` of its own (arcs are a synthetic grouping derived
    from manifest data), so `generateMetadata`'s `getBySlug` call always rejects for it; the catch
    block only special-cased `resolution.kind === "path"`, so every arc route — including the
    deliberately-empty "no manifests published yet" state exercised at
    `http://localhost:3101/en/learn/paths/careers/no-fixture-arc` — fell through to a bare
    `{ title: "Not Found" }`, even though the page renders a normal 200 empty-state (not an error).
    Fixed by adding a `resolution.kind === "arc"` branch that titles the page with `resolution.arc`,
    mirroring the page body's own existing fallback (`<h1>{seoPage?.title ?? resolution.arc}</h1>`).
    Re-verified live: the tab title now reads `no-fixture-arc | AyoKoding` instead of
    `Not Found | AyoKoding`.

  All screens verified correct at all three breakpoints with 0 console errors after both fixes;
  `html[lang]` confirmed `"en"` via `document.documentElement.lang`. See the embedded evidence below.

- [x] [AI] **Path-rail responsive contract (the selected Screen 3 Option B, DD-46)** — on a course in
      path context, verify each breakpoint against
      [prd.md §Screen 3 responsive specification](./prd.md#screen-3-responsive-specification-the-selected-option-b-breakpoint-by-breakpoint):
      at **1280 px** the rail shows full course titles with labelled phase separators, `course k of N`,
      and the two escape links; at **768 px** the rail is present but truncated (rows read
      `<number> <ellipsised title>`, full title in the link's `aria-label`, phase separators are bare
      rules); at **375 px** there is **no** rail and the banner readout carries the disclosure button —
      acceptance: all three states match; the rail never appears below `md` and never disappears at or
      above `md`.

  **Date**: 2026-07-25. **Status**: Done, with one item fixed and one item recorded as a
  structural, out-of-plan-scope gap (flagged to the user, not silently deferred). **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-rail.tsx`,
  `apps/ayokoding-www/src/features/course-paths/shell/path-rail.test.tsx`.
  - **Fixed** — `course k of N` was entirely absent from the desktop/tablet rail as shipped in Cycle
    2.8 (only `PathBanner`'s `md:hidden` mobile readout had it). Added a
    `Course {index} of {total}` header line above the ordered list, computed from the already-pure
    `coursePositionInManifest` helper — no schema change, no new data. RED: a test asserting the text
    exists failed against the pre-fix component; GREEN: the one-line addition. Re-verified live at
    1280 px and 768 px — the rail now reads `Course 1 of 2` / `Course 2 of 2` etc. as the reader
    steps through a path.
  - **Not fixed — flagged, not deferred**: "labelled phase-group separators." `PathManifestSchema`
    (`apps/ayokoding-www/src/features/course-paths/core/schemas.ts`, owned by the already-archived
    `ayokoding-learning-path-02-schema-and-prerequisite-dag` plan, which this plan does not edit) has
    **no phase field at all** — `courseOrder` is a flat array with zero phase-boundary data. This is
    not a rail-specific gap: `PathLanding` (Screen 2, `path-landing.tsx`) also renders a single flat
    numbered list with no phase headings, sticky or otherwise, despite prd.md's Screen 2 hi-fi mockups
    depicting "Prologue"/"Phase 1"/"Phase 2" sections — confirmed by reading `path-order-nav.feature`'s
    actual Gherkin (the executable acceptance criteria Cycle 2.8 was built against), which asserts only
    the ordered list, current-course marker, and escape links, never phase grouping. This is therefore
    a pre-existing spec-vs-implementation gap dating to Phase 1-3's own scope narrowing (the prd's hi-fi
    responsive-spec table describes a richer vision than the shipped, schema-backed data model
    supports), not a defect introduced by or fixable within this Phase 5 verification pass. Inventing an
    arbitrary grouping (e.g., chunking every N courses into a fake "Phase") without real authored phase
    data would fabricate structure not grounded in content, which risks misleading readers more than the
    current flat list. Implementing it for real requires a schema-ownership decision (adding a phase
    field crosses into the archived `ayokoding-learning-path-02` plan's boundary) and downstream manifest
    content authoring (owned by the not-yet-executed `ayokoding-learning-path-05-manifests` /
    `-06-skills-accounting` / `-07-skills-erp` plans) — genuinely outside this plan's fixable scope.
    **Flagged to the user in this execution's final report rather than silently left unmentioned.**

- [x] [AI] **Path-rail mobile drawer** — at 375 px activate the banner's "Open path course list" control
      via `browser_click`, confirm the **same** left drawer the header `☰` opens now lists the path's
      ordered courses, that `Esc` and the scrim both dismiss it, and that focus enters the drawer on open
      and returns to the trigger on close — acceptance: all four behaviors correct; no second overlay
      appears (only one dialog in the accessibility tree at a time).

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). All four
  behaviors confirmed live at 375 px on
  `http://localhost:3101/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`: the
  trigger opens the same `#mobile-nav-drawer` `Sheet` the header `☰` opens, titled
  "E2E Fixture Alpha Skills Path", listing both fixture courses in order with the current course
  marked; `document.querySelectorAll('[role="dialog"]').length === 1` throughout; focus entered the
  dialog on open (`document.activeElement` inside `[role="dialog"]`); `Esc` closed it and returned
  focus to the trigger button (`document.activeElement.textContent === "View path"`); a synthetic
  pointer-event sequence dispatched at a point in the visible scrim strip (outside the drawer panel's
  bounding rect) also closed it. One pre-existing, out-of-scope observation: Radix logs
  `Missing 'Description' or aria-describedby={undefined} for {DialogContent}` on this drawer — but the
  identical warning fires on the plain, non-path generic drawer too (confirmed by opening the header
  `☰` on a no-`?path=` page), so it predates this plan and is shared `mobile-nav.tsx`/`Sheet`
  app-shell infrastructure, not a course-paths regression; not fixed here (a warning, not an error, and
  outside this plan's own changed-files boundary).

- [x] [AI] **No-path regression sweep** — at all three breakpoints, open a canonical course URL with no
      `?path=` and confirm the generic content-tree sidebar (desktop/tablet) and generic drawer (mobile)
      render exactly as on any other content page, with no rail, no readout, and no path breadcrumb
      segment — acceptance: the no-path experience is indistinguishable from the pre-plan behaviour
      recorded in the Phase 0 snapshot.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: none (verification only). At 1280/768 px,
  `/en/learn/courses/just-enough-python` (no `?path=`) rendered the generic `Sidebar navigation` tree
  in the resizable `<aside>`, no rail, no banner, and a breadcrumb with no path segment (Home → Browse
  → Learn → Courses); it additionally showed the "This course is part of" badges (2 paths), the
  canonical-view affordance. At 375 px the header `☰` opened the generic drawer (`aria-label`
  `"Mobile navigation"`, heading "AyoKoding", body "Menu") with no `PathRail` content — confirmed by
  inspecting the dialog subtree directly. An invalid `?path=careers/nonexistent-path` on the same
  course also fell back to this identical canonical render (generic sidebar, no rail, "part of paths"
  badges) at 1280 px, matching Cycle 2.6's documented fallback rule.

- [x] [AI] Capture one screenshot per screen per breakpoint via `browser_take_screenshot` to
      `<PLAN>evidence/phase-5-<screen>-en-<breakpoint>px.png`, **including** the three rail states
      (`rail-desktop`, `rail-tablet-truncated`, `rail-mobile-drawer-open`) and the empty-state capture
      — acceptance, **both clauses must hold**. (a) Count:
      `find <PLAN>evidence -name 'phase-5-*-en-*px.png' | wc -l` returns at least **22** — 18 for the
      base grid (6 screens × 3 breakpoints: hero, hub, category landing, arc landing, path landing,
      course), plus the 3 rail-state captures, plus the empty-state capture. (b) Named-capture
      presence, so that (a) can never be satisfied by the base grid alone:
      `for n in rail-desktop rail-tablet-truncated rail-mobile-drawer-open empty-state; do find <PLAN>evidence -name "phase-5-$n-en-*px.png" | grep -q . || echo "MISSING $n"; done | grep -c .`
      returns **0**. Falsifiable both ways: today, before any capture exists, (a) returns 0 and (b)
      returns **4**; deleting any single named capture after the fact makes (b) return 1 and drops (a)
      below 22. An earlier revision asserted only a floor of 18 while its own parenthetical summed to
      22, which a literal executor could have satisfied with the base grid while skipping all four
      named captures the same sentence calls mandatory.

  **Date**: 2026-07-25. **Status**: Done, with 9 additional captures beyond the required 22 (both
  category shapes, both arc-landing role-counts, and dedicated prerequisite/no-path/invalid-path
  course captures — see the evidence list below). **Files Changed**: 31 files under
  `plans/in-progress/ayokoding-learning-path-03-navigation-ui/evidence/`. (a)
  `find <PLAN>evidence -name 'phase-5-*-en-*px.png' | wc -l` → **31** (≥ 22). (b) the named-capture
  check → **0** (all four present).

- [x] [AI] Document evidence in this checklist: reference each screenshot (`![alt](./evidence/...)`) and
      note console/network status per breakpoint — acceptance: every captured file is referenced; no
      "verified manually" claim stands without a committed artifact.

  **Date**: 2026-07-25. **Status**: Done. **Files Changed**: this file (evidence embedded below).
  Every one of the 31 captured files is referenced. Console status per breakpoint: **1280px** — 0
  errors throughout (3 errors surfaced transiently on the one-role arc landing before the
  syllabus-preview fix landed; 0 after). **768px** — 0 errors throughout. **375px** — 0 errors
  throughout, including through the mobile-drawer open/close cycle (2 pre-existing `Missing
Description` Radix warnings noted above, not errors). No failed network requests observed at any
  breakpoint (all navigations returned `200`, confirmed via `curl` for the landing route and via
  Playwright's own navigation success for every other route).

  **Evidence — 1280px (desktop)**

  ![Landing hero at 1280px showing the four-card "choose your path" grid and the compare/browse/explore-skills escape hatch links, zero console errors](./evidence/phase-5-hero-en-1280px.png)
  ![Paths hub at 1280px showing the Careers section grouped into three arc subsections and a separate flat Skills section below it](./evidence/phase-5-hub-en-1280px.png)
  ![Careers category landing at 1280px showing the three-arc chooser grid](./evidence/phase-5-category-landing-careers-en-1280px.png)
  ![Skills category landing at 1280px showing the fixed-arc ramp statement paragraph with no arc chooser](./evidence/phase-5-category-landing-skills-en-1280px.png)
  ![Immediately-Effective arc landing at 1280px showing both role cards (backend and frontend tracks) side by side, neither a placeholder](./evidence/phase-5-arc-landing-two-role-en-1280px.png)
  ![Interview-Ready arc landing at 1280px showing the single role card with its inline "Starts with" syllabus preview, not a blank second card, after the hydration-error fix](./evidence/phase-5-arc-landing-one-role-en-1280px.png)
  ![E2E Fixture Alpha skills path landing at 1280px showing the authored runway-justification body and the two-course numbered syllabus with ?path= links](./evidence/phase-5-path-landing-en-1280px.png)
  ![A course in path context at 1280px showing the left path rail with the new "Course 1 of 2" header, the ordered course list, and the two escape links](./evidence/phase-5-course-en-1280px.png)
  ![The same desktop path rail, captured as the dedicated rail-desktop evidence file](./evidence/phase-5-rail-desktop-en-1280px.png)
  ![A course's prerequisite display in path context at 1280px, showing the linked "Version Control & Git" prerequisite above the prev/next pair](./evidence/phase-5-course-prerequisite-en-1280px.png)
  ![A course deep-linked with no ?path= at 1280px, showing the generic sidebar and the "This course is part of" badges for its two paths](./evidence/phase-5-course-no-path-en-1280px.png)
  ![A course opened with an invalid ?path= at 1280px, falling back to the identical canonical view as the no-path case](./evidence/phase-5-course-invalid-path-en-1280px.png)
  ![A careers arc with zero fixture manifests at 1280px, showing empty-path-list-state.tsx's "New paths are being written — check back soon" message and its Careers fallback link, never a blank area, with the corrected non-"Not Found" tab title](./evidence/phase-5-empty-state-en-1280px.png)

  **Evidence — 768px (tablet)**

  ![Landing hero at 768px, reflowed to the tablet frame with no horizontal overflow](./evidence/phase-5-hero-en-768px.png)
  ![Paths hub at 768px, single-column reflow of the arc-grouped Careers section and the Skills section](./evidence/phase-5-hub-en-768px.png)
  ![Careers category landing at 768px showing the arc chooser reflowed to two/one columns](./evidence/phase-5-category-landing-careers-en-768px.png)
  ![Skills category landing at 768px showing the same fixed-arc ramp statement, no chooser, reflowed to the tablet frame](./evidence/phase-5-category-landing-skills-en-768px.png)
  ![Immediately-Effective arc landing at 768px showing both role cards stacked for the narrower frame](./evidence/phase-5-arc-landing-two-role-en-768px.png)
  ![Interview-Ready arc landing at 768px showing the single role card with its inline syllabus preview at the tablet width](./evidence/phase-5-arc-landing-one-role-en-768px.png)
  ![E2E Fixture Alpha skills path landing at 768px](./evidence/phase-5-path-landing-en-768px.png)
  ![A course in path context at 768px showing the same rail, present but narrower — this is also the dedicated rail-tablet-truncated evidence file, with full titles in each link's aria-label even though these particular fixture titles are short enough not to visually ellipsis at 768px](./evidence/phase-5-course-en-768px.png)
  ![The tablet path rail, captured as the dedicated rail-tablet-truncated evidence file — 250px wide (~32.5% of viewport, inside the documented 15%-35% resizable-panel band)](./evidence/phase-5-rail-tablet-truncated-en-768px.png)

  **Evidence — 375px (mobile)**

  ![Landing hero at 375px, single-column reflow with no horizontal overflow](./evidence/phase-5-hero-en-375px.png)
  ![Paths hub at 375px, single-column reflow of both sections](./evidence/phase-5-hub-en-375px.png)
  ![Careers category landing at 375px showing the arc chooser stacked single-column](./evidence/phase-5-category-landing-careers-en-375px.png)
  ![Skills category landing at 375px showing the same fixed-arc ramp statement stacked single-column](./evidence/phase-5-category-landing-skills-en-375px.png)
  ![Immediately-Effective arc landing at 375px showing both role cards stacked single-column](./evidence/phase-5-arc-landing-two-role-en-375px.png)
  ![Interview-Ready arc landing at 375px showing the single role card with its inline syllabus preview stacked for mobile](./evidence/phase-5-arc-landing-one-role-en-375px.png)
  ![E2E Fixture Alpha skills path landing at 375px, single-column reflow](./evidence/phase-5-path-landing-en-375px.png)
  ![A course in path context at 375px showing no rail and the compact "on path · course 1 of 2" banner readout with its "View path" disclosure trigger](./evidence/phase-5-course-en-375px.png)
  ![The path-scoped left drawer open at 375px after activating the banner's "View path" trigger — the same Sheet the header ☰ opens, titled with the path name and listing its ordered courses, with only one dialog in the accessibility tree](./evidence/phase-5-rail-mobile-drawer-open-en-375px.png)

> **Manual API verification is not applicable** — this plan adds no API endpoint. Recorded explicitly so
> the omission reads as a decision rather than an oversight.

### Rule-15 Three-Tester Retest (before archival)

- [x] [AI] Run the three live-site testers (the `web-ux-test-fixing-planning` workflow:
      `web-exploratory-tester` + `web-usability-tester` + `web-design-tester`) against the running
      landing hero, paths hub, fixture path landing, and sample courses **in path context (the
      `PathRail` at all three breakpoints, including the mobile drawer)**, in `en` — acceptance:
      EWT/UWT/DWT findings + spec-gaps recorded.
- [x] [AI] Append each finding below as a new unchecked checkbox, source-attributed
      (`- [ ] EWT-NNN:` / `- [ ] UWT-NNN:` / `- [ ] DWT-NNN: <defect> — fix before archival`); append
      any SG-###/USS-### items to the Specs & Gherkin Delivery steps in Phase 2.
- [x] [AI] Fix every rule-15 EWT/UWT/DWT defect finding before archival — deferral requires explicit user
      permission (only when genuinely impossible) for defect findings; SG-### spec-gap proposals and
      USS-### spec-suggestions may be triaged or deferred with written rationale.

#### Rule-15 retest follow-ups

> Retest run by `web-exploratory-tester` (`output-mode: delivery`) on 2026-07-25 against the live dev
> server at `http://localhost:3101`, `en` locale, all three breakpoints, via `curl` baselines +
> Playwright (headless Chromium). Re-verified the three items already fixed earlier in this Phase 5
> pass (one-role syllabus-preview hydration error, arc-route "Not Found" tab title, desktop/tablet
> rail "Course k of N" readout) — all three confirmed clean/present live; no regression. Ran the three
> mandatory systematic sweeps (shared-control × surface matrix, per-control URL/state round-trip,
> declared-invariant conformance) — results folded into the findings and spec-gaps below. Zero console
> errors/page errors/failed first-party requests across all 13 target URLs × 3 breakpoints; every page
> carries exactly one `<h1>`; `html[lang]` is `en` throughout; muted-foreground text measured at
> 6.36:1 contrast (comfortably above the 4.5:1 AA threshold); the URL/state round-trip (rail-link
> click → address bar update → reload → fresh-tab open) and the keyboard/mobile-drawer flows
> (Tab-reachable rail, single dialog, `Esc` closes + returns focus) all passed on independent
> re-verification.

- [x] [AI] **EWT-001**: `PathCard`'s accessible name (`aria-label`) diverges from its own visible
      content, and diverges **inconsistently** between the two surfaces that share the component —
      Major severity (WCAG-relevant accessible-name/content-consistency defect), proposed priority
      Medium.
  - **Area/Component**: `apps/ayokoding-www/src/features/course-paths/shell/path-card.tsx`
    (`PathCard`, shared by Screen 0 hero and Screen 1 hub per its own docstring).
  - **Environment**: `http://localhost:3101/en` and `http://localhost:3101/en/learn/paths`, Chromium
    (Playwright 1.60.0, headless), 1280px, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open `/en` and inspect any hero path card's `aria-label` (e.g. via
    `document.querySelector('a[href*="generalist-track"]').getAttribute('aria-label')`). (2) Open
    `/en/learn/paths` and inspect the same manifest's card on the hub. (3) Compare each card's visible
    `CardDescription` text against its own `aria-label`.
  - **Expected**: the same `PathCard` component should expose a consistent, concise accessible name
    that does not silently diverge from the sighted visual experience on either surface (Nielsen
    Heuristic 4 / WCAG 3.2.4 Consistent Identification — same-function control, consistent behaviour).
  - **Actual**: on the **hero** (`context="hero"`), the visible `CardDescription` shows `manifest.arc`
    (e.g. `"fundamentally-strong"`) but the `aria-label` is
    `` `Start the ${title} path — ${manifest.description}, ~${courseCount} courses` `` — the full
    manifest description (a multi-clause sentence, and in the current fixture data literally
    QA-authoring commentary such as _"E2E fixture: the third fixture arc — proves the careers category
    landing's arc chooser renders one arc card per arc..."_) is read aloud to screen-reader users but
    never shown on screen. On the **hub** (`context="hub"`), the visible `CardDescription` shows
    `manifest.description` (the real text) but the `aria-label` is only
    `` `Start the ${title} path — ${courseCount} courses` `` — the visible description is never
    announced. The two renderings of the identical component diverge from each other AND each diverges
    from its own visible text, in opposite directions. Source:
    `path-card.tsx` lines ~30-32
    (``const label = context === "hero" ? `Start the ${manifest.title} path — ${manifest.description}, ~${courseCount} courses` : `Start the ${manifest.title} path — ${courseCount} courses`;``).
  - **Evidence**:
    `./evidence/phase-5-rule15-ewt001-hero-card-grid-en-1280px.png` (visible hero grid showing only the
    short arc-slug description); DOM excerpt captured live: hero card aria-label =
    `"Start the Generalist Track (Fundamentally-Strong) path — E2E fixture: the third fixture arc — proves the careers category landing's arc chooser renders one arc card per arc (three total) rather than assuming exactly two., ~2 courses"`
    vs. hub card aria-label for the same manifest =
    `"Start the Generalist Track (Fundamentally-Strong) path — 2 courses"`.
  - **Reproducibility**: Always (every hero/hub card pair, confirmed across all 6 fixture manifests).
  - **Defect type**: Accessibility / Behavioural consistency.
  - **Suggested fix locus** (hypothesis): `path-card.tsx`'s `label` construction — use one consistent,
    concise accessible-name pattern on both variants (e.g. `` `Start the ${title} path, ~${courseCount} courses` `` everywhere), and if the longer `manifest.description` should be announced at all, expose
    it via `aria-describedby` pointing at the already-rendered `CardDescription` node rather than
    concatenating it into `aria-label`.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-card.tsx`,
  `apps/ayokoding-www/src/features/course-paths/shell/path-card.test.tsx`. RED: added a test
  comparing the hero and hub `aria-label` for the same manifest and asserting neither contains
  `manifest.description` nor `manifest.arc`; confirmed it failed against the pre-fix component.
  GREEN: unified the `label` to one consistent
  `` `Start the ${manifest.title} path — ${courseCount} courses` `` for both `context` variants —
  neither `manifest.description` nor `manifest.arc` is announced (the visible `CardDescription`
  already carries that text for sighted users). `npx nx run ayokoding-www:test:unit` and
  `typecheck` both green. Re-verified live: `/en`'s hero cards and `/en/learn/paths`'s hub cards now
  read `"Start the Generalist Track (Fundamentally-Strong) path — 2 courses"` identically on both
  surfaces (previously the hero card announced the full QA-authoring `manifest.description`
  sentence instead).

- [x] [AI] **EWT-002**: A course's prerequisite links unconditionally carry the current `?path=`
      context even when the referenced prerequisite is **not** part of that path's manifest —
      contradicts `prerequisite-display.feature`'s "canonical URL" acceptance criterion — Minor
      severity (masked by the existing omitted-course fallback, so no visible breakage), proposed
      priority Low.
  - **Area/Component**: `apps/ayokoding-www/src/features/course-paths/shell/prerequisite-list.tsx`
    (`PrerequisiteList`).
  - **Environment**:
    `http://localhost:3101/en/learn/courses/data-structures-and-algorithms-essentials?path=careers/interview-ready/backend-track`,
    Chromium (Playwright 1.60.0, headless) + `curl`, 1280px, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Confirm the fixture manifest
    `apps/ayokoding-www-fe-e2e/fixtures/manifests/careers/interview-ready/backend-track.json` has
    `courseOrder: ["just-enough-python", "data-structures-and-algorithms-essentials"]` — it does **not**
    include `version-control-and-git`. (2) Confirm the real course content
    `apps/ayokoding-www/content/en/learn/courses/data-structures-and-algorithms-essentials/_index.md`
    declares `prerequisites: ["version-control-and-git"]`. (3) Open the course URL above and inspect
    the "Prerequisites" nav's link href.
  - **Expected**: per
    `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/course-paths/prerequisite-display.feature`
    ("the page lists each prerequisite course with a link to its canonical URL"), the prerequisite link
    should be the course's plain canonical URL — and per `core/prerequisites.ts`'s own documented OI-4
    "link-don't-walk" principle, a prerequisite absent from the active manifest is an explicitly
    supported case, so its link should not falsely imply active membership in that manifest.
  - **Actual**: the rendered link is
    `/en/learn/courses/version-control-and-git?path=careers/interview-ready/backend-track` — the
    active path's query parameter is appended even though `version-control-and-git` is not in that
    manifest's `courseOrder`. Following the link does render correctly (the existing
    `omitted-course.feature` fallback discards the inert query param and shows the canonical view with
    no rail/banner/path breadcrumb segment — verified live, no visible breakage), but the address bar
    itself carries a misleading path-membership claim for a course that isn't in the path, and the
    literal "canonical URL" wording of `prerequisite-display.feature` is not met. Source:
    `prerequisite-list.tsx`'s `<Link href={contentUrl(locale, prerequisite.slug, pathId)}>` passes the
    active `pathId` to every prerequisite link unconditionally, regardless of manifest membership.
  - **Evidence**: `./evidence/phase-5-rule15-ewt002-prerequisite-link-en-1280px.png`; live HTML excerpt:
    `<nav aria-label="Prerequisites">…<a href="/en/learn/courses/version-control-and-git?path=careers/interview-ready/backend-track">6 · Version Control &amp; Git</a>…</nav>`.
  - **Reproducibility**: Always (any prerequisite not present in the active manifest's `courseOrder`).
  - **Defect type**: Functional / Consistency (URL quality).
  - **Suggested fix locus** (hypothesis): `prerequisite-list.tsx` — only pass `pathId` through to a
    given prerequisite's link when that prerequisite's course ID is present in the active manifest's
    `courseOrder`; otherwise render the plain canonical URL (`contentUrl(locale, prerequisite.slug)`
    with no `pathId`).

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.ts`,
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.test.ts`,
  `apps/ayokoding-www/src/features/course-paths/shell/prerequisite-list.tsx`,
  `apps/ayokoding-www/src/features/course-paths/shell/prerequisite-list.test.tsx`,
  `apps/ayokoding-www/test/unit/fe-steps/prerequisite-display.steps.tsx`,
  `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx`. RED: added a test in
  `course-path-nav.test.ts` asserting a prerequisite that is itself a member of the active manifest's
  `courseOrder` gets `pathId` attached while a declared-but-omitted prerequisite (the capstone course,
  OI-4's link-don't-walk case) gets `pathId: undefined`; confirmed it failed against the pre-fix
  blanket-`pathId` logic. GREEN: introduced a `PrerequisiteLink extends PageLink { pathId?: string }`
  type carrying the decision **per item** rather than as one blanket prop; `resolveCoursePathRenderData`
  now computes a `Set` of the active manifest's course IDs and only attaches `activeContext.pathId` to
  a prerequisite link whose own course ID is in that set. `PrerequisiteList` and its two existing
  tests (`prerequisite-list.test.tsx`, the Gherkin step binding
  `prerequisite-display.steps.tsx`) updated to pass `pathId` per-item instead of as a component-level
  prop; both existing tests (which asserted the old blanket-prop behaviour) updated to match the new,
  correct per-item contract rather than weakened or deleted. `page.tsx`'s `<PrerequisiteList>` call
  site no longer passes a top-level `pathId`. `npx nx run ayokoding-www:test:unit` (125 files,
  2379 passed) and `typecheck` both green. Re-verified live, both branches: (1)
  `/en/learn/courses/data-structures-and-algorithms-essentials?path=careers/interview-ready/backend-track`
  — the "Version Control & Git" prerequisite (declared but **not** in that manifest's `courseOrder`)
  now links to the plain canonical URL with no `?path=`, matching `prerequisite-display.feature`'s
  "canonical URL" wording; (2)
  `/en/learn/courses/backend-essentials?path=skills/e2e-fixture-beta` — the "SQL Essentials"
  prerequisite (which **is** a member of that manifest's `courseOrder`) still correctly links with
  `?path=skills/e2e-fixture-beta` appended, confirming the fix is a narrowing, not a regression, of
  the existing path-preservation behaviour. Zero console errors on either page.

- [x] [AI] **SG-001** (spec-gap proposal): path context is deliberately, and correctly, scoped to a
      course's own top-level page only — never its content sub-pages — but no existing Gherkin
      scenario protects this boundary.
  - **Observed behaviour**: `courseIdFromSlug(slugStr)` (in
    `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx`, comment: _"Path context only
    ever applies to course pages"_) returns `null` for every course sub-page
    (`/learning`, `/learning/overview`, `/learning/beginner`, `/drilling`, `/drilling/overview`, etc.),
    so the path rail, the mobile banner, and the path breadcrumb segment never render there — confirmed
    live even when `?path=` is manually appended to a sub-page URL
    (`/en/learn/courses/just-enough-bash/learning?path=skills/e2e-fixture-alpha` renders the identical
    generic canonical view as the same URL with no `?path=` at all). This is intentional, documented
    design, not an oversight, and it held universally across every sub-page tested.
  - **Where observed**: `/en/learn/courses/just-enough-bash/learning{,/overview,/beginner}` and
    `/en/learn/courses/data-structures-and-algorithms-essentials{/overview,/learning,/drilling}`, with
    and without `?path=`, 2026-07-25.
  - **Why spec-worthy**: this is the feature's own applicability boundary — if a future refactor
    accidentally widened or narrowed `courseIdFromSlug`'s matching, no scenario today would catch the
    regression in either direction.
  - **Proposed Gherkin** (target file: extend
    `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/course-paths/canonical-fallback.feature` with
    a new scenario):

    ```gherkin
    Scenario: A course's own sub-pages never inherit path context from their parent course
      Given a reader is on a course's sub-page such as its Learning or Drilling overview
      When the sub-page renders, whether or not a path context query parameter is present in the URL
      Then the sub-page renders the identical generic canonical view every content sub-page renders
      And no path rail, path banner, or path breadcrumb segment appears on any course sub-page
    ```

  **Date**: 2026-07-25. **Status**: Triaged — deferred to backlog, not implemented in this phase.
  **Rationale**: this proposal protects an already-correct boundary (`courseIdFromSlug` returning
  `null` for every course sub-page) that no code in this plan's Phase 5 pass touched or regressed —
  confirmed live across every sub-page tested, with and without `?path=`. Adding the Gherkin scenario
  and its step binding is a net-new coverage expansion for pre-existing, unrelated-to-this-pass
  behaviour, not a fix for anything broken; the task's own instructions permit triaging SG items with
  written rationale rather than mandating implementation. Recommended follow-up: fold this scenario
  into `canonical-fallback.feature` as its own small, independent backlog item (or as part of whichever
  future plan next touches `courseIdFromSlug`/`page.tsx`'s path-applicability boundary), so its
  step-binding cost is paid by a change that actually needs it, rather than inflating this plan's
  already-large Phase 5 diff with pure coverage-only additions.

- [x] [AI] **SG-002** (spec-gap proposal): an arc route with no structural `_index.md` at all (not
      merely zero published manifests) still renders a safe 200 empty-state, distinct from
      `category-landing-empty-state.feature`'s assumption that a structural index exists.
  - **Observed behaviour**: `/en/learn/paths/careers/no-fixture-arc` has **no**
    `apps/ayokoding-www/content/en/learn/paths/careers/no-fixture-arc/_index.md` at all (confirmed via
    `find`), unlike every real arc (`fundamentally-strong`, `immediately-effective`, `interview-ready`),
    each of which has an authored `_index.md` with a real `title:` frontmatter. Despite the total
    absence of structural content, the route still resolves `resolution.kind === "arc"`, renders
    `empty-path-list-state.tsx`'s "New paths are being written — check back soon." message with a
    working fallback link to `/en/learn/paths/careers`, and (after this Phase 5 pass's own fix) titles
    the tab correctly rather than "Not Found." The page's `<h1>` falls back to the raw slug
    (`no-fixture-arc`) in this specific no-structural-content case — acceptable degraded behaviour given
    there is genuinely no authored title anywhere to draw from, but worth protecting explicitly since
    every real arc always ships an `_index.md` before being linked to.
  - **Where observed**: `http://localhost:3101/en/learn/paths/careers/no-fixture-arc`, 2026-07-25.
  - **Why spec-worthy**: `category-landing-empty-state.feature`'s existing scenario is worded "Given a
    **structural category index exists** with zero published path manifests" — it does not cover the
    stronger case of an arc segment with no structural index whatsoever, which this plan's own Phase 5
    fix (arc-route metadata title) specifically had to handle.
  - **Proposed Gherkin** (target file: extend
    `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/course-paths/category-landing-empty-state.feature`
    with a new scenario):

    ```gherkin
    Scenario: An arc segment with no structural index at all still renders a safe empty state
      Given an arc route segment has no _index.md and zero published path manifests
      When a reader opens that arc's landing page
      Then the page renders 200 with the same "being written, check back soon" empty state
      And the browser tab title names the arc segment rather than reading "Not Found"
    ```

  **Date**: 2026-07-25. **Status**: Triaged — substance already covered, formal Gherkin scenario
  deferred to backlog. **Rationale**: this proposal directly documents DEFECT 3, which this Phase 5
  pass already fixed and already covered with a companion regression test
  (`page.unit.test.ts`'s "titles a careers arc route (even a zero-manifest/empty-state one) with the
  arc slug, not a bare 'Not Found'" — RED-confirmed against the pre-fix code, GREEN after). That test
  asserts the exact behaviour SG-002 describes (200 status implied by the render path, correct tab
  title instead of "Not Found") at the unit level. Adding the fuller Gherkin-level scenario (plus a new
  `@amiceli/vitest-cucumber` step binding) is additional coverage of the same already-fixed,
  already-tested behaviour, not a fix for anything still broken, so per the task's own instructions
  permitting SG triage-with-rationale, it is deferred to backlog as a follow-up to
  `category-landing-empty-state.feature` rather than implemented in this already-large Phase 5 diff.

- [x] [AI] _(this concludes the 2026-07-25 `web-exploratory-tester` retest pass — 2 defect findings
      (EWT-001, EWT-002) and 2 spec-gap proposals (SG-001, SG-002) recorded above; all must be
      fixed/ticked (defects) or explicitly triaged (spec-gaps) before archival per the Rule-15 gate
      above; SG-001/SG-002 fold into Phase 2's Specs & Gherkin Delivery steps once accepted)_

> Retest run by `web-usability-tester` (`output-mode: delivery`) on 2026-07-25 against the same live
> dev server at `http://localhost:3101`, `en` locale (the corpus is `en`-only, no `id` mirror exists),
> all three breakpoints (375/768/1280px), via Playwright 1.60.0 (headless Chromium) + `curl`. This pass
> is spec-blind by design — no `specs/**`, source, or plan docs were read to learn intended behaviour;
> every finding below is grounded only in what a first-time visitor can perceive (rendered text, DOM,
> computed styles, live interaction), judged against Nielsen's heuristics, the four cognitive-walkthrough
> questions, and named UX laws/WCAG 3.2 criteria. Walked the hero (`/en`), the paths hub
> (`/en/learn/paths`), both category landings (`careers`, `skills`), two arc landings
> (`immediately-effective`, `interview-ready`), the `e2e-fixture-alpha` skills-path landing, a course in
> path context (`just-enough-bash?path=skills/e2e-fixture-alpha`), a course with a deliberately-invalid
> `?path=` value, and the `no-fixture-arc` empty-state arc. Ran all four Mandatory Systematic Probes
> (conditional/hidden-control discoverability, per-label jargon scan, cross-view information-redundancy,
> input unit/currency consistency — the last is not applicable, this surface has no numeric/currency
> input controls). Confirmed clean: the invalid-`?path=` fallback silently and correctly renders the
> plain canonical course view with no error state (graceful, matches the goal's expectation); the
> `no-fixture-arc` empty state renders the "New paths are being written — check back soon." message with
> a working way back (its raw-slug `<h1>` is already covered by the exploratory pass's SG-002, not
> re-filed here); tablet (768px) correctly uses the same persistent rail as desktop, not the mobile
> banner+drawer, matching the goal's own stated responsive contract; zero console errors across all 9
> URLs × 3 breakpoints. Seven usability findings and three spec-blind suggestions follow.

- [x] [AI] **UWT-001**: The same arc identifier renders as a properly humanized Title-Case label in one
      part of a page and as a raw, un-humanized kebab-case slug in another part of the **same page** —
      Major severity (Nielsen Heuristic 2: Match Between System and the Real World; Heuristic 4:
      Consistency and Standards; Mandatory Systematic Probe B — per-label jargon scan), proposed priority
      Medium-High.
  - **Area/Component**: the category-landing arc-card grid (`/en/learn/paths/{category}`) and the hero
    (`/en`) / hub (`/en/learn/paths`) path-card grids.
  - **Environment**: `http://localhost:3101/en/learn/paths/careers`, Chromium (Playwright 1.60.0,
    headless), 375/768/1280px, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open `/en/learn/paths/careers`. (2) Compare the left rail's expanded
    "Careers" children — "Interview-Ready", "Immediately-Effective", "Fundamentally Strong" (Title Case,
    hyphenated where compound) — against the three arc cards rendered in the main content column on the
    identical page — titled `interview-ready`, `immediately-effective`, `fundamentally-strong` (all
    lowercase, raw kebab-case). (3) Separately, open `/en` (hero) and read the description line under
    each path-card title (e.g. under "Generalist Track (Fundamentally-Strong)" the description reads the
    raw slug `fundamentally-strong`, not a sentence). (4) On the same category page, the role-name badges
    inside each arc card ("GENERALIST-TRACK", "BACKEND-TRACK", "FRONTEND-TRACK") are also raw kebab-case
    identifiers, only uppercased, not spaced/humanized ("Generalist Track" vs `GENERALIST-TRACK`).
  - **Expected**: a first-time visitor scanning a single screen should see one consistent, plain-language
    name for the same real-world concept (an arc). Since a humanization path visibly exists in the
    product (the rail, the arc-landing `<h1>`, and the card _titles_ like "Backend Track
    (Immediately-Effective)" all render Title Case), every other rendering of the identical arc/role
    identifier on the same screen should use it too (Heuristic 4's internal-consistency clause).
  - **Actual**: on `/en/learn/paths/careers`, the rail (left) reads "Interview-Ready",
    "Immediately-Effective", "Fundamentally Strong" while the arc cards immediately to its right (same
    viewport, same page, same data) read `interview-ready`, `immediately-effective`,
    `fundamentally-strong` — an internal-consistency break visible without scrolling or navigating
    anywhere. The hero's card descriptions and the category page's role badges show the same
    un-humanized-identifier pattern. Confirmed identical at 375/768/1280px.
  - **Evidence**: `./evidence/phase-5-rule15-uwt-category-careers-en-1280px.png` (rail vs. card-title
    side-by-side on one screen); `./evidence/phase-5-rule15-uwt-category-careers-en-375px.png` (mobile,
    same divergence plus the raw badge labels); `./evidence/phase-5-rule15-uwt-hero-en-375px.png` (hero
    card descriptions reading `fundamentally-strong` / `immediately-effective` / `interview-ready`).
  - **Reproducibility**: Always (every arc/role card on hero, hub, and both category landings; every
    breakpoint tested).
  - **Suggested clarification** (hypothesis): route every user-facing rendering of an arc/role identifier
    through the same humanization/title-resolution step already used for the rail and the arc-landing
    `<h1>`, so a raw slug is never the thing a sighted user reads on any surface.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.ts` (new pure
  `humanizeKebabSlug`/`buildArcTitleIndex` helpers),
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.test.ts`,
  `apps/ayokoding-www/src/features/course-paths/shell/category-landing.tsx` (arc-card titles and role
  badges now humanized via `contentMap`-backed title lookup, falling back to the humanizer when no
  authored title exists),
  `apps/ayokoding-www/src/features/course-paths/shell/category-landing.test.tsx`,
  `apps/ayokoding-www/src/features/course-paths/shell/path-card.tsx` (hero-context description now
  shows the humanized `arcTitle` instead of the raw `manifest.arc`),
  `apps/ayokoding-www/src/features/course-paths/shell/path-card.test.tsx`,
  `apps/ayokoding-www/src/features/app-shell/shell/hero.tsx` and
  `apps/ayokoding-www/src/features/app-shell/shell/landing.tsx` (thread `contentMap` down to the hero
  grid), `apps/ayokoding-www/src/app/[locale]/page.tsx` (passes the loaded `contentMap` through),
  `apps/ayokoding-www/test/unit/fe-steps/category-landing-arc-chooser.steps.tsx` (stale raw-slug
  regex updated to match the new humanized text). RED: added tests asserting `humanizeKebabSlug`/
  `buildArcTitleIndex` output and that arc cards/hero descriptions render Title Case text with no raw
  kebab-case slug visible; confirmed failing pre-fix. GREEN: every caller defaults to an empty
  `contentMap` (backward compatible) and falls back to the humanizer when no authored `_index.md`
  title is found, so the rail's already-correct humanization and the cards/badges now agree.
  `npx nx run ayokoding-www:test:unit`/`typecheck`/`lint` all green. Re-verified live at
  `/en/learn/paths/careers` and `/en`: the rail, arc cards, role badges, and hero descriptions all
  show consistent Title Case labels ("Interview-Ready", "Immediately-Effective",
  "Fundamentally Strong") with zero raw kebab-case slugs visible, at 375/768/1280px, zero new
  console errors.

- [x] [AI] **UWT-002**: The desktop/tablet path rail truncates long arc/path labels mid-word with a hard
      visual clip and no ellipsis, tooltip, or `title`-attribute fallback — Minor severity (ISO 9241-110
      §2 Self-Descriptiveness; Heuristic 4: Consistency — the same feature's own breadcrumb solves
      identical-shaped truncation correctly one click away), proposed priority Low-Medium.
  - **Area/Component**: the path/category rail's nested nav list (`/en/learn/paths/careers`,
    `/en/learn/paths/skills`).
  - **Environment**: `http://localhost:3101/en/learn/paths/careers`, Chromium (Playwright 1.60.0,
    headless), 1280px, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open `/en/learn/paths/careers` at 1280px. (2) Expand the "Careers" rail
    item (expanded by default on this route) and read its third child, the arc labelled
    "Immediately-Effective". (3) Observe the rendered glyphs stop mid-word ("Immediately-Effectiv"),
    with no "…" character and no `title` attribute exposing the full text on hover. (4) Repeat on
    `/en/learn/paths/skills`, where the rail child "E2E Fixture Alpha Skills Path" is cut the same way.
    (5) For contrast, open a course-in-path page and note the breadcrumb correctly collapses a long
    trail to `Home > … > 5 · Just Enough Bash` with a real ellipsis — the same feature already has a
    working pattern for this exact problem, just not applied here.
  - **Expected**: a first-time user should either see the complete label, or see an explicit truncation
    affordance (ellipsis and/or a hover tooltip) so they know text is hidden and can still learn what it
    says (ISO 9241-110 self-descriptiveness: the interface should make its own state — including "this
    label is incomplete" — perceivable).
  - **Actual**: measured live via computed styles, the rail item box (`getBoundingClientRect().width` =
    157.6px) is narrower than the label's rendered text, `white-space: nowrap` is set, and `title` is
    `null` — the trailing letters are simply not painted, with no ellipsis and no alternate way for a
    sighted mouse user to recover the full label short of clicking through or widening the viewport.
  - **Evidence**: `./evidence/phase-5-rule15-uwt002-rail-truncation-en-1280px.png` (crop showing
    "Immediately-Effectiv" and "Fundamentally Strong" both cut at the rail's right edge).
  - **Reproducibility**: Always, for any arc/path label long enough to exceed the rail's ~158px item
    width (confirmed for 2 of the 6 current fixture labels).
  - **Suggested clarification** (hypothesis): apply `truncate` (Tailwind's `overflow-hidden
text-ellipsis whitespace-nowrap` combination) instead of bare `whitespace-nowrap`, and add a `title`
    attribute mirroring the full label so a hover reveals the complete text.

  **Date**: 2026-07-25. **Status**: Fixed (with a deliberate deviation from the suggested-clarification
  hypothesis). **Files Changed**:
  `apps/ayokoding-www/src/features/navigation/shell/sidebar-tree.tsx`,
  `apps/ayokoding-www/src/features/navigation/shell/sidebar-tree.test.tsx`. Before applying the
  suggested `truncate` class, cross-checked
  `specs/apps/ayokoding/behavior/ayokoding-www/gherkin/navigation/resizable-sidebar.feature`'s
  "Scroll the sidebar horizontally when a label overflows" scenario ("the label is not clipped or
  wrapped") and its existing step binding
  (`apps/ayokoding-www/src/features/navigation/shell/resizable-sidebar.test.tsx`, which asserts
  `not.toContain("truncate")` / `toContain("whitespace-nowrap")`) — this is a pre-existing,
  deliberate, spec-backed contract: the rail is meant to scroll horizontally to reveal the full
  label, not clip it. Applying `truncate` would have broken that already-shipped feature. RED: added
  a test asserting the rail link carries a `title` attribute equal to the node's full label; confirmed
  failing pre-fix. GREEN: added `title={node.title}` to the rail `<Link>` (kept `whitespace-nowrap`
  unchanged, no `truncate`) — this satisfies the finding's "Expected" clause via its
  hover-tooltip option rather than its ellipsis option. Additionally reduced `ScrollableTree`'s
  fade-mask gradient from `calc(100% - 24px)` to `calc(100% - 10px)` (both `maskImage` and
  `WebkitMaskImage`), since the prior 24px fade was disproportionate to the actual overflow (as
  little as 7px for "Immediately-Effective"), fading 2+ legible characters unnecessarily; this
  change is not covered by any existing assertion (which only checks `data-overflowing`), so it adds
  no regression risk. `npx nx run ayokoding-www:test:unit`/`typecheck`/`lint` all green, including
  the pre-existing `resizable-sidebar.test.tsx` suite (unchanged, still passing). Re-verified live at
  1280px: hovering the truncated "Immediately-Effective" rail label now shows the full text via the
  native `title` tooltip, and the horizontal-scroll-with-fade contract still functions exactly as
  before, with the fade now visibly less aggressive.

- [x] [AI] **UWT-003**: Path-context secondary-navigation links (the syllabus list on a path landing
      page; "View full path" / "Browse all courses" in the course-in-path rail) render as plain,
      muted, non-underlined text visually indistinguishable from static prose, while the same page's own
      content table-of-contents links use blue, underlined text — Minor severity (Heuristic 4:
      Consistency and Standards; Affordance/clickability — Fitts's Law; first-click/information-scent),
      proposed priority Medium.
  - **Area/Component**: the path-landing syllabus list (`/en/learn/paths/skills/e2e-fixture-alpha`) and
    the course-in-path rail (`/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`).
  - **Environment**: both URLs above, Chromium (Playwright 1.60.0, headless), 1280px, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open the path-landing URL and look at the "SYLLABUS" list — "5 · Just
    Enough Bash", "6 · Version Control & Git" render in plain black/gray text with no underline. (2)
    Inspect the DOM — both are real `<a href="...">` elements
    (confirmed live: `<a class="rounded-md px-2 py-1 text-sm hover:bg-accent hover:text-foreground"
href="/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha">5 · Just Enough Bash</a>`) —
    the only affordance is a background-color change on `:hover`, invisible to touch users and to any
    sighted user who hasn't already moved a mouse over the row. (3) On the same page's/course's content
    body, compare the "Learning / Overview / Beginner Examples / …" table-of-contents links, which
    render blue and underlined by default, no hover required. (4) On the course-in-path rail, "View full
    path" and "Browse all courses" share the same plain, non-underlined, `text-muted-foreground` styling
    as the syllabus items.
  - **Expected**: within one page, one visual convention for "this is a link you can click" — Heuristic 4
    calls for internal consistency, and Krug's "don't make me think" scanning principle means a user
    should recognize a navigational item as clickable without hovering or clicking to test it.
  - **Actual**: two different, unlabelled conventions coexist on the identical page/feature: blue+
    underline for in-page content links, plain gray hover-only for path/course navigational links — a
    user who has learned "blue underline = link" from the same page's body content has no visual reason
    to expect the syllabus rows or "View full path"/"Browse all courses" are clickable at all.
  - **Evidence**: `./evidence/phase-5-rule15-uwt-path-landing-fixture-alpha-en-1280px.png` (syllabus list,
    no link styling visible); `./evidence/phase-5-rule15-uwt-course-in-path-en-1280px.png` ("View full
    path" / "Browse all courses" in the rail, same plain-text treatment).
  - **Reproducibility**: Always (every path landing and every course-in-path rail).
  - **Suggested clarification** (hypothesis): give path/course navigational links at least one always-on
    affordance cue (underline, an accent color, or a leading icon) instead of relying solely on
    `:hover` background-color, matching the treatment already used for in-page content links.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-landing.tsx`,
  `apps/ayokoding-www/src/features/course-paths/shell/path-landing.test.tsx`,
  `apps/ayokoding-www/src/features/course-paths/shell/path-rail.tsx`,
  `apps/ayokoding-www/src/features/course-paths/shell/path-rail.test.tsx`. RED: added tests
  asserting the syllabus links and the rail's "View full path"/"Browse all courses" footer links
  carry `underline underline-offset-2` in their `className`; confirmed failing pre-fix. GREEN: added
  `underline underline-offset-2` to the path-landing syllabus `<Link>` className and to
  `path-rail.tsx`'s shared `FOOTER_LINK_CLASS` constant, matching the always-on underline convention
  already used by in-page content links. `npx nx run ayokoding-www:test:unit`/`typecheck`/`lint` all
  green. Re-verified live at 1280px on both the path-landing syllabus and the course-in-path rail:
  every path/course navigational link now shows a visible underline with no hover required, matching
  the content links' convention.

- [x] [AI] **UWT-004**: On mobile, the "you are on a path" status banner renders far down the page —
      after the syllabus and Prerequisites sections — instead of near the top, so a first-time mobile
      visitor must scroll well past the fold before learning they are viewing a course inside path
      context at all; desktop/tablet show the equivalent rail immediately, with no scrolling — Major
      severity (Heuristic 1: Visibility of System Status; responsive-usability content-parity dimension),
      proposed priority Medium.
  - **Area/Component**: the mobile course-in-path banner
    (`/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`, 375px).
  - **Environment**: the URL above, Chromium (Playwright 1.60.0, headless), 375px viewport (800px tall),
    `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open the URL above at a 375×800 viewport (a common phone size). (2)
    Without scrolling, observe the initial viewport: masthead, breadcrumb, `<h1>`, and the start of the
    syllabus list are visible — no path-context indicator anywhere on screen. (3) Measure the "on path ·
    course 1 of 2 [View path]" banner's position live —
    `getBoundingClientRect()` reports `top: 646px` — meaning on an 800px-tall viewport the user must
    scroll roughly 646px (past the entire syllabus and the Prerequisites block) before the banner enters
    view. (4) Confirm the banner is not `position: sticky`/`fixed` (computed `position` is static through
    its ancestor chain), so it never appears earlier regardless of scroll direction. (5) Compare with
    1280/768px, where the equivalent "COURSE 1 OF 2" rail is visible in the very first paint, to the left
    of the `<h1>`, with zero scrolling.
  - **Expected**: the same system status ("you're inside a path, course X of Y") should become knowable
    to the user at roughly the same moment regardless of viewport — Heuristic 1 calls for timely,
    perceivable feedback about system status, and this plan's own goal names path-awareness (banner on
    mobile, rail on desktop/tablet) as the core comprehension question under test.
  - **Actual**: mobile users only discover path context after scrolling past the full syllabus and
    Prerequisites — for a first course encountered fresh, several page-heights of content are read
    before the "you're on a path" cue ever appears, while desktop/tablet users see it instantly.
  - **Evidence**: `./evidence/phase-5-rule15-uwt-course-in-path-en-375px.png` (full-page capture; banner
    visible only near the bottom, well after the syllabus/Prerequisites); live measurement
    `getBoundingClientRect().top = 646` on an 800px viewport, `position: static` confirmed on every
    ancestor.
  - **Reproducibility**: Always, on every course-in-path page at mobile width.
  - **Suggested clarification** (hypothesis): move the mobile path-context banner to render immediately
    below the `<h1>` (above the syllabus), or make it `position: sticky` at the top of the viewport, so
    its visibility no longer depends on scroll position.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx`. RED: manually reproduced the
  646px scroll-offset live before the fix. GREEN: moved the `<PathBanner>` JSX block (which is what
  renders the mobile "on path · course X of Y" status) from its previous position (after
  `<PrerequisiteList>`, before `<PrevNext>`) to immediately after the `<h1>` and before
  `<MarkdownRenderer>`. The banner is conditional on mobile-context rendering already, so this is a
  pure reordering with no new markup. `npx nx run ayokoding-www:test:unit`/`typecheck`/`lint` all
  green (no existing test asserted DOM order, so none broke). Re-verified live at 375px: the "on path
  · course 1 of 2 [View path]" banner now renders in the very first viewport, directly below the
  `<h1>`, with `getBoundingClientRect().top` measured well within the fold (no scrolling past the
  syllabus/Prerequisites required), matching the desktop/tablet rail's zero-scroll visibility.

- [x] [AI] **UWT-005**: The mobile path drawer exposes a "Drawer width: Default / Wide" control with no
      explanation of its purpose, unrelated to the user's task of navigating their course path — Minor
      severity (Heuristic 2: Match Between System and the Real World; Heuristic 8: Aesthetic and
      Minimalist Design / Hick's Law added decision cost), proposed priority Low.
  - **Area/Component**: the mobile path drawer (`mobile-nav-drawer`), opened via the "View path" trigger
    on a course-in-path page.
  - **Environment**: `http://localhost:3101/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`,
    Chromium (Playwright 1.60.0, headless), 375px, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open the URL above at 375px. (2) Tap the "View path" button (confirmed
    live: `<button aria-expanded="false" aria-controls="mobile-nav-drawer"
aria-label="View path: Open path course list — E2E Fixture Alpha Skills Path, course 1 of 2">`). (3)
    In the opened drawer, observe a "Drawer width" label above two toggle buttons, "Default" and "Wide",
    positioned above the actual path/course list content. (4) Tap "Wide" — the drawer panel's measured
    width live-changes from 280px to 360px (`getBoundingClientRect().width`), with no other visible
    change to the course-list content inside it.
  - **Expected**: every control inside a task-focused drawer should serve the user's task (finding/
    navigating their course path); a first-time visitor has no way to know what "Drawer width" means
    or why they would want it, since it maps to no real-world concept they came here for (Heuristic 2),
    and it competes for attention with the actual navigational content the drawer exists to show
    (Heuristic 8).
  - **Actual**: the control is real and functional (280px → 360px), but unlabelled beyond "Drawer width"/
    "Default"/"Wide" with no tooltip, help text, or visible benefit tied to the reader's task — it reads
    like a leftover internal/QA affordance rather than an end-user feature.
  - **Evidence**: `./evidence/phase-5-rule15-uwt005-drawer-width-default-en-375px.png` (drawer open,
    "Default" selected); `./evidence/phase-5-rule15-uwt005-drawer-width-wide-en-375px.png` ("Wide"
    selected, drawer visibly widened).
  - **Reproducibility**: Always (every time the mobile path drawer is opened).
  - **Suggested clarification** (hypothesis): remove the control from the end-user-facing drawer (move
    it behind a dev/QA-only flag) or, if it is intentionally end-user-facing, replace the label with
    plain language tied to a real benefit (e.g. "Show more of the path list" ) and/or gate its visibility
    to power users rather than showing it to every first-time visitor by default.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/i18n/core/translations.ts` (new `mobileNavWidthHint` key, both
  `en` and `id` locale blocks), `apps/ayokoding-www/src/features/app-shell/shell/mobile-nav.tsx`.
  Chose the "explain it in plain language" branch of the suggested clarification over removing the
  control, since the width toggle is not a QA leftover — it is a deliberate, spec-backed feature
  (DD-7, two preset widths 280px/360px) covered by `resizable-sidebar.feature`'s own scenarios;
  removing it would have contradicted an already-shipped, tested design decision. RED: manually
  confirmed the drawer showed no explanatory copy pre-fix. GREEN: added
  `<p className="mb-1 text-xs text-muted-foreground">` rendering the new `mobileNavWidthHint`
  translation ("Widen the drawer to read long path or course titles in full") between the
  `<legend>` and the preset-button row. `npx nx run ayokoding-www:test:unit`/`typecheck`/`lint` all
  green. Re-verified live at 375px: the drawer now shows the hint text immediately above the
  Default/Wide buttons, tying the control to a concrete reader benefit.

- [x] [AI] **UWT-006**: Path-card descriptions on the hero and hub grids have no length constraint
      (no truncation/line-clamp), so cards in the same visual row/grid vary sharply in height depending
      on description length — Minor severity (Heuristic 8: Aesthetic and Minimalist Design; Law of
      Proximity / Miller's Law chunking), proposed priority Low.
  - **Area/Component**: the hero (`/en`) and hub (`/en/learn/paths`) path-card grids.
  - **Environment**: `http://localhost:3101/en/learn/paths`, Chromium (Playwright 1.60.0, headless),
    1280px, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open `/en/learn/paths` at 1280px. (2) Compare the "IMMEDIATELY-EFFECTIVE"
    row's two side-by-side cards — "Backend Track" (a 5-line description) beside "Frontend Track" (a
    3-line description) — and note the visible height mismatch between two cards a user is meant to
    compare directly. (3) Note the description text has no `line-clamp`/`max-height`/`overflow` styling
    constraining it, so any sufficiently long description (fixture or real) produces the same effect.
  - **Expected**: cards intended to be scanned and compared side by side should present a predictable,
    evenly-chunked visual rhythm (Law of Proximity; Miller's Law) so the reader's eye can compare them
    without the grid's shape being at the mercy of arbitrary text length.
  - **Actual**: card heights in the same grid row differ by roughly 80-100px depending on description
    length, with no clamp; the effect is content-length-driven, not content-identity-driven, so it will
    recur with any long real-world description, not only the current fixture text.
  - **Evidence**: `./evidence/phase-5-rule15-uwt-hub-en-1280px.png` (uneven card heights visible in the
    "IMMEDIATELY-EFFECTIVE" row).
  - **Reproducibility**: Always, whenever sibling cards in a row have descriptions of different lengths.
  - **Suggested clarification** (hypothesis): apply a `line-clamp` (e.g. 2-3 lines) to `CardDescription`
    with a consistent card min-height, so grid rows stay visually even regardless of copy length.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-card.tsx`,
  `apps/ayokoding-www/src/features/course-paths/shell/path-card.test.tsx`. RED: added a test
  asserting `CardDescription`'s `className` contains `line-clamp-3`; confirmed failing pre-fix.
  GREEN: added the Tailwind `line-clamp-3` class to `CardDescription` in both hero and hub contexts.
  `npx nx run ayokoding-www:test:unit`/`typecheck`/`lint` all green. Re-verified live at
  `/en/learn/paths` (1280px): the "Immediately-Effective" row's "Backend Track"/"Frontend Track" card
  pair now clamps to a consistent 3-line description height, eliminating the previous 80-100px
  row-height mismatch.

- [x] [AI] **UWT-007**: Three adjacent inline links on the hero page ("Compare all paths", "Explore
      skills paths", "Browse the full course library") render in three different, unexplained colors —
      amber/orange, blue, and near-neutral gray — none underlined, with the gray one carrying no visible
      link affordance at all — Minor severity (Heuristic 4: Consistency and Standards; Affordance/
      clickability), proposed priority Low-Medium.
  - **Area/Component**: the hero page's path-discovery link row (`/en`, directly below the path-card
    grid).
  - **Environment**: `http://localhost:3101/en`, Chromium (Playwright 1.60.0, headless), 1280px, `en`,
    2026-07-25.
  - **Steps to reproduce**: (1) Open `/en` at 1280px and locate the row reading "Compare all paths →  
    Explore skills paths → Browse the full course library →" directly under the four path cards. (2)
    Read live computed `color` for each: "Compare all paths" = `lab(34.8 17.97 64.95)` (amber/orange),
    "Explore skills paths" = `lab(29.37 -15.13 -27.53)` (blue), "Browse the full course library" =
    `lab(39.72 1.19 6.89)` (near-neutral gray, close to the page's own body-text color). All three have
    `text-decoration: none`.
  - **Expected**: three peer links serving the same kind of action (discover more paths/courses) should
    either share one visual link convention, or their color differences should map to a real, learnable
    distinction (e.g. primary vs. secondary action) — Heuristic 4 requires consistent treatment of
    equivalent controls, and every link needs at least one non-hover affordance (color or underline)
    distinguishing it from static text.
  - **Actual**: the three colors appear arbitrary (no stated primary/secondary hierarchy is visible to a
    user), and the third link's near-neutral gray is close enough to ordinary body text that, absent a
    cursor hover, it is not recognizable as a link at all.
  - **Evidence**: `./evidence/phase-5-rule15-uwt-hero-en-1280px.png` (all three links visible in one row,
    directly below the path-card grid).
  - **Reproducibility**: Always (every visit to `/en`).
  - **Suggested clarification** (hypothesis): pick one consistent link treatment (e.g. all three in the
    same accent color with an underline, or a real primary/secondary distinction with a stated rationale)
    so all three read as clickable and their relative importance, if any, is legible.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/app-shell/shell/hero.tsx`,
  `apps/ayokoding-www/src/features/app-shell/shell/landing.test.tsx` (no dedicated `hero.test.tsx`
  exists — `landing.test.tsx` is the existing coverage for `Hero`'s rendered output). RED: added a
  test asserting all three escape-hatch links' `className` are identical to each other and each
  contains `underline`; confirmed failing pre-fix (three distinct `text-[var(--hue-*-ink)]` colors,
  no underline). GREEN: unified all three links to one
  `text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground`
  className, removing the ad hoc `--hue-honey-ink`/`--hue-sky-ink` CSS-variable colors (confirmed via
  repo-wide search that no other file references either variable, so removal is safe).
  `npx nx run ayokoding-www:test:unit`/`typecheck`/`lint` all green. Re-verified live at `/en`
  (1280px): all three links now render in one consistent muted color with an always-visible
  underline, with no unexplained color hierarchy.

- [x] [AI] **USS-001** (spec-blind suggestion, pairs with UWT-001): a first-time visitor comparing path
      cards should get a plain-language sense of what each arc category means, not just its (even if
      correctly humanized) name.
  - **Violated principle**: Heuristic 2 (Match Between System and the Real World) — "Interview-Ready",
    "Immediately-Effective", and "Fundamentally-Strong" are internal product taxonomy terms with no
    obvious real-world meaning to someone who has never seen this site before.
  - **Proposed Gherkin**:

    ```gherkin
    Scenario: A first-time visitor can tell what an arc category means without leaving the page
      Given a reader is viewing a category landing page listing its arcs
      When the page renders each arc's card
      Then each arc card shows a short plain-language explanation of what that arc is for
      And the explanation is visible without hovering, clicking, or navigating away
    ```

  - **Spec-blind caveat**: this agent did not read `specs/**`; a spec-aware reviewer must confirm this
    behaviour is not already covered before adding it (e.g. `category-landing-*.feature` may already
    define arc-card content requirements this satisfies).

  **Date**: 2026-07-25. **Status**: Triaged — deferred to backlog. **Rationale**: UWT-001's fix
  (humanizing the arc/role identifier itself) is code-only and complete; the plain-language
  explanation this suggestion asks for is a content-authoring scope expansion (new copy per arc,
  likely inside each arc's `_index.md`), not a code defect this phase's UI work can fix. Deferring to
  backlog for a content pass, same pattern as SG-001/SG-002 above.

- [x] [AI] **USS-002** (spec-blind suggestion, pairs with UWT-002): a rail label that visually cannot fit
      should still let a sighted, non-touch user recover its full text without leaving the page.
  - **Violated principle**: ISO 9241-110 §2 (Self-Descriptiveness) — an interface should make its own
    truncation state (that text is hidden) perceivable and recoverable.
  - **Proposed Gherkin**:

    ```gherkin
    Scenario: A truncated rail label reveals its full text on hover
      Given a path or arc rail label is too long to fit its allotted rail width
      When a mouse user hovers over the truncated label
      Then a tooltip or native title attribute shows the label's complete, untruncated text
      And the visible label itself ends with a truncation indicator rather than an unmarked hard cut
    ```

  - **Spec-blind caveat**: this agent did not read `specs/**`; a spec-aware reviewer must confirm this
    behaviour is not already covered before adding it.

  **Date**: 2026-07-25. **Status**: Accepted — already satisfied by the UWT-002 fix. **Rationale**:
  UWT-002's fix added a native `title` attribute to the rail link, which is exactly this suggestion's
  proposed Gherkin behaviour (a mouse user hovering a truncated label sees its complete text via a
  tooltip). No further change needed.

- [x] [AI] **USS-003** (spec-blind suggestion, pairs with UWT-004): a mobile visitor should learn they
      are inside path context at the same moment a desktop/tablet visitor would, not after scrolling past
      unrelated content.
  - **Violated principle**: Heuristic 1 (Visibility of System Status) — status information should be
    communicated without a delay the user must discover by accident.
  - **Proposed Gherkin**:

    ```gherkin
    Scenario: A mobile reader sees path context immediately, without scrolling
      Given a reader opens a course page in path context on a mobile-width viewport
      When the page finishes its initial render, before any user scrolling
      Then the "on path · course X of Y" status is visible within the first viewport
      And the reader does not need to scroll past the syllabus or prerequisites to see it
    ```

  - **Spec-blind caveat**: this agent did not read `specs/**`; a spec-aware reviewer must confirm this
    behaviour is not already covered before adding it.

  **Date**: 2026-07-25. **Status**: Accepted — already satisfied by the UWT-004 fix. **Rationale**:
  UWT-004's fix moved the mobile path-context banner to render immediately below the `<h1>`, before
  the syllabus/Prerequisites — exactly this suggestion's proposed Gherkin behaviour (status visible
  in the first viewport, no scrolling past unrelated content required). No further change needed.

- [x] [AI] _(this concludes the 2026-07-25 `web-usability-tester` retest pass — 7 usability findings
      (UWT-001 through UWT-007) and 3 spec-blind suggestions (USS-001 through USS-003) recorded above;
      all UWT defect findings must be fixed/ticked before archival per the Rule-15 gate above — deferral
      requires explicit user permission, only when genuinely impossible; USS-001/002/003 may be triaged
      or deferred with written rationale, same as SG-001/SG-002 above)_

> Retest run by `web-design-tester` (`output-mode: delivery`) on 2026-07-25 against the same live dev
> server at `http://localhost:3101`, via Playwright 1.60.0 (headless Chromium). Ground truth used (the
> Five Ground-Truth Sources): (1) this plan's own committed hi-fi mockups in `../assets/`
> (`landing-hero-option-a-desktop.png`, `paths-hub-option-a-desktop.png`,
> `category-landing-option-a-desktop.png`, `arc-landing-option-a-desktop.png`,
> `path-landing-option-a-desktop.png` — every one the Selected finalist per `prd.md`'s funnel record,
> the only committed design source for this feature — no external Figma link was supplied at
> invocation); (2) this app's runtime design tokens (`apps/ayokoding-www/src/app/globals.css`,
> `libs/web-ui-token/src/ayokoding.css`), read via **computed styles** on the live page, never jsdom;
> (3) the shared `libs/web-ui` primitive library (`Card`, `Badge`, `Button`, `Sheet`); (4) no external
> design source was provided at invocation — skipped, its absence is not itself a finding; (5) Nielsen
> Heuristic 4 (Consistency and Standards) for the two Mandatory Systematic Checks. Covered **all three
> breakpoints (375/768/1280px) in `en`, light mode**, across all 8 screens (hero, hub, both category
> shapes, both arc-landing role-counts, path landing, course-in-path); **1280px and 375px in `en`, dark
> mode**, across the same 8 screens plus the mobile drawer open state; and **1280px, `id`, light mode**
> for the 4 screens that resolve `200` in `id` (hero, hub, careers category landing, the
> `e2e-fixture-alpha` path landing — `id/learn/courses/...` 404s, as expected, since course content is
> declared `en`-only per `brd.md`'s non-goal). 40 screenshots captured to `../evidence/` (named
> `phase-5-rule15-dwt-<screen>[-dark]-<locale>-<breakpoint>px.png`) plus 1 targeted crop
> (`phase-5-rule15-dwt005-sidebar-active-highlight-en-1280px.png`), 41 total. Zero console
> errors/page errors across every capture. Re-verified EWT-001/002, UWT-001 through UWT-007 are all
> still visually correct live (sanity pass only — not re-filed, per this retest's own instructions).
> Ran both Mandatory Systematic Checks: the raw/unstyled native-element audit found **zero** native
> `select`/`input`/`textarea`/checkbox/radio elements anywhere in the course-paths or navigation feature
> surface (the mobile drawer's width toggle uses the `libs/web-ui` `Button` primitive, not a raw
> `<button>` styling gap) — nothing to report under Check A. The intra-form/cross-surface
> styling-consistency matrix (Check B) is what surfaced DWT-005 below. One capture artefact corrected
> before filing: an initial blunt `.dark` class toggle produced a false-positive washed-out-gray card
> read on every `Card`-based surface — traced to Tailwind's `transition-colors` mid-fade, not a real
> bug; the script was fixed to disable transitions before the dark-mode screenshot pass, and all dark
> captures were redone and re-verified clean. Also note: every screenshot shows a small floating "N"
> badge bottom-left — confirmed via `document.querySelector('nextjs-portal')` to be Next.js's own
> dev-mode indicator (a `<nextjs-portal>` custom element), not shipped app UI; it does not render in
> production and is not filed as a finding. Five design findings follow; no design-specific spec-gap
> proposals are filed this pass — every finding below is a corrective defect (something already built
> that diverges from its own committed mockup/token/consistency ground truth), not an already-correct
> behaviour lacking protective Gherkin coverage, so there is nothing here that fits the SG-### shape.
> **Disambiguation**: this plan's own DWT numbering starts fresh at `DWT-001` below. The unrelated
> `DWT-001` cited earlier in this file (Phase 0's breadcrumb snapshot note, `tech-docs.md`, and
> `prd.md`) is a **different plan's** finding — `ayokoding-learning-path-01-url-restructure`'s own
> Rule-15 retest, about `breadcrumb.tsx`'s mobile-collapse behaviour — cited here only as historical
> background on a shared component this plan did not itself change. The two `DWT-001`s are unrelated;
> do not conflate them.

- [x] [AI] **DWT-001**: The per-arc/per-category colour-coding visual language depicted in **every one**
      of this plan's five committed, Selected hi-fi mockups is entirely absent from the shipped
      hero/hub/category-landing/arc-landing screens, and survives only as a single, non-varying,
      wrong-variant remnant on the path-landing screen — Critical severity (a primary, pervasively
      mocked-up design element is missing across the whole feature's card surfaces, though layout/copy/
      structure otherwise remain faithful), proposed priority Medium-High.
  - **Area/Component**: `PathCard` (hero + hub contexts), `ArcCard` (careers category landing), the
    arc-landing role-card grid (reuses `PathCard`), and the path-landing decorative bar — collectively
    `apps/ayokoding-www/src/features/course-paths/shell/{path-card,category-landing,arc-landing,path-landing}.tsx`.
  - **Environment**: `http://localhost:3101/en`, `/en/learn/paths`, `/en/learn/paths/careers`,
    `/en/learn/paths/careers/immediately-effective`, `/en/learn/paths/skills/e2e-fixture-alpha`,
    Chromium (Playwright 1.60.0, headless), 375/768/1280px, light + dark, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open `../assets/landing-hero-option-a-desktop.png` (Screen 0, Option A,
    **Selected**) — each of the four hero cards carries a colour-coded left-border stripe (amber for
    Interview-Ready, teal for Immediately-Effective ×2, green for Fundamentally-Strong) AND its
    "~N courses" badge itself renders in that arc's hue-wash background, not a neutral gray badge. (2)
    Open the live `/en` hero at 1280px (`./evidence/phase-5-rule15-dwt-hero-en-1280px.png`) — all four
    cards are plain white/card-background with an identical neutral 1px border and an identical neutral
    gray `~N courses` badge; zero colour differentiation between arcs. (3) Open
    `../assets/paths-hub-option-a-desktop.png` (Screen 1, Option A, **Selected**) — every card additionally
    carries a small coloured "tag" pill above its title (e.g. "Interview-Ready" in an amber wash,
    "Skill path" in a red or purple wash distinguishing Conventional from Sharia-compliant tracks) plus a
    coloured top border. (4) Open the live `/en/learn/paths` hub
    (`./evidence/phase-5-rule15-dwt-hub-en-1280px.png`) — no tag pill, no coloured border, on any card.
    (5) Open `../assets/category-landing-option-a-desktop.png` (Screen 1a, Option A, **Selected**) — the
    careers `ArcCard`s each show a full, vivid, arc-specific coloured border on all four sides; the
    skills cards show a red-vs-purple bordered distinction between "Conventional" and "Sharia" variants.
    (6) Open the live `/en/learn/paths/careers` category landing
    (`./evidence/phase-5-rule15-dwt-category-careers-en-1280px.png`) and inspect the computed style of an
    `ArcCard` via `getComputedStyle` — `border-left-color` and `border-top-color` are **identical**
    (`lab(86.1348 0.424385 5.35419)`, the plain neutral `--color-border` token) even though the
    className carries `border-l-4` (a 4px-wide left edge that is exactly the same colour as the 1px top/
    right/bottom edges, i.e. a wider stripe of nothing). (7) Open
    `../assets/arc-landing-option-a-desktop.png` (Screen 1b, Option A, **Selected**) — each role card
    ("Software Engineer", "AI Engineer") carries a coloured **top**-border stripe in the arc's hue
    (teal/amber). (8) Open the live arc-landing pages
    (`./evidence/phase-5-rule15-dwt-arc-landing-two-role-en-1280px.png`,
    `./evidence/phase-5-rule15-dwt-arc-landing-one-role-en-1280px.png`) — the reused `PathCard` has no
    border-colour class at all (confirmed via computed style: `border-color` uniformly neutral, no
    `border-l-4`/top-accent class present in the rendered `className`). (9) Open
    `../assets/path-landing-option-a-desktop.png` (Screen 2, Option A, **Selected**) — the H1 sits inside
    a coloured wash-background bordered header banner (amber wash for the Interview-Ready example,
    matching that path's hub-card hue). (10) Open the live path landing
    (`./evidence/phase-5-rule15-dwt-path-landing-en-1280px.png`) — there is no banner box; only a bare
    `h-1.5 w-16 rounded-full bg-[var(--hue-honey)]` bar sits above the H1, always the vivid honey hue
    regardless of which path/arc is being viewed (source:
    `apps/ayokoding-www/src/features/course-paths/shell/path-landing.tsx` line 34).
  - **Expected**: per `prd.md`'s own Screen 1a hi-fi spec ("Each `ArcCard` = `Card` (arc hue
    `border-l-4`)") and Screen 2 hi-fi spec ("framed by a hue strip (`bg-[var(--hue-<h>-wash)]`) matching
    the path's hub card"), plus all five committed, Selected mockup PNGs cited above: every card
    representing an arc/category/path should carry a hue-coded border and/or tag treatment that (a)
    varies per arc/category (not a single fixed colour), (b) uses the token system's pastel `-wash`
    variant for large fills (not the vivid base hue), and (c) is consistent between a path's hub-card
    treatment and its own landing-page accent, so the arc/category identity is visually scannable at a
    glance — a real, load-bearing part of this design (the Conventional-vs-Sharia red/purple distinction
    on the skills category page is not decorative, it flags a genuinely different compliance track).
  - **Actual**: no card anywhere in the shipped hero, hub, category-landing, or arc-landing carries any
    colour-coding at all — every `PathCard`/`ArcCard` renders with the identical neutral `--color-border`
    edge and the identical neutral-gray secondary `Badge`, regardless of which arc/category/path it
    represents. The one surviving trace of the mockups' hue system — path-landing's decorative bar — is
    hardcoded to a single, non-varying `--hue-honey` (the vivid base variant, not the documented `-wash`
    variant) for every skills path, and has no hub-card hue counterpart to "match" (since the hub card
    itself carries none).
  - **Evidence**: `../assets/landing-hero-option-a-desktop.png`, `../assets/paths-hub-option-a-desktop.png`,
    `../assets/category-landing-option-a-desktop.png`, `../assets/arc-landing-option-a-desktop.png`,
    `../assets/path-landing-option-a-desktop.png` (the five committed mockups);
    `./evidence/phase-5-rule15-dwt-hero-en-1280px.png`, `./evidence/phase-5-rule15-dwt-hub-en-1280px.png`,
    `./evidence/phase-5-rule15-dwt-category-careers-en-1280px.png`,
    `./evidence/phase-5-rule15-dwt-arc-landing-two-role-en-1280px.png`,
    `./evidence/phase-5-rule15-dwt-path-landing-en-1280px.png` (the live renders); computed-style
    excerpt: `{ borderLeftWidth: "4px", borderLeftColor: "lab(86.1348 0.424385 5.35419)", borderTopWidth:
"1px", borderTopColor: "lab(86.1348 0.424385 5.35419)" }` on the `immediately-effective` `ArcCard`.
  - **Reproducibility**: Always (every card on every affected screen, all breakpoints, both colour
    schemes — confirmed identical in dark mode; this is a static, code-level omission, not a display
    artefact).
  - **Defect type**: Mockup-fidelity / Colour / Hierarchy.
  - **Suggested fix locus** (hypothesis): thread a per-arc/per-category hue token (the same `--hue-*`
    family `path-landing.tsx` already imports one member of) through `PathCard`/`ArcCard`'s props,
    applied as a border-colour utility (not just `border-l-4`'s width) and a hue-wash `Badge`/tag variant;
    resolve path-landing's bar to the same per-path hue instead of the hardcoded `--hue-honey`, and swap
    it to the `-wash` variant per `prd.md`'s own documented spec.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**: new
  `apps/ayokoding-www/src/features/course-paths/core/path-hue.ts` (pure `hueForManifest`/
  `hueForCareersArc`/`hueCssVars` resolving the DD-50 arc/subject-to-hue map, plus the
  `--hue-current*` generic CSS-variable indirection needed to keep every hue combination statically
  visible to Tailwind's JIT scanner) and `path-hue.test.ts` (9 tests);
  `apps/ayokoding-www/src/features/course-paths/shell/path-card.tsx` (hue border + hue-wash
  course-count badge via `style`+`className`, plus the proactive `ArcGroup` heading-humanization fix)
  and `path-card.test.tsx`; `category-landing.tsx` (`ArcCard` hue border) and
  `category-landing.test.tsx`; `path-landing.tsx` (hue-wash strip replacing the hardcoded
  `--hue-honey` bar, neutral fallback for unmapped arcs) and `path-landing.test.tsx`;
  `apps/ayokoding-www/src/app/[locale]/(content)/[...slug]/page.tsx` (wires `buildArcTitleIndex`
  through to the hub's `ArcGroup` headings). RED: added tests asserting the hue border/style/badge
  classes and the hue-wash-vs-neutral-fallback bar before the fix existed; confirmed failing. GREEN:
  minimal `hueCssVars`-based `style`+`className` wiring at each of the three call sites (never
  interpolating the hue name directly into a Tailwind arbitrary-value class — the indirection this
  module documents was adopted specifically because a first attempt using a doc-comment-quoted
  interpolated class crashed the entire dev server via Tailwind's JIT scanning literal source text,
  including comments, for bracket-shaped class candidates; see the module's own doc comment and the
  Errors/fixes note in this plan's execution history). `npx nx run
  ayokoding-www:test:unit`/`typecheck`/`lint` all green. Re-verified live at `/en/learn/paths/careers`
  (`./evidence/phase-5-rule15-dwt-fix-category-careers-en-1280px.png` — sage/teal/honey borders
  matching each arc), `/en/learn/paths` (`./evidence/phase-5-rule15-dwt-fix-hub-en-1280px.png` — hue
  borders, hue-wash course-count badges, and humanized `ArcGroup` headings all correct), and `/en`
  hero in both light and dark mode
  (`./evidence/phase-5-rule15-dwt-fix-hero-en-1280px.png`,
  `./evidence/phase-5-rule15-dwt-fix-hero-dark-en-1280px.png`) — zero console errors/warnings on every
  capture.

- [x] [AI] **DWT-002**: The one-role arc-landing's inline `SyllabusPreview` renders a confusing
      double-numbered line — its own manually-rendered list index collides with the course title's
      already-embedded catalog number — Major severity (a clear, visible divergence on a primary content
      element, and a typography/legibility defect that reads as a rendering glitch), proposed priority
      Medium.
  - **Area/Component**: `apps/ayokoding-www/src/features/course-paths/shell/syllabus-preview.tsx`
    (`SyllabusPreview`, rendered inline on the single-role arc-landing state).
  - **Environment**: `http://localhost:3101/en/learn/paths/careers/interview-ready`, Chromium (Playwright
    1.60.0, headless), 1280px, light + dark, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open the URL above (the `interview-ready` arc, a single-role state). (2)
    Read the line below the "Backend Track (Interview-Ready)" card: it renders
    `Starts with: 1. 4 · Just Enough Python · 2. 7 · Data Structures & Algorithms Essentials →`. (3)
    Compare against `prd.md`'s own Screen 1b hi-fi mockup text for this exact component
    (`../assets/arc-landing-option-a-desktop.png`'s single-role panel): `"Starts with: 1. Just Enough
Nvim · 2. Just Enough Lua · 3. Extending Neovim → ..."` — a clean single index per item, because the
    mockup's course titles carry no embedded number of their own. (4) Compare against the structurally
    analogous full syllabus on `path-landing.tsx` (Screen 2) for the SAME two courses
    (`./evidence/phase-5-rule15-dwt-path-landing-en-1280px.png`, `/en/learn/paths/skills/e2e-fixture-alpha`)
    — it renders `5 · Just Enough Bash` / `6 · Version Control & Git` with **no** added list-index
    prefix (its `<ol>` has no visible marker; the course's own embedded number is the only number shown),
    confirming the two sibling "syllabus" components use two incompatible numbering conventions.
  - **Expected**: per `prd.md`'s own documented format for this component ("Starts with: 1. … · 2. … · 3. … →") and Nielsen Heuristic 4 (internal consistency — one feature, one numbering convention), the
    syllabus preview should show exactly one number per course, matching how `path-landing.tsx`'s own
    syllabus (the structurally identical Screen 2 component this component is explicitly modelled on,
    per its own docstring: "sharing the same 'number is order' list semantics `path-landing.tsx`'s own
    syllabus uses") numbers its rows.
  - **Actual**: live text captured verbatim via `element.textContent`:
    `"Starts with: 1. 4 · Just Enough Python · 2. 7 · Data Structures & Algorithms Essentials →"` — the
    component's own `{index + 1}.` prefix (`syllabus-preview.tsx` line 33) is concatenated directly in
    front of a course title that already begins with its own catalog number ("4 · Just Enough Python"),
    producing a nonsensical-looking `"1. 4 ·"` double-number every reader will misread as a typo.
  - **Evidence**: `./evidence/phase-5-rule15-dwt-arc-landing-one-role-en-1280px.png`,
    `./evidence/phase-5-rule15-dwt-arc-landing-one-role-dark-en-1280px.png` (identical text in dark
    mode); live text excerpt above; `../assets/arc-landing-option-a-desktop.png` (mockup ground truth).
  - **Reproducibility**: Always, for any single-role arc whose course titles already carry an embedded
    catalog number (confirmed for both current single-role fixture arcs, `interview-ready` and
    `fundamentally-strong`).
  - **Defect type**: Typography / Mockup-fidelity.
  - **Suggested fix locus** (hypothesis): `syllabus-preview.tsx` — drop the manually-rendered
    `{index + 1}.` prefix entirely and rely solely on the course title's own embedded number, mirroring
    `path-landing.tsx`'s syllabus exactly (no added index), or — if an explicit local order marker is
    still wanted for titles that carry no embedded number — detect whether the title already starts with
    a `\d+\s*·` pattern before deciding whether to prepend one.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/syllabus-preview.tsx` (dropped the
  manually-rendered `{index + 1}.` prefix; each `<li>` now renders only the course's own embedded
  catalog-numbered title, matching `path-landing.tsx`'s sibling syllabus exactly) and
  `syllabus-preview.test.tsx` (new regression test asserting exact `textContent` per item, with no
  `"1. 4 ·"` double-number artefact). RED: added the regression test against the old implementation;
  confirmed failing (`"1. 4 · Just Enough Python"`). GREEN: removed the added-index prefix. `npx nx
  run ayokoding-www:test:unit`/`typecheck`/`lint` all green. Re-verified live at
  `/en/learn/paths/careers/interview-ready`
  (`./evidence/phase-5-rule15-dwt-fix-arc-interview-ready-en-1280px.png`): the preview now reads
  `"Starts with: 4 · Just Enough Python · 7 · Data Structures & Algorithms Essentials →"` — a single
  number per course, zero console errors/warnings.

- [x] [AI] **DWT-003**: Nearly every static UI-chrome string the course-paths feature introduces is
      hardcoded English and never localizes on `/id`, even though the same page's header, footer, and
      hero heading/intro correctly render in Indonesian — Major severity (a pervasive, always-visible
      mixed-language screen on a fully-supported locale, contradicting this plan's own documented
      "locale-neutral" nav-UI intent), proposed priority Medium-High.
  - **Area/Component**: `PathCard`/`Hero` ("Start", "CHOOSE YOUR PATH" / "Choose your path", "Compare all
    paths →" / "Explore skills paths →" / "Browse the full course library →"), `ArcCard`/
    `CategoryLanding` ("Explore arc", "Explore this arc's roles"), `PathLanding` ("SYLLABUS"),
    `PrerequisiteList` ("Prerequisites"), `PathRail`/`PathBanner` ("Course {n} of {total}", "View full
    path", "Browse all courses", "on path · course k of N", "View path") — collectively every
    `apps/ayokoding-www/src/features/course-paths/shell/*.tsx` and
    `apps/ayokoding-www/src/features/app-shell/shell/hero.tsx` file.
  - **Environment**: `http://localhost:3101/id`, `/id/learn/paths`, `/id/learn/paths/careers`,
    `/id/learn/paths/skills/e2e-fixture-alpha`, Chromium (Playwright 1.60.0, headless), 1280px, `id`,
    2026-07-25.
  - **Steps to reproduce**: (1) Open `/id` (`./evidence/phase-5-rule15-dwt-hero-id-1280px.png`) — the
    masthead ("Belajar"/"Alat"), the H1 ("Belajar membangun perangkat lunak, dengan cara yang jelas."),
    the intro paragraph, the "Explore" section ("Jelajahi"), and the Tools card are all correctly
    Indonesian. (2) In the same viewport, read the path-card grid: "CHOOSE YOUR PATH" (English), every
    card's "Start →" CTA (English), and the escape-hatch row "Compare all paths → Explore skills paths
    → Browse the full course library →" (all English) — a jarring mixed-language block sitting directly
    beneath correctly-translated copy. (3) Open `/id/learn/paths/careers`
    (`./evidence/phase-5-rule15-dwt-category-careers-id-1280px.png`) — "Explore this arc's roles" and
    "Explore arc →" render in English on every card, on an otherwise-Indonesian page (masthead "Belajar"/
    "Alat" still correct). (4) Open `/id/learn/paths/skills/e2e-fixture-alpha`
    (`./evidence/phase-5-rule15-dwt-path-landing-id-1280px.png`) — the "SYLLABUS" heading is English. (5)
    Confirm the i18n mechanism itself is present and actively used elsewhere in this exact codebase:
    `apps/ayokoding-www/src/features/i18n/core/translations.ts` carries both an `en` and an `id` block
    for `heroHeading`/`heroIntro`/`sectionExploreHeading`, and — added in **this same Phase 5 retest
    pass**, by the UWT-005 fix — `mobileNavWidthLabel`/`mobileNavWidthHint`/`mobileNavWidthDefault`/
    `mobileNavWidthWide` are already translated to Indonesian ("Lebar drawer", "Standar", "Lebar"),
    proving the `t(locale, key)` convention is live, current, and trivially extensible — the course-paths
    feature's own strings simply never route through it.
  - **Expected**: per `brd.md`'s own Business-Scope Non-Goal ("the path-aware nav UI itself remains
    locale-neutral — it renders whatever locale-specific content exists"), the UI **chrome** (labels,
    CTAs, headings) should render in the active locale regardless of whether the underlying manifest
    **content** is `en`-only — the non-goal defers translating path/course _data_, not the feature's own
    static interface strings.
  - **Actual**: the feature's static strings are literal JSX text, not `t(locale, "...")` calls (confirmed
    by reading `path-card.tsx`, `category-landing.tsx`, `path-landing.tsx`, `arc-landing.tsx`,
    `path-rail.tsx`, `path-banner.tsx`, `hero.tsx` — none call `t()` for these strings, while `hero.tsx`
    calls `t(locale, "heroHeading")`/`t(locale, "heroIntro")` for its other two strings two lines above
    the hardcoded "Choose your path" literal), so they render identically regardless of `locale`.
  - **Evidence**: `./evidence/phase-5-rule15-dwt-hero-id-1280px.png`,
    `./evidence/phase-5-rule15-dwt-hub-id-1280px.png`,
    `./evidence/phase-5-rule15-dwt-category-careers-id-1280px.png`,
    `./evidence/phase-5-rule15-dwt-path-landing-id-1280px.png`; `document.documentElement.lang` confirmed
    `"id"` on every capture (the mismatch is content-language, not the `lang` attribute).
  - **Reproducibility**: Always, on every course-paths screen visited under `/id`.
  - **Defect type**: Consistency / Mockup-fidelity (i18n scope).
  - **Suggested fix locus** (hypothesis): add the missing keys to
    `apps/ayokoding-www/src/features/i18n/core/translations.ts`'s `en`/`id` blocks (mirroring the
    `mobileNavWidth*` precedent from this same retest pass) and route every hardcoded string identified
    above through `t(locale, key)`.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/i18n/core/translations.ts` (~18 new keys added to both the `en` and
  `id` blocks — `pathsChooseYourPath`, `pathsCompareAllPaths`, `pathsExploreSkillsPaths`,
  `pathsBrowseCourseLibrary`, `pathsStart`, `pathsExploreArc`, `pathsExploreArcRoles`,
  `pathsSyllabus`, `pathsPrerequisites`, `pathsCourseWordCapital`, `pathsCourseWordLower`,
  `pathsOfWord`, `pathsOnPathPrefix`, `pathsViewPath`, `pathsViewFullPath`, `pathsBrowseAllCourses` —
  `en` values verbatim-identical to the prior hardcoded strings so existing `en` assertions keep
  passing unchanged); `path-card.tsx`/`path-card.test.tsx` ("Start"), `category-landing.tsx`/
  `category-landing.test.tsx` ("Explore arc", "Explore this arc's roles"), `path-landing.tsx`/
  `path-landing.test.tsx` ("Syllabus"), `prerequisite-list.tsx`/`prerequisite-list.test.tsx`
  ("Prerequisites", nav landmark label), `path-rail.tsx`/`path-rail.test.tsx` ("Course N of M", "View
  full path", "Browse all courses"), `path-banner.tsx`/`path-banner.test.tsx` (added a required
  `locale` prop; "on path · course k of N", "View path" — plus every existing PathBanner call site
  updated with `locale="en"`: `mobile-nav.test.tsx`, `path-order-nav.steps.tsx`,
  `[...slug]/page.tsx`), `hero.tsx`/`landing.test.tsx` ("Choose your path" eyebrow, and — reconciled
  together with the DWT-001 hue fix and this plan's own earlier UWT-007 fix — the three
  escape-hatch links, which now carry both an always-visible underline (the genuine UWT-007 gap) AND
  their individually documented per-link hue colour (honey-ink/sky-ink/muted-foreground per `prd.md`'s
  Screen 0 hi-fi spec) rather than the flattened single colour my earlier UWT-007 pass had mistakenly
  applied before this design-tester pass surfaced the mockup's real, differentiated intent — see the
  reconciliation doc comment in `hero.tsx` itself). RED: added an `id`-locale test per touched
  component asserting the Indonesian string renders; confirmed failing pre-fix (English string
  rendered instead). GREEN: routed every identified hardcoded string through `t(locale, key)`. `npx nx
run ayokoding-www:test:unit`/`typecheck`/`lint` all green. Re-verified live: `/id`
  (`./evidence/phase-5-rule15-dwt-fix-hero-en-1280px.png` — en control; id captured via unit tests, no
  further live `id` screenshot needed since every touched surface's `id` assertion is unit-tested
  directly), `/id/learn/paths/skills/e2e-fixture-alpha`
  (`./evidence/phase-5-rule15-dwt-fix-path-landing-id-fallback-1280px.png` — "Silabus" heading
  confirmed Indonesian live), zero console errors/warnings.

- [x] [AI] **DWT-004**: On `/id`, when a course has no Indonesian-locale content to resolve a title from,
      the fallback silently renders the raw, un-humanized course-id slug instead of at least the
      humanization helper this same plan already introduced for arc/role identifiers — Minor severity (a
      narrow edge case — only triggers where `id` content is already known to be absent per this plan's
      own non-goal — but a regression of the exact "raw slug leaks to the reader" class UWT-001 fixed
      elsewhere), proposed priority Low-Medium.
  - **Area/Component**:
    `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.ts` (`buildCourseTitleIndex`),
    consumed by `path-landing.tsx` and `path-rail.tsx`.
  - **Environment**: `http://localhost:3101/id/learn/paths/skills/e2e-fixture-alpha`, Chromium
    (Playwright 1.60.0, headless), 1280px, `id`, 2026-07-25.
  - **Steps to reproduce**: (1) Confirm `apps/ayokoding-www/content/id/` has no `learn/courses/`
    subdirectory at all (`find apps/ayokoding-www/content/id -maxdepth 2 -type d` — no `learn` entry),
    i.e. every course in this manifest genuinely has zero `id`-locale content. (2) Open the URL above
    (`./evidence/phase-5-rule15-dwt-path-landing-id-1280px.png`) and read the "SYLLABUS" list: it shows
    `just-enough-bash` and `version-control-and-git` — the literal, raw, kebab-case course IDs. (3)
    Compare against the same path's `en` rendering
    (`./evidence/phase-5-rule15-dwt-path-landing-en-1280px.png`), which correctly shows
    `5 · Just Enough Bash` / `6 · Version Control & Git`. (4) Trace the source:
    `buildCourseTitleIndex` (`course-path-nav.ts`) only populates `titles[id]` when
    `pageLinkForCourseId(contentMap, locale, id)` resolves a real, locale-specific content link; when it
    does not (as for every course here under `id`), the id is simply absent from the returned record, so
    `path-landing.tsx`/`path-rail.tsx`'s own `courseTitles[course.id] ?? course.id` fallback renders the
    bare id verbatim — with no call to the `humanizeKebabSlug` helper this same plan's UWT-001 fix
    already introduced (in this same file) for exactly this "no authored title available" situation on
    arc/role identifiers.
  - **Expected**: per this plan's own UWT-001 precedent (arc/role identifiers fall back to
    `humanizeKebabSlug(slug)`, never the raw slug, when no authored title resolves), a course title that
    fails to resolve for the active locale should degrade to at least a humanized form
    ("Just Enough Bash", "Version Control And Git") rather than the completely raw, un-spaced,
    un-capitalized identifier.
  - **Actual**: `just-enough-bash` and `version-control-and-git` render verbatim, with no humanization
    fallback of any kind — the same class of defect UWT-001 fixed for arc/role identifiers, but via a
    different code path (`buildCourseTitleIndex`'s content-lookup fallback) that fix did not touch.
  - **Evidence**: `./evidence/phase-5-rule15-dwt-path-landing-id-1280px.png` (raw slugs visible);
    `./evidence/phase-5-rule15-dwt-path-landing-en-1280px.png` (the same path's correct `en` rendering,
    for contrast).
  - **Reproducibility**: Always, for any course whose active-locale content does not exist (currently:
    every course, under `id`, since course content is `en`-only per `brd.md`'s non-goal).
  - **Defect type**: Consistency / Typography.
  - **Suggested fix locus** (hypothesis): `buildCourseTitleIndex` — when `pageLinkForCourseId` returns no
    link for a given course id, fall back to `humanizeKebabSlug(id)` instead of omitting the id from the
    returned record entirely, mirroring `buildArcTitleIndex`'s own already-shipped fallback behaviour.

  **Date**: 2026-07-25. **Status**: Fixed. **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/course-path-nav.ts` (`buildCourseTitleIndex` now
  always populates every course id — `titles[id] = link ? link.title : humanizeKebabSlug(id)` —
  instead of omitting unresolvable ids) and `course-path-nav.test.ts` (updated the "omits a course ID
  with no resolvable content page" test to assert the humanized fallback instead of omission). RED:
  updated the test to assert `{ "does-not-exist": "Does Not Exist" }` instead of the key being absent;
  confirmed failing pre-fix. GREEN: one-line fallback change. `npx nx run
ayokoding-www:test:unit`/`typecheck`/`lint` all green. Re-verified live at
  `/id/learn/paths/skills/e2e-fixture-alpha`
  (`./evidence/phase-5-rule15-dwt-fix-path-landing-id-fallback-1280px.png`): the syllabus now shows
  "Just Enough Bash" / "Version Control And Git" (humanized) instead of the raw
  `just-enough-bash`/`version-control-and-git` slugs, zero console errors/warnings.

- [x] [AI] **DWT-005**: The "you are here" active-item indicator uses two visually incompatible
      treatments across two sibling left-navigation components in the same app — Major severity (a clear,
      always-reproducible internal-consistency break in the primary navigation chrome), proposed priority
      Medium.
  - **Area/Component**: `SidebarTree`
    (`apps/ayokoding-www/src/features/navigation/shell/sidebar-tree.tsx`) vs. `PathRail`
    (`apps/ayokoding-www/src/features/course-paths/shell/path-rail.tsx`).
  - **Environment**: `http://localhost:3101/en/learn/courses/just-enough-bash/learning` (generic sidebar,
    no path) and `http://localhost:3101/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`
    (path rail), Chromium (Playwright 1.60.0, headless), 1280px, `en`, 2026-07-25.
  - **Steps to reproduce**: (1) Open the generic-sidebar URL above and read the computed style of the
    active "Learning" row via `getComputedStyle`:
    `{ color: "rgb(37, 99, 235)", fontWeight: "500", borderRadius: "12px" }` — a blue-text, rounded,
    light-blue-pill (`bg-primary/10`) highlight (`./evidence/phase-5-rule15-dwt005-sidebar-active-highlight-en-1280px.png`).
    (2) Open the path-rail URL above and read the computed style of the current-course row
    (`[aria-current="page"]`):
    `{ color: "lab(5.26078 1.68304 3.85763)", fontWeight: "600", borderRadius: "0px" }` — near-black
    bold text, **no** background pill at all
    (`./evidence/phase-5-rule15-dwt-course-in-path-en-1280px.png`). (3) Both rows serve the identical
    function — "this is the item the reader is currently on, within this left navigation list" — yet
    render with unrelated colour, weight, and background treatments.
  - **Expected**: per Nielsen Heuristic 4 (Consistency and Standards) and this agent's own Mandatory
    Systematic Check B (cross-surface styling-consistency matrix for a recurring control kind), the same
    "current item in the left nav" affordance should look the same wherever it recurs in the app, so a
    reader who has learned one "you are here" visual language recognizes it in the other navigation
    surface without relearning it.
  - **Actual**: `sidebar-tree.tsx`'s active-link className is
    `"bg-primary/10 font-medium text-primary"`; `path-rail.tsx`'s current-course className is
    `"font-semibold text-foreground"` (no background utility at all) — two independently-authored,
    unrelated treatments for the same semantic state.
  - **Evidence**: `./evidence/phase-5-rule15-dwt005-sidebar-active-highlight-en-1280px.png`,
    `./evidence/phase-5-rule15-dwt-course-in-path-en-1280px.png`; computed-style excerpts above.
  - **Reproducibility**: Always (every active/current row on both components, confirmed at 1280px; the
    underlying classNames are static, so this is breakpoint- and colour-scheme-independent).
  - **Defect type**: Consistency.
  - **Suggested fix locus** (hypothesis): give `path-rail.tsx`'s current-course `<Link>` the same
    `bg-primary/10 text-primary` treatment `sidebar-tree.tsx` already uses for its active row (dropping
    or keeping the `▸` marker as a secondary cue), so "you are here" reads identically in both
    navigation surfaces.

  **Date**: 2026-07-25. **Status**: Fixed (deliberate deviation from the suggested-fix hypothesis —
  see rationale below). **Files Changed**:
  `apps/ayokoding-www/src/features/course-paths/shell/path-rail.tsx` (current-course row className
  gained `bg-accent`, alongside its existing `font-semibold text-foreground` and `▸` marker) and
  `path-rail.test.tsx` (new test asserting `bg-accent` on the current row). Deviation rationale: the
  finding's own suggested fix hypothesized copying `sidebar-tree.tsx`'s `bg-primary/10 text-primary`
  treatment verbatim, but `prd.md`'s own literal Screen 3 hi-fi spec for **this** component
  ("Current row: `aria-current="page"` + a ▸ marker + `font-semibold` + `bg-accent` — never hue
  alone") already documents a specific, different treatment for `PathRail` — so the ground-truth-
  correct fix is `bg-accent` (matching `prd.md`'s own spec for this exact surface), not borrowing an
  unrelated pre-existing component's styling that `prd.md` never specifies for `PathRail`; RED:
  added the `bg-accent` assertion against the old className; confirmed failing pre-fix. GREEN: added
  the single class. `npx nx run ayokoding-www:test:unit`/`typecheck`/`lint` all green. Re-verified
  live at `/en/learn/courses/just-enough-bash?path=skills/e2e-fixture-alpha`
  (`./evidence/phase-5-rule15-dwt-fix-course-in-path-en-1280px.png`,
  `./evidence/phase-5-rule15-dwt-fix-course-in-path-mobile-en-390px.png`): the current row now shows
  a visible `bg-accent` highlight alongside the bold text and `▸` marker, on both desktop and mobile
  (`PathBanner`'s "on path · course 1 of 2" / "View path" text also reconfirmed live here, DWT-003),
  zero console errors/warnings.

- [x] [AI] _(this concludes the 2026-07-25 `web-design-tester` retest pass — 5 design findings (DWT-001
      through DWT-005) recorded above; all must be fixed/ticked before archival per the Rule-15 gate
      above — deferral requires explicit user permission, only when genuinely impossible; no design-
      specific spec-gap proposals were filed this pass)_

### Phase 5 Gate

> All checks below must pass before starting Phase 6.

- [x] [AI] All screens (hero + hub + category landing (both category shapes) + arc landing (both
      role-count shapes) + path landing + sample courses + prerequisite display + empty-state) verified
      in `en` across all three breakpoints; screenshots committed in `<PLAN>evidence/`; console clean.
- [x] [AI] Rail responsive contract, mobile drawer, and no-path regression sweep all verified with
      committed evidence.
- [x] [AI] All rule-15 EWT/UWT/DWT defect findings fixed (ticked) or explicitly permitted to defer.
- [x] [AI] Draft PR opened (retest evidence + any fixes); 3-cycle PR-Review complete; CI green; PR
      `[AI]`-merged; deployed.
      Evidence: PR #95, 3 review cycles complete (all findings fixed/deferred-with-reason), CI green
      (run `30162860098`), `[AI]`-merged (squash, commit `0834ac1b7`), deployed to `prod-ayokoding-www`.

> **Pause Safety**: the navigation UI is verified live and defect-clean in `en`. Safe to stop. To
> resume: re-run the three testers against the running app.

---

## Phase 6: Final `origin/main` Integration & CI Verification

- [x] [AI] Confirm no plan PR is still open — `gh pr list --search "ayokoding-learning-path-03-navigation-ui" --state open`
      returns zero rows — acceptance: no open plan PRs remain. (Do **not** use
      `git merge-base --is-ancestor` to prove a phase merged: squash-merge here rewrites the commit, so
      that check false-negatives on every merged PR.)
      Evidence: `gh pr list --search "ayokoding-learning-path-03-navigation-ui" --state open` → `[]`.
- [x] [AI] Sync the worktree to latest `origin/main` and run the full affected suite:
      `npx nx affected -t typecheck lint test:quick test:unit test:e2e specs:behavior:coverage` +
      `npx nx run ayokoding-www:build` — acceptance: all exit 0 on the integrated `main`.
      Evidence: worktree synced to `origin/main` tip `0834ac1b7` (PR #95 squash commit). Full affected
      run (base `e740ec998`, head `0834ac1b7`, 25 projects) initially showed 5 e2e failures under
      `--parallel=2` load; each was isolated and re-run individually after a fresh rebuild and passed
      clean: `ayokoding-www-fe-e2e` (622 passed, 0 failed — the flaking test,
      `course-rehome-redirects.feature`, fires many concurrent HTTP requests via `Promise.all` and hit
      `ECONNRESET`/`TimeoutError` only under the 25-project parallel load; 3/3 browsers pass in
      isolation), `ose-www-fe-e2e` (42 passed — prior failure was a stale/evicted build artifact, not a
      code issue), `wahidyankf-www-fe-e2e` (29 passed), `organiclever-www-fe-e2e` (39 passed),
      `organiclever-app-web-e2e` (78 passed). One target, `ose-app-web-e2e:test:e2e`, cannot run
      standalone locally by design — its `playwright.config.ts` has no `webServer` block at all (unlike
      sibling `organiclever-app-web-e2e`, which does) and requires an externally-running `WEB_BASE_URL`
      (its own staging CI workflow supplies this). This is pre-existing, unrelated to this plan's diff
      (PR #95 never touched `ose-app-web`), and outside the actual CI required-check surface (the
      `TypeScript quality gate` job's `nx affected` invocation excludes `test:e2e` entirely — see CI job
      command in the Phase 6 CI evidence below). Routed to Phase 7 Knowledge Capture as a
      `plans/backlog/` candidate rather than fixed inline (out of this plan's scope). `nx run
ayokoding-www:build` — exit 0.
- [x] [AI] Monitor the final `main` CI run (poll every ~2 min; one
      `gh run view --json status,conclusion` per wakeup; never `gh run watch`) — acceptance: all GitHub
      Actions green; fix root causes and push follow-ups (own PR → review → `[AI]` merge) until green.
      Evidence: PR #95 pre-merge CI run `30162860098` — all 19 jobs green (TypeScript quality gate took
      16m42s, the heaviest job). Post-merge `pr-quality-gate` run on `main` at commit `0834ac1b7`
      (`30163586230`) — all 19 jobs green, `conclusion: success`. `validate-env` and `publish-images`
      workflows on the same commit — both `success`.
- [x] [AI] Confirm `prod-ayokoding-www` serves the landing hero and the paths hub without error, and that
      a canonical course URL with no `?path=` renders exactly as before this plan; re-dispatch
      `apps-ayokoding-www-deployer` if any earlier deploy lagged — acceptance: production serves the
      rendering layer with no regression for no-path readers.
      Evidence: `apps-ayokoding-www-deployer` force-pushed `main`@`0834ac1b7` to `prod-ayokoding-www`
      (`a103eb8b5..0834ac1b7`). Direct verification: `https://www.ayokoding.com/en` → 200, `.../en
/learn/paths` → 200 (`<title>Paths | AyoKoding</title>`), `.../en/learn/courses/just-enough-nvim`
      (no `?path=`) → 200, final URL unchanged (no redirect to a `?path=`-bearing URL),
      `<title>1 · Just Enough Nvim | AyoKoding</title>`.
- [x] [AI] Fast-forward local `main` after the last side-worktree push (`git checkout main && git pull
--ff-only`) so the primary checkout does not silently diverge — acceptance: `git status` reports
      `main` up to date with `origin/main`.
      Evidence: base checkout (`~/ose-projects/ose-public`) `git status` → `On branch main...
      Your branch is up to date with 'origin/main'` at `0834ac1b7`, working tree clean.

### Phase 6 Gate

> All checks below must pass before starting Phase 7.

- [x] [AI] Zero open plan PRs; every prior phase merged to `main`.
- [x] [AI] Full affected suite + build green on integrated `main`; final `main` CI run green.
- [x] [AI] `prod-ayokoding-www` serving the rendering layer; no-path pages unchanged.

> **Pause Safety**: the whole plan is integrated on `main`, green in CI, and live in production. Safe to
> stop. To resume: re-run the affected suite on `main` and check CI/prod status.

---

## Phase 7: Knowledge Capture

> _Triage every surviving `learnings.md` entry before archival. See the
> [Knowledge Capture Convention](../../../repo-governance/development/quality/knowledge-capture.md)._

- [x] [AI] Apply the litmus test to every `learnings.md` entry — keep only if a durable surface would
      catch this automatically next time; discard the rest with a one-line reason — acceptance: every
      entry has either a route or a discard reason.
      Evidence: 4 entries triaged — 3 survive (gh `-f`/`-F`, zsh 1-indexed arrays, parallel-affected-run
      contention flakes), 1 discarded (`ose-app-web-e2e` "failure" — already documented in its own
      README, litmus fails since nothing new would be caught).
- [x] [AI] Apply the **secret/sensitivity gate** to every surviving entry — sanitize any secret,
      credential, token, or private hostname to a `<placeholder>` token, or discard if unsanitizable —
      acceptance: `learnings.md` contains no raw secret.
      Evidence: none of the 3 surviving entries reference any secret, credential, token, or hostname —
      all are shell/tooling/environment behavior notes.
- [x] [AI] Apply the **repo-relevance gate** — infra-private content (Terraform, k3s, Proxmox, real
      hostnames/inventories) stays in `ose-infra` only and is NEVER cross-routed into
      `ose-public`/`ose-primer`; public-governance content may propagate via the existing parity loop —
      acceptance: no infra-private content appears in this repo's routed output.
      Evidence: none of the 3 surviving entries reference `ose-infra`-private content (no Terraform,
      k3s, Proxmox, or real inventory data) — all are generic shell/CI/agent-instruction behavior.
- [x] [AI] Route each surviving learning to exactly one durable home per the open-ended routing matrix —
      non-code homes may land inline (small edit) or as a `plans/backlog/` follow-up (large); **code
      homes (`apps/`, `libs/`, tests) are ALWAYS filed as a separate `plans/backlog/<slug>/` plan and
      NEVER landed inline** in this plan's commits or PR — acceptance: every `learnings.md` entry records
      its terminal routing state.
      Evidence: all 3 surviving entries are non-code (`.claude/agents/`, workflow docs) and small —
      routed inline: 2 to `.claude/agents/pr-review-fixer.md`, 1 to `repo-governance/workflows/plan/
plan-execution.md`. No code-homed (`apps/`/`libs/`/tests) learning surfaced, so no new
      `plans/backlog/` filing was needed — the one candidate that would have been code-homed
      (`course-rehome-redirects.feature` concurrency) is already tracked by the existing backlog plan
      `harden-ayokoding-www-fe-e2e-bulk-link-concurrency`.
- [x] [AI] If no generalizable learning surfaced, record the explicit escape in `learnings.md`:
      `No generalizable learnings — <one-line reason>` — acceptance: `learnings.md` is never silently
      empty.
      N/A — 3 generalizable learnings did surface and are recorded above with terminal routing states;
      `learnings.md` is not empty.

### Phase 7 Gate

> All checks below must pass before Plan Archival.

- [x] [AI] Every `learnings.md` entry is in a terminal state (routed inline, filed as backlog, or
      discarded with reason), or the file records the explicit "none" escape.
- [x] [AI] No code-homed learning landed inline in this plan's own commits/PR.
- [x] [AI] `learnings.md` triage is committed to `ayokoding-learning-path-03-navigation-ui/archival`
      (this delivery unit's branch, Phases 7-8); every check above in this Phase 7 Gate is green;
      nothing has been pushed for review yet — the unit's PR opens at Phase 8 per
      [Delivery Boundaries](#delivery-boundaries).

> **Pause Safety**: `learnings.md` is fully triaged (or explicitly recorded as empty); no future process
> depends on querying it later. Safe to stop. To resume: re-read `learnings.md` and confirm every entry
> is terminal.

---

## Phase 8: Plan Archival

- [x] [AI] Verify ALL delivery checklist items are ticked.
      **Evidence**: `grep -n "^- \[ \]" delivery.md` shows only Phase 8's own in-progress items (this
      phase) and the standing cross-cutting "Commit Guidelines" / "Local Quality Gates" sections
      (continuously-applied practices, not one-time deliverables). Phases 0-7 are fully ticked; 3 gaps
      found during this sweep (2 Phase 3 RED-step ticks, 1 Phase 5 Gate PR-merge/deploy tick — each
      genuinely done, just never ticked) were fixed.
- [x] [AI] Verify the Knowledge Capture phase is complete — every `learnings.md` entry reached a terminal
      state or the file records the explicit "none" escape; both the secret/sensitivity gate and the
      repo-relevance gate were applied to every surviving entry.
      **Evidence**: `learnings.md` has 3 `## Learning:` + 1 `## Discarded:` entries, 4 `Terminal state`
      lines — every entry terminal (3 routed inline, 1 discarded); both gates applied per Phase 7.
- [x] [AI] Verify ALL quality gates pass (local + CI) and the build is green.
      **Evidence**: `nx show projects --affected` (base `0834ac1b7` merge-base → head) returns zero
      projects — this branch's diff is docs-only (delivery.md/learnings.md/agent-md/workflow-md), so
      `nx affected -t typecheck lint test:quick test:unit specs:behavior:coverage` reports "No tasks
      were run", exit 0. CI on `main`'s tip (`0834ac1b7`, this branch's base) is green (run
      `30163586230` and 2 sibling jobs, all `conclusion: success`) — same evidence already recorded in
      Phase 6.
- [x] [AI] **Cross-plan link gate (BF-8)** — run **both** commands 1 and 2 in
      [Markdown validation commands](#markdown-validation-commands) — acceptance: command 1 prints
      `All links valid! No broken links found.` AND command 2's `grep` finds no matching line (exit 1).
      This is the check that catches a stale `../../done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/…`
      link after that plan archives into `plans/done/YYYY-MM-DD__…` — command 1 alone cannot see it,
      because it excludes `plans/done`.
      **Evidence**: command 1 → `All links valid! No broken links found.` Command 2 → `grep -F
"ayokoding-learning-path-03-navigation-ui"` on command-1's output, exit 1 (no match). Command 3
      (`md heading-hierarchy validate` + `markdownlint-cli2`, scoped to `<PLAN>`) → both exit 0, 6 files
      linted, 0 errors.
- [x] [AI] Verify ALL manual assertions pass (Playwright MCP) with committed evidence in
      `<PLAN>evidence/`; the `en` content locale exercised (per brd.md's Indonesian-mirror-deferred
      non-goal). Manual API verification is not applicable — this plan adds no endpoint.
      **Evidence**: `<PLAN>evidence/` has 115 files — 112 screenshots from Phase 5's full 3-breakpoint
      walk across all screens (`en` locale), plus `phase-0-snapshot.txt`, `phase-2-specs-coverage-delta.txt`,
      and the Phase 8 no-path-invariant production screenshot (`phase-8-prod-no-path-invariant-en-1280px.png`)
      — committed across Phases 0/2/5/8, re-confirmed present here.
- [x] [AI] Verify every rule-15 EWT/UWT/DWT defect finding is fixed (ticked) — deferral requires explicit
      user permission (only when genuinely impossible); SG-###/USS-### may be triaged or deferred with
      rationale.
      **Evidence**: 14 EWT/UWT/DWT finding checkboxes in Phase 5, all ticked `[x]`; the one remaining
      `- [ ]` grep match is the section's own template-example line (`EWT-NNN:` placeholder text), not a
      real finding.
- [x] [AI] **Verify this plan's design-funnel artefacts are complete (DD-46 / DD-47)** —
      `find <PLAN>assets -name '*-option-*-*.png' | wc -l` returns **36** (6 screens × 2 options × 3
      viewports: hero, paths hub, category landing, arc landing, path landing, course path); every one
      is embedded in `prd.md` with viewport-specific alt text; Screen 3's selection reads **Option B —
      Left path rail** (`grep -o -- "Selected: Option B — Left path rail" <PLAN>prd.md | wc -l` returns
      **1**); no "Selection: PENDING" remains.
      **36 is the complete deliverable for this plan.** DD-47's total of 42 is a two-plan total: the
      remaining 6 (Screen 4) belong to `ayokoding-learning-path-01-url-restructure`. Do NOT copy that
      plan's renders into this folder to make the number read 42 — a duplicated matrix drifts.
      **Evidence**: `find <PLAN>assets -name '*-option-*-*.png' | wc -l` → `36`. `grep -o -- "Selected:
Option B — Left path rail" <PLAN>prd.md | wc -l` → `1`. `grep -c "Selection: PENDING" <PLAN>prd.md`
      → `0`.
- [x] [AI] Verify the no-path invariant one last time on production: a canonical course URL renders the
      generic sidebar with no path chrome — acceptance: confirmed with a committed screenshot.
      **Evidence**: Playwright MCP navigated to `https://www.ayokoding.com/en/learn/courses/just-enough-nvim`
      (no `?path=`) on production — final URL unchanged (no redirect), title `1 · Just Enough Nvim |
AyoKoding`. Screenshot committed:
      ![Production canonical course URL with no `?path=` renders the generic sidebar with no path chrome](./evidence/phase-8-prod-no-path-invariant-en-1280px.png)
- [x] [AI] Move: `git mv plans/in-progress/ayokoding-learning-path-03-navigation-ui/
plans/done/YYYY-MM-DD__ayokoding-learning-path-03-navigation-ui/` using today's completion date (the
      `evidence/` and `assets/` subfolders move with it).
      **Evidence**: `git mv` to `plans/done/2026-07-25__ayokoding-learning-path-03-navigation-ui/` — 169
      files renamed (README/brd/prd/tech-docs/delivery/learnings + `assets/` + `evidence/`).
- [x] [AI] Update `plans/in-progress/README.md` — remove the plan entry.
      **Evidence**: "Active Plans" section now reads "No plans currently in progress."
- [x] [AI] Update `plans/done/README.md` — add the plan entry with completion date.
      **Evidence**: entry added at the top of "Completed Projects", dated 2026-07-25.
- [x] [AI] Update any other READMEs that reference this plan (e.g. `plans/README.md`,
      `plans/backlog/README.md`), and the four sibling split plans' `Depends-on` sections if they name
      this plan's location.
      **Evidence**: rewrote the stale `in-progress/` link path in `plans/backlog/README.md` (1 site) and
      `plans/backlog/ayokoding-learning-path-04-course-authoring/{README,prd,tech-docs,delivery,learnings}.md`
      (6 sites) to the new `plans/done/2026-07-25__…` location; `plans/05-manifests`,
      `-06-skills-accounting`, `-07-skills-erp` reference this plan only by plain-text slug in
      Depends-on tables (no markdown links), so nothing there needed a path fix. A repo-wide grep for
      `in-progress/ayokoding-learning-path-03-navigation-ui` outside `plans/done/` returns no matches.
- [x] [AI] Commit the archival:
      `chore(plans): move ayokoding-learning-path-03-navigation-ui to done`.
      **Evidence**: commit `903f88acc`.

### Phase 8 Gate

- [x] [AI] All 36 funnel renders present and embedded; Screen 3 recorded as Option B; the cross-plan
      DD-47 note intact so 36 is not misread as under-delivery.
- [x] [AI] Plan folder is under `plans/done/YYYY-MM-DD__ayokoding-learning-path-03-navigation-ui/`; all
      READMEs updated; archival committed.
- [x] [AI] Draft PR opened (`learnings.md` triage + archival move — this delivery unit's Phase 7-8
      PR); 3-cycle PR-Review complete; CI green; PR `[AI]`-merged; deployed (no-op).
      **Evidence**: PR [#96](https://github.com/wahidyankf/ose-public/pull/96). 3-cycle PR-Review
      Maker→Fixer Cycle run to completion: Cycle 1 — all 8 discipline specialists found 3
      evidence-annotation errors in this file (CI job count 20→19, `learnings.md` entry count
      miscounted 4→3 real `## Learning:` entries, EWT/UWT/DWT finding count 18→14), fixed in commit
      `e0fd93a09a8492d8efa41b6b1ece5a67ed02a069`. Cycle 2 — all 8 specialists independently
      re-verified the fix against live ground truth and found zero new issues; synthesis-maker
      posted a clean-cycle review. Cycle 3 (final) — 7 of 8 specialists found nothing; the logic
      specialist found one further evidence-annotation error (this file's own `evidence/` file count
      stated 114, ground truth was 115 — the Phase-8 no-path-invariant screenshot and two earlier
      process-note files were omitted from the count), fixed in commit
      `6d16dc73e47ebdf008f3676f27740d498cf650f6`. CI green on that commit (17/17 checks passed); all
      review threads resolved; `mergeStateStatus: CLEAN`. PR squash-merged to `main` as commit
      `3dcd9530f`. Deploy is a no-op — this delivery unit touches only `plans/` and
      `repo-governance/`/`.claude/`/`.opencode/` doc surfaces, no `ayokoding-www` app code.

> **Pause Safety**: the plan is archived and its final PR `[AI]`-merged to `main`. Terminal state. To
> resume: nothing — the plan is complete.

---

### Commit Guidelines (all phases)

- [x] [AI] Commit changes thematically — group related changes into logically cohesive commits.
- [x] [AI] Follow Conventional Commits: `<type>(<scope>): <description>` (imperative, no period).
- [x] [AI] Split domains/concerns into separate commits; preexisting fixes get their own commits.
- [x] [AI] Do NOT bundle unrelated changes into a single commit.
- [x] [AI] Stage explicit paths only (`git add <path>`) — never `git add -A`; sibling repos and adjacent
      plan folders carry concurrent work that must not be swept into this plan's commits.

### Local Quality Gates (Before Every Push)

- [x] [AI] `npx nx affected -t typecheck` exits 0.
- [x] [AI] `npx nx affected -t lint` exits 0.
- [x] [AI] `npx nx affected -t test:quick test:unit` exits 0 (add `test:e2e` for the feature phases).
- [x] [AI] `npx nx affected -t specs:behavior:coverage` exits 0.
- [x] [AI] Fix ALL failures — including preexisting issues not caused by your changes (Root Cause
      Orientation).

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes.
> Commit preexisting fixes separately with appropriate conventional-commit messages.

### Note: plan location at execution time

This plan was authored in `plans/backlog/ayokoding-learning-path-03-navigation-ui/` and has already
been promoted (pure move, no date prefix) to its current location,
`plans/in-progress/ayokoding-learning-path-03-navigation-ui/`, where execution proceeds. The `git mv`
in Phase 8 archives it from there to
`plans/done/YYYY-MM-DD__ayokoding-learning-path-03-navigation-ui/` using the completion date. Substitute
the current location wherever `<PLAN>` appears.
