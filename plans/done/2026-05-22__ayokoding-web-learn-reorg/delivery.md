# Delivery — Learn-Tree Reorganization

The executor's working file. Each `- [ ]` item is an atomic step. Tick it the moment it is done; do not batch.

Three iron rules:

1. **One phase per commit group**. A phase ends with a commit (or small commit cluster) and the three validation commands at exit 0.
2. **Never edit the main checkout**. All work happens inside `worktrees/ayokoding-web-learn-reorg/`.
3. **`git mv`, always**. No plain `mv` followed by `git add`.

## Worktree

Worktree path: `worktrees/ayokoding-web-learn-reorg/`

Provision before execution (run from ose-public repo root):

```bash
claude --worktree ayokoding-web-learn-reorg
```

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and [Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

### Commit Guidelines

- Commit changes thematically — group related changes into logically cohesive commits.
- Follow Conventional Commits format: `<type>(<scope>): <description>`.
- Split different domains/concerns into separate commits (e.g., do not bundle governance doc updates with content renames).
- Do NOT bundle unrelated fixes into a single commit.

## Phase 0 — Worktree and Baseline

- [ ] Create the worktree: `cd ~/ose-projects/ose-public && claude --worktree ayokoding-web-learn-reorg`
- [ ] Inside the worktree run `npm install`
- [ ] Inside the worktree run `npm run doctor -- --fix`
- [ ] Inside the worktree run the three validation commands and capture exit codes as baseline:
  - [ ] `cd apps/ayokoding-web && ../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content` (expect exit 0)
  - [ ] `nx run ayokoding-web:validate-indexes` (expect exit 0)
  - [ ] `nx run ayokoding-web:test:quick` (expect exit 0)
- [ ] Inventory Gherkin specs that reference `/en/learn/...` URLs: `rg "/en/learn/" specs/apps/ayokoding > /tmp/learn-reorg-spec-refs.txt`
- [ ] Inventory governance docs that reference learn paths: `rg "platform-linux\|platform-web\|platform-mobile\|/en/learn/human" repo-governance docs > /tmp/learn-reorg-gov-refs.txt`
- [ ] Commit baseline notes if any tooling tweaks needed: `chore(ayokoding-web): prepare for learn-tree reorg`

## Phase 1 — Redirect Plumbing Skeleton (Make-It-Fail First)

The redirect file lands before any rename. Empty/skeleton, but wired in — so phase 2's renames have a target to push entries into immediately.

- [x] [RED] Create `specs/apps/ayokoding/behavior/web/gherkin/navigation/learn-reorg-redirects.feature`

<!-- Date: 2026-05-22 | Status: done | Files: specs/apps/ayokoding/behavior/web/gherkin/navigation/learn-reorg-redirects.feature, apps/ayokoding-web-fe-e2e/src/steps/learn-reorg-redirects.steps.ts | Scenario discovered and failing in all 3 browsers (RED confirmed) --> (_New file_) with a failing scenario asserting that visiting `/en/learn/software-engineering/platform-web` redirects to `/en/learn/software-engineering/platforms/web`. Create the corresponding step file `apps/ayokoding-web-fe-e2e/src/steps/learn-reorg-redirects.steps.ts` (_New file_) implementing the step definitions using `createBdd()` from `playwright-bdd`. Run `nx run ayokoding-web-fe-e2e:test:e2e` — confirm the new scenario appears in test output and fails (expected — redirect not yet wired).

- [x] Create `apps/ayokoding-web/src/redirects/learn-reorg.ts` (_New file_) with `export const learnReorgRedirects: Array<{source: string; destination: string; permanent: boolean}> = [];`
<!-- Date: 2026-05-22 | Status: done | Files: apps/ayokoding-web/src/redirects/learn-reorg.ts -->
- [x] Edit `apps/ayokoding-web/next.config.ts` to import and spread `learnReorgRedirects` into `redirects()`
<!-- Date: 2026-05-22 | Status: done | Files: apps/ayokoding-web/next.config.ts -->
- [x] Run `nx run ayokoding-web:build` to confirm Next.js still builds with the empty array — exit code must be 0.
<!-- Date: 2026-05-22 | Status: done | Build success -->
- [x] Add a smoke test asserting that a known unredirected path still 200s (e.g., `GET /en/learn/software-engineering/programming-languages/typescript`) — establishes the "no redirect yet" baseline. Run `nx run ayokoding-web:test:quick` — exit code must be 0.
<!-- Date: 2026-05-22 | Status: done | Coverage 86.21% >= 82% -->
- [ ] Commit: `feat(ayokoding-web): scaffold learn-reorg redirect map`

## Phase 2 — Platforms Rename (`platform-*` → `platforms/*`)

Most-used area in software-engineering. Doing it first proves the mechanics on a high-traffic surface.

- [ ] `git mv apps/ayokoding-web/content/en/learn/software-engineering/platform-linux apps/ayokoding-web/content/en/learn/software-engineering/platforms/linux` (creates `platforms/` directory)
- [ ] `git mv apps/ayokoding-web/content/en/learn/software-engineering/platform-web apps/ayokoding-web/content/en/learn/software-engineering/platforms/web`
- [ ] `git mv apps/ayokoding-web/content/en/learn/software-engineering/platform-mobile apps/ayokoding-web/content/en/learn/software-engineering/platforms/mobile`
- [ ] Repeat the three `git mv` calls for `content/id/learn/software-engineering/platform-*` paths if they exist (check with `ls apps/ayokoding-web/content/id/learn/software-engineering/ 2>/dev/null`)
- [ ] Create `apps/ayokoding-web/content/en/learn/software-engineering/platforms/_index.md` (_New file_) with frontmatter (`title: Platforms`, `weight: <next-available>`) and a brief overview of the platforms area. Verify: `test -f apps/ayokoding-web/content/en/learn/software-engineering/platforms/_index.md` exits 0.
- [ ] Create `apps/ayokoding-web/content/en/learn/software-engineering/platforms/overview.md` (_New file_) explaining that platforms covers linux, web, and mobile. Verify: `test -f apps/ayokoding-web/content/en/learn/software-engineering/platforms/overview.md` exits 0.
- [ ] Cross-link rewrite for platform-linux: `rg -l "/en/learn/software-engineering/platform-linux\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/software-engineering/platform-linux\b|/en/learn/software-engineering/platforms/linux|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm `rg "/en/learn/software-engineering/platform-linux\b" apps/ayokoding-web/content` returns no matches.
- [ ] Cross-link rewrite for platform-web: `rg -l "/en/learn/software-engineering/platform-web\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/software-engineering/platform-web\b|/en/learn/software-engineering/platforms/web|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm no matches remain.
- [ ] Cross-link rewrite for platform-mobile: `rg -l "/en/learn/software-engineering/platform-mobile\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/software-engineering/platform-mobile\b|/en/learn/software-engineering/platforms/mobile|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm no matches remain.
- [ ] Repeat cross-link rewrites for `/id/learn/...` if applicable
- [ ] Append three redirect entries to `learn-reorg.ts` (en) and three more (id) if Indonesian content was touched
- [ ] Regenerate indexes: `nx run ayokoding-web:generate-indexes` — diff the output and reinstate any hand-curated wording deleted by regen.
- [ ] Run link-check: `cd apps/ayokoding-web && ../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content` — exit code must be 0.
- [ ] Run quick tests: `nx run ayokoding-web:test:quick` — exit code must be 0.
- [ ] Sample-check `git log --follow apps/ayokoding-web/content/en/learn/software-engineering/platforms/web/_index.md` reaches the pre-rename history
- [ ] Commit: `refactor(ayokoding-web): rename platform-* to platforms/{linux,web,mobile}`

## Phase 3 — `algorithm-and-data-structures` Grammar Fix

- [ ] `git mv apps/ayokoding-web/content/en/learn/software-engineering/algorithm-and-data-structures apps/ayokoding-web/content/en/learn/software-engineering/algorithms-and-data-structures`
- [ ] Repeat for `content/id/learn/...` if applicable
- [ ] Cross-link rewrite: `rg -l "/en/learn/software-engineering/algorithm-and-data-structures\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/software-engineering/algorithm-and-data-structures\b|/en/learn/software-engineering/algorithms-and-data-structures|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm `rg "/en/learn/software-engineering/algorithm-and-data-structures\b" apps/ayokoding-web/content` returns no matches.
- [ ] Append redirect entry to `learn-reorg.ts`
- [ ] Regenerate indexes: `nx run ayokoding-web:generate-indexes` — diff the output and reinstate any hand-curated wording deleted by regen.
- [ ] Run link-check: `cd apps/ayokoding-web && ../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content` — exit code must be 0.
- [ ] Run quick tests: `nx run ayokoding-web:test:quick` — exit code must be 0.
- [ ] Commit: `refactor(ayokoding-web): rename algorithm-and-data-structures to algorithms-and-data-structures`

## Phase 4 — `human/` → `personal-development/` Domain Rename

- [ ] `git mv apps/ayokoding-web/content/en/learn/human apps/ayokoding-web/content/en/learn/personal-development`
- [ ] Repeat for `content/id/learn/human` if applicable
- [ ] Cross-link rewrite: `rg -l "/en/learn/human\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/human\b|/en/learn/personal-development|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm `rg "/en/learn/human\b" apps/ayokoding-web/content` returns no matches.
- [ ] Append redirect entry to `learn-reorg.ts`
- [ ] Update `apps/ayokoding-web/content/en/learn/_index.md` "Human" entry wording to "Personal Development" if hand-curated text exists post-regen
- [ ] Edit `apps/ayokoding-web/content/en/learn/overview.md`: find the line mentioning "Human Development" and change it to "Personal Development". Verify: `grep -c "Personal Development" apps/ayokoding-web/content/en/learn/overview.md` returns `1` and `grep "Human Development" apps/ayokoding-web/content/en/learn/overview.md` returns no matches.
- [ ] Regenerate indexes: `nx run ayokoding-web:generate-indexes` — diff the output and reinstate any hand-curated wording deleted by regen.
- [ ] Run link-check: `cd apps/ayokoding-web && ../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content` — exit code must be 0.
- [ ] Run quick tests: `nx run ayokoding-web:test:quick` — exit code must be 0.
- [ ] Commit: `refactor(ayokoding-web): rename human domain to personal-development`

## Phase 5 — Information-Security Track Normalization

Three sub-moves; order matters because `concepts/explanation/` must move before `concepts/` is deleted.

- [ ] `git mv apps/ayokoding-web/content/en/learn/information-security/concepts/explanation apps/ayokoding-web/content/en/learn/information-security/by-concept` (creates `by-concept/` directory if absent)
- [ ] Remove now-empty `information-security/concepts/` if it has no remaining content; if it has, fold remaining files into `information-security/by-concept/` via `git mv` per file and then remove
- [ ] `git mv apps/ayokoding-web/content/en/learn/information-security/foundations/by-example apps/ayokoding-web/content/en/learn/information-security/by-example/foundations`
- [ ] Remove now-empty `information-security/foundations/` (move any non-`by-example` content into `by-concept/foundations/` first)
- [ ] Cross-link rewrite for concepts/explanation prefix: `rg -l "/en/learn/information-security/concepts/explanation\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/information-security/concepts/explanation\b|/en/learn/information-security/by-concept|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm no matches remain.
- [ ] Cross-link rewrite for foundations/by-example prefix: `rg -l "/en/learn/information-security/foundations/by-example\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/information-security/foundations/by-example\b|/en/learn/information-security/by-example/foundations|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm no matches remain.
- [ ] Append redirect entries to `learn-reorg.ts`
- [ ] Edit `apps/ayokoding-web/content/en/learn/information-security/_index.md`: after regeneration, diff against git HEAD (`git diff HEAD apps/ayokoding-web/content/en/learn/information-security/_index.md`); reinstate any hand-curated wording that was overwritten. Verify: `git diff --stat HEAD apps/ayokoding-web/content/en/learn/information-security/_index.md` shows only intentional regen changes, no missing curated text.
- [ ] Regenerate indexes: `nx run ayokoding-web:generate-indexes` — diff the output and reinstate any hand-curated wording deleted by regen.
- [ ] Run link-check: `cd apps/ayokoding-web && ../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content` — exit code must be 0.
- [ ] Run quick tests: `nx run ayokoding-web:test:quick` — exit code must be 0.
- [ ] Commit: `refactor(ayokoding-web): fold information-security concepts and foundations into canonical tracks`

## Phase 6 — Infrastructure `concepts/` Fold-In

- [ ] Inventory `software-engineering/infrastructure/concepts/` contents: `find apps/ayokoding-web/content/en/learn/software-engineering/infrastructure/concepts -type f`
- [ ] Classify each file as conceptual (→ `by-concept/`) or action-oriented (→ `by-example/`); the existing `concepts/how-to/` sub-tree is action-oriented by definition
- [ ] `git mv apps/ayokoding-web/content/en/learn/software-engineering/infrastructure/concepts/how-to apps/ayokoding-web/content/en/learn/software-engineering/infrastructure/by-example` (merging contents; resolve any name collisions explicitly)
- [ ] `git mv` remaining `concepts/*` files into `infrastructure/by-concept/`
- [ ] Remove the now-empty `infrastructure/concepts/`
- [ ] Cross-link rewrite for infrastructure/concepts/how-to prefix: `rg -l "/en/learn/software-engineering/infrastructure/concepts/how-to\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/software-engineering/infrastructure/concepts/how-to\b|/en/learn/software-engineering/infrastructure/by-example|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm no matches remain.
- [ ] Cross-link rewrite for infrastructure/concepts prefix: `rg -l "/en/learn/software-engineering/infrastructure/concepts\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/software-engineering/infrastructure/concepts\b|/en/learn/software-engineering/infrastructure/by-concept|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm no matches remain.
- [ ] Append redirect entries to `learn-reorg.ts`
- [ ] Regenerate indexes: `nx run ayokoding-web:generate-indexes` — diff the output and reinstate any hand-curated wording deleted by regen.
- [ ] Run link-check: `cd apps/ayokoding-web && ../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content` — exit code must be 0.
- [ ] Run quick tests: `nx run ayokoding-web:test:quick` — exit code must be 0.
- [ ] Commit: `refactor(ayokoding-web): fold infrastructure concepts into canonical tracks`

## Phase 7 — `cases/` Subfolders Into `by-example/cases/`

- [ ] `git mv apps/ayokoding-web/content/en/learn/software-engineering/software-architecture/cases apps/ayokoding-web/content/en/learn/software-engineering/software-architecture/by-example/cases`
- [ ] `git mv apps/ayokoding-web/content/en/learn/software-engineering/system-design/cases apps/ayokoding-web/content/en/learn/software-engineering/system-design/by-example/cases`
- [ ] Cross-link rewrite for software-architecture/cases prefix: `rg -l "/en/learn/software-engineering/software-architecture/cases\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/software-engineering/software-architecture/cases\b|/en/learn/software-engineering/software-architecture/by-example/cases|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm no matches remain.
- [ ] Cross-link rewrite for system-design/cases prefix: `rg -l "/en/learn/software-engineering/system-design/cases\b" apps/ayokoding-web/content | xargs sed -i.bak 's|/en/learn/software-engineering/system-design/cases\b|/en/learn/software-engineering/system-design/by-example/cases|g' && find apps/ayokoding-web/content -name '*.bak' -delete` — confirm no matches remain.
- [ ] Append redirect entries to `learn-reorg.ts`
- [ ] Regenerate indexes: `nx run ayokoding-web:generate-indexes` — diff the output and reinstate any hand-curated wording deleted by regen.
- [ ] Run link-check: `cd apps/ayokoding-web && ../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content` — exit code must be 0.
- [ ] Run quick tests: `nx run ayokoding-web:test:quick` — exit code must be 0.
- [ ] Edit `apps/ayokoding-web/content/en/learn/software-engineering/software-architecture/overview.md`: add a cross-link to `system-design/` and a sentence stating the working split per PRD §FR-4 (software-architecture = code-shape patterns; system-design = whiteboard scaling and case studies). Verify: `grep -c "system-design" apps/ayokoding-web/content/en/learn/software-engineering/software-architecture/overview.md` returns `>= 1`.
- [ ] Edit `apps/ayokoding-web/content/en/learn/software-engineering/system-design/overview.md`: add a cross-link to `software-architecture/` and a sentence stating the working split per PRD §FR-4. Verify: `grep -c "software-architecture" apps/ayokoding-web/content/en/learn/software-engineering/system-design/overview.md` returns `>= 1`.
- [ ] Commit: `refactor(ayokoding-web): move architecture and system-design cases under by-example`

## Phase 8 — Governance and Specs Sweep

By now content is reshaped. Governance docs, agent skills, and Gherkin specs likely still reference old paths.

- [ ] Compare `/tmp/learn-reorg-gov-refs.txt` (from Phase 0) against current paths; update any remaining old references
- [ ] Search agent definitions for old patterns: `rg "platform-linux\|platform-web\|platform-mobile\|concepts/explanation\|foundations/by-example\|/en/learn/human\|software-architecture/cases\|system-design/cases" .claude/agents .claude/skills .opencode/agents`
- [ ] Update any agent definition that hard-codes an old path
- [ ] Compare `/tmp/learn-reorg-spec-refs.txt` against current paths; update Gherkin specs
- [ ] Run `npm run sync:claude-to-opencode` if any `.claude/agents/` files changed
- [ ] Run `nx affected -t lint typecheck test:quick spec-coverage`
- [ ] Commit: `chore(ayokoding-web): update governance docs, agents, and specs for learn reorg`

## Phase 9 — End-to-End Redirect Verification

- [ ] Run `nx run ayokoding-web:build` then `nx run ayokoding-web:start` to serve the production build at `http://localhost:3101` — verify server is running before proceeding.
- [ ] For each `source` entry in `apps/ayokoding-web/src/redirects/learn-reorg.ts`, run `curl -sI http://localhost:3101/<source-without-colon-star> | head -5` and verify the `HTTP` status is 308 or 301 and the `Location:` header matches the `destination`. Example:
  - [ ] `curl -sI http://localhost:3101/en/learn/software-engineering/platform-web | head -5` — expect `Location: .../platforms/web`
  - [ ] `curl -sI http://localhost:3101/en/learn/human | head -5` — expect `Location: .../personal-development`
  - [ ] `curl -sI http://localhost:3101/en/learn/information-security/concepts/explanation | head -5` — expect `Location: .../by-concept`
  - [ ] `curl -sI http://localhost:3101/en/learn/software-engineering/algorithm-and-data-structures | head -5` — expect `Location: .../algorithms-and-data-structures`
  - [ ] For the full list of URLs to test, iterate over each `source` entry in `apps/ayokoding-web/src/redirects/learn-reorg.ts`.
- [ ] Random spot-check three nested cases that should cascade (e.g., `platform-linux/<subpath>` and `concepts/explanation/<subpath>`)
- [ ] `curl -IL http://localhost:3101/en/learn/software-engineering/platform-linux/foo` — confirm the redirect chain resolves and final response is 200.

### Manual Browser Verification (Playwright MCP)

- [ ] The production server from the step above is already running on port 3101 — no additional server startup needed.
- [ ] `browser_navigate` to `http://localhost:3101/en/learn/software-engineering/platform-web` — confirm browser follows redirect to `/en/learn/software-engineering/platforms/web`.
- [ ] `browser_snapshot` — verify the page heading renders (not a blank/error page).
- [ ] `browser_console_messages` — must report zero JavaScript errors.
- [ ] `browser_take_screenshot` — visual record of the redirected page.
- [ ] `browser_navigate` to `http://localhost:3101/en/learn/human` — confirm redirect to `/en/learn/personal-development`.
- [ ] `browser_snapshot` — verify the page heading renders (not a blank/error page).
- [ ] `browser_console_messages` — must report zero JavaScript errors.
- [ ] `browser_navigate` to `http://localhost:3101/en/learn/information-security/concepts/explanation` — confirm redirect to `/en/learn/information-security/by-concept`.
- [ ] `browser_snapshot` — verify the page heading renders (not a blank/error page).
- [ ] `browser_console_messages` — must report zero JavaScript errors.

- [ ] Commit any redirect-map fixes: `fix(ayokoding-web): repair redirect entries discovered in verification`

## Phase 10 — Final Local Gate

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes. This follows the root cause orientation principle — proactively fix preexisting errors encountered during work.

- [ ] `cd apps/ayokoding-web && ../../apps/ayokoding-cli/dist/ayokoding-cli links check --content content` — exit 0
- [ ] `nx run ayokoding-web:validate-indexes` — exit 0
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` — all green
- [ ] Sample five random renamed files; for each run `git log --follow --format=%H -- <new-path> | tail -1` and confirm history reaches pre-reorg
- [ ] Tree check: `find apps/ayokoding-web/content -type d \( -name concepts -o -name explanation -o -name foundations -o -name cases -o -name 'platform-*' \) | grep -v by-example/cases` returns empty
- [ ] Tree check: `find apps/ayokoding-web/content/en/learn -type d -name human` returns empty

## Phase 11 — Publish to `main` (Direct-to-Main per [Trunk Based Development](../../../repo-governance/development/workflow/trunk-based-development.md))

- [ ] Inside the worktree, ensure all phases committed: `git status` clean
- [ ] From the main checkout (NOT the worktree): `git fetch origin && git checkout main && git pull --ff-only origin main`
- [ ] Merge worktree branch into main fast-forward: `git merge --ff-only worktree-ayokoding-web-learn-reorg`
- [ ] Push: `git push origin main` (pre-push hook runs again as final gate)
- [ ] Wait for hook to pass; if it does not, do NOT `--no-verify` — investigate root cause and add a new phase to fix
- [ ] After push, run `gh run list --branch main --limit 5` to identify the triggered workflow runs.
- [ ] Monitor with `gh run view <run-id> --json status,conclusion` (poll every 3 minutes). Do NOT use `gh run watch`.
- [ ] Verify all workflows pass before moving to Phase 12. If any fail, fix the root cause and push a follow-up commit — do NOT use `--no-verify`.

## Phase 12 — Promote to Production

- [ ] Delegate to the `apps-ayokoding-web-deployer` agent. Brief: "Reorg landed at SHA `<main-tip>`. Promote `prod-ayokoding-web` to `origin/main`. Vercel will rebuild ayokoding.com."
- [ ] After Vercel build completes, verify in production:
  - [ ] `curl -IL https://ayokoding.com/en/learn/software-engineering/platform-web` returns 308/301 with Location `…/platforms/web`
  - [ ] `curl -IL https://ayokoding.com/en/learn/human` returns 308/301 with Location `…/personal-development`
  - [ ] `curl -IL https://ayokoding.com/en/learn/information-security/concepts/explanation` returns 308/301 with Location `…/information-security/by-concept`
- [ ] Spot-check three pages render correctly in a browser

## Phase 13 — Archive

- [ ] Wait for the gitlink at parent (ose-projects) to track `origin/main` containing the merge SHA (only relevant when parent bump is needed; this plan does not require one because it only modifies subrepo content)
- [ ] From the `ose-public` repo root (main checkout, after worktree branch is merged): `git mv plans/in-progress/ayokoding-web-learn-reorg plans/done/$(date +%Y-%m-%d)__ayokoding-web-learn-reorg` — confirm `ls plans/done/` shows the new folder.
- [ ] Commit: `chore(plans): archive ayokoding-web-learn-reorg`
- [ ] Push

## Rollback Plan

If a phase introduces breakage that surfaces after merge to main:

- The phases are designed to be reverted individually. `git revert <phase-commit>` reverses one phase's renames and removes that phase's redirect entries.
- Reverting Phase 2 (`platforms/`) requires reverting Phase 7's `software-architecture/by-example/cases/` only if the cases-under-by-example move depended on a path that no longer exists post-revert — re-check.
- A full rollback is: `git revert <SHA-range>` for all phase commits in reverse order, then `git push origin main`. Vercel re-deploys on push.

## After-Action

- [ ] Open a follow-up plan in `plans/backlog/` if Indonesian content (`content/id/`) needs the same treatment but was deferred
- [ ] Open a follow-up plan if the existing checker agents (`apps-ayokoding-web-by-example-checker`, `apps-ayokoding-web-in-the-field-checker`) need new structural validation rules; consider also creating an `apps-ayokoding-web-by-concept-checker` agent if the by-concept track warrants dedicated validation
- [ ] Update `apps-ayokoding-web-developing-content` skill to reference the canonical shape if it does not already
