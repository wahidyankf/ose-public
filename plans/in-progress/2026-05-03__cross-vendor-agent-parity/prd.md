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
  And any mismatch (e.g., the currently-observed 70 vs 71, where .opencode has orphan ci-monitor-subagent.md) is investigated and resolved before final validation

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
  Then the entry says Aider reads CONVENTIONS.md natively; AGENTS.md support claimed by agents.md standard but not documented by Aider itself
  And any AGENTS.md adoption claim is sourced to agents.md, not Aider's own docs

Scenario: Parity checker agent invokes existing tools and reports findings
  Given the .claude/agents/repo-parity-checker.md agent file exists with the documented invariants
  When the agent is invoked via Agent tool
  Then it runs rhino-cli governance vendor-audit, npm run sync:claude-to-opencode, ls/grep/diff against agent dirs, and WebFetch on Aider docs
  And it writes a dual-label audit report to generated-reports/parity__<uuid>__<YYYY-MM-DD--HH-MM>__audit.md
  And it does not duplicate logic that already exists in rhino-cli or the sync command

Scenario: Parity fixer auto-remediates only sync drift
  Given the parity checker reports sync drift as a finding
  When the parity fixer runs against that finding
  Then it re-runs npm run sync:claude-to-opencode and stages the result
  And for color-map gaps, tier-map gaps, orphan agents, or Aider entry drift it flags the finding without auto-fixing

Scenario: Cross-vendor parity Nx target gates pre-push
  Given the validate:cross-vendor-parity Nx target is wired into .husky/pre-push
  When a developer pushes a commit that breaks any of the five invariants
  Then the pre-push hook exits non-zero and blocks the push
  And the failure message identifies which invariant failed
  And re-running the target after fixing the invariant exits 0

Scenario: Cross-vendor-parity-quality-gate workflow runs the maker-checker-fixer loop
  Given the repo-cross-vendor-parity-quality-gate workflow exists at governance/workflows/repo/
  When a contributor invokes the workflow
  Then it runs repo-parity-checker as Step 1
  And it runs repo-parity-fixer as Step 3 only if findings exist
  And it re-validates with repo-parity-checker as Step 4
  And it iterates until two consecutive zero-finding validations are confirmed
  And it terminates with final-status pass on double-zero, partial on max-iterations exhaustion, or fail on technical errors

Scenario: Workflow surfaces non-auto-fixable findings as partial
  Given the parity checker reports a color-map gap finding
  When the repo-cross-vendor-parity-quality-gate workflow runs against that finding
  Then the fixer flags the finding without auto-fixing
  And the workflow continues to subsequent iterations
  And if the finding persists at max-iterations the workflow exits with final-status partial
  And the partial-status report identifies the unfixable finding for human resolution
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
- Author `repo-parity-checker` (green) and `repo-parity-fixer` (yellow) agents in `.claude/agents/` (auto-synced to `.opencode/agents/`); author `repo-cross-vendor-parity-quality-gate` workflow at `governance/workflows/repo/` (mirrors `plan-quality-gate.md`); wire `validate:cross-vendor-parity` Nx target into `.husky/pre-push`
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
4. **Risk**: Color-translation map gap causes synced agents to fail on current OpenCode (docs enumerate only hex and theme tokens as valid; named-color rejection is observed behavior but not explicitly stated in public docs)
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
- **Operator running parity gate periodically** — invokes `repo-parity-checker` agent for ad-hoc audits OR runs `nx run rhino-cli:validate:cross-vendor-parity` (also runs automatically on every push via the pre-push hook). Requires no memory of this plan's specifics — invariants are encoded in the agent body and the Nx target script.
- **`repo-parity-checker` agent** — invokes existing tools (rhino-cli, npm sync, ls/grep, WebFetch) to validate the five invariants and emit a dual-label audit report. Does NOT duplicate logic.
- **`repo-parity-fixer` agent** — auto-remediates sync drift only; flags color-map / tier-map / orphan / Aider-drift findings for human resolution.

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

### As a convention author

I want AGENTS.md and CLAUDE.md to be in scope of the vendor-independence convention,
so that the highest-leverage cross-vendor instruction surfaces are governed by the same rules as the rest of `governance/`.

**Acceptance**: `governance-vendor-independence.md` Scope section includes AGENTS.md and CLAUDE.md; Exceptions list no longer lists them; `plans/` exclusion is preserved.

### As a future contributor periodically auditing parity

I want a single agent invocation OR a single Nx target invocation to validate every cross-vendor invariant,
so that I do not need to remember this plan's specifics or run six separate shell commands by hand.

**Acceptance**: `Agent({subagent_type: "repo-parity-checker"})` produces a dual-label audit report covering all five invariants. `nx run rhino-cli:validate:cross-vendor-parity` exits 0 on a green tree and non-zero with a specific failing-invariant message on a broken tree. The Nx target also runs automatically via `.husky/pre-push`.
