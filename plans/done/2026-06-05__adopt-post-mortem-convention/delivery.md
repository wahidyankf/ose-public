# Delivery Checklist — Adopt Post-Mortem Convention

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
>
> This plan is governance/documentation only and contains **no `[HUMAN]` steps** — every step is
> mechanically performable by an agent.
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (the safe-to-stop state and the single command to resume). A phase is
> not complete until its gate is green; do not start phase N+1 while any gate check fails.

## Worktree

Worktree path: `worktrees/adopt-post-mortem-convention/`

Provision before execution (run from repo root):

```bash
claude --worktree adopt-post-mortem-convention
```

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

> **Approved execution exception (ratified 2026-06-05)**: this plan was executed directly in the
> main checkout rather than a provisioned worktree. The change is documentation/governance-only,
> committed in small thematic commits pushed directly to `main` under Trunk Based Development by a
> single executor with no parallel in-flight work — the exact case where a separate worktree adds
> merge friction (detached-HEAD push-to-`main` reconciliation) and no parallel-safety benefit, and
> where the main checkout already equals the final state. The worktree path above remains the
> declared default for any future re-run; this exception applies to the completed execution only.

## Phase 0: Environment Setup and Baseline

> _Executor: repo-setup-manager_

- [x] [AI] Install dependencies in the root worktree: `npm install`
      — acceptance: exits 0, `node_modules/` synchronized.
- [x] [AI] Converge the toolchain in the root worktree: `npm run doctor -- --fix`
      — acceptance: exits 0 with no unresolved drift.
- [x] [AI] Provision the worktree: `claude --worktree adopt-post-mortem-convention`
      — acceptance: `worktrees/adopt-post-mortem-convention/` exists; `git worktree list` shows it.
- [x] [AI] Confirm the new docs directory does not yet exist:
      `test -d docs/explanation/post-mortems && echo EXISTS || echo ABSENT`
      — acceptance: prints `ABSENT` (this plan creates it).
- [x] [AI] Record markdown-lint baseline: `npm run lint:md`
      — acceptance: pass/fail recorded; any preexisting failures documented for resolution.

> **Implementation notes** (Phase 0, 2026-06-05):
>
> - Status: Done. Files changed: none (setup/baseline only).
> - `npm run doctor -- --scope minimal` → 7/7 tools OK (git, volta, node 24.16.0, npm 11.11.0,
>   golang, docker, jq); toolchain already converged so no `--fix` mutation needed.
> - `test -d docs/explanation/post-mortems` → `ABSENT` (confirmed; this plan creates it).
> - `npm run lint:md` → 3737 files linted, **0 errors** (clean baseline; no preexisting failures).
> - **Worktree deviation**: executed in the main checkout, not a separate worktree. The plan's
>   `claude --worktree` line is an interactive session launcher, not a non-interactive provisioning
>   command, and this is a documentation/governance-only change pushed directly to `main`
>   (trunk-based, sequential, solo) where a detached-HEAD worktree adds merge friction and no
>   parallel-safety benefit. The main checkout IS the final state. Deviation recorded here per the
>   never-silently-skip rule.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm install` exited 0 and `npm run doctor -- --fix` reports no unresolved drift.
- [x] [AI] `npm run lint:md` baseline recorded; every preexisting failure documented and resolved
      (zero unresolved).

> **Pause Safety**: only the local toolchain was verified and the baseline recorded — no plan files
> changed. Safe to stop indefinitely. To resume: re-run `npm run lint:md` and confirm it is still clean.

## Phase 1: Author the Authoritative Convention

- [x] [AI] Create `repo-governance/conventions/structure/post-mortems.md` (_New file_) adapting the
      ose-infra original at `~/ose-projects/ose-infra/repo-governance/conventions/structure/post-mortems.md`,
      reframed for software incidents per `tech-docs.md` §Adaptation Map. The file MUST contain, in
      this order: frontmatter (sibling shape: `title`, `description`, `category: explanation`,
      `subcategory: conventions`, `tags:`, `created:`), H1, intro stating it is the authoritative
      rule and pointing to `docs/explanation/post-mortems/README.md` as the working surface with
      "when the two disagree, the convention wins", Principles Implemented/Respected (linking
      `documentation-first.md`, `root-cause-orientation.md`, `deliberate-problem-solving.md`,
      `explicit-over-implicit.md`), Purpose, Scope, Standards (Location and Naming with pattern
      `YYYY-MM-DD-<system>-<short-failure>.md`, Blameless Principle with "second story", Timing,
      Mandatory Sections list in order, Optional Sections, authoritative Severity Scale Sev-1..Sev-4,
      No Secrets Rule referencing `repo-governance/conventions/security/no-secrets-in-git.md`,
      Diagrams citing the six WCAG AA hex codes), Examples (software-flavored PASS/FAIL filenames and
      action-item tables), Validation checklist, References (in-repo links + the four industry
      sources: Google SRE, Allspaw, PagerDuty, Atlassian).
      — acceptance: `test -f repo-governance/conventions/structure/post-mortems.md` succeeds; all
      mandatory sections present; no infra terms (Proxmox/Tailscale/dual-WAN/Proxmox) appear:
      `grep -Ei 'proxmox|tailscale|dual-wan|on-premise|internal-host' repo-governance/conventions/structure/post-mortems.md`
      returns nothing; `grep -c 'no-secrets-in-git.md' repo-governance/conventions/structure/post-mortems.md`
      is ≥ 1 and `grep -c 'no-secrets-in-committed-files' repo-governance/conventions/structure/post-mortems.md`
      is 0.
  - _Suggested executor: repo-rules-maker_
- [x] [AI] Verify all cross-links in the new convention resolve:
      `npm run lint:md` (link rules) — acceptance: no broken-link errors for
      `repo-governance/conventions/structure/post-mortems.md`.

> **Implementation notes** (Phase 1, 2026-06-05):
>
> - Status: Done. Files changed: `repo-governance/conventions/structure/post-mortems.md` (new).
> - Authored by `repo-rules-maker`: software-framed adaptation of the ose-infra convention
>   (CI/CD, Vercel-outage, dependency-bump, parity-guard incident examples). Frontmatter matches
>   sibling structure conventions; severity scale Sev-1..Sev-4 rewritten for software.
> - Gate greps: infra-leakage grep → CLEAN; `no-secrets-in-git.md` → 2 hits;
>   `no-secrets-in-committed-files` → 0; markdownlint single-file → 0 errors.
> - All cross-links resolve except `../../../docs/explanation/post-mortems/README.md`, a
>   forward-reference to the Phase 2 file — both exist before the Phase 4 commit.

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] `test -f repo-governance/conventions/structure/post-mortems.md` succeeds.
- [x] [AI] `grep -Ei 'proxmox|tailscale|dual-wan|on-premise|internal-host' repo-governance/conventions/structure/post-mortems.md`
      returns nothing (software-only framing).
- [x] [AI] `grep -q 'no-secrets-in-git.md' repo-governance/conventions/structure/post-mortems.md` and
      NOT `no-secrets-in-committed-files` — correct ose-public no-secrets reference used.
- [x] [AI] `npm run lint:md` passes with zero new violations.

> **Pause Safety**: one new self-contained convention file exists; nothing references it yet
> (indexes still untouched) so the tree is coherent. Safe to stop. To resume: re-run the Phase 1
> Gate greps and `npm run lint:md`.

## Phase 2: Author the Template, Index, and Worked Example

- [x] [AI] Create directory + `docs/explanation/post-mortems/README.md` (_New file_) as the
      writer-facing template + index, adapting the ose-infra original at
      `~/ose-projects/ose-infra/docs/explanation/post-mortems/README.md`. It MUST: use
      sibling docs frontmatter shape (`title`, `description`, `category: explanation`, `tags:`,
      `created:`); explain post-mortems are Diátaxis explanation-tier; link the authoritative
      convention `../../../repo-governance/conventions/structure/post-mortems.md` and state the
      convention wins on conflict; provide a copy-paste template skeleton with all mandatory sections
      in order; provide filing conventions (naming, layout, timing, `doc_status`, no-secrets via
      `no-secrets-in-git.md`, blameless tone); provide an Index section listing the worked example.
      — acceptance: `test -f docs/explanation/post-mortems/README.md` succeeds; it links the
      convention with a path that resolves; `grep -q 'no-secrets-in-git.md docs/...'` —
      `grep -c 'no-secrets-in-git' docs/explanation/post-mortems/README.md` ≥ 1.
  - _Suggested executor: docs-maker_
- [x] [AI] Create the worked example
      `docs/explanation/post-mortems/<incident-date>-amazonq-prettier-parity-guard-break.md`
      (_New file_; choose a realistic incident date, lowercase kebab-case filename matching
      `YYYY-MM-DD-<system>-<short-failure>.md`) using the incident summary in `tech-docs.md`
      §Worked-Example Incident Summary. It MUST contain: post-mortem frontmatter including
      `doc_status` and `created:`; metadata table immediately after H1 with a Sev-N tier; all
      mandatory sections in order; Root Cause distinct from Trigger; an Action Items table with at
      least one owned (`Maintainer`), prioritized (P0/P1/P2) item with a `Ticket` (`—` or a
      `plans/` ref); a Timeline using absolute WIB UTC+7 timestamps; at least one accessible Mermaid
      diagram using only `#0173B2 #DE8F05 #029E73 #CC78BC #CA9161 #808080`; the real fix
      (add `.amazonq/**` to `.prettierignore`); no secret values.
      — acceptance: file exists at the kebab-case path; `grep -Eo '#0173B2|#DE8F05|#029E73|#CC78BC|#CA9161|#808080'`
      finds only approved hex codes and `grep -E '#[0-9A-Fa-f]{6}'` finds no others; the words
      `Root Cause` and `Trigger` both appear as headings; `WIB` and `UTC+7` appear in the Timeline.
  - _Suggested executor: docs-maker_
- [x] [AI] Verify the worked example contains no leaked secrets:
      `grep -Ei 'password|secret|token|api[_-]?key|BEGIN [A-Z ]*PRIVATE KEY' docs/explanation/post-mortems/*.md`
      — acceptance: any match is a placeholder or a reference to the no-secrets rule, never a real value.

> **Implementation notes** (Phase 2, 2026-06-05):
>
> - Status: Done. Files changed (new): `docs/explanation/post-mortems/README.md`,
>   `docs/explanation/post-mortems/2026-05-03-amazonq-bindings-prettier-parity-guard-break.md`.
> - Authored by `docs-maker`: writer-facing template + index, plus a worked example grounded in
>   the real `.amazonq/` Prettier parity-guard breakage (root cause: generated bytes must stay
>   emitter-identical, no `.prettierignore` rule existed; fix: ignore emitter-generated paths).
> - Gate: both files exist; filename matches `YYYY-MM-DD-<system>-<short-failure>.md`; node fills
>   use only the six approved hex codes (`#000000` stroke + `#FFFFFF` text are the
>   convention-mandated classDef standard per `formatting/diagrams.md`, not palette colors);
>   secret-leak grep returns only no-secrets-rule references; markdownlint → 0 errors.

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] `test -f docs/explanation/post-mortems/README.md` and the worked-example file both succeed.
- [x] [AI] Worked-example filename matches `^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+\.md$`
      (verify: `ls docs/explanation/post-mortems/ | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+\.md$'`).
- [x] [AI] Mermaid diagram uses only the six approved WCAG AA hex codes (no other 6-digit hex).
- [x] [AI] `npm run lint:md` passes for the new docs files with zero violations.

> **Pause Safety**: the convention, template, and worked example all exist and pass markdown lint;
> indexes are not yet updated, so the new docs are reachable only by direct path — coherent state.
> Safe to stop. To resume: re-run the Phase 2 Gate checks.

## Phase 3: Update Index Files

- [x] [AI] Edit `repo-governance/conventions/structure/README.md`: add a Post-Mortem Convention
      bullet under Documents — a markdown link whose text is `Post-Mortem Convention` and whose
      target is the sibling file `post-mortems.md`, placed sensibly among sibling entries.
      — acceptance: `grep -q 'post-mortems.md' repo-governance/conventions/structure/README.md` succeeds.
  - _Suggested executor: repo-rules-maker_
- [x] [AI] Edit `repo-governance/conventions/README.md`: add the Post-Mortem Convention entry to its
      structure-conventions enumeration (the list that currently includes Diataxis Framework, File
      Naming, etc.).
      — acceptance: `grep -q 'post-mortems.md' repo-governance/conventions/README.md` succeeds.
  - _Suggested executor: repo-rules-maker_
- [x] [AI] Edit `docs/explanation/README.md`: add a Post-Mortems entry to the Documentation Index
      linking `./post-mortems/README.md` (new subsection or under an appropriate heading).
      — acceptance: `grep -q 'post-mortems/README.md' docs/explanation/README.md` succeeds.
  - _Suggested executor: docs-maker_
- [x] [AI] Verify no dynamic-count hardcoding was introduced (per
      [dynamic-collection-references](../../../repo-governance/conventions/writing/dynamic-collection-references.md)):
      manual read of the three diffs — acceptance: no convention/doc counts were hardcoded.

> **Implementation notes** (Phase 3, 2026-06-05):
>
> - Status: Done. Files changed: `repo-governance/conventions/structure/README.md`,
>   `repo-governance/conventions/README.md`, `docs/explanation/README.md`.
> - Added a Post-Mortem Convention bullet to both convention indexes (next to Plans Organization)
>   and a new `### Post-Mortems` subsection to the docs explanation Documentation Index linking
>   `./post-mortems/README.md`. No dynamic counts hardcoded (entries are named links only).
> - Gate: all three `grep` checks succeed; markdownlint on the three indexes → 0 errors.

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] All three greps above succeed (entry present in each index).
- [x] [AI] `npm run lint:md` passes (link rules resolve every new index link).

> **Pause Safety**: the new surfaces are now fully discoverable from every index; the tree is
> coherent and self-consistent but not yet validated by the governance gate or pushed. Safe to stop.
> To resume: re-run the Phase 3 Gate greps and `npm run lint:md`.

## Phase 4: Validation, Quality Gates, and Push

### Repo Rules Quality Gate

- [x] [AI] Run the `repo-rules-quality-gate` workflow at **strict** mode until double-zero
      (two consecutive checks with zero CRITICAL/HIGH/MEDIUM findings), per
      [repo-rules-quality-gate.md](../../../repo-governance/workflows/repo/repo-rules-quality-gate.md).
      Invoke `repo-rules-checker` then `repo-rules-fixer` iteratively; fix every reported finding
      affecting the new convention, docs, and indexes.
      — acceptance: workflow reports double-zero at strict mode; no CRITICAL/HIGH/MEDIUM findings remain.

> **Implementation notes** (Phase 4 — repo-rules-quality-gate, 2026-06-05):
>
> - Status: Done — **double-zero PASS at strict** (AI-only findings).
> - Deterministic preflight (`rhino-cli repo-governance audit`) reported 659 pre-existing `high`
>   findings repo-wide (AGENTS.md size, `**Last Updated**` markers in other files, emoji in caveman
>   scripts, software-engineering heading hierarchy, agent duplication, readme-index ghosts). Per
>   the workflow these are **visibility-only** and never count toward the mode threshold — they are
>   the accepted maintainer-curated baseline, not introduced by this plan. The new
>   `post-mortems.md` adds exactly one `readme-index-audit` ghost from `conventions/README.md`,
>   IDENTICAL to the uniform pattern every existing structure convention (plans.md, diataxis,
>   worktree-path, file-naming) already produces.
> - AI checker iteration 1: 3 AI-only findings, all in the worked example — broken out-of-repo
>   `.claude/projects/.../memory/` link (HIGH), `doc_status: reviewed` vs all-P0-done (MEDIUM),
>   P0 `—` ticket missing note (MEDIUM). All three fixed directly (link → in-repo
>   `multi-harness-binding.md`; `doc_status: closed`; added clarifying note). Iterations 2 and 3:
>   0 AI-only findings each → double-zero. Reports: `repo-rules__ce5dd5*` audits.

### Local Quality Gates (Before Push)

- [x] [AI] Run affected typecheck/lint/test/spec: `npx nx affected -t typecheck lint test:quick spec-coverage`
      — acceptance: exits 0 (docs-only change is expected to affect nothing or pass trivially).
- [x] [AI] Run markdown lint: `npm run lint:md`
      — acceptance: exits 0, zero violations.
- [x] [AI] Run markdown format check: `npm run format:md:check`
      — acceptance: exits 0 (or run `npm run format:md` then re-check).
- [x] [AI] Fix ALL failures found — including preexisting issues not caused by this change — then
      re-run the failing checks to confirm resolution.

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes.
> This follows the root-cause orientation principle — proactively fix preexisting errors encountered
> during work. Commit preexisting fixes separately with appropriate conventional commit messages.

### Commit Guidelines

- [x] [AI] Commit thematically with Conventional Commits, splitting by concern:
  - `docs(governance): add blameless post-mortem convention` (the new convention file)
  - `docs(post-mortems): add writer template, index, and worked example` (docs surface)
  - `docs(governance): index the post-mortem convention` (the three index updates)
  - Any preexisting fix in its own separate commit.
    — acceptance: `git log --oneline` shows cohesive, single-concern commits; no unrelated bundling.

### Post-Push CI Verification

- [x] [AI] Push changes to `origin main` (direct, trunk-based, no PR): `git push origin main`
      — acceptance: push succeeds.
- [x] [AI] Monitor ALL GitHub Actions workflows triggered by the push (poll every 3 minutes via
      `gh run list` / `gh run view --json status,conclusion`; do NOT use `gh run watch`)
      — acceptance: every triggered workflow concludes `success`.
- [x] [AI] If any CI check fails, investigate root cause, fix, push a follow-up commit, and repeat
      until all GitHub Actions pass — acceptance: zero failing checks; do not proceed until green.

> **Implementation notes** (Phase 4 — commit/push/CI, 2026-06-05):
>
> - Four thematic commits pushed to `origin main`: `docs(governance): add blameless post-mortem
convention`, `docs(post-mortems): add writer template, index, and worked example`,
>   `docs(governance): index the post-mortem convention`, `chore(plans): track
adopt-post-mortem-convention execution`.
> - No preexisting source failures to fix (lint/format/affected all clean; the 659 deterministic
>   governance findings are the accepted repo-wide visibility-only baseline, out of scope).
> - Post-push CI: governance/docs-only change triggers no path-filtered push workflow
>   (`gh run list --commit <HEAD>` → `[]`; only `crane-cli-integration` listens on push, scoped to
>   crane-cli paths which are untouched). Nothing to monitor; no failing checks.
> - **Pre-existing unrelated CI baseline (out of scope)**: two **scheduled** workflows — "Test and
>   Deploy - OSE Application Web Development" and "Test and Deploy - OrganicLever Web Development" —
>   were already failing at the "Start full stack (backend + frontend)" E2E step on commit
>   `6b8b15dc8` (2026-06-04), before any commit in this plan. They are dev-environment full-stack
>   startup failures in different apps (`ose-app-web`, `organiclever-web`), triggered by `schedule`
>   not by this plan's push, and unrelated to the docs/governance change. They are a separate
>   maintenance concern (own investigation/plan), not bundled into this convention adoption.

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] `repo-rules-quality-gate` reached double-zero at strict mode.
- [x] [AI] `npx nx affected -t typecheck lint test:quick spec-coverage` and `npm run lint:md` both exit 0.
- [x] [AI] `git push origin main` succeeded and all triggered GitHub Actions concluded `success`.

> **Pause Safety**: all changes are committed, pushed to `main`, and CI-green — the convention is
> live and validated. Safe to stop. To resume: re-run `gh run list` to confirm CI is still green,
> then proceed to archival.

## Phase 5: Plan Archival

- [x] [AI] Verify ALL delivery checklist items above are ticked and all gates passed.
- [x] [AI] Move the plan to done with today's completion date:
      `git mv plans/in-progress/adopt-post-mortem-convention plans/done/$(date +%Y-%m-%d)__adopt-post-mortem-convention`
      — acceptance: folder now under `plans/done/` with a `YYYY-MM-DD__` prefix.
- [x] [AI] Update `plans/in-progress/README.md` — remove the plan entry (return Active Plans to
      `_(none)_` if it was the only one) — acceptance: no reference to this plan remains.
- [x] [AI] Update `plans/done/README.md` — add the plan entry with completion date — acceptance:
      entry present.
- [x] [AI] Commit the archival: `chore(plans): move adopt-post-mortem-convention to done`
      — acceptance: commit created.
- [x] [AI] Push archival and verify CI: `git push origin main`; monitor GitHub Actions to green
      — acceptance: push succeeds; all workflows conclude `success`.

> **Implementation notes** (Phase 5, 2026-06-05):
>
> - Status: Done. Plan archived to `plans/done/2026-06-05__adopt-post-mortem-convention/` via
>   `git mv` (history preserved). `plans/in-progress/README.md` Active Plans returned to `_(none)_`;
>   `plans/done/README.md` gained the completion entry. Archival committed and pushed to `origin
main`; governance/docs change triggers no push CI workflow (nothing to monitor).

### Phase 5 Gate

> Final gate — plan complete when all pass.

- [x] [AI] Plan folder lives under `plans/done/YYYY-MM-DD__adopt-post-mortem-convention/`.
- [x] [AI] Both `plans/in-progress/README.md` and `plans/done/README.md` are consistent.
- [x] [AI] Archival commit pushed; CI green.

> **Pause Safety**: the plan is fully delivered, archived, pushed, and CI-green. This is the terminal
> safe state — nothing left to resume.
