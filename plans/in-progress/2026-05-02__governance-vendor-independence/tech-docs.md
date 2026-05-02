---
title: "Tech Docs — Governance Vendor-Independence Refactor"
description: Architecture, vocabulary map, file-by-file refactor mechanics, validation tooling design.
created: 2026-05-02
---

# Technical Documentation — Governance Vendor-Independence

## 1. Target Architecture

### 1.1 Layered separation

```
ose-public/
├── AGENTS.md                            # NEW — canonical, vendor-neutral root instruction file
├── CLAUDE.md                            # EXISTING — becomes thin shim importing AGENTS.md + Claude-specific notes
├── governance/                          # vendor-NEUTRAL prose only
│   ├── vision/
│   ├── principles/
│   ├── conventions/
│   │   ├── structure/
│   │   │   ├── governance-vendor-independence.md   # NEW convention codifying the rule
│   │   │   └── ... (existing conventions, vocabulary-cleansed)
│   │   └── ...
│   ├── development/
│   │   ├── agents/
│   │   │   ├── ai-agents.md             # rewritten: agent-agnostic prose
│   │   │   ├── model-selection.md       # rewritten: capability-tier-based
│   │   │   ├── skill-context-architecture.md   # rewritten: "Agent Skills" terminology
│   │   │   └── ...
│   │   └── ...
│   └── workflows/                       # rewritten: vendor-neutral workflow prose
├── docs/
│   └── reference/
│       └── platform-bindings.md         # NEW — catalog of all platform bindings
├── .claude/                             # Claude Code platform binding (UNCHANGED structure)
│   ├── agents/                          # vendor-specific; lives here on purpose
│   ├── skills/                          # SKILL.md is shared natively with OpenCode
│   ├── settings.json
│   └── commands/
└── .opencode/                           # OpenCode platform binding (UNCHANGED structure)
    └── agents/
```

### 1.2 Layer-binding contract

| Layer                                              | Vendor terms allowed?                                                                                                                         | Rationale                                                                |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Vision (Layer 0)                                   | NO                                                                                                                                            | Mission-level prose; nothing vendor-specific belongs here                |
| Principles (Layer 1)                               | NO                                                                                                                                            | Foundational values; vendor-agnostic by definition                       |
| Conventions (Layer 2)                              | NO except inside `binding-example` blocks                                                                                                     | Documentation rules; written for any reader                              |
| Development (Layer 3)                              | NO except inside `binding-example` blocks                                                                                                     | Software practices; vendor binding is one detail among many              |
| AI Agents (`.claude/agents/`, `.opencode/agents/`) | YES                                                                                                                                           | These ARE the vendor bindings                                            |
| Workflows (Layer 5)                                | NO except inside `binding-example` blocks; agent invocations refer to abstract role names that map to specific files via the platform binding | Workflows orchestrate roles; bindings resolve role → concrete agent file |

## 2. Vocabulary Map (Authoritative)

| Vendor-specific term (current)                    | Vendor-neutral term (new)                                            | Notes / when to use exception                                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| "Claude Code"                                     | "the coding agent" or "the AI coding agent"                          | Allowed inside `binding-example` and inside `docs/reference/platform-bindings.md`                                |
| "OpenCode"                                        | "the coding agent" / drop where redundant                            | Allowed in cross-reference and platform-bindings catalog                                                         |
| "Anthropic"                                       | drop, or "the model vendor"                                          | Allowed only in citation context                                                                                 |
| "Sonnet" / "Opus" / "Haiku"                       | capability tier: "planning-grade", "execution-grade", "fast"         | Concrete model names live in `.claude/agents/<file>.md` frontmatter only                                         |
| "Skills" (proper noun, branded)                   | "Agent Skills" (lowercase generic plural)                            | Aligned with AAIF / Codex / OpenCode shared term                                                                 |
| "slash commands"                                  | "agent commands" or "workflow commands"                              | No formal AAIF term yet; use lowercase generic                                                                   |
| "subagents"                                       | "delegated agents" / "agent delegation"                              | Aligned with A2A protocol vocabulary                                                                             |
| "MCP server"                                      | unchanged (already cross-vendor standard)                            | MCP is a Linux Foundation / AAIF standard since Dec 2025                                                         |
| "CLAUDE.md" (as canonical root)                   | "AGENTS.md"                                                          | `CLAUDE.md` continues to exist as a Claude-Code binding, but governance prose refers to `AGENTS.md` as canonical |
| "`.claude/agents/<name>.md`" (path-as-identifier) | "the agent definition file" or `<platform-binding>/agents/<name>.md` | Use exact path only inside platform-binding examples                                                             |
| "`.claude/skills/<name>/SKILL.md`"                | "the Agent Skill file" or `<skill-search-path>/<name>/SKILL.md`      | Concrete path inside binding examples only                                                                       |
| "`.opencode/agents/<name>.md`"                    | same treatment as `.claude/agents/`                                  |                                                                                                                  |

This table is the single source of truth, copied into the new convention file.

## 3. New Convention: `governance-vendor-independence.md`

Lives at `governance/conventions/structure/governance-vendor-independence.md`.

Required sections:

1. **Title and frontmatter** — standard kebab-case.
2. **Principles Implemented/Respected** — links to relevant Layer-1 principles (Simplicity Over Complexity; Explicit Over Implicit; Accessibility First — broadly read as accessible to any contributor; Documentation First).
3. **Purpose** — separate vendor-neutral governance from vendor-specific bindings.
4. **Scope** — applies to all of `governance/**/*.md`. Out of scope: `.claude/`, `.opencode/`, `AGENTS.md`, `CLAUDE.md`, `docs/reference/platform-bindings.md`.
5. **Forbidden vendor terms** — exact list with regex patterns.
6. **Allowlist mechanism** — explicit `binding-example` fenced blocks; sections under `Platform Binding Examples` heading.
7. **Vocabulary Map** — full table from §2 above.
8. **Platform-binding directory pattern** — per-tool dotdir model.
9. **Migration guidance** — how to refactor an existing governance file: identify, rewrite, allowlist any irreducible binding examples, validate.
10. **Enforcement** — pointer to validation tooling (§6).
11. **Exceptions and escape hatches** — explicit list.

## 4. AGENTS.md Design

### 4.1 Content shape

```markdown
# AGENTS.md

> Canonical instruction file for any AI coding agent or human contributor working in this repo.
> Aligned with the [AGENTS.md spec](https://agents.md/) (Agentic AI Foundation, Linux Foundation).

## Repository Overview

[short summary, links to README.md]

## Build, Test, Lint Commands

[npm install, npm run build, nx affected -t test:quick, nx affected -t lint, ...]

## Conventions

- Linking: see governance/conventions/formatting/linking.md
- File naming: see governance/conventions/structure/file-naming.md
- ... (links into governance/, no duplication)

## Plans

See governance/conventions/structure/plans.md and the plans/ directory.

## Worktree Workflow

See ose-public/CLAUDE.md "Subrepo worktree workflow" (or migrate that subsection here once cleansed).

## Platform Bindings

Concrete tool integrations live OUTSIDE governance:

- Claude Code → .claude/, with CLAUDE.md as the Claude-Code-discoverable shim
- OpenCode → .opencode/agents/, AGENTS.md (this file) read natively, .claude/skills/ read natively
- Future: .cursor/, .github/copilot-instructions.md, GEMINI.md, CONVENTIONS.md (Aider)
  See docs/reference/platform-bindings.md for the catalog.

## Models

This repo describes model selection by capability tier (planning-grade / execution-grade / fast).
Concrete vendor models resolve in the platform binding (e.g., .claude/agents/<name>.md frontmatter).
See governance/development/agents/model-selection.md for the tier definitions.
```

### 4.2 CLAUDE.md transition

Two viable shapes; this plan picks **shim-by-import** (recommended) over **symlink**:

**Shape A — Symlink (simpler but Windows-fragile)**:

```bash
ln -s AGENTS.md CLAUDE.md
```

**Shape B — Shim with @-import (recommended)**:

```markdown
# CLAUDE.md

@AGENTS.md

## Claude-Code-Specific Notes

- Plugins: see .claude/settings.json
- Subagents (Claude term for delegated agents): see .claude/agents/README.md
- Skills loaded from .claude/skills/<name>/SKILL.md
- (other Claude-Code-only details that genuinely don't apply to other agents)
```

The `@AGENTS.md` syntax is Claude Code's native file-import primitive. OpenCode's AGENTS.md priority means it never reads CLAUDE.md as long as AGENTS.md exists. Other agents either read AGENTS.md natively or are unaffected.

This shape preserves the canonical content in one file (AGENTS.md), keeps Claude-Code-only notes scoped to CLAUDE.md, and avoids cross-platform symlink fragility.

## 5. Platform-Bindings Catalog

Lives at `docs/reference/platform-bindings.md`. Table-driven.

> **Translation artifacts.** A platform binding is more than a directory — it
> includes the per-field translations rhino-cli applies when generating the
> binding from upstream sources. The first concrete artifact is the
> Claude→OpenCode color map landed 2026-05-02 (commit `7e003e106`):
> `apps/rhino-cli/internal/agents/types.go` `ClaudeToOpenCodeColor` is the
> single source of truth, with the policy authored at
> `governance/development/agents/ai-agents.md` "Dual-Mode Color Translation
> (Claude Code to OpenCode)" subsection. The catalog Phase 4 step adds a
> "Translation artifacts" subsection listing all such mappings (model IDs,
> tool names, color, etc.) per tool; future entries follow the same shape.

| Tool             | Binding location                                | Root instruction file                               | Status                                            | Upstream docs                                |
| ---------------- | ----------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| Claude Code      | `.claude/`                                      | `CLAUDE.md` (shim → AGENTS.md)                      | Provided                                          | code.claude.com/docs                         |
| OpenCode         | `.opencode/agents/`, `.claude/skills/` (native) | `AGENTS.md`                                         | Provided                                          | opencode.ai/docs                             |
| Cursor           | `.cursor/rules/*.mdc`                           | `AGENTS.md` (also reads .cursor/rules)              | Reserved (not yet provided)                       | cursor.com/docs/rules                        |
| OpenAI Codex CLI | (no dotdir)                                     | `AGENTS.md`                                         | Provided automatically once AGENTS.md exists      | developers.openai.com/codex/guides/agents-md |
| Gemini CLI       | (no dotdir)                                     | `GEMINI.md` or `AGENTS.md`                          | Reserved                                          | geminicli.com/docs/cli/gemini-md/            |
| GitHub Copilot   | `.github/copilot-instructions.md`               | `AGENTS.md` (coding agent mode)                     | Reserved                                          | docs.github.com/copilot/customizing-copilot  |
| Aider            | n/a                                             | `CONVENTIONS.md` (via `--read` flag) or `AGENTS.md` | Provided automatically once AGENTS.md exists      | aider.chat/docs/usage/conventions.html       |
| Continue         | TBD                                             | TBD                                                 | Not researched conclusively; see plan brd.md gaps | docs.continue.dev                            |
| Sourcegraph Cody | search-based context                            | none                                                | Not applicable                                    | sourcegraph.com/docs/cody                    |

## 6. Validation Tooling

### 6.1 Selected approach: `rhino-cli` subcommand

`rhino-cli governance vendor-audit` (or `rhino-cli vi audit`, naming TBD during delivery). Reasons:

- Consistent with existing `rhino-cli` pattern (Go CLI, has `bc validate`, `ul validate`, etc. per the OrganicLever DDD enforcement plan).
- Cacheable as part of `test:quick` for the rhino-cli project itself.
- Single binary distributed via doctor; available in CI and pre-push.
- Avoids inflating `repo-rules-checker` with a domain-specific scanner.

### 6.2 Behavior contract

````
rhino-cli governance vendor-audit [--root <path>] [--exclude <glob>]

Default root: governance/
Default excludes: <none> — scan everything under root

For each .md file:
  1. Parse and tokenize, identifying:
     - Code fences (skip if tagged ```binding-example)
     - Section ranges under headings whose text matches "(?i)Platform Binding Examples"
  2. In remaining text, search for forbidden patterns from the new convention
  3. Emit findings with file:line:column, matched term, suggested neutral replacement

Exit codes:
  0 → no findings
  1 → findings present
  2 → tool error
````

### 6.3 TDD shape for the tool

Steps in `delivery.md` follow Red → Green → Refactor:

1. RED: write a Godog scenario "scanner reports forbidden term" and have it fail because scanner doesn't exist yet.
2. GREEN: minimal Go scanner returning forbidden findings.
3. REFACTOR: split tokenizer, allowlist parser, reporter; add suggested-replacement column.
4. RED: scenario "binding-example fence is exempted" → currently fails because scanner doesn't recognize fence tag.
5. GREEN: implement fence recognition.
6. REFACTOR: factor fence handling into shared helper; reuse for "Platform Binding Examples" section.
7. Repeat for each forbidden term family (vendor names, model names, paths).
8. Wire to a `nx run rhino-cli:test:quick` exit-1 enforcement.
9. Wire to pre-push via existing `test:quick` for affected projects.

## 7. Refactor Plan for Existing Governance Files

### 7.1 Stratification by impact

Files identified as vendor-tainted (65 of 157), grouped by refactor weight:

**Tier A — heavy lift (> 30 KB, deep structural rewrite)**:

- `governance/development/agents/ai-agents.md` (112.7 KB)
- `governance/repository-governance-architecture.md` (30.5 KB)
- `governance/conventions/structure/ose-primer-sync.md` (38.4 KB)

**Tier B — moderate lift (10-30 KB)**:

- `governance/development/agents/model-selection.md` (23.8 KB)
- `governance/development/agents/skill-context-architecture.md` (10.8 KB)
- `governance/conventions/structure/agent-naming.md` (8.6 KB)
- `governance/conventions/structure/plans.md` (27.9 KB)
- `governance/workflows/plan/plan-execution.md` (size TBD)
- `governance/workflows/plan/plan-quality-gate.md`
- `governance/workflows/repo/repo-rules-quality-gate.md`
- `governance/workflows/repo/repo-ose-primer-*.md` (multiple)
- `governance/conventions/writing/web-research-delegation.md`
- `governance/development/agents/anti-patterns.md`
- `governance/development/agents/best-practices.md`
- `governance/development/agents/README.md`
- (others — see full list under §7.3)

**Tier C — light lift (< 10 KB or surgical replacements)**:

- All remaining 50+ files; mostly single-occurrence vendor mentions (a few "`.claude/agents/`" references in cross-links).

### 7.2 Refactor recipe (per file)

For each vendor-tainted file:

1. Read file, identify all matches via the vendor-term regex.
2. For each match, classify: load-bearing prose / cross-reference / illustrative example / inside agent-specific section.
3. **Load-bearing prose**: rewrite using the Vocabulary Map (§2).
4. **Cross-reference**: rewrite link target if it points into a vendor dotdir; rewrite anchor text to neutral.
5. **Illustrative example**: wrap in `binding-example` fence OR move under a "Platform Binding Examples" heading.
6. **Inside agent-specific section**: if the section is genuinely binding-specific, allowlist via the section heading; if not, neutralize.
7. Run markdown-link-checker; fix any breakage.
8. Run vendor-audit; expect zero findings.
9. Commit per file (or per logical group of files within one phase).

### 7.3 Full vendor-tainted file inventory

(Captured at recon time — 65 files. Stored in delivery.md as a checklist.)

## 8. Linkage Side-Effects

These files reference governance/ paths or vendor terms and may need updates as governance content shifts:

- `ose-public/CLAUDE.md` — replace canonical references with `AGENTS.md`; keep Claude-specific notes only.
- `ose-public/AGENTS.md` (new) — canonical content.
- `ose-public/.claude/agents/*.md` — many agents grep into `governance/`; check for hardcoded vendor terms appearing in their reference paths.
- `ose-public/.claude/skills/*/SKILL.md` — same check.
- `ose-public/.opencode/agents/*.md` — same; auto-synced from `.claude/agents/` so usually no separate edit.
- `ose-public/docs/explanation/repository-governance.md` (if exists) — link target updates.
- `parent ose-projects/governance/` — out of scope (companion plan).
- `ose-primer/*` — out of scope; future propagation plan.

## 9. Cross-References to Existing Conventions and Practices

- [governance/conventions/structure/plans.md](../../../governance/conventions/structure/plans.md) — this plan's structure follows it.
- [governance/conventions/writing/web-research-delegation.md](../../../governance/conventions/writing/web-research-delegation.md) — already followed; web research delegated to `web-research-maker`.
- [governance/development/workflow/test-driven-development.md](../../../governance/development/workflow/test-driven-development.md) — validation tooling delivery items are TDD-shaped.
- [governance/development/workflow/trunk-based-development.md](../../../governance/development/workflow/trunk-based-development.md) — refactor lands on `main` via direct-to-main publish per Standard 14.
- [governance/development/quality/code.md](../../../governance/development/quality/code.md) — pre-push hook gates remain green throughout.

## 10. Decisions Made (Reconciling PRD Open Questions)

| Question                        | Decision                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Symlink vs shim for `CLAUDE.md` | **Shim with `@AGENTS.md` import** — portable across Windows clones, keeps Claude-Code-only notes scoped                                                                                           |
| Allowlist mechanism             | **Both**: `binding-example` fence (granular) PLUS "Platform Binding Examples" heading-scoped sections (page-level). Convention specifies precedence (fence wins for in-line; heading for grouped) |
| Validation tooling location     | **`rhino-cli governance vendor-audit` subcommand** — consistent with existing rhino-cli pattern, cacheable, CI-friendly                                                                           |

## 11. Rollback Strategy

### Overview

This refactor proceeds via serial, atomic commits (one file or logical group per commit). Every phase has a per-phase rollback noted in `delivery.md`. This section documents the overall architectural rollback: how to abandon the refactor at any phase boundary and return the repo to a pre-refactor state.

### Phase-boundary rollback points

| After phase          | State of the repo                                                | Rollback action                                                                                                                     |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0              | Baselines captured; no files changed                             | Nothing to revert                                                                                                                   |
| Phase 1              | New convention file added; no governance prose changed           | `git revert` the Phase 1 commit; remove the convention file                                                                         |
| Phase 2              | AGENTS.md added; CLAUDE.md converted to shim                     | `git revert` the Phase 2 commit; CLAUDE.md reverts to original; AGENTS.md removed                                                   |
| Phase 3 (mid-Tier A) | Some governance files vocabulary-cleaned; others not yet changed | `git revert <sha>` per file; each file was its own commit — rollback is granular                                                    |
| Phase 3 (complete)   | All 65 vendor-tainted governance files rewritten                 | `git revert` range from Phase 3 start to Phase 3 end; all governance files revert atomically                                        |
| Phase 4              | Platform-bindings catalog added                                  | `git revert` the Phase 4 commit; remove `docs/reference/platform-bindings.md`; restore TODO markers                                 |
| Phase 5              | Validation tooling (`rhino-cli governance vendor-audit`) added   | `git revert` the Phase 5 commits; remove the new rhino-cli subcommand; tooling reverts to absent                                    |
| Phase 6              | Plan archived; worktree merged to main                           | Revert on main requires explicit approval per `ci-blocker-resolution.md`; always fix-forward unless governance failure is confirmed |

### Reversibility principles

- All changes are in tracked files (no database migrations, no infra changes). Every commit is `git revert`-safe.
- Phase 3 file-by-file commits preserve granular rollback: a single problematic file can be reverted without affecting the rest of the refactor.
- CLAUDE.md shim conversion (Phase 2) is immediately reversible: the original CLAUDE.md content is preserved in git history; `git revert` restores it within seconds.
- The `rhino-cli` binary change (Phase 5) does not modify the binary's external interface; removing the new subcommand is backward-compatible with all existing `rhino-cli` usage.
- If the entire refactor must be abandoned mid-Phase-3, the recommended approach is: identify the last Phase 2 commit SHA; `git revert <Phase-2-sha>..HEAD`; repo returns to the post-Phase-2 state with AGENTS.md + CLAUDE.md shim intact; Phase 3 work is cleanly undone.

## 12. Phase Outline (high level — `delivery.md` carries the granular checklist)

1. **Phase 0** — Pre-flight: confirm worktree, run baselines.
2. **Phase 1** — New convention `governance-vendor-independence.md` lands first (Documentation First).
3. **Phase 2** — `AGENTS.md` introduction at root + `CLAUDE.md` shim conversion.
4. **Phase 3** — Bulk vocabulary refactor in governance/, file-by-file in tier order (A → B → C).
5. **Phase 4** — Platform-bindings catalog at `docs/reference/platform-bindings.md`.
6. **Phase 5** — Validation tooling: TDD-shaped `rhino-cli governance vendor-audit`. Wired into `test:quick` and pre-push.
7. **Phase 6** — Final pass: full-tree audit, link-checker green, sync-mirror green, plan-execution-checker green; archive.

Each phase has its own pre-flight, exit gates, and rollback plan in `delivery.md`.
