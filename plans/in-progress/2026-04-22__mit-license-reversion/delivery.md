# Delivery Checklist

## Phase 0: Environment Setup

- [ ] Install dependencies in the root worktree: `npm install`
- [ ] Converge the full polyglot toolchain: `npm run doctor -- --fix`
- [ ] Verify existing markdown lint passes: `npm run lint:md`

## Phase 1: LICENSE Files

- [ ] Replace `LICENSE` (root) with MIT text
- [ ] Replace `apps/ayokoding-cli/LICENSE` with MIT text
- [ ] Replace `apps/ayokoding-web/LICENSE` with MIT text
- [ ] Replace `apps/organiclever-be/LICENSE` with MIT text
- [ ] Replace `apps/organiclever-fe/LICENSE` with MIT text
- [ ] Replace `apps/oseplatform-cli/LICENSE` with MIT text
- [ ] Replace `apps/oseplatform-web/LICENSE` with MIT text
- [ ] Replace `apps/wahidyankf-web/LICENSE` with MIT text
- [ ] Replace `specs/LICENSE` with MIT text
- [ ] Verify `archived/ayokoding-web-hugo/LICENSE` unchanged (Xin 2023 MIT)
- [ ] Verify `libs/` LICENSE files unchanged (already MIT)

## Phase 2: Configuration

- [ ] Update `package.json`: `"license": "FSL-1.1-MIT"` → `"license": "MIT"`
- [ ] Update `package-lock.json`: patch `"license"` entry for root package to `"MIT"`

## Phase 3: Primary Documentation

- [ ] Rewrite `LICENSING-NOTICE.md` for uniform MIT (remove FSL sections)
- [ ] Update `CLAUDE.md`: License line → `**License**: MIT`
- [ ] Rewrite `README.md` license section (remove FSL competing-use/rolling-conversion content)

## Phase 4: Governance Docs

- [ ] Update `governance/vision/README.md`: license reference → `Open source (MIT)`
- [ ] Rewrite `governance/conventions/structure/licensing.md` for MIT-only model
- [ ] Update `governance/conventions/writing/oss-documentation.md`: remove FSL badge/template
- [ ] Update `governance/conventions/writing/readme-quality.md`: update YAML example
- [ ] Update `governance/principles/general/simplicity-over-complexity.md`: update YAML example
- [ ] Update `governance/conventions/README.md`: remove or update any FSL-1.1-MIT references
- [ ] Update `governance/conventions/structure/README.md`: remove or update any FSL-1.1-MIT references

## Phase 5: Other Docs

- [ ] Create `docs/explanation/software-engineering/licensing/mit-license-rationale.md` — explain
      why the project uses MIT: business risks/benefits of open-sourcing, the building-block economy
      vs. feature-monopoly model, and AI agent preference for open tools (source: Theo t3.gg,
      "A letter to tech CEOs", https://www.youtube.com/watch?v=G1xqTjoihfo)
- [ ] Update `docs/explanation/software-engineering/licensing/README.md` to link the new file
- [ ] Update `docs/how-to/add-new-lib.md`: default license → MIT
- [ ] Update `docs/explanation/software-engineering/licensing/licensing-decisions.md` for MIT model
- [ ] Review `docs/explanation/software-engineering/licensing/dependency-compatibility.md` for FSL
      references and update if needed
- [ ] Update `apps/oseplatform-web/content/about.md`: license section → MIT
- [ ] Update `apps/oseplatform-web/content/updates/2026-04-05-phase-1-week-8-wide-to-learn-narrow-to-ship.md`:
      contextualize FSL reference as historical

## Phase 6: Validation

- [ ] Run FSL reference check — expect zero results:
      `grep -r "FSL\|Functional Source License" --include="*.md" . | grep -v "^./plans/done/" | grep -v "^./plans/in-progress/2026-04-22__mit-license-reversion/"`
- [ ] Run: `grep '"license"' package.json` — expect `"MIT"`
- [ ] Spot-check: `head -3 LICENSE` — expect `MIT License`
- [ ] Spot-check: `head -3 apps/organiclever-fe/LICENSE` — expect `MIT License`
- [ ] Run markdown lint: `npm run lint:md` — expect no violations
- [ ] Run markdown format check: `npm run format:md:check` — expect clean

### Local Quality Gates (Before Push)

> **Important**: Fix ALL failures found during quality gates, not just those caused by your
> changes. This follows the root cause orientation principle — proactively fix preexisting
> errors encountered during work. Do not defer or mention-and-skip existing issues.

- [ ] Run affected typecheck: `nx affected -t typecheck`
- [ ] Run affected linting: `nx affected -t lint`
- [ ] Run affected quick tests: `nx affected -t test:quick`
- [ ] Run affected spec coverage: `nx affected -t spec-coverage`
- [ ] Fix ALL failures found — including preexisting issues not caused by your changes
- [ ] Verify all checks pass before pushing

## Phase 7: Commit and Push

### Commit Guidelines

- [ ] Group changes thematically — this relicensing is one logical unit; a single commit is appropriate
- [ ] Follow Conventional Commits format: `chore(license): revert to MIT from FSL-1.1-MIT`
- [ ] Do NOT bundle unrelated fixes into the same commit

### Staging and Committing

- [ ] Stage modified LICENSE files, configuration, and documentation explicitly:
      `git add LICENSE apps/ayokoding-cli/LICENSE apps/ayokoding-web/LICENSE apps/organiclever-be/LICENSE apps/organiclever-fe/LICENSE apps/oseplatform-cli/LICENSE apps/oseplatform-web/LICENSE apps/wahidyankf-web/LICENSE specs/LICENSE`
      `git add package.json package-lock.json`
      `git add LICENSING-NOTICE.md CLAUDE.md README.md`
      `git add governance/ docs/ apps/oseplatform-web/content/`
- [ ] Commit: `chore(license): revert to MIT from FSL-1.1-MIT`
- [ ] Push branch and open draft PR against `main`

### Post-Push Verification

- [ ] Monitor GitHub Actions checks on the draft PR
- [ ] Verify all CI checks pass (pre-push hook runs: typecheck, lint, test:quick, spec-coverage
      for affected projects)
- [ ] If any CI check fails, fix immediately and push a follow-up commit before proceeding
- [ ] Do NOT proceed to Phase 8 until CI is green

## Phase 8: Plan Archival

- [ ] Verify ALL delivery checklist items (Phases 0–7) are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Move plan folder: `git mv plans/in-progress/2026-04-22__mit-license-reversion plans/done/2026-04-22__mit-license-reversion`
- [ ] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] Update `plans/done/README.md` — add the plan entry with completion date
- [ ] Commit: `chore(plans): move mit-license-reversion to done`
