# Governance Vendor-Neutrality & Content Separation

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

## Business Rationale

- **Accessibility**: Governance must be readable by contributors using any AI coding agent (Cursor, Codex CLI, Aider, etc.)
- **Maintainability**: Vendor names/APIs change; coupling governance correctness to a specific vendor creates maintenance debt
- **Clarity**: Governance = rules; docs/ = reference material; clear separation improves navigation

## Product Requirements

### Gherkin Acceptance Criteria

```gherkin
Given a file in governance/
When I audit it for vendor-specific content
Then I find zero forbidden vendor terms outside binding-example fences
And zero references to model names, benchmark scores, or vendor paths in load-bearing prose
And any illustrative vendor examples are wrapped in binding-example fences

Given a governance file that references benchmarks or model data
When I process it for vendor-neutrality
Then the benchmark data moves to docs/reference/
And the governance file links to the canonical docs/reference/ source
And load-bearing prose uses vendor-neutral capability tier terms

Given a new governance file
When I create it
Then I apply the vendor-independence vocabulary map
And I verify via rhino-cli governance vendor-audit before committing
```

## Technical Approach

### Phase 1: Audit & Inventory

1. Run `rhino-cli governance vendor-audit governance/` to baseline violations
2. Catalog findings by category:
   - **Model names in load-bearing prose** → capability tiers
   - **Benchmark scores in governance** → docs/reference/ai-model-benchmarks.md
   - **Vendor paths (.claude/, .opencode/)** → "platform binding" / "agent definition file"
   - **Anthropic company name** → "model vendor" / citation context only
3. Identify files needing content migration vs. simple rewording

### Phase 2: Content Migration

**Benchmark data** (model scores, pricing, capability summaries):

- **Current**: Scattered in governance files referencing model tiers
- **Target**: `docs/reference/ai-model-benchmarks.md` (already exists, expand)
- **Diátaxis category**: Reference — technical specs users look up

**Governance file rewrites** per vocabulary map:

| File | Issue | Action |
|------|-------|--------|
| `governance/development/agents/model-selection.md` | Concrete model names, benchmark citations | Rewrite using capability tiers; link to docs/reference/ai-model-benchmarks.md |
| `governance/README.md` | Layer 4 references `.claude/agents/` | Replace with "platform binding agents" |
| `governance/repository-governance-architecture.md` | Skills = delivery (not Layer 4.5); agent color palette examples | Clarify skills are delivery infra; color palette is docs/reference/ |
| `governance/principles/` | Any model-name citations | Rewrite using tier language |

### Phase 3: Governance Layer-Test Update

Update `governance/README.md` Layer Test to include:

```
### Vendor-Specific Content Test

**Question**: Is this content vendor-specific (model names, benchmark scores, vendor paths)?

- ✅ **YES** → Does it answer "WHAT technical specs do I look up?"?
  - YES → `docs/reference/` (benchmarks, pricing, model specs)
  - NO → Does it explain a vendor concept?
    - YES → `docs/explanation/` (vendor-specific explanations)
    - NO → Platform binding directory (`.claude/`, `.opencode/`)
- ❌ **NO** → Continue to other layer tests
```

### Phase 4: Validation

1. Run `rhino-cli governance vendor-audit governance/` — expect 0 violations
2. Run `npm run lint:md:fix && npm run lint:md` — expect 0 violations
3. Verify benchmark references in governance link to `docs/reference/ai-model-benchmarks.md`
4. Verify `docs/reference/ai-model-benchmarks.md` is linked from governance files that need it

## Delivery Checklist

### Phase 1: Audit & Inventory

- [ ] Run `rhino-cli governance vendor-audit governance/` baseline
- [ ] Catalog all violations by category (model names, benchmarks, vendor paths)
- [ ] Identify content-migration files vs. rewording-only files
- [ ] Verify docs/reference/ai-model-benchmarks.md is comprehensive enough to serve as canonical source

### Phase 2: Content Migration & Rewrite

- [ ] Update `governance/development/agents/model-selection.md`:
  - Rewrite model references using capability tiers (planning-grade, execution-grade, fast)
  - Remove benchmark scores from governance prose
  - Link to `docs/reference/ai-model-benchmarks.md` as canonical source
- [ ] Update `governance/README.md`:
  - Replace `.claude/agents/` references with "platform binding agents"
  - Update Layer 4 description to reflect vendor-neutrality
- [ ] Update `governance/repository-governance-architecture.md`:
  - Clarify Skills are delivery infrastructure (not Layer 4.5)
  - Ensure agent color palette examples are not load-bearing prose
- [ ] Check other governance files for vendor-specific content
- [ ] Verify vendor-specific benchmark content is complete in `docs/reference/ai-model-benchmarks.md`

### Phase 3: Layer-Test Update

- [ ] Update `governance/README.md` Layer Test with Vendor-Specific Content Test
- [ ] Update `governance/conventions/structure/governance-vendor-independence.md` if needed

### Phase 4: Validation

- [ ] Run `rhino-cli governance vendor-audit governance/` — expect 0 violations
- [ ] Run `npm run lint:md:fix` then `npm run lint:md` — expect 0 violations
- [ ] Verify all benchmark references in governance link to `docs/reference/ai-model-benchmarks.md`
- [ ] Verify docs/reference/ai-model-benchmarks.md follows Diátaxis reference conventions
- [ ] Run `nx affected -t typecheck lint test:quick` — all pass

## Quality Gates

### Local Quality Gates (Before Push)

- [ ] Run `rhino-cli governance vendor-audit governance/` — 0 violations
- [ ] Run `npm run lint:md:fix && npm run lint:md` — 0 violations
- [ ] Run `nx affected -t typecheck lint test:quick` — all pass
- [ ] Verify no new vendor-specific content introduced

### Post-Push Verification

- [ ] Push changes to `main`
- [ ] Monitor GitHub Actions workflows for the push
- [ ] Verify all CI checks pass
- [ ] If any CI check fails, fix immediately and push a follow-up commit

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
