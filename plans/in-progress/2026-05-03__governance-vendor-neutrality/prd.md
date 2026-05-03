# Product Requirements Document — Governance Vendor-Neutrality

## Product Overview

Execute the already-defined [Governance Vendor-Independence Convention](./conventions/structure/governance-vendor-independence.md) by auditing governance/, migrating vendor-specific content to `docs/` following Diátaxis framework, and rewriting governance prose to use vendor-neutral capability tiers.

## Acceptance Criteria

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

## Product Scope

### In Scope

- Audit `governance/` for vendor-specific content (model names, benchmark scores, vendor paths)
- Move benchmark data to `docs/reference/ai-model-benchmarks.md`
- Rewrite governance files using vendor-neutral vocabulary
- Update `governance/README.md` layer-test with vendor-specific content test
- Validate via `rhino-cli governance vendor-audit`

### Out of Scope

- `.claude/`, `.opencode/` platform binding directories (already correct)
- `AGENTS.md`, `CLAUDE.md` at repo root (explicitly out of scope per convention)
- `plans/` (explicitly out of scope per convention)
- `docs/reference/platform-bindings.md` catalog (by definition references vendors)

## Product Risks

1. **Risk**: Vendor-specific content remains after migration
   - **Mitigation**: Automated validation via `rhino-cli governance vendor-audit`
2. **Risk**: Benchmark references break if `docs/reference/ai-model-benchmarks.md` is incomplete
   - **Mitigation**: Verify benchmark file is comprehensive before final push

## User Stories

### As a contributor using a non-Claude AI coding agent

I want governance to be readable so I can follow the repository rules regardless of my toolchain.

**Acceptance**: Governance prose uses no vendor-specific terms outside allowlisted regions.

### As an AI agent executing governance rules

I want all rule references to be vendor-neutral so my execution is not coupled to a specific platform.

**Acceptance**: Model names replaced with capability tiers (planning-grade, execution-grade, fast).

### As a future platform maintainer

I want benchmark data isolated in `docs/reference/` so I can update model information without touching governance.

**Acceptance**: Benchmark scores, pricing, and model specs live in `docs/reference/ai-model-benchmarks.md`.
