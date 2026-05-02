# CLAUDE.md

@AGENTS.md

## Claude-Code-Specific Notes

Guidance for Claude Code (claude.ai/code) working with code in this repository. All general content is in `AGENTS.md` above.

### Markdown Quality (Claude Code Hook)

In addition to the standard Prettier + markdownlint pipeline, a Claude Code hook auto-formats and lints after Edit/Write operations (requires `jq`).

### Working with .claude/ and .opencode/ Directories

Edit `.claude/` and `.opencode/` files with normal `Write` / `Edit` tools. Both paths pre-authorized in `.claude/settings.json` (`Write(.claude/**)`, `Edit(.claude/**)`, `Write(.opencode/**)`, `Edit(.opencode/**)`), no approval prompt fires. `Bash` heredoc and `sed` remain fine for bulk mechanical substitutions, but no rule against direct edits.

**Applies to all paths**:

- `.claude/agents/*.md` — agent definition files (Claude Code format)
- `.claude/skills/*/SKILL.md` — Agent Skill files (source of truth for both Claude Code AND OpenCode; OpenCode reads natively per [opencode.ai/docs/skills](https://opencode.ai/docs/skills/), no mirror)
- `.claude/skills/*/reference/*.md` — skill reference modules
- `.opencode/agents/*.md` — OpenCode agent mirrors (auto-synced from `.claude/agents/`)

**See**: [.claude/agents/README.md](./.claude/agents/README.md)

### Dual-Mode Configuration (Claude Code + OpenCode)

Repo maintains **dual compatibility** with Claude Code and OpenCode:

- **`.claude/`**: Source of truth (PRIMARY) — All updates happen here first
- **`.opencode/`**: Auto-generated (SECONDARY) — Synced from `.claude/`

**Making Changes:**

1. Edit agents/skills in `.claude/` first
2. Run sync: `npm run sync:claude-to-opencode`
3. Both systems stay synced automatically

**Format Differences:**

- **Tools**: Claude Code uses arrays `[Read, Write]`, OpenCode uses boolean flags `{ read: true, write: true }`
- **Models**: Claude Code uses `sonnet`/`opus`/`haiku` (or omits for budget-adaptive opus-inherit — intentional, not legacy); OpenCode uses `opencode-go/minimax-m2.7` (opus/sonnet/omitted) and `opencode-go/glm-5` (haiku). See [model-selection.md](./governance/development/agents/model-selection.md) for full tier mapping.
- **Skills**: NOT mirrored — OpenCode reads `.claude/skills/{name}/SKILL.md` natively per [opencode.ai/docs/skills](https://opencode.ai/docs/skills/). The validate:sync `No Synced Skill Mirror` check fails if a stale `.opencode/skill/` or `.opencode/skills/<claude-name>` mirror reappears.
- **Permissions**: Claude Code uses `settings.json` permissions, OpenCode uses `opencode.json` permission block (both configured with equivalent access)
- **Colors**: Claude Code agents use named colors (`blue`, `green`, `yellow`, `purple`, etc.) written by hand in `.claude/agents/*.md`. `rhino-cli agents sync` translates these to OpenCode theme tokens (`primary`, `success`, `warning`, `secondary`, etc.) when generating `.opencode/agents/*.md` — OpenCode 1.14.31+ rejects named colors. See [Dual-Mode Color Translation](./governance/development/agents/ai-agents.md#dual-mode-color-translation-claude-code-to-opencode) for the full mapping.
- **MCP/Plugins**: Claude Code uses plugins (Context7, Playwright, Nx, LSPs), OpenCode uses MCP servers (Playwright, Nx, Perplexity)

**Security Policy**: Only use skills from trusted sources. All skills in this repo maintained by project team.

**See**: [.claude/agents/README.md](./.claude/agents/README.md)

### organiclever-web Skill

The organiclever-web content development skill is at [.claude/skills/apps-organiclever-web-developing-content/SKILL.md](./.claude/skills/apps-organiclever-web-developing-content/SKILL.md).

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring workspace, invoke `nx-workspace` skill first - has patterns for querying projects, targets, and deps
- When running tasks (build, lint, test, e2e, etc.), prefer running through `nx` (`nx run`, `nx run-many`, `nx affected`) instead of underlying tooling directly
- Prefix nx commands with workspace package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to Nx MCP server and its tools, use them
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin config, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you know
- `nx-generate` skill handles generator discovery internally - don't call nx_docs to look up generator syntax

<!-- nx configuration end-->

<!-- rtk-instructions v2 -->

# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has dedicated filter, uses it. If not, passes through unchanged. RTK always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## Meta Commands

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze Claude Code history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

Full command reference with all workflows and savings: <https://github.com/rtk-ai/rtk>

<!-- /rtk-instructions -->
