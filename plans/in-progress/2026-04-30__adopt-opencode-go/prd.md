# Product Requirements Document

## Product Overview

This change migrates the OpenCode model provider from Z.ai (GLM family) to
OpenCode Go (MiniMax and GLM family via a multi-lab subscription). From the
product perspective, a developer opening an OpenCode session gains access to a
higher-benchmark large model (MiniMax M2.7, successor to M2.5 which led the
SWE-Bench Verified leaderboard) and native Exa web search — without per-token
billing. The `rhino-cli` sync mechanism is updated so that agent configuration
files are generated correctly from the new provider IDs automatically.

## Personas

| Persona | Description |
| ------- | ----------- |
| Developer (OpenCode sessions) | Uses OpenCode as a secondary coding assistant alongside Claude Code. Benefits from improved model quality and integrated Exa web search without changing the workflow. |
| CI / rhino-cli maintainer | Owns the Go code in `apps/rhino-cli/`. Applies model mapping changes and updates test expectations. Runs `npm run validate:config` and `npm run sync:claude-to-opencode` after changes. |
| Repository governance reviewer | Reviews `model-selection.md` to verify model equivalents table is accurate and that the documented mapping matches the code. |

## Product Scope

### In Scope

- Update `ConvertModel()` in `rhino-cli` to output `opencode-go/*` model IDs
- Update all `rhino-cli` unit and integration tests for new model IDs
- Update `.opencode/opencode.json` model fields, provider block, and MCP entries
- Regenerate all `.opencode/agent/*.md` files via the existing sync mechanism
- Update `model-selection.md` with the new OpenCode Go equivalents table and web search documentation
- Document Exa web search as the primary search mechanism (`OPENCODE_ENABLE_EXA=true`)

### Out of Scope

- `.claude/agents/*.md` files — Claude Code aliases are not changing
- Any Z.ai subscription or credential cleanup — personal billing concern
- `ose-infra`, `ose-primer`, parent `ose-projects` — not affected
- Adding OpenCode Go to CI — CI does not execute OpenCode sessions
- Evaluating all OpenCode Go models — only the best-benchmark model is selected

## Product Risks

| Risk | User Impact | Mitigation |
| ---- | ----------- | ---------- |
| Exa web search does not work with `opencode-go/*` models | Developer loses web search capability temporarily | Perplexity MCP is configured as a provider-agnostic fallback |
| Model slug (`minimax-m2.7`) differs from actual OpenCode Go roster | Empty or error sessions; no model connects | Phase 0 slug verification step catches this before any code changes |
| OpenCode Go beta outage | Developer cannot use OpenCode sessions | Claude Code remains the primary tool; OpenCode is secondary |
| M2.7 quality below expectations | Developer perception of degraded session quality | Rollback plan exists: revert commits, re-run sync; isolated to `rhino-cli` + config |

## User Stories

1. As a developer using OpenCode, I want model calls routed through OpenCode Go
   so that I benefit from a higher-benchmark model (MiniMax M2.7) at a flat
   monthly rate, with Exa web search available out of the box.
2. As a rhino-cli maintainer, I want `ConvertModel()` to output `opencode-go/*`
   model IDs so that agent sync files reflect the correct provider automatically
   without manual editing of any `.opencode/agent/*.md` file.

## Functional Requirements

### FR-1: ConvertModel produces OpenCode Go IDs

The `ConvertModel(claudeModel string) string` function in
`apps/rhino-cli/internal/agents/converter.go` must return `opencode-go/*` model
IDs for all Claude tier aliases.

| Input                  | Required output                        |
| ---------------------- | -------------------------------------- |
| `"sonnet"`             | `"opencode-go/minimax-m2.7"`           |
| `"opus"`               | `"opencode-go/minimax-m2.7"`           |
| `""` (empty / inherit) | `"opencode-go/minimax-m2.7"`           |
| `"haiku"`              | `"opencode-go/glm-5"`                  |
| any unknown string     | `"opencode-go/minimax-m2.7"` (default) |

> **Slug verification prerequisite**: before implementing, verify that
> `minimax-m2.7` and `glm-5` are the exact slugs returned by `/models` in
> the OpenCode TUI after connecting with an OpenCode Go subscription. If the
> actual slugs differ, use the verified slugs throughout.

### FR-2: opencode.json uses OpenCode Go model IDs

`.opencode/opencode.json` must:

- Set `"model": "opencode-go/minimax-m2.7"` (or verified slug)
- Set `"small_model": "opencode-go/glm-5"` (or verified slug)
- Include a `"provider"` block with `opencode-go` keyed to the API key env var:

  ```json
  "provider": {
    "opencode-go": {
      "options": { "apiKey": "{env:OPENCODE_GO_API_KEY}" }
    }
  }
  ```

### FR-3: Z.ai MCP entries removed from opencode.json

`.opencode/opencode.json` must not contain any of:

- `"zai-mcp-server"`
- `"web-search-prime"`
- `"web-reader"`
- `"zread"`

The remaining MCP servers (`perplexity`, `playwright`, `nx-mcp`) must be preserved
unchanged. Perplexity is the configured fallback for web search (see FR-7); Playwright
covers page reading/browsing.

### FR-4: All OpenCode agent files reflect new model IDs

After running `npm run sync:claude-to-opencode`, every file under
`.opencode/agent/*.md` must contain `opencode-go/minimax-m2.7` (for opus/sonnet-
tier agents) or `opencode-go/glm-5` (for haiku-tier agents) — no file must
contain `zai-coding-plan/*`.

### FR-5: rhino-cli test suite passes

All `rhino-cli` unit and integration tests must pass with the new model IDs:

- `nx run rhino-cli:test:unit` — green (≥90% coverage maintained)
- `nx run rhino-cli:test:integration` — green
- `nx run rhino-cli:test:quick` — green

### FR-6: validate:config passes end-to-end

`npm run validate:config` (which runs `validate:claude` → `sync:claude-to-opencode`
→ `validate:opencode`) must exit 0 after all changes.

### FR-7: Exa web search enabled as primary mechanism

The `OPENCODE_ENABLE_EXA=true` environment variable must be set in the developer's
shell and documented in the team's onboarding notes so every developer benefits from
the built-in Exa `websearch` tool in OpenCode sessions.

**Primary**: `OPENCODE_ENABLE_EXA=true` — activates OpenCode's native Exa-powered
`websearch` and `codesearch` tools. No separate API key required. Exa is the lightest
path: one env var, no MCP server process.

**Configured fallback**: Perplexity MCP — already wired in `.opencode/opencode.json`.
Requires `PERPLEXITY_API_KEY`. Activates automatically when the `perplexity` MCP
server is running; provides cited, research-quality answers. Used when Exa is
unavailable or returns insufficient results.

**Alternative (not configured)**: Brave Search MCP — best free-tier option if no
Perplexity subscription. Provides 10–20× better free quota than Google's MCP. Can
be added to `opencode.json` by any developer who prefers it.

> **Caveat**: Exa's reliability with OpenCode Go models specifically is not
> officially confirmed — the OpenCode docs say the tool activates for "the OpenCode
> provider or when `OPENCODE_ENABLE_EXA` is set," leaving ambiguity about whether
> OpenCode Go counts as "the OpenCode provider." Perplexity MCP is the safe,
> confirmed fallback for web search if Exa proves non-functional with
> `opencode-go/*` models.

### FR-8: model-selection.md updated

The "OpenCode / GLM Equivalents" section of
`governance/development/agents/model-selection.md` must reflect the new OpenCode
Go provider, including:

- Updated model ID mapping table
- Updated "3-to-2 Tier Collapse" explanation (the converter maintains the same
  3-to-2 collapse across the OpenCode Go model roster)
- Updated benchmark notes for `minimax-m2.7`
- New "Web Search in OpenCode Sessions" subsection documenting Exa (primary),
  Perplexity MCP (fallback), and Brave Search MCP (alternative)

## Non-Functional Requirements

- **No regression in Claude Code**: `.claude/agents/*.md` files are not modified.
  Claude Code model aliases (`sonnet`, `haiku`, omit) remain unchanged.
- **No broken sync**: the sync mechanism (`rhino-cli agents sync`) continues to
  produce semantically valid `.opencode/agent/*.md` files.
- **API key not hardcoded**: the OpenCode Go API key must be sourced from the
  `OPENCODE_GO_API_KEY` environment variable via `{env:OPENCODE_GO_API_KEY}`.
  The key must never appear in any committed file.
- **Single commit per concern**: rhino-cli code changes, config changes, and doc
  changes are separate commits.
- **Exa env var not committed**: `OPENCODE_ENABLE_EXA=true` is a shell environment
  variable set in `~/.zshrc` or `~/.bashrc`. It must never appear in any committed
  file in the repository.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: OpenCode Go Model Provider Adoption
  As a developer using OpenCode in this repository
  I want the OpenCode configuration to route model calls through OpenCode Go
  So that I benefit from higher-benchmark models without per-token billing

  Background:
    Given the repository is on the main branch with a clean working tree
    And an OpenCode Go subscription is active with OPENCODE_GO_API_KEY set

  Scenario: ConvertModel maps sonnet tier to large OpenCode Go model
    Given the rhino-cli ConvertModel function is compiled
    When ConvertModel is called with input "sonnet"
    Then the return value is "opencode-go/minimax-m2.7"

  Scenario: ConvertModel maps haiku tier to small OpenCode Go model
    Given the rhino-cli ConvertModel function is compiled
    When ConvertModel is called with input "haiku"
    Then the return value is "opencode-go/glm-5"

  Scenario: ConvertModel maps empty string (inherit) to large OpenCode Go model
    Given the rhino-cli ConvertModel function is compiled
    When ConvertModel is called with an empty string
    Then the return value is "opencode-go/minimax-m2.7"

  Scenario: opencode.json does not contain Z.ai model identifiers
    Given the changes to .opencode/opencode.json are committed
    When the file contents are read
    Then no line contains "zai-coding-plan"
    And the model field equals "opencode-go/minimax-m2.7"
    And the small_model field equals "opencode-go/glm-5"

  Scenario: opencode.json does not contain Z.ai MCP entries
    Given the changes to .opencode/opencode.json are committed
    When the mcp block is read
    Then "zai-mcp-server" is not present
    And "web-search-prime" is not present
    And "web-reader" is not present
    And "zread" is not present
    And "perplexity" is present
    And "playwright" is present
    And "nx-mcp" is present

  Scenario: Sync produces OpenCode Go model IDs in agent files
    Given all rhino-cli changes are built
    When "npm run sync:claude-to-opencode" is executed
    Then no .opencode/agent/*.md file contains "zai-coding-plan"
    And haiku-tier agents contain "opencode-go/glm-5"
    And opus-tier and sonnet-tier agents contain "opencode-go/minimax-m2.7"

  Scenario: validate:config passes after all changes
    Given all code, config, and doc changes are in place
    When "npm run validate:config" is executed
    Then the command exits with code 0

  Scenario: rhino-cli test suite passes
    Given all Go source and test changes are in place
    When "nx run rhino-cli:test:quick" is executed
    Then the command exits with code 0
    And line coverage remains at or above 90%

  Scenario: Exa web search is the primary search mechanism
    Given OPENCODE_ENABLE_EXA is set to "true" in the shell environment
    When an OpenCode session is opened with the opencode-go provider active
    Then the model has access to the built-in "websearch" Exa tool
    And the model has access to the built-in "codesearch" Exa tool

  Scenario: Perplexity MCP is available as fallback web search
    Given the .opencode/opencode.json "perplexity" mcp entry is present
    And PERPLEXITY_API_KEY is set in the shell environment
    When an OpenCode session is opened
    Then the model can invoke the Perplexity MCP server for web research
    And the Perplexity MCP operates independently of the OpenCode Go model provider
```
