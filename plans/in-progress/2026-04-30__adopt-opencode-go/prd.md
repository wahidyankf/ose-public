# Product Requirements Document

## Functional Requirements

### FR-1: ConvertModel produces OpenCode Go IDs

The `ConvertModel(claudeModel string) string` function in
`apps/rhino-cli/internal/agents/converter.go` must return `opencode-go/*` model
IDs for all Claude tier aliases.

| Input | Required output |
| ----- | --------------- |
| `"sonnet"` | `"opencode-go/minimax-m2.7"` |
| `"opus"` | `"opencode-go/minimax-m2.7"` |
| `""` (empty / inherit) | `"opencode-go/minimax-m2.7"` |
| `"haiku"` | `"opencode-go/glm-5"` |
| any unknown string | `"opencode-go/minimax-m2.7"` (default) |

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

The remaining MCP servers (`perplexity`, `playwright`, `nx-mcp`) must be
preserved unchanged. Perplexity covers web-search capability; Playwright covers
page reading.

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

### FR-7: model-selection.md updated

The "OpenCode / GLM Equivalents" section of
`governance/development/agents/model-selection.md` must reflect the new OpenCode
Go provider, including:

- Updated model ID mapping table
- Updated "3-to-2 Tier Collapse" explanation (OpenCode Go has 14 models, not 2)
- Updated benchmark notes for `minimax-m2.7`

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
```
