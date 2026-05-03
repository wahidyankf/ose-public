# Cross-Vendor Agent Parity Plan

## Context

`governance/` must be readable and actionable by any contributor — human or agent — regardless of which AI coding platform they use. Vendor-specific implementation details belong in dedicated platform-binding directories (`.claude/`, `.opencode/`, etc.) and in `docs/` following the Diátaxis framework.

The [Governance Vendor-Independence Convention](../../../governance/conventions/structure/governance-vendor-independence.md) already establishes the rule for `governance/` prose. However, **prose neutrality alone does not produce behavioral parity** across coding agents. AGENTS.md is read natively by OpenCode, OpenAI Codex CLI, and Aider; binding sync (`.claude/` ↔ `.opencode/`), color translation, and capability-tier model mapping are the load-bearing surfaces that determine whether a contributor on a non-Claude agent gets behaviorally-equivalent agent invocations. This plan therefore covers both surfaces.

## Scope

**In-scope (governance prose, the original phase 1-3 work)**:

- Re-baseline by running `rhino-cli governance vendor-audit governance/` first; only execute remediation phases for findings that remain
- Audit `governance/` for vendor-specific content (model names, benchmark scores, vendor paths)
- Move benchmark content to `docs/reference/ai-model-benchmarks.md` per Diátaxis framework
- Rewrite governance prose using vendor-neutral capability tiers (planning-grade, execution-grade, fast)
- Modify `governance/development/agents/ai-agents.md` explicitly — keep vendor-specific bits inside `binding-example` fences, neutralize load-bearing prose
- Update layer-test guidance in `governance/README.md`
- Validate via `rhino-cli governance vendor-audit`

**In-scope (newly added — cross-vendor behavioral parity)**:

- Amend [Governance Vendor-Independence Convention](../../../governance/conventions/structure/governance-vendor-independence.md) to bring `AGENTS.md` and `CLAUDE.md` IN scope (currently both are explicitly out of scope; see Scope section of that file). Convention amendment is BLOCKING for the AGENTS.md / CLAUDE.md audit phase.
- Audit `AGENTS.md` (canonical root instruction, read natively by OpenCode / Codex CLI / Aider) for vendor terms in load-bearing prose
- Audit `CLAUDE.md` (Claude-Code shim) — should remain a thin shim importing AGENTS.md; flag if it duplicates content
- Verify behavioral-parity invariants:
  - `npm run sync:claude-to-opencode` is no-op (or commit drift)
  - `.claude/agents/*.md` count matches `.opencode/agents/*.md` count
  - color-translation map in `governance/development/agents/ai-agents.md` covers every named color used in `.claude/agents/*.md` frontmatter
  - capability-tier map in `governance/development/agents/model-selection.md` covers every model tier referenced in `.claude/` and `.opencode/` agent frontmatter
- Correct factually-inaccurate Aider entry in `docs/reference/platform-bindings.md` and `AGENTS.md` (web research 2026-05-03 found Aider's own docs only document `CONVENTIONS.md`, not AGENTS.md)
- **Operationalize parity** — author `repo-parity-checker` (green) and `repo-parity-fixer` (yellow) agents in `.claude/agents/` (auto-synced to `.opencode/agents/`) that invoke existing tools (rhino-cli vendor-audit, npm sync, ls/grep/diff, WebFetch) to validate the five invariants above. Author the `repo-cross-vendor-parity-quality-gate` workflow at `governance/workflows/repo/repo-cross-vendor-parity-quality-gate.md` (mirrors `plan-quality-gate.md` — iterative check-fix-verify, terminates on double-zero). Wire into Nx target `validate:cross-vendor-parity` and pre-push hook so invariants stay green long-term without requiring memory of this plan.

**External standards alignment** (verified 2026-05-03 via `web-research-maker`):

- AGENTS.md is a real Linux Foundation standard under the Agentic AI Foundation (announced 2025-12-09). Confirms that AGENTS.md neutrality is the correct cross-vendor instruction surface.
- OpenCode reads AGENTS.md natively (per <https://opencode.ai/docs/rules/>) and reads SKILL.md from `.claude/skills/<name>/SKILL.md` as one of multiple search paths (also `.opencode/skills/`, `.agents/skills/`).
- OpenAI Codex CLI reads AGENTS.md natively (per <https://developers.openai.com/codex/guides/agents-md>).
- OpenCode rejects named CSS colors in agent frontmatter; only hex values or theme tokens (`primary`, `secondary`, `accent`, `success`, `warning`, `error`, `info`) are valid. The specific version "1.14.31" is decorative trivia and unverifiable; the plan substitutes "current OpenCode".

**Out of scope**:

- `.claude/`, `.opencode/` platform binding directories (already correct)
- Parent repo `ose-projects/` `AGENTS.md` and `CLAUDE.md` — different repository, gitlink boundary; handle in a separate future plan if needed
- `plans/` (intentionally remains out of scope per convention; planning documents may reference vendor specifics)
- ~~`docs/reference/platform-bindings.md` catalog~~ — partially in scope: only the Aider entry's factual-accuracy correction is in scope; the catalog as a whole continues to reference vendors by design

## Approach Summary

1. **Phase 0 — Re-baseline** — Run `rhino-cli governance vendor-audit governance/` BEFORE any other work. If audit returns 0 violations, original Phase 1-3 collapses to "verify only" and the plan focuses on Phase X (convention amendment) onward.
2. **Phase 1 — Audit & Inventory** — Catalog any remaining `governance/` violations by category.
3. **Phase 2 — Content migration & rewrite** — Move benchmark prose to `docs/reference/ai-model-benchmarks.md`; rewrite governance prose (including `ai-agents.md`) with capability tiers.
4. **Phase 3 — Layer-test update** — Add vendor-specific content test to governance layer-test guidance.
5. **Phase X — Convention amendment** (BLOCKING for Phase 4) — Amend `governance-vendor-independence.md` to include `AGENTS.md` and `CLAUDE.md` in scope; preserve `plans/` exclusion.
6. **Phase 4 — AGENTS.md / CLAUDE.md neutrality audit** — Audit and remediate vendor terms in those two files using the amended convention.
7. **Phase 5 — Behavioral-parity invariants** — Verify binding-sync layer is in known-good state (sync no-op, count parity, color map coverage, tier map coverage).
8. **Phase 6 — Operationalize parity** — Author `repo-parity-checker` and `repo-parity-fixer` agents; author `repo-cross-vendor-parity-quality-gate` workflow; wire `validate:cross-vendor-parity` Nx target into pre-push hook. Promotes Phase 5's manual checks to long-lived automated invariants.
9. **Phase 7 — Final validation** — Run audit + lint + affected-tests; run new parity gate; archive plan.

## Navigation

- [BRD](./brd.md) — Business rationale and impact
- [PRD](./prd.md) — Acceptance criteria and scope
- [Tech Docs](./tech-docs.md) — Architecture and technical approach
- [Delivery](./delivery.md) — Execution checklist and quality gates
