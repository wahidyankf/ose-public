# Delivery Checklist — Cross-Vendor Agent Parity

## Phase 0: Re-Baseline

- [ ] Run `rhino-cli governance vendor-audit governance/` and record exact violation count
- [ ] Document the actual baseline finding inline in this checklist (e.g., "0 violations as of YYYY-MM-DD HH:MM" or "N violations across M files")
- [ ] Decide path:
  - If 0 violations → mark Phase 1-3 as "verify only" (skip remediation; still verify links and benchmark coverage)
  - If N > 0 violations → execute Phase 1-3 remediation as written
- [ ] Inspect `.claude/agents/*.md` and `.opencode/agents/*.md` counts: `ls .claude/agents/*.md | wc -l` and `ls .opencode/agents/*.md | wc -l` — record both numbers; mismatch is expected to be addressed in Phase 5
- [ ] Run `npm run sync:claude-to-opencode` once to record whether sync is currently a no-op or produces drift; do NOT commit yet — Phase 5 handles drift remediation

## Phase 1: Audit & Inventory

- [ ] Catalog all governance/ violations by category (model names, benchmarks, vendor paths)
- [ ] Identify content-migration files vs. rewording-only files
- [ ] Verify `docs/reference/ai-model-benchmarks.md` is comprehensive enough to serve as canonical source

## Phase 2: Content Migration & Rewrite (governance/)

- [ ] Verify `docs/reference/ai-model-benchmarks.md` has benchmark data for every model referenced in governance files — add any missing entries before proceeding
- [ ] Update `governance/development/agents/model-selection.md`:
  - Rewrite model references using capability tiers (planning-grade, execution-grade, fast)
  - Remove benchmark scores from governance prose
  - Link to `docs/reference/ai-model-benchmarks.md` as canonical source
  - Confirm the capability-tier map covers every tier used in `.claude/agents/*.md` and `.opencode/agents/*.md` frontmatter (extract via `grep -h "^model:" .claude/agents/*.md .opencode/agents/*.md | sort -u`)
  - Add a one-line note clarifying that "planning-grade / execution-grade / fast" is internal repo vocabulary, not an externally-recognized cross-vendor standard (web research 2026-05-03 found no community usage)
- [ ] Update `governance/development/agents/ai-agents.md` (explicit Phase 2 target):
  - Wrap vendor-specific examples (color-translation map entries, OpenCode named-color rejection note, etc.) in `binding-example` fences. Drop the specific version number "1.14.31" — unverified per OpenCode public changelog; use "current OpenCode" instead
  - Neutralize load-bearing prose around the fences
  - Confirm the color-translation map covers every named color used in `.claude/agents/*.md` frontmatter (extract via `grep -h "^color:" .claude/agents/*.md | sort -u`)
- [ ] Update `governance/README.md`:
  - Replace `.claude/agents/` references with "platform binding agents"
  - Update Layer 4 description to reflect vendor-neutrality
- [ ] Update `governance/repository-governance-architecture.md`:
  - Clarify agent skills are delivery infrastructure (not Layer 4.5)
  - Ensure agent color palette examples are not load-bearing prose
- [ ] Check other governance files (including `governance/principles/`) for vendor-specific content
- [ ] Verify vendor-specific benchmark content is complete in `docs/reference/ai-model-benchmarks.md`

## Phase 3: Layer-Test Update

- [ ] Update `governance/README.md` Layer Test with Vendor-Specific Content Test
- [ ] Update `governance/conventions/structure/governance-vendor-independence.md` (minor edits only; major Scope expansion happens in Phase X)

## Phase X: Convention Amendment (BLOCKING for Phase 4)

This phase MUST run before Phase 4. It expands the scope of the vendor-independence convention so that the AGENTS.md / CLAUDE.md audit has a convention to enforce against.

- [ ] Amend `governance/conventions/structure/governance-vendor-independence.md`:
  - Update the Scope section: AGENTS.md and CLAUDE.md are now in scope (move them OUT of "Out of scope" list)
  - Update the Exceptions list: remove the entry that exempts AGENTS.md and CLAUDE.md
  - Preserve the `plans/` exclusion (plans intentionally permit vendor-specific implementation discussion)
  - Add a brief note explaining that CLAUDE.md is itself a Claude-Code binding shim, so vendor terms are allowed inside `binding-example` fences or under "Platform Binding Examples" headings
  - Add a brief note explaining that the single-line `@AGENTS.md` import in CLAUDE.md is treated as an inline binding directive (not a forbidden vendor term)
- [ ] Run `npm run lint:md:fix && npm run lint:md` against the convention file
- [ ] Run `rhino-cli governance vendor-audit governance/` — must remain at 0 violations after amendment (the convention file itself is allowlisted)
- [ ] Commit the amendment: `refactor(governance): expand vendor-independence convention to include AGENTS.md and CLAUDE.md`

## Phase 4: AGENTS.md and CLAUDE.md Neutrality Audit

This phase requires Phase X (convention amendment) to be committed first.

- [ ] Audit `AGENTS.md` for vendor terms using the combined audit regex from the convention (or `rhino-cli governance vendor-audit AGENTS.md` if the CLI accepts file targets)
- [ ] Catalog AGENTS.md violations and classify each per the convention's Migration Guidance:
  - Load-bearing prose → rewrite using the Vocabulary Map
  - Cross-reference link → rewrite anchor text and link target to neutral equivalent
  - Illustrative example → wrap in ` ```binding-example ` fence or move under "Platform Binding Examples" heading
- [ ] Apply rewrites to `AGENTS.md`
- [ ] Audit `CLAUDE.md`:
  - Verify the single-line `@AGENTS.md` import is preserved
  - Identify any duplication of load-bearing AGENTS.md content; consolidate (CLAUDE.md should remain a thin shim)
  - Wrap any Claude-Code-specific notes inside `binding-example` fences or under "Platform Binding Examples" headings
- [ ] Apply rewrites to `CLAUDE.md`
- [ ] Re-run audit against both files — expect 0 violations outside fences and Platform Binding Examples sections
- [ ] Run `npm run lint:md:fix && npm run lint:md` against both files
- [ ] Commit thematically: typically two commits (one for AGENTS.md, one for CLAUDE.md) unless the changes are tiny enough to bundle

### Phase 4 sub-task: factual-accuracy correction in platform-bindings catalog

Surfaced by web research 2026-05-03 against current vendor docs. The `docs/reference/platform-bindings.md` catalog currently lists Aider as a native AGENTS.md reader; Aider's own documentation (<https://aider.chat/docs/usage/conventions.html>) only documents `CONVENTIONS.md`. The agents.md standard site lists Aider in its supported tools, but Aider's own docs do not — internal contradiction.

- [ ] Update `docs/reference/platform-bindings.md` Aider entry: change "reads AGENTS.md natively" to "reads CONVENTIONS.md natively; AGENTS.md support claimed by agents.md standard site but not documented by Aider itself"
- [ ] Update any matching claim in `AGENTS.md` itself (Platform Bindings section) to reflect the same nuance
- [ ] If `CONVENTIONS.md` is later adopted as a future binding, document the relationship (it can be a thin shim importing AGENTS.md, similar to CLAUDE.md)
- [ ] Commit: `docs(reference): correct Aider AGENTS.md claim per Aider's own docs`

## Phase 5: Behavioral-Parity Invariants

This phase verifies the binding-sync layer is in a known-good state. It runs verification commands and remediates any drift surfaced.

- [ ] Run `npm run sync:claude-to-opencode` — must complete with no file modifications (no-op)
- [ ] If drift exists: commit the synced changes with `chore(opencode): re-sync agents from .claude/` and re-run sync to confirm idempotence
- [ ] Compare counts: `ls .claude/agents/*.md | wc -l` vs `ls .opencode/agents/*.md | wc -l` — must be equal (currently 73 vs 71 — fix in this phase)
- [ ] If counts differ, diff the agent sets: `diff <(ls .claude/agents/ | sort) <(ls .opencode/agents/ | sort)` — investigate why each missing agent is missing; fix root cause (re-run sync, or remove orphaned files, or add missing agent definitions)
- [ ] Verify color-translation map coverage:
  - Extract distinct colors from `.claude/agents/*.md` frontmatter: `grep -h "^color:" .claude/agents/*.md | sort -u`
  - Compare against the Dual-Mode Color Translation table in `governance/development/agents/ai-agents.md`
  - Any gap is a finding — add missing color entries to the map; commit the map update
- [ ] Verify capability-tier map coverage:
  - Extract distinct model tiers from agent frontmatter (both bindings): `grep -h "^model:" .claude/agents/*.md .opencode/agents/*.md | sort -u`
  - Compare against the capability-tier map in `governance/development/agents/model-selection.md`
  - Any gap is a finding — add missing tier entries to the map; commit the map update
- [ ] If `rhino-cli` exposes a `validate:sync` Nx target or equivalent, run it and resolve any findings; if absent, document the gap (a future plan can add the automated check)

## Phase 6: Final Validation

- [ ] Run `rhino-cli governance vendor-audit governance/` — expect 0 violations
- [ ] Run audit against AGENTS.md and CLAUDE.md (via CLI or grep with the combined regex) — expect 0 violations outside fences and Platform Binding Examples sections
- [ ] Run `npm run lint:md:fix` then `npm run lint:md` — expect 0 violations
- [ ] Verify all benchmark references in governance link to `docs/reference/ai-model-benchmarks.md`
- [ ] Verify `docs/reference/ai-model-benchmarks.md` follows Diátaxis reference conventions
- [ ] Run `nx affected -t typecheck lint test:quick spec-coverage` — all pass
- [ ] Verify `npm run sync:claude-to-opencode` is still a no-op (sanity check after all edits)
- [ ] Verify final counts: `.claude/agents/*.md` count equals `.opencode/agents/*.md` count

## Quality Gates

### Development Environment Setup (First-Time)

- [ ] Provision worktree: `claude --worktree cross-vendor-agent-parity` (creates `worktrees/cross-vendor-agent-parity/` in repo root, per `governance/conventions/structure/worktree-path.md`)
- [ ] Run `npm install && npm run doctor -- --fix` to converge toolchain
- [ ] Verify `rhino-cli` is available: `go run apps/rhino-cli/main.go --version`

### Local Quality Gates (Before Push)

- [ ] Run `rhino-cli governance vendor-audit governance/` — 0 violations
- [ ] Run audit against AGENTS.md and CLAUDE.md — 0 violations outside fences and Platform Binding Examples sections
- [ ] Run `npm run sync:claude-to-opencode` — no-op
- [ ] Verify `.claude/agents/*.md` count equals `.opencode/agents/*.md` count
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

- [ ] Commit changes thematically — group related changes into logically cohesive commits
- [ ] Suggested commit themes (one or more per phase):
  - `refactor(governance): migrate benchmark prose to docs/reference/`
  - `refactor(governance): rewrite ai-agents.md vendor specifics inside binding-example fences`
  - `refactor(governance): expand vendor-independence convention to include AGENTS.md and CLAUDE.md`
  - `refactor(root): apply vendor-neutral vocabulary to AGENTS.md`
  - `refactor(root): consolidate CLAUDE.md as thin shim importing AGENTS.md`
  - `chore(opencode): re-sync agents from .claude/` (only if drift exists in Phase 5)
  - `docs(governance): document color-translation map gaps` (only if Phase 5 surfaces gaps)
- [ ] Follow Conventional Commits format: `<type>(<scope>): <description>`
- [ ] Split benchmark content migration from governance prose cleanup into separate commits if files differ significantly
- [ ] Convention-amendment commit (Phase X) MUST land before AGENTS.md / CLAUDE.md remediation commits (Phase 4)

## Plan Archival

- [ ] Verify ALL delivery checklist items are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Move plan folder from `plans/in-progress/` to `plans/done/` via `git mv`
- [ ] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] Update `plans/done/README.md` — add the plan entry with completion date
