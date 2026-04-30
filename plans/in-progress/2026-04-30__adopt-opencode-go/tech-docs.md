# Technical Design

## Architecture Overview

OpenCode Go is a **cloud model provider** accessed via an OpenAI-compatible API.
It is not a local binary, SDK, or MCP server — it is purely a model-routing
endpoint that maps `opencode-go/<model-slug>` IDs to the underlying lab APIs.
Authentication is via an API key obtained from the OpenCode Zen console.

The integration surface in this repository is entirely in two places:

1. **`rhino-cli` converter**: the Go function `ConvertModel()` translates Claude
   Code model aliases to the correct OpenCode model ID. This is the single source
   of truth for the model mapping. All `.opencode/agent/*.md` files are generated
   from it; they are never edited manually.
2. **`.opencode/opencode.json`**: configures the default model, small model,
   provider credentials, and MCP servers for OpenCode sessions.

```
.claude/agents/*.md           opencode.json
      │                            │
      │ (model: sonnet/haiku/omit) │ (model: "opencode-go/minimax-m2.7")
      ▼                            │
rhino-cli ConvertModel()           │ (provider block → OPENCODE_GO_API_KEY)
      │                            │
      ▼                            ▼
.opencode/agent/*.md ──────── OpenCode session
  model: opencode-go/...           │
                                   ▼
                          opencode.ai/go API → lab model
```

## Model Selection Rationale

OpenCode Go offers 14 models from 6 labs as of April 2026. The selection criteria
for the large model are:

1. **Highest available SWE-Bench score**: MiniMax M2.5 was benchmarked at 80.2%
   SWE-Bench in the OpenCode Go documentation. Its successor `minimax-m2.7` is
   listed in the model roster and expected to be at least as capable.
2. **Preserves 3-to-2 collapse**: same single large model for opus and sonnet tiers.
3. **API compatibility**: MiniMax M2.7 is OpenAI-API-compatible through OpenCode Go.

For the small model, `glm-5` (Zhipu AI) is selected because:

- Same lab as current `glm-5-turbo`, so behavior is familiar
- OpenCode Go lists it as the non-turbo lighter GLM variant
- Haiku-tier agents do purely mechanical work; benchmark differences matter less

> **Slug verification**: `minimax-m2.7` and `glm-5` are the intended slugs but
> must be confirmed via `/models` in the OpenCode TUI. If slugs differ, use the
> verified values everywhere below.

## Files to Change

### 1. `apps/rhino-cli/internal/agents/converter.go`

**Function**: `ConvertModel()` (lines 111–125).

Current:
```go
func ConvertModel(claudeModel string) string {
    model := strings.TrimSpace(claudeModel)
    switch model {
    case "sonnet", "opus":
        return "zai-coding-plan/glm-5.1"
    case "haiku":
        return "zai-coding-plan/glm-5-turbo"
    default:
        return "zai-coding-plan/glm-5.1"
    }
}
```

Target:
```go
func ConvertModel(claudeModel string) string {
    model := strings.TrimSpace(claudeModel)
    switch model {
    case "haiku":
        return "opencode-go/glm-5"
    default:
        return "opencode-go/minimax-m2.7"
    }
}
```

The `default` branch covers `""`, `"sonnet"`, `"opus"`, and any unknown value —
all map to the large model. The `haiku` case is the only distinct branch.

### 2. `apps/rhino-cli/internal/agents/types.go`

**Struct comment**: `OpenCodeAgent.Model` field (line 23).

Current:
```go
Model string `yaml:"model"` // "zai-coding-plan/glm-5.1" | "zai-coding-plan/glm-5-turbo"
```

Target:
```go
Model string `yaml:"model"` // "opencode-go/minimax-m2.7" | "opencode-go/glm-5"
```

### 3. `apps/rhino-cli/cmd/agents_sync.go` (comment update)

Line 25 contains `Model mapping (sonnet/opus → zai-coding-plan/glm-5.1, haiku →
zai-coding-plan/glm-5-turbo)`. Update to reference OpenCode Go IDs.

### 4. `apps/rhino-cli/cmd/agents_validate_sync.go` (comment update)

Line 21 contains `Model is correctly converted (sonnet/opus/empty → zai-coding-
plan/glm-5.1, haiku → zai-coding-plan/glm-5-turbo)`. Update to reference
OpenCode Go IDs.

### 5. `apps/rhino-cli/internal/agents/converter_test.go`

**`TestConvertModel`** table test cases (lines ~173–178):

Current:
```go
{"sonnet",    "sonnet",         "zai-coding-plan/glm-5.1"},
{"opus",      "opus",           "zai-coding-plan/glm-5.1"},
{"haiku",     "haiku",          "zai-coding-plan/glm-5-turbo"},
{"empty",     "",               "zai-coding-plan/glm-5.1"},
{"whitespace","  ",             "zai-coding-plan/glm-5.1"},
{"unknown",   "unknown-model",  "zai-coding-plan/glm-5.1"},
```

Target:
```go
{"sonnet",    "sonnet",         "opencode-go/minimax-m2.7"},
{"opus",      "opus",           "opencode-go/minimax-m2.7"},
{"haiku",     "haiku",          "opencode-go/glm-5"},
{"empty",     "",               "opencode-go/minimax-m2.7"},
{"whitespace","  ",             "opencode-go/minimax-m2.7"},
{"unknown",   "unknown-model",  "opencode-go/minimax-m2.7"},
```

**`TestConvertAgent_*`** assertions referencing `"zai-coding-plan/glm-5.1"`
(lines 245 and 345): update to `"opencode-go/minimax-m2.7"`.

### 6. `apps/rhino-cli/internal/agents/types_test.go`

**`TestOpenCodeAgent`** (lines 34–41): the test constructs an `OpenCodeAgent`
with `Model: "zai-coding-plan/glm-5.1"` and asserts against it. Update to
`"opencode-go/minimax-m2.7"`:

```go
agent := OpenCodeAgent{
    Description: "Test agent description",
    Model:       "opencode-go/minimax-m2.7",
    Tools:       tools,
}
// ...
if agent.Model != "opencode-go/minimax-m2.7" {
```

### 7. `apps/rhino-cli/internal/agents/sync_validator_test.go`

Multiple OpenCode content strings contain `zai-coding-plan/glm-5.1` (lines ~635,
709, 736, 763, 798, 929, 957). Update all to `opencode-go/minimax-m2.7`.

The comment on line 675 (`// Claude uses "sonnet" → should convert to "zai-coding-
plan/glm-5.1"`) must be updated to reference `"opencode-go/minimax-m2.7"`.

### 8. `apps/rhino-cli/cmd/steps_common_test.go`

**Constant rename + regex update** (line 85):

Current:
```go
stepCorrespondingOpenCodeAgentUsesZaiGlmModel = `^the corresponding \.opencode/ agent uses the "zai-coding-plan/glm-5\.1" model identifier$`
```

Target:
```go
stepCorrespondingOpenCodeAgentUsesOpenCodeGoModel = `^the corresponding \.opencode/ agent uses the "opencode-go/minimax-m2\.7" model identifier$`
```

All usages of `stepCorrespondingOpenCodeAgentUsesZaiGlmModel` in the codebase
must be updated to the new constant name.

### 9. `apps/rhino-cli/cmd/agents_sync.integration_test.go`

Lines 193–194 assert `"zai-coding-plan/glm-5.1"`. Update to
`"opencode-go/minimax-m2.7"`.

Line 217 references the old step constant. Update to
`stepCorrespondingOpenCodeAgentUsesOpenCodeGoModel`.

### 10. `apps/rhino-cli/cmd/agents_validate_sync.integration_test.go`

Lines 66, 117, 144 contain `"zai-coding-plan/glm-5.1"`. Update to
`"opencode-go/minimax-m2.7"`.

### 11. `apps/rhino-cli/cmd/agents_validate_naming.integration_test.go`

Line 56 contains a fixture string with `"zai-coding-plan/glm-5.1"`. Update to
`"opencode-go/minimax-m2.7"`.

### 12. `.opencode/opencode.json`

Full target content:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode-go/minimax-m2.7",
  "small_model": "opencode-go/glm-5",
  "provider": {
    "opencode-go": {
      "options": {
        "apiKey": "{env:OPENCODE_GO_API_KEY}"
      }
    }
  },
  "permission": {
    "read": "allow",
    "edit": {
      "*": "ask",
      ".claude/**": "allow",
      ".opencode/**": "allow"
    },
    "bash": {
      "*": "ask",
      "npm run sync*": "allow",
      "git *": "allow",
      "nx *": "allow",
      "npx *": "ask",
      "go *": "allow",
      "gofmt *": "allow",
      "rm -rf *": "deny"
    },
    "glob": "allow",
    "grep": "allow",
    "list": "allow",
    "skill": "allow",
    "external_directory": {
      "/tmp/**": "allow"
    }
  },
  "mcp": {
    "perplexity": {
      "type": "local",
      "command": ["npx", "-y", "@perplexity-ai/mcp-server"]
    },
    "nx-mcp": {
      "type": "local",
      "command": ["npx", "-y", "nx-mcp"],
      "enabled": true
    },
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest"]
    }
  }
}
```

Removed entries: `zai-mcp-server`, `web-search-prime`, `web-reader`, `zread`.
Added: `provider.opencode-go` block with env-var API key.

**MCP capability coverage after removal**:

| Capability | Before (Z.ai) | After |
| ---------- | ------------- | ----- |
| Web search | `web-search-prime` | `perplexity` (already wired) |
| Web reading | `web-reader`, `zread` | `playwright` (already wired) |
| Nx workspace | `nx-mcp` | `nx-mcp` (unchanged) |

### 13. `governance/development/agents/model-selection.md`

**Section to update**: "OpenCode / GLM Equivalents".

Replace the entire section (from `## OpenCode / GLM Equivalents` to the end of
the "Why No Separate GLM Opus Tier" subsection) with:

```markdown
## OpenCode / OpenCode Go Equivalents

Agents in `.claude/agents/` are auto-synced to `.opencode/agent/` by rhino-cli
(`npm run sync:claude-to-opencode`). The sync translates Claude model aliases to
OpenCode Go model IDs.

### Model ID Mapping

| Claude Code              | OpenCode Go                     | Capability notes                                          |
| ------------------------ | ------------------------------- | --------------------------------------------------------- |
| omit (opus-tier inherit) | `opencode-go/minimax-m2.7`      | MiniMax MoE; SWE-Bench 80.2%; highest in OpenCode Go      |
| `model: sonnet`          | `opencode-go/minimax-m2.7`      | Same model as opus-tier (no separate sonnet tier)         |
| `model: haiku`           | `opencode-go/glm-5`             | Zhipu GLM lighter variant; fast/cheap for mechanical work |

### 3-to-2 Tier Collapse

Claude Code has three tiers (Opus 4.7 > Sonnet 4.6 > Haiku 4.5). OpenCode Go
offers 14 models across 6 labs, but the converter maintains the same 3-to-2
collapse: a single large model (`minimax-m2.7`) covers opus and sonnet tiers;
a fast model (`glm-5`) covers the haiku tier.

This collapse is an acceptable platform-level constraint. Claude Code tier
assignments govern behavior in Claude sessions (the primary runtime). OpenCode
uses the highest-benchmark available model for all non-haiku work.

### Why MiniMax M2.7 as the Default

MiniMax M2.7 is selected because it achieves the highest published SWE-Bench
score among OpenCode Go models (80.2%), significantly above the former
`zai-coding-plan/glm-5.1` (58.4%). It is accessible via the flat-rate OpenCode
Go subscription without per-token overage.

If a stronger model joins the OpenCode Go roster, update only `ConvertModel()`
in `apps/rhino-cli/internal/agents/converter.go` and re-run
`npm run sync:claude-to-opencode`. No agent files need manual editing.
```

## Regeneration Step

After all Go code changes are made and `rhino-cli` is rebuilt, run:

```bash
npm run sync:claude-to-opencode
```

This rebuilds `rhino-cli`, then calls `rhino-cli agents sync` which reads every
`.claude/agents/*.md`, calls `ConvertModel()` for each agent's `model` field,
and writes the result to `.opencode/agent/*.md`. The resulting files will contain
`opencode-go/minimax-m2.7` or `opencode-go/glm-5` throughout.

## Environment Setup for Developers

To use OpenCode Go locally:

1. Subscribe at [opencode.ai/go](https://opencode.ai/go)
2. Copy the API key from the OpenCode console
3. Set the environment variable:
   ```bash
   export OPENCODE_GO_API_KEY="<your-key>"
   ```
   Add to `~/.zshrc` or `~/.bashrc` for persistence. Do NOT add to `.env` in
   the repository — API keys are never committed.
4. Open OpenCode: run `/connect` in the TUI, select "OpenCode Go", paste the key
   (this populates the key in the OpenCode session; alternatively the env var
   is sufficient if `opencode.json` uses `{env:OPENCODE_GO_API_KEY}`)
5. Run `/models` to verify available model slugs match the values in
   `opencode.json`

## Risk Assessment

| Risk | Likelihood | Mitigation |
| ---- | ---------- | ---------- |
| Model slug differs from expected | Medium | Verify via `/models` before code changes |
| OpenCode Go beta service outage | Low | OpenCode Go has US/EU/SG PoPs; fallback to Claude Code |
| MiniMax M2.7 slower than GLM-5.1 | Low | Perplexity + Playwright are local/independent of model |
| Perplexity MCP doesn't start | Low | Already configured; test before committing |
| Test count changes with rename | Medium | Search all usages of old step constant before rename |
