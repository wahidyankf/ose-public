# Product Requirements Document — Cross-Vendor Agent Parity

## Product Overview

Execute the already-defined [Governance Vendor-Independence Convention](../../../governance/conventions/structure/governance-vendor-independence.md) and extend cross-vendor neutrality to:

1. The canonical AGENTS.md root instruction file (read natively by OpenCode, Codex CLI, Aider) and the CLAUDE.md shim
2. The binding-sync layer (`.claude/agents/*.md` ↔ `.opencode/agents/*.md`), color-translation map, and capability-tier map — collectively the "behavioral-parity invariants"

The plan re-baselines `governance/` first, amends the convention to include AGENTS.md / CLAUDE.md, then audits and remediates those files, then verifies behavioral parity at the binding-sync layer.

## Acceptance Criteria

### Gherkin Acceptance Criteria

```gherkin
Scenario: Re-baseline governance audit
  Given the plan begins execution
  When I run rhino-cli governance vendor-audit governance/
  Then I record the actual baseline finding (0 or N violations)
  And I document whether Phase 1-3 remediation work remains or collapses to verify-only

Scenario: Governance prose is vendor-neutral
  Given a file in governance/ (including ai-agents.md explicitly)
  When I audit it for vendor-specific content
  Then I find zero forbidden vendor terms outside binding-example fences
  And zero references to model names, benchmark scores, or vendor paths in load-bearing prose
  And any illustrative vendor examples are wrapped in binding-example fences

Scenario: Benchmark data lives in docs/reference/
  Given a governance file that references benchmarks or model data
  When I process it for vendor-neutrality
  Then the benchmark data moves to docs/reference/ai-model-benchmarks.md
  And the governance file links to the canonical docs/reference/ source
  And load-bearing prose uses vendor-neutral capability tier terms

Scenario: Convention amendment expands scope to AGENTS.md and CLAUDE.md
  Given the existing governance-vendor-independence convention excludes AGENTS.md and CLAUDE.md
  When I amend the convention
  Then the Scope section includes AGENTS.md and CLAUDE.md as in-scope
  And the Exceptions list no longer lists AGENTS.md and CLAUDE.md
  And the plans/ exclusion is preserved
  And the convention is amended BEFORE the AGENTS.md / CLAUDE.md audit phase begins

Scenario: AGENTS.md neutrality audit
  Given the convention amendment is committed
  When I audit AGENTS.md for vendor-specific content
  Then I find zero forbidden vendor terms outside binding-example fences
  And every illustrative vendor example sits inside a binding-example fence or under a Platform Binding Examples heading

Scenario: CLAUDE.md remains a thin shim
  Given the convention amendment is committed
  When I audit CLAUDE.md
  Then CLAUDE.md continues to import AGENTS.md (single-line @AGENTS.md import preserved)
  And any added Claude-Code-specific notes are clearly delimited and load-bearing rules do not duplicate AGENTS.md content
  And the file passes the audit (vendor terms allowed only inside binding-example fences or under Platform Binding Examples headings, since CLAUDE.md is a Claude-Code-specific shim)

Scenario: Binding-sync layer is in known-good state
  Given .claude/ is the source of truth for agents
  When I run npm run sync:claude-to-opencode
  Then the command completes with no file modifications (no-op)
  Or any drift is committed with a Conventional Commits message before proceeding

Scenario: Agent count parity between bindings
  Given the binding-sync layer
  When I count .claude/agents/*.md and .opencode/agents/*.md
  Then the two counts are equal
  And any mismatch (e.g., the currently-observed 73 vs 71) is fixed before final validation

Scenario: Color-translation map covers every used color
  Given .claude/agents/*.md files declare named colors in frontmatter
  When I extract the set of distinct colors used
  Then every color has a corresponding entry in the color-translation map in governance/development/agents/ai-agents.md
  And no agent's frontmatter color falls through to a missing OpenCode token

Scenario: Capability-tier map covers every referenced tier
  Given .claude/ and .opencode/ agent frontmatter declares model tiers
  When I extract the set of distinct tier identifiers used
  Then every tier has a corresponding entry in governance/development/agents/model-selection.md
  And the tier-to-vendor-model mapping is documented for both bindings

Scenario: Layer-test guidance includes vendor-specific content test
  Given a contributor authoring new governance content
  When they consult the layer test in governance/README.md
  Then the layer test includes a "Is this vendor-specific?" decision
  And content failing the test is routed to docs/reference/ or to a binding directory

Scenario: New governance file passes neutrality before commit
  Given a new governance file
  When I create it
  Then I apply the vendor-independence vocabulary map
  And I verify via rhino-cli governance vendor-audit before committing

Scenario: Platform-bindings catalog reflects each tool's documented file
  Given the docs/reference/platform-bindings.md Aider entry
  When I cross-check it against Aider's own documentation
  Then the entry says CONVENTIONS.md (not AGENTS.md) is Aider's documented instruction file
  And any AGENTS.md adoption claim is sourced to agents.md, not Aider's own docs
```

## Product Scope

### In Scope

- Re-baseline of `governance/` via `rhino-cli governance vendor-audit`
- Audit `governance/` for vendor-specific content (model names, benchmark scores, vendor paths)
- Move benchmark data to `docs/reference/ai-model-benchmarks.md`
- Rewrite governance files using vendor-neutral vocabulary, including `governance/development/agents/ai-agents.md` as an explicit modify target
- Amend `governance/conventions/structure/governance-vendor-independence.md` to include AGENTS.md and CLAUDE.md in scope (preserve `plans/` exclusion)
- Audit and remediate AGENTS.md and CLAUDE.md per the amended convention
- Correct `docs/reference/platform-bindings.md` Aider entry per Aider's own docs (research-driven factual fix)
- Verify behavioral-parity invariants: sync no-op, count parity, color-map coverage, capability-tier-map coverage
- Update `governance/README.md` layer-test with vendor-specific content test
- Validate via `rhino-cli governance vendor-audit`

### Out of Scope

- Rewriting `.claude/` or `.opencode/` agent body content (only counts and sync state are checked)
- Parent-repo `ose-projects/` AGENTS.md / CLAUDE.md (different repository)
- `plans/` directory (intentionally remains out of scope per convention)
- ~~`docs/reference/platform-bindings.md` catalog~~ — Aider entry IS in scope for factual-accuracy correction; rest of catalog continues to reference vendors by design

## Product Risks

1. **Risk**: Vendor-specific content remains in governance prose after migration
   - Mitigation: Automated validation via `rhino-cli governance vendor-audit`
2. **Risk**: Convention amendment surfaces previously-legal AGENTS.md / CLAUDE.md violations as a cascade
   - Mitigation: Plan schedules amendment immediately before the audit phase; remediation happens in the same plan
3. **Risk**: Binding sync drifts undetected during this plan's execution
   - Mitigation: Phase 5 explicitly runs `npm run sync:claude-to-opencode` and verifies count parity; mismatches are fixed before push
4. **Risk**: Color-translation map gap rejects synced agents on current OpenCode (named CSS colors are rejected; only hex or theme tokens valid)
   - Mitigation: Phase 5 cross-checks color frontmatter against the map; gaps become findings
5. **Risk**: Capability-tier-map gap leaves an agent's tier unresolved on one or both bindings
   - Mitigation: Phase 5 cross-checks tier frontmatter against the map; gaps become findings
6. **Risk**: Benchmark references break if `docs/reference/ai-model-benchmarks.md` is incomplete
   - Mitigation: Verify benchmark file is comprehensive before final push

## Personas

- **Maintainer as governance author** — writes and updates governance conventions; must produce vendor-neutral prose by default
- **Maintainer as convention amender** — modifies `governance-vendor-independence.md` to expand scope to AGENTS.md / CLAUDE.md; downstream cascade is intentional
- **Maintainer as AGENTS.md author** — applies vocabulary map to the canonical root instruction file
- **Maintainer as binding-parity verifier** — runs sync and validates count / color-map / tier-map invariants
- **`plan-executor` agent** — executes delivery checklist steps; relies on governance rules being toolchain-agnostic
- **`repo-rules-checker` agent** — audits governance and (after amendment) AGENTS.md / CLAUDE.md
- **Future AI agents on any platform (OpenCode, Codex CLI, Aider, Cursor, ...)** — read AGENTS.md natively at session boot; must not require vendor-specific knowledge to interpret rules

## User Stories

### As a contributor using a non-Claude AI coding agent

I want governance and AGENTS.md to be readable,
so that I can follow the repository rules regardless of my toolchain.

**Acceptance**: Governance prose AND AGENTS.md use no vendor-specific terms outside allowlisted regions (binding-example fences or Platform Binding Examples sections).

### As an AI agent executing governance rules

I want all rule references to be vendor-neutral,
so that my execution is not coupled to a specific platform's product lifecycle.

**Acceptance**: Model names replaced with capability tiers (planning-grade, execution-grade, fast).

### As a future platform maintainer

I want benchmark data isolated in `docs/reference/`,
so that I can update model information without touching governance prose.

**Acceptance**: Benchmark scores, pricing, and model specs live in `docs/reference/ai-model-benchmarks.md`.

### As a contributor onboarding via OpenCode

I want my agent count, available colors, and capability tiers to match the Claude-Code experience,
so that I can invoke the same agents and get behaviorally-equivalent responses.

**Acceptance**: `.claude/agents/*.md` and `.opencode/agents/*.md` counts are equal; every named color and capability tier referenced in agent frontmatter is documented in the corresponding map.

### As the convention author

I want AGENTS.md and CLAUDE.md to be in scope of the vendor-independence convention,
so that the highest-leverage cross-vendor instruction surfaces are governed by the same rules as the rest of `governance/`.

**Acceptance**: `governance-vendor-independence.md` Scope section includes AGENTS.md and CLAUDE.md; Exceptions list no longer lists them; `plans/` exclusion is preserved.
