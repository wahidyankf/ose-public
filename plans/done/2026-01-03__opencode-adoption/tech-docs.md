# Technical Documentation: OpenCode Adoption

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Repository Configuration                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────┐         ┌─────────────────────┐               │
│  │    Claude Code      │         │     OpenCode        │               │
│  ├─────────────────────┤         ├─────────────────────┤               │
│  │ .claude/            │         │ .opencode/          │               │
│  │   settings.json     │         │   agent/            │               │
│  │   settings.local    │         │   plugin/           │               │
│  │   agents/*.md       │         │   skill/            │               │
│  │   skills/*/SKILL.md │◄───────►│                     │               │
│  │                     │ shared! │ opencode.json       │               │
│  │ .mcp.json           │         │                     │               │
│  │ CLAUDE.md           │         │ AGENTS.md           │               │
│  └─────────────────────┘         └─────────────────────┘               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Shared Infrastructure                         │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  .claude/skills/*/SKILL.md  ─────► Both tools read skills       │   │
│  │  MCP Servers (Playwright, Context7)  ─► Both can connect        │   │
│  │  Project conventions  ─────────────────► Defined in both .md    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Configuration Mapping

### Model Configuration

| Setting          | Claude Code            | OpenCode                                     |
| ---------------- | ---------------------- | -------------------------------------------- |
| Default model    | Configured in settings | `model` in opencode.json (GLM-4.7)           |
| Fast model       | -                      | `small_model` in opencode.json (GLM-4.5-Air) |
| Provider         | Anthropic              | Z.AI (Zhipu AI)                              |
| Provider timeout | -                      | `provider.*.options.timeout`                 |

**Claude Code** (implicit from environment/settings):

```json
// No explicit model config in settings.json
// Model selection via CLI or Anthropic account
```

**OpenCode** (opencode.json) - **GLM-4.7 Configuration**:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "zai/glm-4.7",
  "small_model": "zai/glm-4.5-air",
  "provider": {
    "zai": {
      "options": {
        "timeout": 600000
      }
    }
  }
}
```

**Why GLM-4.7?**

1. **Cost Efficiency**: 8.6x-20x cheaper than Claude Sonnet 4.5
2. **Performance**: 90.6% tool calling success (vs Claude's 89.5%)
3. **Speed**: 20-30% faster response times
4. **Math**: 95.7% accuracy on AIME 2025
5. **Quality**: Outperforms GPT-5.1 and Claude 4.5 on several benchmarks

**Z.AI Provider Setup**:

1. Create account at <https://bigmodel.cn/>
2. Generate API key from console
3. Run `/connect` in OpenCode, select **Z.AI**
4. Run `/models` to select GLM-4.7

### MCP Server Configuration

**SECURITY REQUIREMENT**: MCP servers requiring API keys must be configured in local/global config only. NEVER commit API keys to the repository.

**Repository Configuration** (safe to commit):

- **Playwright MCP** - Browser automation (no API key required)
- **Context7 MCP** - Documentation lookup (no API key required)

**Local/Global Configuration** (requires API keys, configure locally):

- **Z.AI Vision MCP** - UI analysis, OCR, diagrams (requires Z.AI API key)
- **Z.AI Web Search MCP** - Real-time web search (requires Z.AI API key)
- **Z.AI Web Reader MCP** - Web content fetching (requires Z.AI API key)
- **Z.AI Zread MCP** - GitHub repository integration (requires Z.AI API key)

**Z.AI API Key Setup** (for enhanced capabilities):

1. Get API key from: <https://bigmodel.cn/>
2. Configure in local/global config (NEVER commit to repository)

#### Local Configuration: Z.AI MCP Servers (Enhanced Capabilities)

**1. Vision MCP Server** - `@z_ai/mcp-server` (GLM-4.6V multimodal)

**Tools**: `ui_to_artifact`, `extract_text_from_screenshot`, `diagnose_error_screenshot`, `understand_technical_diagram`, `analyze_data_visualization`, `ui_diff_check`, `image_analysis`, `video_analysis`

**Claude Code** (configure in `~/.config/claude-code/mcp.json` global or `.claude/settings.local.json` local):

```json
{
  "mcpServers": {
    "zai-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@z_ai/mcp-server"],
      "env": {
        "Z_AI_API_KEY": "your_actual_api_key",
        "Z_AI_MODE": "ZAI"
      }
    }
  }
}
```

**OpenCode** (configure in global or local opencode config, NOT in repository):

```json
{
  "mcp": {
    "zai-mcp-server": {
      "type": "local",
      "command": ["npx", "-y", "@z_ai/mcp-server"],
      "environment": {
        "Z_AI_API_KEY": "your_actual_api_key",
        "Z_AI_MODE": "ZAI"
      }
    }
  }
}
```

**2. Web Search MCP Server** - Real-time web search

**Tools**: `webSearchPrime`

**Claude Code** (configure in `~/.config/claude-code/mcp.json` global or `.claude/settings.local.json` local):

```json
{
  "mcpServers": {
    "web-search-prime": {
      "type": "http",
      "url": "https://api.z.ai/api/mcp/web_search_prime/mcp",
      "headers": {
        "Authorization": "Bearer your_actual_api_key"
      }
    }
  }
}
```

**OpenCode** (configure in global or local opencode config, NOT in repository):

```json
{
  "mcp": {
    "web-search-prime": {
      "type": "remote",
      "url": "https://api.z.ai/api/mcp/web_search_prime/mcp",
      "headers": {
        "Authorization": "Bearer your_actual_api_key"
      }
    }
  }
}
```

**3. Web Reader MCP Server** - Fetch webpage content (markdown)

**Tools**: `webReader`

**Claude Code** (configure in `~/.config/claude-code/mcp.json` global or `.claude/settings.local.json` local):

```json
{
  "mcpServers": {
    "web-reader": {
      "type": "http",
      "url": "https://api.z.ai/api/mcp/web_reader/mcp",
      "headers": {
        "Authorization": "Bearer your_actual_api_key"
      }
    }
  }
}
```

**OpenCode** (configure in global or local opencode config, NOT in repository):

```json
{
  "mcp": {
    "web-reader": {
      "type": "remote",
      "url": "https://api.z.ai/api/mcp/web_reader/mcp",
      "headers": {
        "Authorization": "Bearer your_actual_api_key"
      }
    }
  }
}
```

**4. Zread MCP Server** - GitHub repository integration

**Tools**: `search_doc`, `get_repo_structure`, `read_file`

**Claude Code** (configure in `~/.config/claude-code/mcp.json` global or `.claude/settings.local.json` local):

```json
{
  "mcpServers": {
    "zread": {
      "type": "http",
      "url": "https://api.z.ai/api/mcp/zread/mcp",
      "headers": {
        "Authorization": "Bearer your_actual_api_key"
      }
    }
  }
}
```

**OpenCode** (configure in global or local opencode config, NOT in repository):

```json
{
  "mcp": {
    "zread": {
      "type": "remote",
      "url": "https://api.z.ai/api/mcp/zread/mcp",
      "headers": {
        "Authorization": "Bearer your_actual_api_key"
      }
    }
  }
}
```

#### Repository MCP Servers (Safe to Commit)

**Claude Code** (.mcp.json - repository level):

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  }
}
```

**OpenCode** (opencode.json - repository level, safe to commit):

```json
{
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "@playwright/mcp@latest"],
      "enabled": true
    },
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@context7/mcp-server"],
      "enabled": true
    }
  }
}
```

**IMPORTANT**: Z.AI MCP servers must be configured in local/global config only. See "Local Configuration: Z.AI MCP Servers" section above for setup instructions.

#### Complete Configuration Summary

**Repository Configuration** (opencode.json - safe to commit):

- Model: GLM-4.7 with Z.AI provider
- MCP Servers: Playwright, Context7 (no API keys required)

**Local/Global Configuration** (optional, for enhanced capabilities):

- Z.AI MCP Servers: Vision, Web Search, Web Reader, Zread (requires API key)
- See "Local Configuration: Z.AI MCP Servers" section above for setup instructions

### Key Differences

| Aspect         | Claude Code              | OpenCode               |
| -------------- | ------------------------ | ---------------------- |
| Command format | `command` + `args` array | Single `command` array |
| Type values    | `stdio`                  | `local` / `remote`     |
| Enable toggle  | Not present              | `enabled: true/false`  |
| Environment    | `env` object             | `environment` object   |
| Authentication | Manual                   | OAuth auto-detection   |

### Tool Permissions

**Claude Code** (.claude/settings.json):

```json
{
  "enableAllProjectMcpServers": true,
  "enabledPlugins": {
    "playwright@claude-plugins-official": true,
    "context7@claude-plugins-official": true
  }
}
```

**OpenCode** (opencode.json):

```json
{
  "tools": {
    "bash": true,
    "read": true,
    "write": true,
    "edit": true,
    "grep": true,
    "glob": true,
    "webfetch": true,
    "todowrite": true,
    "skill": true
  },
  "permission": {
    "bash": "allow",
    "write": "allow",
    "edit": "allow"
  }
}
```

## Skills and Agents Compatibility Analysis

### CRITICAL: Naming Convention Issues

**Both Claude Code AND OpenCode enforce the same naming rules for skills AND agents:**

| Type   | Tool        | Regex Pattern              | Underscores Allowed? |
| ------ | ----------- | -------------------------- | -------------------- |
| Skills | Claude Code | `[a-z0-9-]{1,64}`          | **NO**               |
| Skills | OpenCode    | `^[a-z0-9]+(-[a-z0-9]+)*$` | **NO**               |
| Agents | Claude Code | `[a-z0-9-]+`               | **NO**               |
| Agents | OpenCode    | `^[a-z0-9]+(-[a-z0-9]+)*$` | **NO**               |

**Impact**: 65 files total need renaming (19 skills + 46 agents)

### CRITICAL: Skill Naming Issue (19 files)

**Current skill names are INVALID:**

- `docs__applying-content-quality` ❌ (double underscore)
- `apps__ayokoding-web__developing-content` ❌ (multiple underscores)
- `wow__understanding-repository-architecture` ❌ (underscore)

**Required new names (SINGLE hyphen -, NOT double hyphen --):**

- `docs-applying-content-quality` ✓ (replace `__` with single `-`)
- `apps-ayokoding-web-developing-content` ✓ (replace all `__` with single `-`)
- `wow-understanding-repository-architecture` ✓ (replace `__` with single `-`)

**INVALID new names (consecutive hyphens not allowed):**

- `docs--applying-content-quality` ❌ (double hyphen)
- `apps--ayokoding-web--developing-content` ❌ (multiple double hyphens)

### Format Comparison

**Claude Code SKILL.md** (required format):

```yaml
---
name: domain-skill-name # HYPHENS ONLY, must match directory
description: Skill description for auto-loading (1-64 chars)
allowed-tools: [Read, Write, Edit] # Optional
---
# Skill Content
```

**OpenCode SKILL.md** (compatible format):

```yaml
---
name: domain-skill-name # HYPHENS ONLY, must match directory
description: Skill description (1-1024 chars)
license: MIT # Optional
---
# Skill Content
```

### Discovery Locations

OpenCode searches these locations (in order):

1. `.opencode/skill/<name>/SKILL.md` (project-local, highest priority)
2. **`.claude/skills/<name>/SKILL.md`** (Claude-compatible project format) ✓
3. `~/.config/opencode/skill/<name>/SKILL.md` (global)
4. `~/.claude/skills/<name>/SKILL.md` (Claude-compatible global)

**Key Finding**: OpenCode natively supports `.claude/skills/` directory - skills WILL work once renamed.

### Skill Renaming Strategy

**Step 1**: Rename all 18 skill directories

```bash
# Example for one skill
mv .claude/skills/docs__applying-content-quality .claude/skills/docs-applying-content-quality
```

**Step 2**: Update SKILL.md `name` field in each

```yaml
# Before
name: docs__applying-content-quality

# After
name: docs-applying-content-quality
```

**Step 3**: Update all references in:

- Agent files (`.claude/agents/*.md`) - `skills:` field
- Documentation files
- CLAUDE.md
- Skills README.md

### CRITICAL: Agent Naming Issue (46 files) ⚠️ **HIGHER IMPACT**

**Current agent names are INVALID (same rules as skills):**

| Current Name (INVALID)                  | Required Name (VALID)                      |
| --------------------------------------- | ------------------------------------------ |
| `docs__checker.md`                      | `docs-checker.md`                          |
| `apps__ayokoding-web__general-maker.md` | `apps-apps-ayokoding-web-general-maker.md` |
| `wow__workflow-checker.md`              | `repo-workflow-checker.md`                 |
| `plan__executor.md`                     | `plan-executor.md`                         |
| `agent__maker.md`                       | `agent-maker.md`                           |

**Impact Assessment:**

- **Scope**: 46 agent files (more than double the 19 skill files)
- **Criticality**: HIGHER than skills - agents are core automation infrastructure
- **Dependencies**: Agent renaming affects:
  - Agent filenames (`.claude/agents/*.md`)
  - Agent frontmatter `name:` fields
  - **Workflow agent references** (all `.claude/workflows/*.md` files)
  - `.claude/agents/README.md`
  - CLAUDE.md agent listings
  - Documentation mentioning agent names

**Why This Is More Critical Than Skills:**

1. **Workflow Dependencies**: Workflows reference agents by name - ALL workflows must be updated
2. **Invocation Frequency**: Agents are invoked more frequently than skills
3. **Core Automation**: Agents are the primary automation mechanism
4. **Cross-References**: Agents have more cross-references than skills

### Agent Renaming Strategy

**Step 1**: Rename all 46 agent files

```bash
# Rename using git mv to preserve history
for agent in .claude/agents/*__*.md; do
  newname=$(echo "$agent" | sed 's/__/-/g')
  git mv "$agent" "$newname"
done
```

**Step 2**: Update agent frontmatter `name:` fields

```bash
# Update name field in each agent file
for agent in .claude/agents/*.md; do
  sed -i 's/^name: .*__/name: /' "$agent" | sed 's/__/-/g'
done
```

**Step 3**: Update all workflow agent references

```bash
# Find all workflow files and update agent references
for workflow in .claude/workflows/*.md; do
  # Update agent references in workflow frontmatter
  sed -i 's/agent: [a-z]*__/agent: /' "$workflow" | sed 's/__/-/g'
  # Update agent references in workflow steps
  sed -i 's/subagent_type: [a-z]*__/subagent_type: /' "$workflow" | sed 's/__/-/g'
done
```

**Step 4**: Update all references in:

- `.claude/agents/README.md` (agent index)
- CLAUDE.md (agent descriptions)
- Documentation files mentioning agents
- Plan files referencing agent names

**Step 5**: Validate with comprehensive checks

```bash
# Validate no underscores remain
find .claude/agents -name "*_*" | grep -v README.md

# Validate no consecutive hyphens
find .claude/agents -name "*--*"

# Validate agent count is correct
ls -1 .claude/agents/*.md | wc -l  # Should be 46

# Validate workflows reference correct names
grep -h "subagent_type:" .claude/workflows/*.md | grep "__"  # Should return empty
```

## Agent Format Translation

### Claude Code Agent Format

```yaml
---
name: agent__maker
description: Creates new AI agents following conventions
tools: [Read, Glob, Grep, Bash]
model: sonnet
color: blue
skills:
  - agent__developing-agents
---
# Agent prompt content...
```

### OpenCode Agent Format

```yaml
---
description: Creates new AI agents following conventions
mode: primary
model: anthropic/claude-sonnet-4-5
temperature: 0.7
tools:
  read: true
  glob: true
  grep: true
  bash: true
permission:
  bash: "ask"
---
# Agent prompt content...
```

### Key Differences

| Aspect       | Claude Code             | OpenCode                      |
| ------------ | ----------------------- | ----------------------------- |
| Location     | `.claude/agents/`       | `.opencode/agent/`            |
| Name field   | Required in frontmatter | Filename-based                |
| Model format | `sonnet`                | `anthropic/claude-sonnet-4-5` |
| Tools format | Array of names          | Object with booleans          |
| Permissions  | Not in frontmatter      | `permission` object           |
| Modes        | Not present             | `mode: primary/subagent`      |
| Temperature  | Not present             | `temperature: 0.0-1.0`        |
| Color        | Present                 | Not present                   |
| Skills       | `skills` array          | Not present (separate)        |

### Translation Strategy

For high-priority agents, create OpenCode equivalents:

```
.opencode/agent/
├── agent-maker.md          # Translated from agent__maker
├── docs-maker.md           # Translated from docs__maker
└── plan-executor.md        # Translated from plan__executor
```

## Instructions File Strategy

### Current Status

| File      | Claude Code Support              | OpenCode Support |
| --------- | -------------------------------- | ---------------- |
| CLAUDE.md | ✓ Native                         | ✗ Not read       |
| AGENTS.md | ✗ Not native (workarounds exist) | ✓ Native         |

**Key Finding**: Claude Code does NOT officially support AGENTS.md (issue #6235 with 1,615+ upvotes is open). OpenCode does NOT read CLAUDE.md.

### CLAUDE.md (Existing - Keep)

- Comprehensive 35KB+ document
- Six-layer governance architecture
- All conventions and development practices
- Agent and workflow documentation
- Navigation links to detailed docs
- **Keep as-is for Claude Code**

### AGENTS.md (New - Create)

Purpose: Provide essential guidance for OpenCode (and 25+ other AGENTS.md-compatible tools)

Strategy:

1. **Concise summary** of project structure and conventions
2. **Reference CLAUDE.md** for comprehensive details
3. **Focus on actionable guidance** for AI coding agents
4. **~5-10KB target size** (not a duplication of CLAUDE.md)

### Workaround for Claude Code to Read AGENTS.md

Add to CLAUDE.md:

```markdown
@AGENTS.md
```

This loads AGENTS.md content into Claude Code context (community workaround with 200+ upvotes).

### Symlink Strategies (Research Findings)

#### Option A: AGENTS.md as Primary (Industry Standard)

```bash
# Rename CLAUDE.md to AGENTS.md, create symlink
mv CLAUDE.md AGENTS.md
ln -s AGENTS.md CLAUDE.md

# Add to .gitignore
echo "CLAUDE.md" >> .gitignore
echo "**/CLAUDE.md" >> .gitignore
```

**Pros**: Industry standard, single source of truth, 25+ tools support AGENTS.md
**Cons**: Requires restructuring our comprehensive CLAUDE.md

#### Option B: Separate Files (Recommended for This Project)

Keep CLAUDE.md as-is, create condensed AGENTS.md:

```bash
# Keep CLAUDE.md unchanged
# Create new AGENTS.md with essential guidance
# Both files committed to git
```

**Pros**: No disruption to existing Claude Code setup, AGENTS.md tailored for OpenCode
**Cons**: Two files to maintain (but AGENTS.md is condensed, low maintenance)

#### Option C: AGENTS.md → CLAUDE.md Reference

```markdown
# In AGENTS.md

@CLAUDE.md
```

**Pros**: Single source in CLAUDE.md
**Cons**: OpenCode doesn't support `@` imports (Claude Code only)

### Recommendation for This Project

**Use Option B (Separate Files)** because:

1. Our CLAUDE.md is 35KB+ with comprehensive project-specific content
2. CLAUDE.md includes agent definitions, workflows, and governance architecture
3. OpenCode needs simpler, more focused guidance
4. Minimal maintenance burden (AGENTS.md is ~5-10KB condensed version)

### Cross-Platform Symlink Considerations

If using symlinks in the future:

**Linux/macOS**:

```bash
ln -s AGENTS.md CLAUDE.md
```

**Windows (requires Admin or Developer Mode)**:

```cmd
mklink CLAUDE.md AGENTS.md
```

**Git Configuration** (for cross-platform repos):

```gitattributes
# .gitattributes
CLAUDE.md symlink=true
```

**Setup Script** (for team consistency):

```bash
#!/bin/bash
# utils/setup-symlinks.sh
find . -name "AGENTS.md" | while read f; do
  dir=$(dirname "$f")
  rm -f "$dir/CLAUDE.md"
  ln -s AGENTS.md "$dir/CLAUDE.md"
done
```

### Proposed AGENTS.md Structure

```markdown
# AGENTS.md

## Project Overview

Open Sharia Enterprise - democratizing Shariah-compliant enterprise through
open-source solutions. See [Vision](governance/vision/ex-vi__open-sharia-enterprise.md).

## Quick Reference

- **Node.js**: 24.11.1, **npm**: 11.6.3 (Volta-managed)
- **Monorepo**: Nx with apps/ and libs/
- **Commits**: Conventional Commits required
- **Git**: Trunk Based Development on main branch

## Repository Architecture

Six-layer governance hierarchy:

1. **Vision** (Layer 0) - WHY we exist
2. **Principles** (Layer 1) - Foundational values (10 principles)
3. **Conventions** (Layer 2) - Documentation rules (24 conventions)
4. **Development** (Layer 3) - Software practices (15 practices)
5. **Agents** (Layer 4) - AI task executors (40+ agents)
6. **Workflows** (Layer 5) - Multi-step processes

See [Repository Architecture](governance/repository-governance-architecture.md).

## Key Conventions

- Documentation follows Diátaxis framework (tutorials, how-to, reference, explanation)
- All code follows functional programming principles
- File naming: `[prefix]__[content-identifier].[extension]`
- Markdown: Active voice, single H1, proper heading hierarchy

## File Structure

- `apps/` - Deployable applications
- `libs/` - Reusable libraries
- `docs/` - Documentation (Diátaxis framework)
- `.claude/agents/` - AI agent definitions
- `.claude/skills/` - Reusable skill packages
- `plans/` - Project planning (backlog/, in-progress/, done/)

## Skills Available

19 skills in .claude/skills/ covering content creation, quality assurance,
standards application, and process execution. Skills auto-load based on task.

## For Comprehensive Details

See CLAUDE.md for complete documentation including detailed conventions,
development practices, agent definitions, and workflow patterns.
```

## Proposed opencode.json

```json
{
  "$schema": "https://opencode.ai/config.json",

  "model": "zai/glm-4.7",
  "small_model": "zai/glm-4.5-air",

  "provider": {
    "zai": {
      "options": {
        "timeout": 600000
      }
    }
  },

  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "@playwright/mcp@latest"],
      "enabled": true
    },
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@context7/mcp-server"],
      "enabled": true
    }
  },

  "tools": {
    "bash": true,
    "read": true,
    "write": true,
    "edit": true,
    "grep": true,
    "glob": true,
    "list": true,
    "patch": true,
    "webfetch": true,
    "todowrite": true,
    "todoread": true,
    "skill": true
  },

  "permission": {
    "bash": "allow",
    "write": "allow",
    "edit": "allow"
  },

  "instructions": ["AGENTS.md", "governance/conventions/README.md", "governance/development/README.md"],

  "tui": {
    "scroll_speed": 3,
    "diff_style": "auto"
  },

  "autoupdate": "notify",
  "share": "disabled"
}
```

**Configuration Notes**:

- **GLM-4.7**: Primary model for complex tasks (8.6x-20x cheaper than Claude Sonnet)
- **GLM-4.5-Air**: Fast model for quick operations (lightweight and responsive)
- **Z.AI Provider**: Fully supported in OpenCode via `/connect` command
- **Z.AI API Key**: Optional, for enhanced capabilities - configure in local/global config only (NEVER in repository)
- **Cost Savings**: Significant reduction in API costs compared to Claude models

**MCP Servers Summary**:

**Repository Configuration** (opencode.json - safe to commit):

| MCP Server   | Type          | Purpose              | API Key Required |
| ------------ | ------------- | -------------------- | ---------------- |
| `playwright` | local (stdio) | Browser automation   | No               |
| `context7`   | local (stdio) | Documentation lookup | No               |

**Local/Global Configuration** (optional, for enhanced capabilities):

| MCP Server         | Type          | Purpose                                     | API Key Required |
| ------------------ | ------------- | ------------------------------------------- | ---------------- |
| `zai-mcp-server`   | local (stdio) | Vision understanding (GLM-4.6V multimodal)  | Yes (Z.AI)       |
| `web-search-prime` | remote (HTTP) | Real-time web search                        | Yes (Z.AI)       |
| `web-reader`       | remote (HTTP) | Web page content fetching (markdown)        | Yes (Z.AI)       |
| `zread`            | remote (HTTP) | GitHub repo search, structure, file reading | Yes (Z.AI)       |

**Security**: Z.AI MCP servers must be configured in local/global config only. See "Local Configuration: Z.AI MCP Servers" section for setup instructions.

## File Structure After Implementation

```
open-sharia-enterprise/
├── CLAUDE.md                    # Claude Code instructions (existing)
├── AGENTS.md                    # OpenCode instructions (new)
├── opencode.json                # OpenCode configuration (new)
├── .mcp.json                    # Claude Code MCP (may exist)
├── .claude/
│   ├── settings.json            # Claude settings (existing)
│   ├── settings.local.json      # Personal settings (gitignored)
│   ├── agents/                  # Claude agents (existing, 40+)
│   │   └── *.md
│   └── skills/                  # Skills (existing, shared, 18)
│       └── */SKILL.md
├── .opencode/                   # OpenCode-specific (new)
│   ├── agent/                   # OpenCode agents (optional)
│   │   └── *.md
│   └── plugin/                  # OpenCode plugins (optional)
└── ...
```

## Testing Plan

### Phase 1: Skills Compatibility

```bash
# Install OpenCode
npm install -g @opencode/cli

# Test skill discovery
opencode
# In TUI: Check if skills are listed

# Test skill invocation
# Ask OpenCode to use a specific skill
```

### Phase 2: Configuration Validation

```bash
# Validate JSON schema
npx ajv validate -s https://opencode.ai/config.json -d opencode.json

# Start OpenCode and verify:
# 1. Model is correct
# 2. MCP servers connect
# 3. Tools are available
```

### Phase 3: Functional Testing

Test each key workflow:

1. Create documentation (uses skills)
2. Run bash commands (tool permissions)
3. Browser automation (MCP servers)
4. Library docs lookup (Context7 MCP)

### Phase 4: Regression Testing

Verify Claude Code still works:

```bash
claude
# Test existing workflows
# Verify agents load
# Check MCP connections
```

## Maintenance Considerations

### Updates to Sync

When updating Claude Code configuration:

- [ ] Update AGENTS.md if CLAUDE.md changes significantly
- [ ] Update opencode.json if MCP servers change
- [ ] Test OpenCode after significant changes

When updating OpenCode configuration:

- [ ] Ensure changes don't conflict with Claude Code
- [ ] Document OpenCode-specific settings

### Automated Validation

Consider extending `wow__rules-checker` to:

- Verify opencode.json is valid
- Check AGENTS.md references are correct
- Detect configuration drift between tools
