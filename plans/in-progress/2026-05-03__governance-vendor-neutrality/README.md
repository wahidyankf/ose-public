# Governance Vendor-Neutrality Plan

## Context

`governance/` must be readable and actionable by any contributor—human or agent—regardless of which AI coding platform they use. Vendor-specific implementation details belong in dedicated platform-binding directories (`.claude/`, `.opencode/`, etc.) and in `docs/` following Diátaxis framework.

The [Governance Vendor-Independence Convention](./conventions/structure/governance-vendor-independence.md) already establishes the rule. The execution is incomplete.

## Scope

**In-scope**:

- Audit `governance/` for vendor-specific content (model names, benchmark scores, vendor paths)
- Move vendor-specific content to `docs/` following Diátaxis framework
- `docs/reference/` — benchmark data, model capability summaries, pricing info
- `docs/explanation/` — vendor-specific concepts (if genuinely explanatory)
- Update governance files to remove vendor-specific content per vocabulary map
- Update layer-test guidance to include "Is this vendor-specific?" check
- Validate via `rhino-cli governance vendor-audit`

**Out of scope**:

- `.claude/`, `.opencode/` platform binding directories (already correct)
- `AGENTS.md`, `CLAUDE.md` at repo root (explicitly out of scope per convention)
- `plans/` (explicitly out of scope per convention)
- `docs/reference/platform-bindings.md` catalog (by definition references vendors)

## Approach Summary

1. **Audit** — Run `rhino-cli governance vendor-audit` to baseline violations
2. **Migrate** — Move benchmark content to `docs/reference/ai-model-benchmarks.md`
3. **Rewrite** — Update governance prose using vendor-neutral capability tiers
4. **Update layer test** — Add vendor-specific content test to governance layer-test guidance
5. **Validate** — Run audit to confirm zero violations

## Navigation

- [BRD](./brd.md) — Business rationale and impact
- [PRD](./prd.md) — Acceptance criteria and scope
- [Tech Docs](./tech-docs.md) — Architecture and technical approach
- [Delivery](./delivery.md) — Execution checklist and quality gates
