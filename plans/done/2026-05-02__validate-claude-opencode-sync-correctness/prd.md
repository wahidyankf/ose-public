# Product Requirements

## Personas

Three hats the single maintainer wears for this plan:

- **OpenCode User**: Opens OpenCode in this repo and expects the full agent
  roster (70+ agents) to be visible via `/agents`. Today this persona discovers
  an empty or near-empty list because synced agents land in the wrong directory.
- **rhino-cli Maintainer**: Adds new agents, runs `npm run sync:claude-to-opencode`,
  and runs `npm run validate:claude`. Needs the validator to accept all
  spec-valid Claude Code fields without false-positive failures.
- **Plan Executor / Code Reviewer**: Runs the delivery checklist, verifies
  acceptance criteria, and approves the plan's outcomes. Consumes this
  `prd.md` and `delivery.md` to confirm correctness.

Agents that consume this plan:

- `plan-execution-checker` — verifies all FRs and Gherkin scenarios are
  satisfied on completion.
- `repo-ose-primer-propagation-maker` — may propagate sync artifacts; depends
  on correct paths before propagation.

## Product Overview

This plan delivers a sync-correctness audit and targeted fix for the `rhino-cli`
Claude Code ↔ OpenCode synchronization infrastructure. The sync pipeline reads
agent and skill definitions from `.claude/` and writes corresponding OpenCode
artifacts; two categories of defects are corrected here: (1) the agent output
path is wrong (`agent/` singular → `agents/` plural), so OpenCode currently
sees an empty roster, and (2) the `validate:claude` command rejects
spec-legitimate Claude Code fields, producing false-positive failures that
block the pre-push hook. The plan also establishes an explicit per-field
converter policy table so that each Claude Code frontmatter field has a
documented preserve/translate/drop-with-warning decision, and delivers a
spec-fidelity test matrix that exercises every documented field. The end
result is a sync pipeline where `npm run sync:claude-to-opencode` populates
the correct directory, `npm run validate:claude` accepts all spec-valid fields,
and a failing test catches any future spec drift before it reaches production.

## Functional Requirements

### FR-1 — Canonical Output Paths

The sync command writes to the directory paths that OpenCode actually loads.
The repo tracks exactly one canonical location per artifact type.

- Agents: `.opencode/agents/<name>.md` (plural).
- Skills: policy decided in FR-2.

### FR-2 — Skill Output Policy

Either:

- **Option A (preferred)**: Stop syncing skills entirely; rely on OpenCode's
  documented native read of `.claude/skills/<name>/SKILL.md`. Remove
  `.opencode/skill/` and `.opencode/skills/` from git. Strip skill copy and
  identity-validation logic from `rhino-cli` or hard-deprecate it.
- **Option B (fallback)**: Sync to `.opencode/skills/<name>/SKILL.md`
  (plural) only — never both. Keep byte-equal validation against that path.

The plan picks Option A unless integration testing shows a documented OpenCode
behavior (e.g., per-project skill override) that requires the duplicate.

### FR-3 — Validator Spec Fidelity (`validate:claude`)

The validator accepts every Claude Code agent and skill frontmatter field
documented at code.claude.com as of 2026-05-02. Specifically:

- `color`: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`.
- `model`: `""`, `sonnet`, `opus`, `haiku`, `inherit`, OR full Claude model ID
  (`claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, etc.) — accept
  via regex `^claude-[a-z0-9-]+$` for forward compatibility.
- `tools`: comma-separated string OR YAML array. Allow `Read`, `Write`, `Edit`,
  `Glob`, `Grep`, `Bash`, `WebFetch`, `WebSearch`, `TodoWrite`, `Agent`, plus
  `Agent(<subagent-name>)` syntax.
- Additional optional fields (no error, no field-order rejection):
  `disallowedTools`, `permissionMode`, `maxTurns`, `effort`, `memory`,
  `isolation`, `background`, `initialPrompt`, `mcpServers`, `hooks`.
- Skills: optional fields `when_to_use`, `argument-hint`, `arguments`,
  `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`,
  `effort`, `context`, `agent`, `hooks`, `paths`, `shell`. These are
  **Claude Code skill fields** present in `.claude/skills/` source files.
  Per the OpenCode skills docs (verified 2026-05-02), OpenCode recognizes only
  `name`, `description`, `license`, `compatibility`, and `metadata` as skill
  fields; all other keys are silently ignored by OpenCode at runtime. This is
  expected and acceptable — the `validSkillFields` allow-list tells the Claude
  Code validator to accept these fields without false-positive failures, not to
  produce them in OpenCode output.

Field-order validation is **relaxed** to: required fields first in canonical
order, optional fields in any order after. Extra unknown fields produce a
WARNING, not a FAIL, with the field name surfaced.

### FR-4 — Validator Spec Fidelity (`validate:sync`)

The sync validator validates the canonical OpenCode output path defined in
FR-1, with these semantic checks per agent:

- `description` byte-equal between source and output (after frontmatter parse).
- `model` correctly translated by `ConvertModel()`.
- `tools` translated to OpenCode lowercase boolean map; `permission` block
  passed-through if defined on Claude side (rare today but spec-supported).
- `skills` array preserved when present.
- `mode` field: `mode` is an OpenCode-only field with no Claude Code source
  signal. Policy decision (this plan): do **not** emit `mode`; accept
  OpenCode's built-in default (`all`). The sync validator does not check
  `mode` presence. A future plan may introduce a Claude-side convention to
  supply a `mode` hint, at which point this policy is revisited.
- Body text byte-equal.

### FR-5 — Converter Field Policy

Each Claude Code agent frontmatter field has an explicit policy in
`converter.go`, documented in code as a single map or switch:

| Field                  | Policy                         | Notes                                                           |
| ---------------------- | ------------------------------ | --------------------------------------------------------------- |
| `name`                 | drop                           | Filename carries name in OpenCode                               |
| `description`          | preserve                       | Required both sides                                             |
| `tools` (string/array) | translate                      | → lowercase boolean map per OpenCode (deprecated but supported) |
| `model`                | translate via `ConvertModel()` | Mapping owned by opencode-go plan                               |
| `color`                | preserve                       | OpenCode supports color; pass-through (named values map 1:1)    |
| `skills`               | preserve                       | Array passes through                                            |
| `disallowedTools`      | drop + warn                    | No OpenCode equivalent today                                    |
| `permissionMode`       | drop + warn                    | OpenCode uses `permission:` object instead                      |
| `maxTurns`             | translate to `steps`           | Field rename per OpenCode docs                                  |
| `effort`               | drop + warn                    | No documented OpenCode equivalent                               |
| `memory`               | drop + warn                    | Claude-only                                                     |
| `isolation`            | drop + warn                    | Claude-only                                                     |
| `background`           | drop + warn                    | Claude-only                                                     |
| `initialPrompt`        | drop + warn                    | Claude-only                                                     |
| `mcpServers`           | drop + warn                    | OpenCode declares MCP at config level                           |
| `hooks`                | drop + warn                    | No documented OpenCode equivalent                               |

Warnings surface in `--verbose` output and in JSON/markdown reports; they do
not fail the sync.

### FR-6 — Singular-Path Removal

`.opencode/agent/` and `.opencode/skill/` directories:

- Removed from working tree.
- Removed from git index (`git rm -r`).
- Pre-push validator fails if either reappears.
- README and CLAUDE.md updated to reference plural paths only.

### FR-7 — Documentation Drift Fix

`apps/rhino-cli/cmd/agents_sync.go` long-help text accurately describes the
sync behavior:

- Remove false claim "SKILL.md → {skill-name}.md conversion".
- Update directory paths to plural form.
- Remove model-mapping example referencing `zai-coding-plan/glm-5.1`
  (that text is owned by opencode-go plan; this plan replaces with a
  field-policy summary).

### FR-8 — Test Matrix

`converter_test.go`, `sync_validator.go` tests, and a new
`spec_fidelity_test.go` exercise:

- Each Claude Code agent frontmatter field, present and absent.
- Each Claude Code skill frontmatter field, present and absent.
- Round-trip equivalence: `parse(claude) → convert → emit → re-parse(opencode
output)` — re-parsed output is then field-by-field compared against the
  source using the same equivalence logic as `validateAgentFile`. Fields with
  policy `drop-warn` are excluded from the comparison. No reverse-conversion
  function (`ConvertBack`) is defined or required; equivalence is checked
  directly between source fields and output fields using the policy map.
- OpenCode JSON-schema-shape conformance: every emitted agent file has only
  fields recognized by the OpenCode docs (no unknown keys leak through).

### FR-9 — Backwards Compatibility on `.claude/` Source

This plan does NOT modify any `.claude/agents/*.md` or `.claude/skills/*/SKILL.md`
content. All 70+ existing agents continue to validate green after this plan
ships. If validator relaxation surfaces existing latent issues, those are
filed as separate findings, not modifications.

## Non-Functional Requirements

### NFR-1 — No regression in pre-push timing

`nx affected -t typecheck lint test:quick spec-coverage` runtime for
`rhino-cli` increases by ≤ 15% relative to current baseline.

### NFR-2 — `rhino-cli` coverage stays ≥ 90%

Coverage gate in `test:quick` continues to pass after refactor and new tests.

### NFR-3 — Atomic publish path

Sync directory move is a single commit. CI between old singular and new
plural states never observes both directories tracked.

### NFR-4 — No new external deps

Refactor uses existing Go modules (`gopkg.in/yaml.v3`, stdlib). No new
go.mod entries.

### NFR-5 — Deterministic output

Repeated `npm run sync:claude-to-opencode` produces byte-identical
`.opencode/agents/` content (no map-order flakiness in YAML emission).

## Product Scope

### In Scope

- Fix sync output path for agents: `.opencode/agent/` (singular, broken) →
  `.opencode/agents/` (plural, canonical per OpenCode docs).
- Decide and enforce skill output policy (Option A: stop syncing; or Option B:
  sync to `.opencode/skills/` plural).
- Remove singular directories `.opencode/agent/` and `.opencode/skill/` from
  git.
- Relax `validate:claude` to accept every spec-valid Claude Code agent and
  skill frontmatter field (colors, models, tools, optional fields).
- Add explicit per-field converter policy map documenting preserve/translate/
  drop-with-warning for every Claude Code field.
- Add spec-fidelity test matrix exercising all documented fields.
- Update CLAUDE.md and README references to plural paths.
- Fix `agents_sync.go` help text (false SKILL.md rename claim, wrong paths).

### Out of Scope (Product)

- Changing which model the sync emits (owned by `2026-04-30__adopt-opencode-go`
  plan).
- Migrating `tools:` deprecated boolean map → `permission:` block (policy
  decided here, implementation deferred to a follow-up plan).
- Modifying any `.claude/agents/` or `.claude/skills/` source content.
- `ose-infra` and `ose-primer` repos — not affected by this sync tooling.
- Per-agent `opencode.json` `agent` block overrides — not used by this repo.
- `mode` field emission — no Claude Code source signal exists for this
  OpenCode-only field; policy is: do not emit, accept OpenCode default of `all`.

## Product Risks

- **UX regression — empty agent roster**: if the plural path switch is
  deployed but OpenCode does not read it (low probability per docs, but
  unverified in the live TUI), developers lose all agents. Mitigated by
  Phase 0 TUI spot-check and Phase 5 manual verification before push.
- **CLI output shape change breaks existing scripts**: the new `warning`
  tri-state status and verbose dropped-field report change the stdout/JSON
  shape of `agents sync --verbose`. Any scripts parsing this output will
  need updating. Risk is LOW — no known consumers of the machine-readable
  output outside CI quality gate.
- **Option A / Option B decision impact**: choosing Option A (stop syncing
  skills) removes `.opencode/skill/` permanently. If future OpenCode behavior
  requires the skill copy in `.opencode/skills/`, reintroducing it is a
  follow-up plan. The Phase 4 TUI verification step gates the decision.
- **Validator relaxation may mask real bugs**: downgrading hard-fail to
  warning for unknown fields means a typo in a field name passes silently.
  Mitigated by the `--strict` CI flag that treats warnings as failures in the
  pre-push hook.
- **`--strict` flag affects developer workflow**: enabling strict mode in CI
  means any new Claude Code field added without updating the converter policy
  blocks the pre-push hook. Documented in FR-5 and converter field-policy map
  comments.

## User Stories

As an OpenCode user working in this repo,
I want `npm run sync:claude-to-opencode` to write agent files to
`.opencode/agents/` (plural)
so that OpenCode loads every agent defined in `.claude/agents/` without
additional configuration.

As an OpenCode user working in this repo,
I want `npm run validate:sync` to validate against `.opencode/agents/`
so that a green validation result actually means OpenCode can read the agents.

As the rhino-cli maintainer,
I want `npm run validate:claude` to accept every spec-valid Claude Code field
(all eight colors, `inherit` model, `Agent(...)` tools, optional fields)
so that spec-compliant agent definitions are never blocked by a lagging
validator.

As the rhino-cli maintainer,
I want each Claude Code frontmatter field to have an explicit documented policy
(preserve / translate / drop-with-warning)
so that future field additions can be handled consistently and the converter
intent is not ambiguous.

As the rhino-cli maintainer,
I want skills to be removed from the sync output (Option A)
so that `.claude/skills/` remains the single source of truth and OpenCode
reads it natively without a redundant copy to maintain.

As the plan executor,
I want a spec-fidelity test matrix covering every documented Claude Code field
so that future spec drift (new field, new model, renamed tool) is caught by
a failing test rather than a production incident.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Sync writes agents to canonical OpenCode path
  Background:
    Given the repository has 70 agents in .claude/agents/
    And rhino-cli is built from current source

  Scenario: Sync targets the plural agents directory
    When the developer runs "npm run sync:claude-to-opencode"
    Then ".opencode/agents/" contains 70 markdown files
    And ".opencode/agent/" does not exist
    And no agent file is duplicated across singular and plural directories

  Scenario: validate:sync targets the canonical path
    When the developer runs "npm run validate:sync"
    Then the validator reads ".opencode/agents/" not ".opencode/agent/"
    And the validator reports zero failed checks
    And the validator surfaces the canonical path in its output

  Scenario: Singular path resurrection blocks the build
    Given the developer creates ".opencode/agent/foo.md" by hand
    When the pre-push hook runs
    Then validate-sync fails with a finding pointing at the singular path
    And the failure message links to the canonical path docs
```

```gherkin
Feature: Skills are not redundantly copied
  Background:
    Given OpenCode reads ".claude/skills/<name>/SKILL.md" natively per official docs

  Scenario: Skill copy is removed (Option A)
    When sync runs in default mode
    Then ".opencode/skill/" does not exist after sync
    And ".opencode/skills/" does not contain any rhino-cli-generated entries
    And opening OpenCode lists every skill defined in .claude/skills/

  Scenario: Skill validator validates source format only
    When the developer runs "npm run validate:claude"
    Then every .claude/skills/<name>/SKILL.md is validated against the Agent Skills standard
    And validate:sync no longer enforces byte-equality between paths
```

```gherkin
Feature: Validator accepts current Claude Code spec
  Scenario Outline: Spec-valid color does not fail validation
    Given an agent declaring "color: <color>"
    When the developer runs "npm run validate:claude"
    Then the validator passes the agent
    Examples:
      | color  |
      | red    |
      | orange |
      | pink   |
      | cyan   |
      | blue   |
      | green  |
      | yellow |
      | purple |

  Scenario Outline: Spec-valid model does not fail validation
    Given an agent declaring "model: <model>"
    When the developer runs "npm run validate:claude"
    Then the validator passes the agent
    Examples:
      | model               |
      |                     |
      | sonnet              |
      | opus                |
      | haiku               |
      | inherit             |
      | claude-opus-4-7     |
      | claude-sonnet-4-6   |
      | claude-haiku-4-5    |

  Scenario: Optional Claude-only field does not fail validation
    Given an agent declaring "isolation: worktree"
    And the same agent declaring "memory: project"
    When the developer runs "npm run validate:claude"
    Then the validator passes the agent
    And the validator emits a WARNING listing each optional field that has no OpenCode equivalent

  Scenario: Unknown frontmatter field is warned not failed
    Given an agent declaring an unknown field "foo: bar"
    When the developer runs "npm run validate:claude"
    Then the validator emits a WARNING naming the field "foo"
    And the validator's exit code is 0
```

```gherkin
Feature: Converter has explicit policy per field
  Scenario: Drop-and-warn policy on Claude-only field
    Given an agent declares "memory: project"
    When sync converts the agent
    Then the OpenCode output does NOT contain a "memory" field
    And the sync verbose log emits a WARNING that "memory" was dropped
    And the WARNING cites the converter field-policy table

  Scenario: maxTurns translates to steps
    Given a Claude agent declares "maxTurns: 5"
    When sync converts the agent
    Then the OpenCode output contains "steps: 5"
    And the OpenCode output does not contain "maxTurns"

  Scenario: Color field is preserved through conversion
    Given a Claude agent declares "color: orange"
    When sync converts the agent
    Then the OpenCode output contains "color: orange"
```

```gherkin
Feature: Sync output validates against OpenCode JSON schema shape
  Scenario: No unknown fields in OpenCode output
    Given a synced .opencode/agents/<name>.md file
    When the spec-fidelity test parses its frontmatter
    Then every key is in the OpenCode-documented field set
    And no value violates a documented type constraint

  Scenario: Round-trip of supported fields
    Given a Claude agent with description, tools, model, color, skills
    When the agent is converted, then re-parsed
    Then description matches source byte-for-byte
    And tools recover to the same set of names regardless of casing
    And color matches source byte-for-byte
    And skills array order is preserved
```

```gherkin
Feature: Pre-push hook surfaces sync drift
  Scenario: Out-of-sync .opencode/agents file blocks push
    Given a developer modifies .claude/agents/foo.md
    And forgets to run sync before pushing
    When the pre-push hook runs validate:sync
    Then validate:sync fails with a clear pointer to ".opencode/agents/foo.md"
    And the failure message includes the exact "npm run sync:claude-to-opencode" remediation command
```
