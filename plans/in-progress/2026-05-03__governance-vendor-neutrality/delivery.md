# Delivery Checklist — Governance Vendor-Neutrality

## Phase 1: Audit & Inventory

- [ ] Run `rhino-cli governance vendor-audit governance/` baseline
- [ ] Catalog all violations by category (model names, benchmarks, vendor paths)
- [ ] Identify content-migration files vs. rewording-only files
- [ ] Verify `docs/reference/ai-model-benchmarks.md` is comprehensive enough to serve as canonical source

## Phase 2: Content Migration & Rewrite

- [ ] Verify `docs/reference/ai-model-benchmarks.md` has benchmark data for every model referenced in governance files — add any missing entries before proceeding
- [ ] Update `governance/development/agents/model-selection.md`:
  - Rewrite model references using capability tiers (planning-grade, execution-grade, fast)
  - Remove benchmark scores from governance prose
  - Link to `docs/reference/ai-model-benchmarks.md` as canonical source
- [ ] Update `governance/README.md`:
  - Replace `.claude/agents/` references with "platform binding agents"
  - Update Layer 4 description to reflect vendor-neutrality
- [ ] Update `governance/repository-governance-architecture.md`:
  - Clarify agent skills are delivery infrastructure (not Layer 4.5)
  - Ensure agent color palette examples are not load-bearing prose
- [ ] Check other governance files for vendor-specific content
- [ ] Verify vendor-specific benchmark content is complete in `docs/reference/ai-model-benchmarks.md`

## Phase 3: Layer-Test Update

- [ ] Update `governance/README.md` Layer Test with Vendor-Specific Content Test
- [ ] Update `governance/conventions/structure/governance-vendor-independence.md` if needed

## Phase 4: Validation

- [ ] Run `rhino-cli governance vendor-audit governance/` — expect 0 violations
- [ ] Run `npm run lint:md:fix` then `npm run lint:md` — expect 0 violations
- [ ] Verify all benchmark references in governance link to `docs/reference/ai-model-benchmarks.md`
- [ ] Verify `docs/reference/ai-model-benchmarks.md` follows Diátaxis reference conventions
- [ ] Run `nx affected -t typecheck lint test:quick spec-coverage` — all pass

## Quality Gates

### Development Environment Setup (First-Time)

- [ ] Provision worktree: `claude --worktree governance-vendor-neutrality` (creates `worktrees/governance-vendor-neutrality/` in repo root)
- [ ] Run `npm install && npm run doctor -- --fix` to converge toolchain
- [ ] Verify `rhino-cli` is available: `go run apps/rhino-cli/main.go --version`

### Local Quality Gates (Before Push)

- [ ] Run `rhino-cli governance vendor-audit governance/` — 0 violations
- [ ] Run `npm run lint:md:fix && npm run lint:md` — 0 violations
- [ ] Run `nx affected -t typecheck lint test:quick spec-coverage` — all pass
- [ ] Verify no new vendor-specific content introduced

### Post-Push Verification

- [ ] Push changes to `main`
- [ ] Monitor GitHub Actions: watch `pr-quality-gate.yml` and any push-triggered workflows (markdown lint, link validation)
- [ ] Verify all CI checks pass
- [ ] If any CI check fails, fix immediately and push a follow-up commit

**Important**: Fix ALL failures found during quality gates, not just those caused by your changes. This follows the root cause orientation principle.

## Commit Guidelines

- [ ] Commit changes thematically — benchmark migration in one commit, governance rewrites in another
- [ ] Follow Conventional Commits format: `refactor(governance): make vendor-neutral per governance-vendor-independence convention`
- [ ] Split benchmark content migration from governance prose cleanup into separate commits if files differ significantly

## Plan Archival

- [ ] Verify ALL delivery checklist items are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Move plan folder from `plans/in-progress/` to `plans/done/` via `git mv`
- [ ] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] Update `plans/done/README.md` — add the plan entry with completion date
