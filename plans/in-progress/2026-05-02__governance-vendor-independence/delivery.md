---
title: "Delivery — Governance Vendor-Independence Refactor"
description: Phased step-by-step checklist (TDD-shaped where applicable) executing the governance/ vendor-neutralization refactor.
created: 2026-05-02
---

# Delivery Checklist — Governance Vendor-Independence

> Conventions: every item is a `- [ ]` checkbox. TDD-shaped items are explicitly tagged **RED**, **GREEN**, **REFACTOR**. Each phase has a Pre-Flight, Steps, Exit Gates, and Rollback subsection. Phase ordering is mandatory unless explicitly noted as parallelizable.

## Commit Guidelines

> Apply throughout all phases. These rules take precedence when in doubt.

- Commit changes thematically — group related changes into logically cohesive commits.
- Follow Conventional Commits format: `<type>(<scope>): <description>` (e.g., `docs(governance): ...`, `feat(rhino-cli): ...`).
- Split different domains/concerns into separate commits (e.g., a governance prose rewrite and a test addition are separate commits).
- Do NOT bundle unrelated fixes into a single commit.
- Each Phase 3 file rewrite is its own commit (or a tightly grouped commit for closely related files); do not batch-commit all of Phase 3 in one shot.

---

## Phase 0 — Pre-Flight

### Pre-Flight checks

- [ ] Confirm we are inside an `ose-public` Scope-A worktree (path matches `ose-public/.claude/worktrees/<name>/`).
- [ ] Confirm worktree branch is NOT `main` (`git branch --show-current` reports `worktree-<name>`).
- [ ] `git status` reports a clean tree.
- [ ] Run `npm install` once at the worktree root (if not already done in this session).
- [ ] Run `npm run doctor -- --fix` once at the worktree root.
- [ ] Capture baseline: `nx affected -t typecheck lint test:quick spec-coverage --base=origin/main` exits 0 (or "no projects affected").
- [ ] Capture baseline: `npm run lint:md` exits 0.
- [ ] Capture baseline: vendor-term audit (manual ad-hoc grep until tooling exists in Phase 5):
  - [ ] `grep -rln -E "Claude Code|OpenCode|Anthropic|Sonnet|Opus|Haiku|\.claude/|\.opencode/" governance/ | wc -l` → record number (currently 65).

### Exit gate

- [ ] All baseline commands captured. Numbers recorded inline below for diff comparison at Phase 6.
  - Pre-refactor vendor-tainted file count: \_\_\_
  - Pre-refactor `lint:md` status: \_\_\_
  - Pre-refactor `nx affected` summary: \_\_\_

> **Important**: Fix ALL failures found during quality gates, not just those caused by this
> refactor. Per the root-cause orientation principle, proactively fix preexisting errors
> encountered during work. Do not defer or mention-and-skip existing issues.

### Rollback

- [ ] None needed; pre-flight is read-only.

---

## Phase 1 — New Convention Lands First

> Documentation-First principle: the rule MUST exist before bulk rewriting starts.

### Pre-Flight

- [ ] Re-read `governance/conventions/structure/plans.md` (formatting expectations for new conventions).
- [ ] Re-read `governance/conventions/README.md` (registration requirements for a new convention).

### Steps

- [ ] Create `governance/conventions/structure/governance-vendor-independence.md` with the structure specified in tech-docs.md §3:
  - [ ] Frontmatter (title, description, category=explanation, subcategory=conventions, tags, created).
  - [ ] H1 + intro paragraph.
  - [ ] "Principles Implemented/Respected" section, citing Simplicity Over Complexity, Explicit Over Implicit, Accessibility First, Documentation First.
  - [ ] "Purpose" — separation of vendor-neutral governance from platform bindings.
  - [ ] "Scope" — what's in (governance/), what's out (.claude/, .opencode/, AGENTS.md, CLAUDE.md, docs/reference/platform-bindings.md).
  - [ ] "Forbidden Vendor Terms" — exact regex list.
  - [ ] "Allowlist Mechanism" — `binding-example` fence + "Platform Binding Examples" heading.
  - [ ] "Vocabulary Map" — full table from tech-docs.md §2.
  - [ ] "Platform Binding Directory Pattern" — per-tool dotdir model.
  - [ ] "Migration Guidance" — refactor recipe summary.
  - [ ] "Enforcement" — pointer to Phase 5 tooling (use TODO marker citing this plan).
  - [ ] "Exceptions and Escape Hatches" — explicit list.
- [ ] Register the convention in `governance/conventions/README.md`:
  - [ ] Add entry under the "structure" section.
- [ ] Register the convention in `governance/conventions/structure/README.md`:
  - [ ] Add entry to the conventions list.
- [ ] Cross-reference: add link from `governance/README.md` "Key Conventions" if appropriate.
- [ ] `npm run lint:md:fix` to auto-format the new file.
- [ ] `npm run lint:md` exits 0.
- [ ] Manual link check: every link target in the new file resolves.
- [ ] Commit: `docs(governance): add governance-vendor-independence convention`.

### Exit gate

- [ ] New convention file present and listed in two index files (conventions/README.md, conventions/structure/README.md).
- [ ] `npm run lint:md` green.
- [ ] No vendor terms IN the new convention itself except inside its own `binding-example` blocks (it dogfoods the rule).

### Rollback

- [ ] `git revert` the convention commit. No downstream files yet depend on it.

---

## Phase 2 — AGENTS.md and CLAUDE.md Restructure

### Pre-Flight

- [ ] Identify what content in current `CLAUDE.md` is genuinely Claude-Code-specific vs vendor-neutral:
  - [ ] Inventory: read every line of `CLAUDE.md`.
  - [ ] Tag each section: NEUTRAL / CLAUDE-ONLY / DUAL-MODE-ONLY / DELETE.
  - [ ] Persist the tagging in a temp note (e.g., `local-temp/claude-md-section-tagging.md`).

### Steps

- [ ] Create `AGENTS.md` at `ose-public/` root containing all NEUTRAL sections from `CLAUDE.md`, refactored to match the AGENTS.md spec contract (tech-docs.md §4.1):
  - [ ] Repository Overview.
  - [ ] Build / Test / Lint commands.
  - [ ] Conventions section (links into governance/, no duplication).
  - [ ] Plans section (link to governance/conventions/structure/plans.md and plans/).
  - [ ] Worktree Workflow section (or link if too long).
  - [ ] Platform Bindings section (links to .claude/, .opencode/, future bindings, and docs/reference/platform-bindings.md once Phase 4 lands — use TODO marker for now).
  - [ ] Models section (capability-tier framing only).
- [ ] Convert `CLAUDE.md` to a shim:
  - [ ] First non-frontmatter content line: `@AGENTS.md`.
  - [ ] Subsequent sections: only Claude-Code-specific notes (CLAUDE-ONLY tagged content) — slash command primer, Claude-Code subagent semantics, Claude plugins, settings.json pointer.
  - [ ] Remove duplicated NEUTRAL content (it now lives in AGENTS.md).
- [ ] Run `npm run sync:claude-to-opencode` (DO NOT skip — verifies dual-mode infrastructure still operates over the new shape).
- [ ] Verify OpenCode discovers AGENTS.md correctly:
  - [ ] If a smoke-test workflow exists, run it.
  - [ ] If not, document a manual smoke test (open OpenCode, confirm session loads conventions).
- [ ] Verify Claude Code still bootstraps via CLAUDE.md → @AGENTS.md import:
  - [ ] Open a fresh Claude Code session at the worktree root.
  - [ ] Confirm CLAUDE.md content + imported AGENTS.md content both visible.
- [ ] `npm run lint:md` green.
- [ ] Markdown link checker green over both AGENTS.md and CLAUDE.md.
- [ ] Commit: `docs: introduce AGENTS.md as canonical root instruction file; reduce CLAUDE.md to Claude-Code shim`.

### Exit gate

- [ ] `AGENTS.md` exists at `ose-public/` root.
- [ ] `CLAUDE.md` reduced to shim + Claude-only notes.
- [ ] `npm run sync:claude-to-opencode` exits 0.
- [ ] Manual Claude Code session loads the new shape correctly.
- [ ] `npm run lint:md` green.
- [ ] No content duplication between AGENTS.md and CLAUDE.md (cross-check by grep on common headings).

### Rollback

- [ ] If sync breaks: `git revert` the AGENTS.md/CLAUDE.md commit; `npm run sync:claude-to-opencode` again to restore.
- [ ] If Claude Code session bootstrap fails: same revert; investigate the @-import behavior; retry with corrected shim.

---

## Phase 3 — Bulk Vocabulary Refactor

> Order: Tier A → Tier B → Tier C. Within a tier, order by file size descending. Each file is its own commit (or a tightly grouped commit when related).

### Phase 3.0 — Pre-Flight

- [ ] Run a full inventory grep one more time and confirm the file list still matches tech-docs.md §7 stratification.
- [ ] Open the Vocabulary Map (in the new convention) in a side buffer; reference during every rewrite.

### Phase 3.A — Tier A (heavy lift)

For each file: read whole file, classify each match, rewrite per recipe (tech-docs.md §7.2), `npm run lint:md:fix`, link-check, commit.

- [ ] `governance/development/agents/ai-agents.md` (115 KB).
  - [ ] Pre-read: capture current section structure as a temp outline.
  - [ ] Rewrite: vendor terms → neutral; Claude/OpenCode-specific notes moved into `binding-example` fences or a "Platform Binding Examples" section.
  - [ ] Verify: vendor-term grep over this file returns only allowlisted matches.
  - [ ] Link-check.
  - [ ] Commit.
- [ ] `governance/conventions/tutorials/in-the-field.md` (99 KB) — verify vendor mentions are real (largely tutorial framing; some references to `.claude/` agents may exist).
- [ ] `governance/conventions/hugo/ayokoding.md` (78 KB).
- [ ] `governance/conventions/tutorials/by-example.md` (66 KB).
- [ ] `governance/conventions/formatting/diagrams.md` (65 KB).
- [ ] `governance/development/quality/criticality-levels.md` (43 KB).
- [ ] `governance/development/pattern/maker-checker-fixer.md` (40 KB).
- [ ] `governance/workflows/plan/plan-execution.md` (39 KB).
- [ ] `governance/conventions/structure/ose-primer-sync.md` (39 KB).
- [ ] `governance/conventions/formatting/color-accessibility.md` (37 KB).
- [ ] `governance/development/quality/fixer-confidence-levels.md` (36 KB).
- [ ] `governance/repository-governance-architecture.md` (31 KB).

### Phase 3.B — Tier B (moderate)

- [ ] `governance/conventions/structure/plans.md` (28 KB).
- [ ] `governance/workflows/ayokoding-web/ayokoding-web-by-example-quality-gate.md` (28 KB).
- [ ] `governance/workflows/meta/workflow-identifier.md` (28 KB).
- [ ] `governance/development/infra/ci-conventions.md` (28 KB).
- [ ] `governance/conventions/formatting/emoji.md` (28 KB).
- [ ] `governance/development/workflow/trunk-based-development.md` (27 KB).
- [ ] `governance/development/agents/model-selection.md` (24 KB) — special handling: rewrite around capability tiers; concrete model names allowlisted into a single "Platform Binding Examples — Model Resolution" section that maps tiers to vendor models.
- [ ] `governance/workflows/docs/docs-quality-gate.md` (24 KB).
- [ ] `governance/development/quality/code.md` (23 KB).
- [ ] `governance/workflows/README.md` (21 KB).
- [ ] `governance/principles/general/simplicity-over-complexity.md` (19 KB) — Layer 1; vendor mentions should be incidental and easy to neutralize.
- [ ] `governance/workflows/infra/development-environment-setup.md` (19 KB).
- [ ] `governance/conventions/README.md` (18 KB).
- [ ] `governance/development/README.md` (17 KB).
- [ ] `governance/vision/open-sharia-enterprise.md` (17 KB) — Layer 0; AC-9 says "no semantic change". Limit to literal vendor-name removal only.
- [ ] `governance/workflows/ayokoding-web/ayokoding-web-in-the-field-quality-gate.md` (17 KB).
- [ ] `governance/conventions/formatting/linking.md` (16 KB).
- [ ] `governance/development/workflow/test-driven-development.md` (16 KB).
- [ ] `governance/development/quality/repository-validation.md` (16 KB).
- [ ] `governance/workflows/plan/plan-quality-gate.md` (16 KB) — important; this same workflow is invoked at end of plan.
- [ ] `governance/workflows/ayokoding-web/ayokoding-web-general-quality-gate.md` (16 KB).
- [ ] `governance/conventions/linking/internal-ayokoding-references.md` (16 KB).
- [ ] `governance/workflows/repo/repo-rules-quality-gate.md` (15 KB).
- [ ] `governance/development/infra/bdd-spec-test-mapping.md` (14 KB).
- [ ] `governance/conventions/hugo/ose-platform.md` (14 KB).
- [ ] `governance/principles/content/progressive-disclosure.md` (13 KB) — Layer 1; same care as vision.
- [ ] `governance/principles/content/accessibility-first.md` (13 KB) — Layer 1; same care.
- [ ] `governance/principles/software-engineering/automation-over-manual.md` (13 KB) — Layer 1.
- [ ] `governance/development/workflow/worktree-setup.md` (13 KB).
- [ ] `governance/conventions/writing/web-research-delegation.md` (13 KB).
- [ ] `governance/development/workflow/git-push-default.md` (13 KB).
- [ ] `governance/conventions/writing/dynamic-collection-references.md` (12 KB).
- [ ] `governance/development/workflow/native-first-toolchain.md` (12 KB).
- [ ] `governance/workflows/meta/execution-modes.md` (12 KB).
- [ ] `governance/development/workflow/ci-post-push-verification.md` (11 KB).
- [ ] `governance/development/workflow/git-push-safety.md` (11 KB).
- [ ] `governance/development/agents/skill-context-architecture.md` (11 KB) — heavy on "Skills" terminology; central rewrite target.
- [ ] `governance/workflows/repo/repo-ose-primer-extraction-execution.md` (11 KB).
- [ ] `governance/development/workflow/pr-merge-protocol.md` (10 KB).
- [ ] `governance/development/quality/markdown.md` (10 KB).
- [ ] `governance/conventions/structure/no-date-metadata.md` (10 KB).

### Phase 3.C — Tier C (light, <10 KB each)

- [ ] `governance/README.md`.
- [ ] `governance/workflows/repo/repo-ose-primer-sync-execution.md`.
- [ ] `governance/conventions/structure/agent-naming.md` — keep "agent" as generic primary term; "Claude Code agent" replaced with "the agent definition file".
- [ ] `governance/development/agents/anti-patterns.md`.
- [ ] `governance/conventions/structure/workflow-naming.md`.
- [ ] `governance/vision/README.md`.
- [ ] `governance/development/agents/best-practices.md`.
- [ ] `governance/conventions/structure/licensing.md`.
- [ ] `governance/conventions/structure/README.md`.
- [ ] `governance/workflows/ui/ui-quality-gate.md`.
- [ ] `governance/conventions/structure/file-naming.md`.
- [ ] `governance/development/agents/README.md`.

### Phase 3 — Mid-phase exit gate

- [ ] After every 5 file commits, run `npm run lint:md` and the link-checker; do not let backlog accumulate.
- [ ] Run `git status` after each commit; expect clean.

### Phase 3 — Final exit gate

- [ ] Manual ad-hoc audit: `grep -rln -E "Claude Code|OpenCode|Anthropic|Sonnet|Opus|Haiku|\.claude/|\.opencode/" governance/` returns matches ONLY in:
  - [ ] `governance/conventions/structure/governance-vendor-independence.md` (the convention itself, allowlisted in its own examples).
  - [ ] Inside `binding-example` fenced blocks.
  - [ ] Under "Platform Binding Examples" headings.
- [ ] Document the residual matches with file:line in a temp note for the Phase 5 allowlist parser.

### Phase 3 — Rollback

- [ ] Per-file commits make rollback granular: `git revert <sha>` for any file whose rewrite proves problematic.

---

## Phase 4 — Platform-Bindings Catalog

### Pre-Flight

- [ ] Re-confirm `docs/reference/` exists at `ose-public/docs/reference/`.

### Steps

- [ ] Create `docs/reference/platform-bindings.md` populated from tech-docs.md §5 table.
- [ ] Add row links to upstream tool docs (verify each URL resolves).
- [ ] Backfill the AGENTS.md "Platform Bindings" section: replace the TODO marker with the link to `docs/reference/platform-bindings.md`.
- [ ] Backfill the new convention's "Platform Binding Directory Pattern" section: cross-link to `docs/reference/platform-bindings.md`.
- [ ] `npm run lint:md` green.
- [ ] Link-checker green over `docs/reference/platform-bindings.md`, `AGENTS.md`, and the new convention.
- [ ] Commit: `docs(reference): add platform-bindings catalog; link from AGENTS.md and governance-vendor-independence convention`.

### Exit gate

- [ ] `docs/reference/platform-bindings.md` exists and is reachable from AGENTS.md, governance/conventions/structure/governance-vendor-independence.md, and (optionally) governance/README.md.

### Rollback

- [ ] `git revert` the catalog commit; restore TODO marker in AGENTS.md.

---

## Phase 5 — Validation Tooling (TDD)

> Builds a `rhino-cli` subcommand. Strict Red → Green → Refactor.

### Pre-Flight

- [ ] Read `apps/rhino-cli/` to identify existing subcommand structure (likely cobra-based per Go convention).
- [ ] Read `governance/development/workflow/test-driven-development.md` for the project's TDD expectations.
- [ ] Read `governance/development/infra/bdd-spec-test-mapping.md` for the godog scenario style.

### Steps — Scaffolding

- [ ] **RED**: Add a failing godog scenario at `specs/apps/rhino/cli/gherkin/governance-vendor-audit.feature` (matches existing pattern: `specs/apps/rhino/cli/gherkin/<name>.feature`) covering "scanner reports forbidden term in plain markdown". Run the spec; expect failure because the command does not exist yet.
- [ ] **GREEN**: Implement minimal `rhino-cli governance vendor-audit` command that walks a path and reports any match against a hardcoded forbidden-term list. Exit 1 on findings.
- [ ] Verify the scenario goes green.
- [ ] **REFACTOR**: Extract a `Scanner` type with a `Walk(root) ([]Finding, error)` interface.

### Steps — Allowlist mechanism (fence)

- [ ] **RED**: Add scenario "binding-example fence is exempted from scan".
- [ ] **GREEN**: Implement code-fence parser that recognizes ```binding-example and skips its content range.
- [ ] **REFACTOR**: Move fence parser into a shared `markdown_fence` helper; add unit tests.

### Steps — Allowlist mechanism (heading scope)

- [ ] **RED**: Add scenario "section under 'Platform Binding Examples' heading is exempted".
- [ ] **GREEN**: Implement heading-range scanner.
- [ ] **REFACTOR**: Unify fence and heading allowlist into a single Range type.

### Steps — Forbidden-term coverage

- [ ] **RED**: Add scenarios for each forbidden-term family:
  - [ ] vendor product names ("Claude Code", "OpenCode", "Anthropic")
  - [ ] vendor model names ("Sonnet", "Opus", "Haiku")
  - [ ] vendor paths ("`.claude/`", "`.opencode/`")
  - [ ] vendor proper-noun "Skills" pattern (capitalized at start of word, in non-allowlisted prose)
- [ ] **GREEN**: Implement each pattern.
- [ ] **REFACTOR**: Centralize the regex set in a `convention.yaml` config file colocated with the new convention.

### Steps — Suggested replacement output

- [ ] **RED**: Add scenario "scanner output includes suggested replacement column".
- [ ] **GREEN**: Wire the Vocabulary Map to the report output.
- [ ] **REFACTOR**: Output formats: human (default), JSON (`--format=json`), SARIF (stretch goal).

### Steps — Wiring into Nx and pre-push

- [ ] Add `vendor-audit` to `apps/rhino-cli/project.json` `test:quick` target dependencies (or as its own Nx target invoked from `test:quick`).
- [ ] Confirm pre-push hook picks it up via `nx affected -t test:quick`.
- [ ] Run `nx run rhino-cli:test:quick` → expect exit 0 because Phase 3 leaves `governance/` clean.
- [ ] Run `rhino-cli governance vendor-audit governance/` → expect exit 0.
- [ ] Inject a deliberate violation (add "Claude Code" to a governance file in a temp branch), confirm exit 1, then revert.
- [ ] Coverage: ensure new code meets `apps/rhino-cli` ≥90% threshold (already enforced).

### Exit gate

- [ ] `rhino-cli governance vendor-audit` command exists and is documented in `apps/rhino-cli/README.md`.
- [ ] Test coverage ≥90%.
- [ ] All godog scenarios green.
- [ ] Pre-push integration verified.
- [ ] `governance/conventions/structure/governance-vendor-independence.md` "Enforcement" section TODO removed; cite the command directly.

### Rollback

- [ ] If tooling proves unreliable: revert the rhino-cli commits but KEEP the convention; the rule still stands as a manual-review gate. Plan a follow-up to redo the tool.

---

## Phase 6 — Final Pass and Plan Closure

### Pre-Flight

- [ ] Confirm Phases 0–5 all marked complete in this file.

### Steps

- [ ] Run full vendor audit: `rhino-cli governance vendor-audit governance/` — expect exit 0.
- [ ] Run `npm run lint:md` — expect exit 0.
- [ ] Run `npm run lint:md:fix` — expect no diff.
- [ ] Run markdown-link-checker (or the project's link validation Nx target) over `governance/`, `AGENTS.md`, `CLAUDE.md`, `docs/reference/platform-bindings.md` — green.
- [ ] Run `npm run sync:claude-to-opencode` — expect exit 0 and no diff under `.opencode/agents/` (or only the sync-expected diffs).
- [ ] Run pre-push gate: `nx affected -t typecheck lint test:quick spec-coverage --base=origin/main` — exit 0.

  > **Important**: Fix ALL failures found, not just those caused by this refactor. Per the root-cause
  > orientation principle, proactively fix preexisting errors encountered during work.

- [ ] Manual check: open Claude Code session at worktree root, confirm CLAUDE.md → @AGENTS.md loads.
- [ ] Manual check: open OpenCode session at worktree root, confirm AGENTS.md loads as primary.
- [ ] Run `governance/workflows/plan/plan-quality-gate.md` against this plan one more time → double-zero pass.
- [ ] Run `plan-execution-checker` agent against this plan; expect zero outstanding items.
- [ ] Move the plan folder from `plans/in-progress/` to `plans/done/`:
  - [ ] Rename folder using completion date convention (`YYYY-MM-DD__governance-vendor-independence/` updated to closure date).
  - [ ] Update `plans/in-progress/README.md` to remove the entry.
  - [ ] Add the entry to `plans/done/README.md`.
- [ ] Final commit covering Phase 6 cleanup.
- [ ] Direct-to-main publish per Subrepo Worktree Workflow Standard 14:
  - [ ] Fast-forward merge `worktree-<name>` into local `main`.
  - [ ] `git push origin main`.
- [ ] Monitor GitHub Actions CI after the push:
  - [ ] `gh run list --limit 5` — identify triggered workflows for the push.
  - [ ] Verify all CI checks pass (status: completed / conclusion: success).
  - [ ] If any CI check fails: investigate root cause; fix immediately and push a follow-up commit per `ci-blocker-resolution.md`. Do NOT proceed to plan archival until CI is green.
- [ ] Confirm SHA reaches `origin/main`; if any parent gitlink bump is needed (it isn't for this plan), proceed only after origin sync.
- [ ] Optional: trigger `repo-ose-primer-propagation-maker` in dry-run to surface what should propagate to the template.

### Exit gate

- [ ] All checks above green.
- [ ] Plan archived to `plans/done/`.
- [ ] `origin/main` contains the full refactor.
- [ ] Vendor-audit report attached to plan-execution-checker findings (zero findings).

### Rollback

- [ ] If post-push verification (CI green) fails: investigate root cause; do NOT revert merged commits without explicit approval. Per `ci-blocker-resolution.md`, fix forward.

---

## Reference — Pre-Refactor Baseline (filled during Phase 0)

| Metric                                   | Value       |
| ---------------------------------------- | ----------- |
| Vendor-tainted file count in governance/ | 65 (recon)  |
| Total .md files in governance/           | 157 (recon) |
| `npm run lint:md` baseline               | TBD         |
| `nx affected -t test:quick` baseline     | TBD         |
| `nx affected -t spec-coverage` baseline  | TBD         |

## Reference — Post-Refactor Target

| Metric                                                        | Target                           |
| ------------------------------------------------------------- | -------------------------------- |
| Vendor-tainted file count in governance/ (load-bearing prose) | 0                                |
| Files with allowlisted binding-example blocks                 | as small as possible; documented |
| `rhino-cli governance vendor-audit governance/` exit          | 0                                |
| `npm run lint:md`                                             | green                            |
| `npm run sync:claude-to-opencode`                             | green                            |
| Pre-push hook                                                 | green                            |

## Reference — Out-of-Scope Follow-On Plans

- Parent `ose-projects/governance/` vendor-independence refactor (companion plan, Scope B parent worktree).
- `ose-primer` propagation of the new convention and validator (use `repo-ose-primer-propagation-maker`).
- New platform bindings: `.cursor/rules/`, `.github/copilot-instructions.md`, `GEMINI.md`, `CONVENTIONS.md` (Aider).
- Re-evaluate Continue / Sourcegraph Cody bindings after their docs clarify.
