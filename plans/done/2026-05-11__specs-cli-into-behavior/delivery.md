# Delivery: Consolidate CLI Specs Under `behavior/`

## Worktree

Worktree path: `worktrees/specs-cli-into-behavior/`

Provision before execution (run from repo root inside `ose-public`):

```bash
claude --worktree specs-cli-into-behavior
```

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and [Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

---

## Phase 0 — Setup

- [x] 0.1 Provision worktree (run from ose-public repo root): `claude --worktree specs-cli-into-behavior` — creates `worktrees/specs-cli-into-behavior/` per [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md)
<!-- 2026-05-11 | Status: SKIPPED per user override | User explicitly said "do it here" — executing in main checkout ~/ose-projects/ose-public. Parallel-safety acknowledged. -->
- [x] 0.2 Run `npm install && npm run doctor -- --fix` in worktree root
<!-- 2026-05-11 | Status: done | Files Changed: none | npm install clean, 20/20 tools OK -->
- [x] 0.3 Verify baseline: `nx run oseplatform-cli:test:quick && nx run ayokoding-cli:test:quick && nx run rhino-cli:test:quick` — all must pass before making any changes
<!-- 2026-05-11 | Status: done | All three CLI apps passed test:quick (cached). Baseline green. -->

---

## Phase 1 — oseplatform

- [x] 1.1 Move spec directory: `git mv specs/apps/oseplatform/cli specs/apps/oseplatform/behavior/cli`
<!-- 2026-05-11 | Status: done | Files Changed: specs/apps/oseplatform/cli/ → specs/apps/oseplatform/behavior/cli/ | Verified: behavior/ now contains cli/ with links-check.feature + README.md -->
- [x] 1.2 Update `specs/apps/oseplatform/behavior/cli/gherkin/README.md` — fix self-referencing parent link (now one level deeper under `behavior/`). Verify: `grep -i '\.\./\.\.' specs/apps/oseplatform/behavior/cli/gherkin/README.md` returns a path containing `behavior/` (not pointing above `behavior/`).
<!-- 2026-05-11 | Status: done | Files Changed: specs/apps/oseplatform/behavior/cli/gherkin/README.md | Fixed external links (5→6 levels): apps/oseplatform-cli and docs/ refs. Parent link ../../README.md resolves to behavior/README.md (within behavior/). -->
- [x] 1.3 Update `specs/apps/oseplatform/behavior/README.md` — add `cli/` child entry to Children section and Perspectives table. Verify: `grep -i 'cli/' specs/apps/oseplatform/behavior/README.md` returns at least one match in each of the Children and Perspectives sections.
<!-- 2026-05-11 | Status: done | Files Changed: specs/apps/oseplatform/behavior/README.md | Added cli/ to Children and Perspectives table (cli/gherkin/ ref in consumed-by column satisfies grep). -->
- [x] 1.4 Update `apps/oseplatform-cli/cmd/links_check_test.go` line 21: replace `specs/apps/oseplatform/cli/gherkin` with `specs/apps/oseplatform/behavior/cli/gherkin`. Verify: `grep "cli/gherkin" apps/oseplatform-cli/cmd/links_check_test.go | grep -v "behavior/"` returns empty.
  <!-- 2026-05-11 | Status: done | Files Changed: apps/oseplatform-cli/cmd/links_check_test.go | Verify: empty (only behavior/ match remains). -->
  - _Suggested executor: `swe-golang-dev`_
- [x] 1.5 Update `apps/oseplatform-cli/cmd/links-check.integration_test.go` line 21: replace `specs/apps/oseplatform/cli/gherkin` with `specs/apps/oseplatform/behavior/cli/gherkin`. Verify: `grep "cli/gherkin" apps/oseplatform-cli/cmd/links-check.integration_test.go | grep -v "behavior/"` returns empty.
  <!-- 2026-05-11 | Status: done | Files Changed: apps/oseplatform-cli/cmd/links-check.integration_test.go | Verify: empty. -->
  - _Suggested executor: `swe-golang-dev`_
- [x] 1.6 Update `apps/oseplatform-cli/project.json` `spec-coverage` command string: `specs/apps/oseplatform/cli/gherkin` → `specs/apps/oseplatform/behavior/cli/gherkin`.
    Verify: `grep "cli/gherkin" apps/oseplatform-cli/project.json | grep -v behavior` returns empty.
<!-- 2026-05-11 | Status: done | Files Changed: apps/oseplatform-cli/project.json | Verify: empty. -->
- [x] 1.7 Update `apps/oseplatform-cli/project.json` `spec-coverage` inputs glob: change
    `{workspaceRoot}/specs/apps/oseplatform/cli/gherkin/**/*.feature` →
    `{workspaceRoot}/specs/apps/oseplatform/behavior/cli/gherkin/**/*.feature`.
    Verify: `grep "cli/gherkin" apps/oseplatform-cli/project.json | grep -v behavior` returns empty.
<!-- 2026-05-11 | Status: done | Files Changed: apps/oseplatform-cli/project.json (inputs glob) | Verify: empty (same Edit as 1.6). -->
- [x] 1.8 Update `apps/oseplatform-cli/README.md`: replace `specs/apps/oseplatform/cli/gherkin` with `specs/apps/oseplatform/behavior/cli/gherkin`. Verify: `grep "cli/gherkin" apps/oseplatform-cli/README.md | grep -v "behavior/"` returns empty.
<!-- 2026-05-11 | Status: done | Files Changed: apps/oseplatform-cli/README.md | Verify: empty. -->
- [x] 1.9 Run `nx run oseplatform-cli:test:quick` — must pass
<!-- 2026-05-11 | Status: done | PASS 97.30% >= 90% -->
- [x] 1.10 Run `nx run oseplatform-cli:test:integration` — must pass
<!-- 2026-05-11 | Status: done | 4 scenarios, 4 passed -->
- [x] 1.11 Run `nx run oseplatform-cli:spec-coverage` — must pass
<!-- 2026-05-11 | Status: done | 1 spec, 4 scenarios, 13 steps — all covered -->

---

## Phase 2 — ayokoding

- [x] 2.1 Move spec directory: `git mv specs/apps/ayokoding/cli specs/apps/ayokoding/behavior/cli`
<!-- 2026-05-11 | Status: done | specs/apps/ayokoding/behavior/ now contains cli/ -->
- [x] 2.2 Update `specs/apps/ayokoding/behavior/cli/gherkin/README.md` — fix self-referencing parent link (now one level deeper under `behavior/`). Verify: `grep -i '\.\./\.\.' specs/apps/ayokoding/behavior/cli/gherkin/README.md` returns a path containing `behavior/` (not pointing above `behavior/`).
<!-- 2026-05-11 | Status: done | Files Changed: specs/apps/ayokoding/behavior/cli/gherkin/README.md | Fixed external links (5→6 levels). Parent ../../README.md → behavior/README.md. -->
- [x] 2.3 Update `specs/apps/ayokoding/behavior/README.md` — add `cli/` child entry to Children section and Perspectives table. Verify: `grep -i 'cli/' specs/apps/ayokoding/behavior/README.md` returns at least one match in each of the Children and Perspectives sections.
<!-- 2026-05-11 | Status: done | Files Changed: specs/apps/ayokoding/behavior/README.md | cli/ in Children + Perspectives table verified. -->
- [x] 2.4 Update `apps/ayokoding-cli/cmd/links_check_test.go` line 20: replace `specs/apps/ayokoding/cli/gherkin` with `specs/apps/ayokoding/behavior/cli/gherkin`. Verify: `grep "cli/gherkin" apps/ayokoding-cli/cmd/links_check_test.go | grep -v "behavior/"` returns empty.
  <!-- 2026-05-11 | Status: done | Files Changed: apps/ayokoding-cli/cmd/links_check_test.go | Verify: empty. -->
  - _Suggested executor: `swe-golang-dev`_
- [x] 2.5 Update `apps/ayokoding-cli/cmd/links-check.integration_test.go` line 20: replace `specs/apps/ayokoding/cli/gherkin` with `specs/apps/ayokoding/behavior/cli/gherkin`. Verify: `grep "cli/gherkin" apps/ayokoding-cli/cmd/links-check.integration_test.go | grep -v "behavior/"` returns empty.
  <!-- 2026-05-11 | Status: done | Files Changed: apps/ayokoding-cli/cmd/links-check.integration_test.go | Verify: empty. -->
  - _Suggested executor: `swe-golang-dev`_
- [x] 2.6 Update `apps/ayokoding-cli/project.json` `spec-coverage` command string: `specs/apps/ayokoding/cli/gherkin` → `specs/apps/ayokoding/behavior/cli/gherkin`.
    Verify: `grep "cli/gherkin" apps/ayokoding-cli/project.json | grep -v behavior` returns empty.
<!-- 2026-05-11 | Status: done | Files Changed: apps/ayokoding-cli/project.json | Verify: empty. -->
- [x] 2.7 Update `apps/ayokoding-cli/project.json` `spec-coverage` inputs glob: change
    `{workspaceRoot}/specs/apps/ayokoding/cli/gherkin/**/*.feature` →
    `{workspaceRoot}/specs/apps/ayokoding/behavior/cli/gherkin/**/*.feature`.
    Verify: `grep "cli/gherkin" apps/ayokoding-cli/project.json | grep -v behavior` returns empty.
<!-- 2026-05-11 | Status: done | Files Changed: apps/ayokoding-cli/project.json (inputs glob, same Edit as 2.6) | Verify: empty. -->
- [x] 2.8 Update `apps/ayokoding-cli/README.md`: replace `specs/apps/ayokoding/cli/gherkin` with `specs/apps/ayokoding/behavior/cli/gherkin`. Verify: `grep "cli/gherkin" apps/ayokoding-cli/README.md | grep -v "behavior/"` returns empty.
<!-- 2026-05-11 | Status: done | Files Changed: apps/ayokoding-cli/README.md | Verify: empty. -->
- [x] 2.9 Run `nx run ayokoding-cli:test:quick` — must pass
<!-- 2026-05-11 | Status: done | PASS 94.44% >= 90% -->
- [x] 2.10 Run `nx run ayokoding-cli:test:integration` — must pass
<!-- 2026-05-11 | Status: done | 4 scenarios, 4 passed -->
- [x] 2.11 Run `nx run ayokoding-cli:spec-coverage` — must pass
<!-- 2026-05-11 | Status: done | 1 spec, 4 scenarios, 13 steps — all covered -->

---

## Phase 3 — rhino

- [x] 3.1 Move all 18 feature files from `specs/apps/rhino/cli/gherkin/` to `specs/apps/rhino/behavior/cli/gherkin/`:
  <!-- 2026-05-11 | Status: done | Files Changed: 18 .feature files git mv'd to behavior/cli/gherkin/ | Verify: 18 files confirmed. -->

  ```bash
  for f in specs/apps/rhino/cli/gherkin/*.feature; do
    git mv "$f" specs/apps/rhino/behavior/cli/gherkin/
  done
  ```

  Verify: `ls specs/apps/rhino/behavior/cli/gherkin/*.feature | wc -l` returns 18.

- [x] 3.2 Replace `specs/apps/rhino/behavior/cli/gherkin/README.md` with comprehensive version: carry the full 18-command feature table from `specs/apps/rhino/cli/gherkin/README.md`, add `specs/` subfolder section documenting the 4 planned validate-\* features, preserve conventions and related links. Verify: `grep -c '.feature' specs/apps/rhino/behavior/cli/gherkin/README.md` returns at least 22 (18 feature rows + 4 planned).
<!-- 2026-05-11 | Status: done | Files Changed: specs/apps/rhino/behavior/cli/gherkin/README.md | Verify: 24 >= 22. -->
- [x] 3.3 Remove old `specs/apps/rhino/cli/gherkin/README.md` (superseded by merged file):
    `git rm specs/apps/rhino/cli/gherkin/README.md`
    Verify: `test -f specs/apps/rhino/cli/gherkin/README.md && echo STILL_EXISTS || echo REMOVED` returns `REMOVED`.
<!-- 2026-05-11 | Status: done | Verify: REMOVED -->
- [x] 3.4 Remove empty `specs/apps/rhino/cli/` directory: `git rm -r specs/apps/rhino/cli`
<!-- 2026-05-11 | Status: done | cli/ already absent — emptied by 3.1+3.3, git auto-removed dir -->
- [x] 3.5 Bulk-update all 36 rhino-cli Go test files — path string (line varies per file, sed replaces by pattern):
  <!-- 2026-05-11 | Status: done | Files Changed: 36 files under apps/rhino-cli/cmd/ | Verify: grep old path returns 0. -->

  ```bash
  sed -i '' 's|specs/apps/rhino/cli/gherkin|specs/apps/rhino/behavior/cli/gherkin|g' \
    apps/rhino-cli/cmd/*_test.go apps/rhino-cli/cmd/*.integration_test.go
  ```

  - _Suggested executor: `swe-golang-dev`_

- [x] 3.6 Verify sed replaced exactly 36 files and no unintended files changed: `git diff --name-only apps/rhino-cli/cmd/` — output must list exactly 36 files, all under `apps/rhino-cli/cmd/`.
<!-- 2026-05-11 | Status: done | Verify: 36 files, all under apps/rhino-cli/cmd/ -->
- [x] 3.7 Update `apps/rhino-cli/project.json` `spec-coverage` command string: `specs/apps/rhino/cli/gherkin` → `specs/apps/rhino/behavior/cli/gherkin`.
    Verify: `grep "cli/gherkin" apps/rhino-cli/project.json | grep -v behavior` returns empty.
<!-- 2026-05-11 | Status: done | Files Changed: apps/rhino-cli/project.json | Verify: empty. -->
- [x] 3.8 Update `apps/rhino-cli/project.json` `spec-coverage` inputs glob: change
    `{workspaceRoot}/specs/apps/rhino/cli/gherkin/**/*.feature` →
    `{workspaceRoot}/specs/apps/rhino/behavior/cli/gherkin/**/*.feature`.
    Verify: `grep "cli/gherkin" apps/rhino-cli/project.json | grep -v behavior` returns empty.
<!-- 2026-05-11 | Status: done | Files Changed: apps/rhino-cli/project.json (same Edit as 3.7) | Verify: empty. -->
- [x] 3.9 Update `specs/apps/rhino/README.md`: replace all occurrences of `specs/apps/rhino/cli/` with `specs/apps/rhino/behavior/cli/`:
  <!-- 2026-05-11 | Status: done | Files Changed: specs/apps/rhino/README.md | Verify: all specs/apps/rhino/cli/ path refs replaced; remaining cli/ refs are app names (rhino-cli) and tree diagram — intentional. -->

  ```bash
  sed -i '' 's|specs/apps/rhino/cli/|specs/apps/rhino/behavior/cli/|g' specs/apps/rhino/README.md
  ```

  Verify: `grep "cli/" specs/apps/rhino/README.md | grep -v behavior` returns empty.

- [x] 3.10 Update `repo-governance/development/infra/bdd-spec-test-mapping.md`: replace `specs/apps/rhino/cli/gherkin` with `specs/apps/rhino/behavior/cli/gherkin`:
  <!-- 2026-05-11 | Status: done | Files Changed: repo-governance/development/infra/bdd-spec-test-mapping.md | Also updated template pattern specs/{app}/cli/gherkin/ → specs/{app}/behavior/cli/gherkin/ | Verify: empty. -->

  ```bash
  sed -i '' 's|specs/apps/rhino/cli/gherkin|specs/apps/rhino/behavior/cli/gherkin|g' repo-governance/development/infra/bdd-spec-test-mapping.md
  ```

  Verify: `grep "cli/gherkin" repo-governance/development/infra/bdd-spec-test-mapping.md | grep -v behavior` returns empty.

- [x] 3.11 Run `nx run rhino-cli:test:quick` — must pass
<!-- 2026-05-11 | Status: done | PASS 90.42% >= 90% -->
- [x] 3.12 Run `nx run rhino-cli:test:integration` — must pass
<!-- 2026-05-11 | Status: done | 468 passed -->
- [x] 3.13 Run `nx run rhino-cli:spec-coverage` — check output carefully:
  <!-- 2026-05-11 | Status: done | PASS — 22 specs, 165 scenarios, 693 steps — all covered. specs/ subfolder planned features not present yet; tool handled gracefully. -->
  - If it **passes**: done, continue.
  - If it **fails on `validate-*.feature`** files in `specs/`: the tool recurses into the `specs/` subfolder. Resolve: implement stub test files for those 4 planned specs (preferred) OR adjust spec-coverage scope. Do not mark 3.13 complete until green.

---

## Phase 4 — Final Validation

- [x] 4.1 Verify no `specs/apps/*/cli/` directories remain: `ls specs/apps/oseplatform/ specs/apps/ayokoding/ specs/apps/rhino/`
<!-- 2026-05-11 | Status: done | No cli/ dirs in oseplatform, ayokoding, or rhino — only behavior/ and other dirs. -->
- [x] 4.2 Run `nx affected -t test:quick` — all affected projects green
<!-- 2026-05-11 | Status: done | 14 projects passed (17 tasks from cache). -->
- [x] 4.3 Run `nx affected -t test:integration` — all affected projects green
<!-- 2026-05-11 | Status: done | 9 projects passed. Pre-existing fixes: ayokoding-web _index.md regenerated; organiclever-be Dockerfile.integration --no-restore removed (FSharp.Core 10.0.105 resolution fix). -->
- [x] 4.4 Run `nx affected -t spec-coverage` — all affected projects green
<!-- 2026-05-11 | Status: done | 13 projects passed (all from cache). -->
- [x] 4.5 Run `npm run lint:md` — no markdown violations
<!-- 2026-05-11 | Status: done | 0 errors on all changed files. Full run also exited 0. -->
- [x] 4.6 Verify `specs/apps/oseplatform/behavior/README.md` documents `cli/` perspective
<!-- 2026-05-11 | Status: done | cli/ in Children + Perspectives table confirmed. -->
- [x] 4.7 Verify `specs/apps/ayokoding/behavior/README.md` documents `cli/` perspective
<!-- 2026-05-11 | Status: done | cli/ in Children + Perspectives table confirmed. -->
- [x] 4.8 Verify `specs/apps/rhino/behavior/cli/gherkin/README.md` covers all 18 commands + `specs/` subfolder
<!-- 2026-05-11 | Status: done | 24 .feature refs >= 22 (18 commands + 4 planned specs/). -->

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work. Do not defer or mention-and-skip existing issues.

---

## Phase 5 — Commit and Push

### Commit Guidelines

- [x] Commit changes thematically — group related changes into logically cohesive commits
- [x] Follow Conventional Commits format: `<type>(<scope>): <description>`
- [x] Preferred split: one commit per app (`oseplatform`, `ayokoding`, `rhino`), or one
      atomic commit if all tests green together (see `tech-docs.md §Commit Strategy`)
- [x] Do NOT bundle unrelated fixes into a single commit

- [x] 5.1 Stage all changes and commit (example for atomic commit):
  <!-- 2026-05-11 | Status: done | 3 commits: fix(ayokoding-web) 0b1fcbe91, fix(organiclever-be) 7935a597e, refactor(specs) 8e6a64b94. Also created specs/apps/rhino/behavior/README.md (pre-commit broken-link fix). -->

  ```
  refactor(specs): consolidate cli/ specs under behavior/cli/ for all apps

  Move specs/apps/{oseplatform,ayokoding,rhino}/cli/ into their respective
  behavior/cli/ directories. Unifies all Gherkin behavioral contracts under
  behavior/, organized by interface type (web/, api/, cli/).

  Updates all Go test path strings, project.json spec-coverage targets,
  behavior/README.md files, app READMEs, and governance docs.
  ```

- [x] 5.2 Push to `origin main` (direct-to-main per Trunk Based Development)
<!-- 2026-05-11 | Status: done | Pushed 5 commits after resolving pre-push MD violations (worktrees/ exclude, MD028/MD031 in organiclever-be-java-migration delivery.md, MD032 in tech-docs.md). -->
- [x] 5.3 Monitor CI after push:
  <!-- 2026-05-11 | Status: N/A — all workflows are schedule/workflow_dispatch only, no push triggers. Pre-push hook was the quality gate. All sub-items N/A. -->
  - [x] Run `gh run list --branch main --limit 5` to find the relevant workflow run
  - [x] Run `gh run watch <run-id>` or check every 3–5 min via `gh run view <run-id>`
  - [x] Verify all CI checks pass (build, typecheck, lint, test:quick, spec-coverage for affected projects)
  - [x] If any check fails: fix root cause, push follow-up commit, and re-verify before proceeding
- [ ] 5.4 Archive plan:
  - [ ] 5.4a `git mv plans/in-progress/specs-cli-into-behavior plans/done/$(date +%Y-%m-%d)__specs-cli-into-behavior`
  - [ ] 5.4b Update `plans/in-progress/README.md` — remove `specs-cli-into-behavior` entry
  - [ ] 5.4c Update `plans/done/README.md` — add entry with completion date
  - [ ] 5.4d Commit: `chore(plans): move specs-cli-into-behavior to done`
