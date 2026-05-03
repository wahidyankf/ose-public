# Technical Documentation

## Tool Overview

### caveman

**What it does**: ~75% output token reduction by compressing agent communication into terse caveman-speak. Code, URLs, and file paths are preserved byte-for-byte.

**How it works**: Drops articles, filler words, and hedging. Technical information remains intact. Based on academic research showing brevity improves accuracy.

**Supported agents**: Claude Code, Gemini CLI, Codex, Cursor, Windsurf, Cline, Copilot, **OpenCode**, and 30+ others.

**Version**: v1.7.0 (May 1, 2026)

**License**: MIT

**Key features**:

- `/caveman` — toggle compression in session
- `lite/full/ultra/wenyan` modes
- `/caveman-commit` — generate terse commit messages
- `/caveman-stats` — show token savings
- `/caveman-review` — one-line PR comments
- `cavecrew` — subagent coordination
- `caveman-shrink` — MCP middleware

### cavemem

**What it does**: Cross-agent persistent memory using SQLite + FTS5 + vector index. Uses deterministic caveman grammar compression (~75% fewer prose tokens).

**Supported agents**: Claude Code, Cursor, Gemini CLI, **OpenCode**, Codex explicitly listed.

**Version**: v0.1.3 (April 2026) — very early stage.

**License**: MIT

**Key differentiator**: Cross-agent memory — one store accessible from multiple IDEs. Compression via caveman grammar (not AI).

**MCP tools**:

- `search` — full-text search across observations
- `timeline` — chronological view of observations
- `get_observations` — retrieve stored context

## Actual Installation State (as of 2026-05-03)

### caveman — INSTALLED for OpenCode ✅

**Installation**: `npx -y skills add JuliusBrussee/caveman -a opencode -y`

Installed 8 skills to `.agents/skills/`:

- `caveman` — core compression skill
- `caveman-compress` — compress mode variant
- `caveman-commit` — terse commit messages
- `caveman-help` — help/usage
- `caveman-review` — PR review compression
- `caveman-stats` — token savings stats
- `cavecrew` — subagent coordination
- `compress` — alternative compress mode

**Verification**: `/caveman` command confirmed working via `opencode run "/caveman"`. Output: `Skill "caveman" — caveman mode on. full intensity active.`

### cavemem — INSTALLED and Operational ✅

**Actual setup**:

- Binary: `~/.volta/bin/cavemem`
- MCP server path: `~/.volta/tools/image/packages/cavemem/lib/node_modules/cavemem/dist/index.js`
- Config: `~/.opencode/config.json` with MCP server registration
- Status: `cavemem status` shows worker daemon running

## Installation for OpenCode

### caveman Installation

```bash
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash
```

The install script auto-detects all installed agents including OpenCode.

For OpenCode specifically (fallback if curl install doesn't auto-detect):

```bash
# Manual skill installation (fallback)
npx skills add JuliusBrussee/caveman -a opencode
```

### cavemem Installation

```bash
# Install cavemem globally via npm
npm install -g cavemem

# Configure for OpenCode
cavemem install --ide opencode
```

**Note**: cavemem v0.1.3 is early stage. Evaluate after caveman adoption is stable.

## Configuration

### caveman Modes

| Mode     | Description                    | Use Case                         |
| -------- | ------------------------------ | -------------------------------- |
| `lite`   | Minimal compression            | Debugging, verbose output needed |
| `full`   | Standard compression (default) | Most sessions                    |
| `ultra`  | Maximum compression            | Token-constrained sessions       |
| `wenyan` | Classical Chinese style        | Special creative contexts        |

### OpenCode Configuration

After installation, configure in `.claude/` (source of truth, auto-synced to `.opencode/`):

```json
{
  "caveman": {
    "mode": "full",
    "preserve": ["code", "urls", "paths"]
  }
}
```

## Available Commands

### Session Commands

| Command           | Description               |
| ----------------- | ------------------------- |
| `/caveman`        | Toggle compression on/off |
| `/caveman lite`   | Set lite mode             |
| `/caveman full`   | Set full mode             |
| `/caveman ultra`  | Set ultra mode            |
| `/caveman wenyan` | Set wenyan mode           |

### Git Integration

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `/caveman-commit` | Generate terse commit message |
| `/caveman-review` | Generate one-line PR comment  |

### Stats and Debug

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `/caveman-stats` | Show token savings since session start |

## Verification Procedures

### Verify caveman Installation

1. Start a new OpenCode session
2. Type `/caveman` in the chat
3. Verify help text is returned with available modes listed

Expected output:

```
caveman v1.7.0 — token compression tool
Modes: lite | full | ultra | wenyan
Usage: /caveman [mode]
```

### Verify Token Savings

1. Run a baseline session without caveman (disable if previously enabled)
2. Note approximate token count from session metadata
3. Enable caveman: `/caveman full`
4. Run a comparable session
5. Run `/caveman-stats` to see reduction

Expected: ~75% token reduction while code/URLs/paths remain unchanged.

### Verify Byte-for-Byte Preservation

1. Enable caveman: `/caveman full`
2. Send a message containing code blocks, URLs, and file paths
3. Verify all technical content is preserved exactly

Example test message:

```
Here's the file path: /Users/wkf/ose-projects/ose-public/apps/ayokoding-web/src/app/page.tsx

And the URL: https://github.com/JuliusBrussee/caveman

And the code:
function hello() {
  console.log("test");
}
```

Expected: Path, URL, and code are identical in the compressed output.

### Verify cavemem (Deferred)

1. Install cavemem
2. Store an observation in one IDE (Claude Code)
3. Search from OpenCode with the same query
4. Verify the observation is returned

Expected: Cross-agent memory access via shared SQLite store.

## Dependencies

- **Node.js**: Required for `npx skills add` installation
- **OpenCode**: Must be installed and configured
- **SQLite**: Required for cavemem (built-in to most systems)

## Ecosystem Context

caveman is part of a sibling ecosystem:

| Tool    | Purpose                            |
| ------- | ---------------------------------- |
| caveman | Token compression (~75% reduction) |
| cavemem | Cross-agent persistent memory      |
| cavekit | Spec-driven build tool             |

These are independent tools that can be adopted separately or together. This plan focuses on caveman (primary) and cavemem (secondary/deferred).

## References

- [caveman GitHub](https://github.com/JuliusBrussee/caveman) — v1.7.0, May 1, 2026
- [cavemem GitHub](https://github.com/JuliusBrussee/cavemem) — v0.1.3, April 2026
- [caveman research paper](https://arxiv.org/abs/2604.00025) — "Brevity Constraints Reverse Performance Hierarchies in Language Models" (April 2026)
