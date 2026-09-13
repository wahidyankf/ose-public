# Product Requirements — Plan Domain Parity (ose-public)

## Product Overview

Deliver, inside `ose-public`, the merged upstream canon of the plan domain: fourteen
3-way-merged governance/agent/skill files, a restructured parity workflow, a modernized
OpenCode emitter (`permission` object), a Codex per-agent config consolidated in
`.codex/config.toml`, a full harness-binding audit, a plain-language rationale doc, and the
harness-doc updates those changes imply. The "product" is the repository's planning system
itself — its users are the maintainer's hats and the agents that read these files.

## Personas

- **Planner** — invokes plan-establishment / parity workflows; needs identical, unambiguous
  workflow text and worktree mechanics.
- **Plan agents** (`plan-maker`, `plan-checker`, `plan-fixer`, `plan-execution-checker`) —
  consume the merged agent definitions and skills verbatim.
- **Harness bindings** — OpenCode reads `.opencode/agents/*.md` mirrors; Codex reads
  `.codex/config.toml`; Amazon Q reads the generated bridge. They need formats the vendors
  actually recognize.
- **Future maintainer** — reads `docs/explanation/plan-domain-parity-decisions.md` to learn
  why each deviation exists.

## User Stories

1. As a **planner**, I want `plan-establishment-execution.md` to document the worktree
   default (provision `worktrees/<identifier>/`, commit there, push `HEAD` to the confirmed
   push target, remove after), so that every plan-authoring session follows one mechanic.
2. As a **planner**, I want the parity workflow to use the two-grill + conditional-research
   step structure, so that cross-repo decisions get the same rigor as single-repo plans.
3. As a **plan agent**, I want my definition and skills to contain the best-of content from
   all three repos, so that my behavior no longer depends on which repo I run in.
4. As an **OpenCode binding**, I want agent mirrors emitted with the official `permission`
   object, so that I am not relying on a deprecated frontmatter format.
5. As a **Codex binding**, I want per-agent config in `.codex/config.toml` sub-tables with
   no `.codex/agents/` directory, so that my config surface matches the official reference.
6. As a **tooling maintainer**, I want `rhino-cli` tests to fail if the deprecated formats
   reappear, so that parity survives future edits.
7. As a **future maintainer**, I want a rationale doc explaining all 26 matrix decisions,
   so that deviations read as deliberate, not accidental.

## Acceptance Criteria (Gherkin)

### Feature: 3-way best-of merges (matrix rows 3–16)

```gherkin
Scenario: Establishment workflow carries the worktree default and target-stage
  Given the merged repo-governance/workflows/plan/plan-establishment-execution.md in ose-public
  When I read its Execution Mode and Steps sections
  Then it documents authoring the plan inside "worktrees/<identifier>/"
  And it documents provisioning via "git worktree add -b <identifier> worktrees/<identifier> main" followed by "npm install" and "npm run doctor -- --fix" when the worktree is absent
  And it documents committing in the worktree and pushing HEAD to the confirmed push target (default "origin main")
  And it documents removing the worktree after delivery
  And it retains the "target-stage" input

Scenario: A sibling improvement is not lost in a merge
  Given any in-scope file and its copies in ~/ose-projects/ose-primer and ~/ose-projects/ose-infra
  When the 3-way diff review for that file completes
  Then every sibling-only improvement is either present in the merged ose-public copy
  Or recorded in the delivery checklist implementation notes as deliberately excluded with a reason

Scenario: Skill merge adopts infra's mandatory grilling gates
  Given the merged .claude/skills/plan-creating-project-plans/SKILL.md
  When I read it
  Then it contains a mandatory pre-write grilling gate and a mandatory post-write grilling gate
  And every grill question is required to present 2-4 concrete options

Scenario: Grilling convention keeps the public name
  Given the merged grilling convention in ose-public
  When I check its path
  Then it lives at repo-governance/development/workflow/grilling-with-options.md
  And its content includes the best-of merge with infra's broader grilling.md wording
```

### Feature: Parity workflow restructure (matrix row 2)

```gherkin
Scenario: Parity workflow exposes the two-grill plus research step structure
  Given the amended repo-governance/workflows/plan/plan-multi-repo-parity-planning.md
  When I read its Steps section headings in order
  Then the ordered steps are Survey, Matrix, First Grill (hard gate), web-researcher (conditional), Second Grill (post-research), Author, Gate, Deliver
  And the First Grill step is marked as a hard gate that blocks authoring until all matrix rows are resolved
  And internal cross-references (Grilling Contract, Termination Criteria, Sibling Plans) point at the renumbered steps
```

### Feature: OpenCode permission emitter (matrix row 18)

```gherkin
Scenario: Converter emits a permission object instead of boolean tools flags
  Given a Claude agent definition with frontmatter "tools: Read, Write"
  When rhino-cli agents sync converts it to an OpenCode mirror
  Then the mirror frontmatter contains a "permission" mapping with "read: allow" and "write: allow"
  And the mirror frontmatter contains no boolean tools map

Scenario: All committed mirrors are regenerated in the new format
  Given the modernized converter
  When "npm run generate:bindings" completes
  Then every file in .opencode/agents/ contains a "permission:" block
  And "grep -rl 'tools:' .opencode/agents/" matching the boolean-map form returns no files
  And "npm run validate:sync" exits 0

Scenario: Regression guard for the deprecated format
  Given the rhino-cli unit test suite
  When a future change re-introduces boolean tools emission
  Then at least one converter unit test fails
```

### Feature: Codex config consolidation (matrix row 19)

```gherkin
Scenario: Per-agent Codex config lives in config.toml sub-tables only
  Given the migrated .codex/config.toml
  When I read it
  Then the [agents.ci-monitor-subagent] sub-table carries the agent's configuration per the official Codex config reference
  And the directory .codex/agents/ does not exist in the repository

Scenario: Guard against .codex/agents/ reappearing
  Given the extended rhino-cli validate-bindings check
  When a .codex/agents/ directory exists at the repo root
  Then "npm run validate:harness-bindings" exits non-zero
  And the failure message advises using .codex/config.toml agents.<name> sub-tables
```

### Feature: Full binding audit (matrix rows 17 and 20)

```gherkin
Scenario: Binding surfaces are complete and validated
  Given the regenerated bindings
  When the audit phase runs
  Then the count of .claude/agents/*.md files equals the count of .opencode/agents/*.md files
  And "npm run validate:sync" exits 0
  And "npm run validate:harness-bindings" exits 0
  And "npx nx run rhino-cli:validate:cross-vendor-parity" exits 0

Scenario: generate:bindings invocation already matches the aligned form
  Given package.json in ose-public
  When I read the "generate:bindings" script
  Then it invokes cargo run with --manifest-path apps/rhino-cli/Cargo.toml for agents sync and agents emit-bindings
  And no script change is made by this plan
```

### Feature: Rationale doc and governance doc updates (matrix rows 24 and scope item 7)

```gherkin
Scenario: Rationale doc explains every matrix decision
  Given docs/explanation/plan-domain-parity-decisions.md
  When I read it
  Then it explains all 26 matrix rows in plain language
  And it explicitly covers the deviations (rows 19, 22, 23, 26) including the ose-public nuance that rhino-cli never emitted .codex/agents/
  And docs/explanation/README.md indexes it

Scenario: Stale harness wording is gone
  Given the updated CLAUDE.md, ai-agents.md, platform-bindings.md, and multi-harness-binding.md
  When I grep the repo (excluding plans/done, archived, node_modules, and this plan's matrix embed) for OpenCode "boolean flags" described as the current format
  Then every remaining occurrence describes the boolean form as deprecated/legacy
  And every .codex/agents/ reference describes it as removed/unofficial rather than as a live config surface
```

### Feature: Delivery integrity

```gherkin
Scenario: Worktree-to-main delivery with green CI
  Given all phases complete in worktrees/plan-domain-parity/
  When "git push origin HEAD:main" runs and all triggered GitHub Actions workflows finish
  Then every workflow conclusion is success
  And the plan folder is archived to plans/done/ with the completion-date prefix
```

## Product Scope

**In-scope features**: the seven scope items enumerated in [README.md](./README.md)
(merges, worktree default, parity-workflow restructure, rhino-cli emitter work, binding
audit, rationale doc, governance doc updates).

**Out-of-scope features**: sibling repo writes, automated drift guard, primer Go-port
(row 21), primer plan absorption (row 23), infra rename sweep (row 15 infra half),
`generate:bindings` script changes (row 20 — already compliant `[Repo-grounded]`).

## Product Risks

- **Field-order churn in mirrors**: replacing `tools` with `permission` changes every
  `.opencode/agents/*.md`; a 70-file mechanical diff must be reviewed as format-only.
  Mitigated by the converter unit tests and `validate:sync` byte-parity.
- **Codex sub-table key support uncertainty** `[Unverified at authoring time]`: whether
  `developer_instructions` may be inlined in `[agents.<name>]` is verified at execution time
  against the official config reference (single WebFetch, known authoritative URL), with a
  documented fallback (relocate the referenced file outside `.codex/agents/`). See
  tech-docs design decision D4.
- **Merge-induced markdown gate failures**: merged docs may trip link/heading/mermaid
  validators; every docs phase gate runs them before commit.
