---
description: "Defines the multi-harness directory structure, source-of-truth hierarchy, and format differences across the three supported coding-agent harnesses."
when_to_use: Use when checking which directory is the source of truth for an agent or Skill change, or how its format differs per harness.
---

# Multi-Harness Binding Operation — Directory Structure and Format Differences

**Added**: 2026-01-16

This repository maintains **multi-harness compatibility** across multiple AI coding agent platforms.
Canonical agents and skills live under `.claude/`; `repo-config.yml` assigns ownership per path.
Secondary roots mix generated mirrors with vendored configuration or plugin payloads, so the binding
generator changes only paths or delimited regions declared as generated.

## Directory Structure

```binding-example
.
├── .claude/                 # Source binding
│   ├── agents/             # canonical Markdown/YAML agents
│   ├── skills/             # canonical skills
│   └── settings.json       # hand-authored permissions and hooks
├── .opencode/              # Mixed-ownership OpenCode root
│   ├── agents/             # generated Markdown/YAML agents
│   └── opencode.json       # vendored configuration
├── .codex/                 # Mixed-ownership Codex root
│   ├── agents/             # generated TOML agents
│   └── config.toml         # vendored file; agent-table region is generated
└── .agents/                # Mixed-ownership cross-harness skills root
    └── skills/             # generated mirror plus declared vendored plugin subtrees
```

## Source of Truth Hierarchy

`.claude/agents/` and `.agents/skills/` are the canonical sources for their generated mirrors.
`repo-config.yml` is authoritative for path-level ownership; a more-specific vendored declaration
overrides a generated parent. Vendored configuration and plugin paths are maintained in place.

**Making Changes**:

1. Edit an agent in `.claude/agents/` or a mirrored skill in `.agents/skills/`.
2. Run `./rhino harness adapters generate`, then `./rhino harness adapters validate`.
3. Commit every changed generated mirror in the same commit as its source.
4. Edit a vendored path directly only when `repo-config.yml` classifies that exact path or a
   more-specific ancestor as vendored.

**Rationale**: Single source of truth prevents conflicts, ensures consistency, simplifies maintenance.

## Format Differences

The canonical agent files and one generated agent surface use Markdown with YAML frontmatter. The
other generated agent surface uses TOML; the generator translates canonical metadata and body into
each target format.

### Tools Format

```binding-example
Claude Code (.claude/agents/) — PRIMARY:
  tools: [Read, Write, Edit, Glob, Grep, Bash]
  (array format with capitalized tool names)

OpenCode (.opencode/agents/) — SECONDARY:
  permission:
    read: allow
    write: allow
    edit: allow
    glob: allow
    grep: allow
    bash: allow
  (permission object, nested YAML — current OpenCode convention;
  the historical boolean flags format `tools: { read: true, … }` is
  deprecated/legacy and no longer emitted)

Codex (.codex/agents/) — SECONDARY:
  name = "agent-name"
  description = "..."
  model = "gpt-5.6-terra"
  model_reasoning_effort = "xhigh"
  developer_instructions = """..."""
  (TOML; canonical tool frontmatter is not emitted — Codex governs
   tool access through sandbox and approval policy, not per agent)
```

### Model References

```binding-example
Claude Code:
  model: fable   # ultra
  model: opus    # planning-grade
  model: sonnet  # execution-grade
  model: haiku   # fast
  # a blank model: is not a grade — always declare one

OpenCode:
  # no model key at any grade — the developer's active OpenCode model applies

Codex:
  model = "gpt-6-astra"   # ultra
  model = "gpt-5.6-sol"   # planning-grade
  model = "gpt-5.6-terra" # execution-grade
  model = "gpt-5.6-luna"  # fast
  # inherit and pinned vendor IDs emit no model key at all
```

### Agent skills format

Every registry-declared skill surface uses the same canonical `SKILL.md` format:

```yaml
---
name: skill-name
description: Brief description
context: inline # optional; defaults to inline
---
# Skill Name
Content...
```

**Required fields**: `name` (must match directory name), `description`
**Optional fields**: `context` (inline or fork)

Agent skills need no format conversion when a registry-declared binding reads
`.agents/skills/{name}/SKILL.md` natively. The binding generator also mirrors canonical
`.agents/skills/` content byte-for-byte to registry-declared generated skill directories while
preserving directories that `repo-config.yml` explicitly classifies as vendored.
