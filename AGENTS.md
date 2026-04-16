# AGENTS.md

> ⚠️ **IMPORTANT**: This file documents `.opencode/` configuration which is **AUTO-GENERATED** from `.claude/` (source of truth).
>
> **To make changes**:
>
> 1. Edit agents/skills in `.claude/` directory
> 2. Run: `npm run sync:claude-to-opencode`
> 3. Changes will be synced to `.opencode/` automatically
>
> **See [CLAUDE.md](./CLAUDE.md) for primary documentation** (Claude Code configuration).

**Problem**: Maintaining quality and consistency across many specialized agents, skills, and extensive documentation is time-consuming and error-prone when done manually.

**Solution**: This repository uses specialized AI (Artificial Intelligence) agents that automate documentation creation, validation, content generation, and project planning—ensuring consistent quality, catching errors early, and freeing developers to focus on high-value work.

---

Instructions for AI agents working with this repository via OpenCode.

## Project Overview

**open-sharia-enterprise** - Enterprise platform built with Node.js, using **Nx monorepo** structure.

- **Node.js**: 24.13.1 (LTS - Long-Term Support, managed by Volta)
- **npm**: 11.10.1
- **Monorepo**: Nx with `apps/` and `libs/` structure
- **Git Workflow**: Trunk Based Development (default: commit and push directly to `main`). **Worktree exception**: any work performed inside a `git worktree add` path -- including agents using `isolation: "worktree"` and agents invoked inside an existing worktree session -- must push to a feature branch and open a **draft** PR targeting `main` (`gh pr create --draft`), not push to `main` directly. The draft is flipped to ready for review when the author decides the work is complete; that flip is the moment the [PR Merge Protocol](./governance/development/workflow/pr-merge-protocol.md) approval gate fires. See the [Trunk Based Development Convention](./governance/development/workflow/trunk-based-development.md#worktree-mode-branch--draft-pr) for details.
- **Worktree toolchain init**: After creating or entering a worktree, agents must run BOTH `npm install` AND `npm run doctor -- --fix` in the root repository worktree, in that order. The `package.json` `postinstall` hook runs `npm run doctor || true` which silently tolerates toolchain drift, so the explicit `doctor --fix` invocation is required to converge the 18+ polyglot toolchains (Go, Java, Rust, Elixir, Python, .NET, Dart, Clojure, Kotlin, C#, Node). See [Worktree Toolchain Initialization](./governance/development/workflow/worktree-setup.md) for the full rationale and procedure.

## Dual-Mode Configuration

This repository maintains **dual compatibility** with both Claude Code and OpenCode:

- **`.claude/`**: Source of truth (PRIMARY) - Edit here first
- **`.opencode/`**: Auto-generated (SECONDARY) - Synced from `.claude/`

**Sync Command**: `npm run sync:claude-to-opencode`

**Format Differences**:

- **Tools**: Claude Code uses arrays `[Read, Write]`, OpenCode uses `{ read: true, write: true }`
- **Models**: Claude Code uses `sonnet`/`haiku`, OpenCode uses `zai-coding-plan/glm-5.1` or `zai-coding-plan/glm-5-turbo`
- **Skills**: Same format for both systems (SKILL.md)
- **Permissions**: Claude Code uses `settings.json`, OpenCode uses `opencode.json` permission block (equivalent access configured)
- **MCP/Plugins**: Claude Code uses plugins, OpenCode uses MCP servers (Playwright, Nx, Z.ai, Perplexity)

# AI Agents

## Agent Organization

Specialized agents organized into families:

1. **Documentation**: `docs-maker`, `docs-checker`, `docs-fixer`, `docs-tutorial-maker`, `docs-tutorial-checker`, `docs-tutorial-fixer`, `docs-link-general-checker`, `docs-file-manager`, `docs-software-engineering-separation-checker`, `docs-software-engineering-separation-fixer`
2. **README**: `readme-maker`, `readme-checker`, `readme-fixer`
3. **Project Planning**: `plan-maker`, `plan-checker`, `plan-executor`, `plan-execution-checker`, `plan-fixer`
4. **AyoKoding Web Content**: Bilingual content creators, validators, deployers (includes in-the-field agents: `apps-ayokoding-web-in-the-field-maker`, `apps-ayokoding-web-in-the-field-checker`, `apps-ayokoding-web-in-the-field-fixer`)
5. **Web Content - oseplatform-web**: Landing page content creators, validators, deployers (migrated from Hugo to Next.js 16)
6. **Software Engineering & Specialized**: `agent-maker`, `swe-code-checker`, `swe-ui-maker`, `swe-ui-checker`, `swe-ui-fixer`, `swe-clojure-dev`, `swe-csharp-dev`, `swe-dart-dev`, `swe-e2e-test-dev`, `swe-elixir-dev`, `swe-fsharp-dev`, `swe-golang-dev`, `swe-hugo-dev` (DEPRECATED), `swe-java-dev`, `swe-kotlin-dev`, `swe-python-dev`, `swe-rust-dev`, `swe-typescript-dev`, `social-linkedin-post-maker`, `apps-organiclever-fe-deployer`
7. **Repository Governance**: `repo-governance-maker`, `repo-governance-checker`, `repo-governance-fixer`, `repo-workflow-maker`, `repo-workflow-checker`, `repo-workflow-fixer`
8. **Specs Validation**: `specs-maker`, `specs-checker`, `specs-fixer`
9. **CI/CD**: `ci-checker`, `ci-fixer`

**Full agent catalog**: See [`.opencode/agent/README.md`](./.opencode/agent/README.md)

## Agent Format (OpenCode)

OpenCode agents use YAML (YAML Ain't Markup Language) frontmatter with boolean tool flags:

```yaml
---
description: Brief description of what the agent does
model: zai-coding-plan/glm-5.1 | zai-coding-plan/glm-5-turbo
tools:
  read: true | false
  grep: true | false
  glob: true | false
  write: true | false
  bash: true | false
  edit: true | false
permission:
  skill:
    skill-name: allow
    another-skill: allow
---
```

**Note**: This format is auto-generated from Claude Code format (tool arrays → boolean flags).

## Maker-Checker-Fixer Pattern

Three-stage quality workflow:

1. **Maker** - Creates content (tools: read, write, edit, glob, grep)
2. **Checker** - Validates content, generates audit reports (tools: read, glob, grep, write for reports)
3. **Fixer** - Applies validated fixes (tools: read, edit, write, glob, grep)

**Criticality Levels**: CRITICAL, HIGH, MEDIUM, LOW
**Confidence Levels**: HIGH, MEDIUM, FALSE_POSITIVE

**See**: `.opencode/skill/repo-applying-maker-checker-fixer/SKILL.md`

**Web Research Default**: `web-researcher` is the default primitive for public-web information gathering across all agents. See [Web Research Delegation Convention](./governance/conventions/writing/web-research-delegation.md) for the normative rule, delegation threshold (2+ `WebSearch` or 3+ `WebFetch` per claim), and enumerated exceptions (single-shot known URL; fixer re-validation; link-reachability checkers).

## Skills Integration

**Skill packages** serve agents through two modes:

**Inline Skills** (default) - Knowledge injection:

- Progressive disclosure of conventions and standards
- Injected into current conversation context
- Examples: `docs-applying-content-quality`, `docs-applying-diataxis-framework`, `docs-creating-accessible-diagrams`

**Fork Skills** (`context: fork`) - Task delegation:

- Spawn isolated agent contexts for focused work
- Delegate specialized tasks (research, analysis, exploration)
- Return summarized results to main conversation
- Act as lightweight orchestrators

**Categories** (representative examples — see full catalog below):

- **Documentation**: `docs-applying-content-quality`, `docs-applying-diataxis-framework`, `docs-creating-accessible-diagrams`, `docs-creating-by-example-tutorials`, `docs-creating-in-the-field-tutorials`
- **Planning**: `plan-creating-project-plans`, `plan-writing-gherkin-criteria`
- **Agent Development**: `agent-developing-agents`
- **Repository Patterns**: `repo-applying-maker-checker-fixer`, `repo-assessing-criticality-confidence`, `repo-generating-validation-reports`, `repo-understanding-repository-architecture`
- **Development Workflow**: `repo-practicing-trunk-based-development`, `swe-developing-applications-common`
- **Programming Languages**: `swe-programming-clojure`, `swe-programming-csharp`, `swe-programming-dart`, `swe-programming-elixir`, `swe-programming-fsharp`, `swe-programming-golang`, `swe-programming-java`, `swe-programming-kotlin`, `swe-programming-python`, `swe-programming-rust`, `swe-programming-typescript`
- **Application-Specific**: `apps-ayokoding-web-developing-content`, `apps-oseplatform-web-developing-content`, `apps-organiclever-fe-developing-content`

**Service Relationship**: Skills serve agents with knowledge and execution but don't govern them (service infrastructure, not governance layer).

**Full skills catalog**: See [`.opencode/skill/README.md`](./.opencode/skill/README.md)

## Security Policy

**Trusted Sources Only**: Only use skills from trusted repositories. All skills in this repository are maintained by the project team.

**Rationale**: Skills execute with agent permissions and can access repository content. Only load skills from verified sources.

## Governance Alignment

All agents follow foundational principles:

1. **Deliberate Problem-Solving** - Think before coding; surface assumptions and tradeoffs rather than hiding confusion
2. **Documentation First** - Documentation is mandatory, not optional
3. **Accessibility First** - WCAG AA (Web Content Accessibility Guidelines Level AA) compliance
4. **Simplicity Over Complexity** - Minimum viable abstraction
5. **Explicit Over Implicit** - Clear tool permissions
6. **Automation Over Manual** - Automate repetitive tasks
7. **Root Cause Orientation** - Fix root causes, not symptoms; minimal impact; senior engineer standard

**See**: [governance/principles/README.md](./governance/principles/README.md)

## Related Documentation

- **CLAUDE.md** (PRIMARY) - Claude Code configuration and guidance
- **.opencode/agent/README.md** - Complete agent catalog
- **.opencode/skill/README.md** - Complete skills catalog
- **governance/repository-governance-architecture.md** - Six-layer governance hierarchy

---

**Last Updated**: 2026-04-11

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
