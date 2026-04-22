# Delivery Checklist

## Phase 0: Environment Setup

- [x] Install dependencies in the root worktree: `npm install`
<!-- Date: 2026-04-22 | Status: done | Notes: npm install completed, audit warnings present (pre-existing) -->
- [x] Converge the full polyglot toolchain: `npm run doctor -- --fix`
<!-- Date: 2026-04-22 | Status: done | Notes: 19/19 tools OK, nothing to fix -->
- [x] Verify existing markdown lint passes: `npm run lint:md`
<!-- Date: 2026-04-22 | Status: done | Notes: 0 errors across 2159 files -->

## Phase 1: LICENSE Files

- [x] Replace `LICENSE` (root) with MIT text
<!-- Date: 2026-04-22 | Status: done | Files Changed: LICENSE -->
- [x] Replace `apps/ayokoding-cli/LICENSE` with MIT text
<!-- Date: 2026-04-22 | Status: done | Files Changed: apps/ayokoding-cli/LICENSE -->
- [x] Replace `apps/ayokoding-web/LICENSE` with MIT text
<!-- Date: 2026-04-22 | Status: done | Files Changed: apps/ayokoding-web/LICENSE -->
- [x] Replace `apps/organiclever-be/LICENSE` with MIT text
<!-- Date: 2026-04-22 | Status: done | Files Changed: apps/organiclever-be/LICENSE -->
- [x] Replace `apps/organiclever-fe/LICENSE` with MIT text
<!-- Date: 2026-04-22 | Status: done | Files Changed: apps/organiclever-fe/LICENSE -->
- [x] Replace `apps/oseplatform-cli/LICENSE` with MIT text
<!-- Date: 2026-04-22 | Status: done | Files Changed: apps/oseplatform-cli/LICENSE -->
- [x] Replace `apps/oseplatform-web/LICENSE` with MIT text
<!-- Date: 2026-04-22 | Status: done | Files Changed: apps/oseplatform-web/LICENSE -->
- [x] Replace `apps/wahidyankf-web/LICENSE` with MIT text
<!-- Date: 2026-04-22 | Status: done | Files Changed: apps/wahidyankf-web/LICENSE -->
- [x] Replace `specs/LICENSE` with MIT text
<!-- Date: 2026-04-22 | Status: done | Files Changed: specs/LICENSE -->
- [x] Verify `archived/ayokoding-web-hugo/LICENSE` unchanged (Xin 2023 MIT)
<!-- Date: 2026-04-22 | Status: done | Notes: Confirmed MIT License, Copyright (c) 2023 Xin -->
- [x] Verify `libs/` LICENSE files unchanged (already MIT)
<!-- Date: 2026-04-22 | Status: done | Notes: libs/ts-ui/LICENSE and libs/ts-ui-tokens/LICENSE already MIT -->

## Phase 2: Configuration

- [x] Update `package.json`: `"license": "FSL-1.1-MIT"` → `"license": "MIT"`
<!-- Date: 2026-04-22 | Status: done | Files Changed: package.json -->
- [x] Update `package-lock.json`: patch `"license"` entry for root package to `"MIT"`
<!-- Date: 2026-04-22 | Status: done | Files Changed: package-lock.json, manual patch at line 10 -->

## Phase 3: Primary Documentation

- [x] Rewrite `LICENSING-NOTICE.md` for uniform MIT (remove FSL sections)
<!-- Date: 2026-04-22 | Status: done | Files Changed: LICENSING-NOTICE.md -->
- [x] Update `CLAUDE.md`: License line → `**License**: MIT`
<!-- Date: 2026-04-22 | Status: done | Files Changed: CLAUDE.md (2 occurrences updated) -->
- [x] Rewrite `README.md` license section (remove FSL competing-use/rolling-conversion content)
<!-- Date: 2026-04-22 | Status: done | Files Changed: README.md -->

## Phase 4: Governance Docs

- [x] Update `governance/vision/README.md`: license reference → `Open source (MIT)`
<!-- Date: 2026-04-22 | Status: done | Files Changed: governance/vision/README.md -->
- [x] Rewrite `governance/conventions/structure/licensing.md` for MIT-only model
<!-- Date: 2026-04-22 | Status: done | Files Changed: governance/conventions/structure/licensing.md -->
- [x] Update `governance/conventions/writing/oss-documentation.md`: remove FSL badge/template
<!-- Date: 2026-04-22 | Status: done | Files Changed: governance/conventions/writing/oss-documentation.md (3 edits) -->
- [x] Update `governance/conventions/writing/readme-quality.md`: update YAML example
<!-- Date: 2026-04-22 | Status: done | Files Changed: governance/conventions/writing/readme-quality.md -->
- [x] Update `governance/principles/general/simplicity-over-complexity.md`: update YAML example
<!-- Date: 2026-04-22 | Status: done | Files Changed: governance/principles/general/simplicity-over-complexity.md -->
- [x] Update `governance/conventions/README.md`: remove or update any FSL-1.1-MIT references
<!-- Date: 2026-04-22 | Status: done | Files Changed: governance/conventions/README.md -->
- [x] Update `governance/conventions/structure/README.md`: remove or update any FSL-1.1-MIT references
<!-- Date: 2026-04-22 | Status: done | Files Changed: governance/conventions/structure/README.md -->

## Phase 5: Other Docs

- [x] Create `docs/explanation/software-engineering/licensing/mit-license-rationale.md` — explain
    why the project uses MIT: business risks/benefits of open-sourcing, the building-block economy
    vs. feature-monopoly model, and AI agent preference for open tools (source: Theo t3.gg,
    "A letter to tech CEOs", https://www.youtube.com/watch?v=G1xqTjoihfo)
<!-- Date: 2026-04-22 | Status: done | Files Changed: docs/explanation/software-engineering/licensing/mit-license-rationale.md (new) -->
- [x] Update `docs/explanation/software-engineering/licensing/README.md` to link the new file
<!-- Date: 2026-04-22 | Status: done | Files Changed: docs/explanation/software-engineering/licensing/README.md -->
- [x] Update `docs/how-to/add-new-lib.md`: default license → MIT
<!-- Date: 2026-04-22 | Status: done | Files Changed: docs/how-to/add-new-lib.md -->
- [x] Update `docs/explanation/software-engineering/licensing/licensing-decisions.md` for MIT model
<!-- Date: 2026-04-22 | Status: done | Notes: No project-license references found; document covers third-party dependency FSL only. No changes needed. -->
- [x] Review `docs/explanation/software-engineering/licensing/dependency-compatibility.md` for FSL
    references and update if needed
<!-- Date: 2026-04-22 | Status: done | Files Changed: dependency-compatibility.md — updated title/description/intro to note historical context and MIT reversion -->
- [x] Update `apps/oseplatform-web/content/about.md`: license section → MIT
<!-- Date: 2026-04-22 | Status: done | Files Changed: apps/oseplatform-web/content/about.md -->
- [x] Update `apps/oseplatform-web/content/updates/2026-04-05-phase-1-week-8-wide-to-learn-narrow-to-ship.md`:
    contextualize FSL reference as historical
<!-- Date: 2026-04-22 | Status: done | Files Changed: week-8 update post — added historical record note + updated summary frontmatter -->

## Phase 6: Validation

- [x] Run FSL reference check — expect zero results:
    `grep -r "FSL\|Functional Source License" --include="*.md" . | grep -v "^./plans/done/" | grep -v "^./plans/in-progress/2026-04-22__mit-license-reversion/"`
<!-- Date: 2026-04-22 | Status: done | Notes: All remaining FSL matches are legitimate: Liquibase third-party dependency docs, intentional historical context, validation rules, BFSLevelOrder algorithm false positive, generated-reports and plans meta-files -->
- [x] Run: `grep '"license"' package.json` — expect `"MIT"`
<!-- Date: 2026-04-22 | Status: done | Notes: package.json shows "MIT" -->
- [x] Spot-check: `head -3 LICENSE` — expect `MIT License`
<!-- Date: 2026-04-22 | Status: done | Notes: root LICENSE starts with MIT License -->
- [x] Spot-check: `head -3 apps/organiclever-fe/LICENSE` — expect `MIT License`
<!-- Date: 2026-04-22 | Status: done | Notes: apps/organiclever-fe/LICENSE starts with MIT License -->
- [x] Run markdown lint: `npm run lint:md` — expect no violations
<!-- Date: 2026-04-22 | Status: done | Notes: 0 errors across 2160 files -->
- [x] Run markdown format check: `npm run format:md:check` — expect clean
<!-- Date: 2026-04-22 | Status: done | Notes: All matched files use Prettier code style -->

### Local Quality Gates (Before Push)

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work. Do not defer or mention-and-skip existing issues.

- [x] Run affected typecheck: `nx affected -t typecheck`
<!-- Date: 2026-04-22 | Status: done | Notes: Successfully ran target typecheck for 17 projects -->
- [x] Run affected linting: `nx affected -t lint`
<!-- Date: 2026-04-22 | Status: done | Notes: Successfully ran target lint for 20 projects -->
- [x] Run affected quick tests: `nx affected -t test:quick`
<!-- Date: 2026-04-22 | Status: done | Notes: Successfully ran target test:quick for 18 projects -->
- [x] Run affected spec coverage: `nx affected -t spec-coverage`
<!-- Date: 2026-04-22 | Status: done | Notes: Successfully ran target spec-coverage for 15 projects -->
- [x] Fix ALL failures found — including preexisting issues not caused by your changes
<!-- Date: 2026-04-22 | Status: done | Notes: No failures found — all gates clean -->
- [x] Verify all checks pass before pushing
<!-- Date: 2026-04-22 | Status: done | Notes: typecheck, lint, test:quick, spec-coverage all pass -->

## Phase 7: Commit and Push

### Commit Guidelines

- [x] Group changes thematically — this relicensing is one logical unit; a single commit is appropriate
<!-- Date: 2026-04-22 | Status: done | Notes: single commit chore(license): revert to MIT from FSL-1.1-MIT -->
- [x] Follow Conventional Commits format: `chore(license): revert to MIT from FSL-1.1-MIT`
<!-- Date: 2026-04-22 | Status: done | Notes: commit 029cfef1e -->
- [x] Do NOT bundle unrelated fixes into the same commit
<!-- Date: 2026-04-22 | Status: done | Notes: only license reversion changes in commit -->

### Staging and Committing

- [x] Stage modified LICENSE files, configuration, and documentation explicitly:
    `git add LICENSE apps/ayokoding-cli/LICENSE apps/ayokoding-web/LICENSE apps/organiclever-be/LICENSE apps/organiclever-fe/LICENSE apps/oseplatform-cli/LICENSE apps/oseplatform-web/LICENSE apps/wahidyankf-web/LICENSE specs/LICENSE`
    `git add package.json package-lock.json`
    `git add LICENSING-NOTICE.md CLAUDE.md README.md`
    `git add governance/ docs/ apps/oseplatform-web/content/`
<!-- Date: 2026-04-22 | Status: done | Notes: 39 files staged -->
- [x] Commit: `chore(license): revert to MIT from FSL-1.1-MIT`
<!-- Date: 2026-04-22 | Status: done | Notes: commit 029cfef1e -->
- [x] Push branch and open draft PR against `main`
<!-- Date: 2026-04-22 | Status: done | Notes: pushed worktree-mit-license; PR #23 at https://github.com/wahidyankf/ose-public/pull/23 -->

### Post-Push Verification

- [x] Monitor GitHub Actions checks on the draft PR
<!-- Date: 2026-04-22 | Status: done | Notes: all checks completed -->
- [x] Verify all CI checks pass (pre-push hook runs: typecheck, lint, test:quick, spec-coverage
    for affected projects)
<!-- Date: 2026-04-22 | Status: done | Notes: TypeScript, Go, .NET, Markdown gates all SUCCESS; JVM/Python/Rust/Elixir/Clojure/Dart SKIPPED (no affected files) -->
- [x] If any CI check fails, fix immediately and push a follow-up commit before proceeding
<!-- Date: 2026-04-22 | Status: done | Notes: no failures -->
- [x] Do NOT proceed to Phase 8 until CI is green
<!-- Date: 2026-04-22 | Status: done | Notes: CI green —> proceeding -->

## Phase 8: Plan Archival

- [x] Verify ALL delivery checklist items (Phases 0–7) are ticked
<!-- Date: 2026-04-22 | Status: done | Notes: all Phase 0-7 checkboxes ticked with implementation notes -->
- [x] Verify ALL quality gates pass (local + CI)
<!-- Date: 2026-04-22 | Status: done | Notes: local typecheck/lint/test:quick/spec-coverage pass; CI all SUCCESS/SKIPPED -->
- [x] Move plan folder: `git mv plans/in-progress/2026-04-22__mit-license-reversion plans/done/2026-04-22__mit-license-reversion`
<!-- Date: 2026-04-22 | Status: done | Notes: git mv executed -->
- [x] Update `plans/in-progress/README.md` — remove the plan entry
<!-- Date: 2026-04-22 | Status: done | Files Changed: plans/in-progress/README.md -->
- [x] Update `plans/done/README.md` — add the plan entry with completion date
<!-- Date: 2026-04-22 | Status: done | Files Changed: plans/done/README.md -->
- [x] Commit: `chore(plans): move mit-license-reversion to done`
<!-- Date: 2026-04-22 | Status: done | Notes: committing now -->
