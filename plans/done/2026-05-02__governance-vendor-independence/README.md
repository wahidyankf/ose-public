---
title: "Governance Vendor-Independence Refactor"
description: Refactor governance/ tree so it is platform/vendor-neutral and usable by any AI coding agent (Claude Code, OpenCode, Cursor, Codex CLI, Gemini CLI, Copilot, Aider) and human contributors. Push vendor-specific bindings out to platform-binding directories.
status: In Progress
created: 2026-05-02
owner: Repo Maintainers
scope:
  - ose-public
---

# Governance Vendor-Independence Refactor

## Status

**In Progress** — kicked off 2026-05-02.

## Why This Plan Exists

Today, `ose-public/governance/` reads as if it belongs to one specific AI coding agent (Claude Code) with a thin OpenCode mirror. Vendor terms (`Claude Code`, `Anthropic`, `Sonnet`/`Opus`/`Haiku`, `.claude/`, `.opencode/`, "Skills" as a proper noun) appear in 65 of 157 governance markdown files (~41%). This couples the governance layer to a specific vendor stack, making the repo less welcoming to:

- Contributors using Cursor, Codex CLI, Gemini CLI, GitHub Copilot, Aider, Continue, or Sourcegraph Cody.
- Human contributors reading governance directly without an agent.
- Future agent platforms not yet released.

This plan separates **vendor-neutral governance** (rules any reader can apply) from **platform bindings** (vendor-specific implementation that lets a given agent actually execute the rules), aligned with the AAIF/Linux-Foundation `AGENTS.md` standard donated December 2025.

## Scope

**In scope (this plan):**

- `ose-public/governance/` tree — all 5 layers (Vision, Principles, Conventions, Development, Workflows).
- Root-level `AGENTS.md` introduction (creating canonical vendor-neutral root instruction file).
- New convention `governance/conventions/structure/governance-vendor-independence.md` defining the rule going forward.
- Linkages OUT of `governance/` (e.g., `governance/development/agents/ai-agents.md` references `.claude/agents/`) — rewrite to vendor-neutral pointers.
- Validation tooling (a checker pattern detecting vendor-term regressions in `governance/`).
- `ose-public/CLAUDE.md` re-stitching to point to `AGENTS.md` as canonical, becoming a thin Claude Code binding shim (or symlink).

**Out of scope (this plan):**

- Parent `ose-projects/governance/` tree — separate companion plan; same refactor logic applies but Scope B (parent worktree) constraints differ.
- `ose-primer/` upstream propagation — handled separately by `repo-ose-primer-propagation-maker` after this plan lands; classifier may need an entry for the new convention.
- Rewriting `.claude/agents/`, `.claude/skills/`, `.opencode/agents/` content. Those ARE the platform bindings; their existence is the goal of this refactor, not its target. Their internal text only changes if it crosses back into governance prose.
- Adding `.cursor/`, `.github/copilot-instructions.md`, or other new platform bindings. Tracked as future work.
- Renaming `.claude/skills/` or `.opencode/agents/` paths.

## Worktree Compliance

This plan modifies `ose-public/governance/`, `ose-public/AGENTS.md`, `ose-public/CLAUDE.md`, and the validation tooling under `ose-public/apps/rhino-cli/` (potentially). Per the parent-level Subrepo Worktree Workflow Convention (Standard 11), this is **Scope A** — work runs inside a `ose-public` subrepo worktree. Toolchain initialization for the worktree follows [`governance/development/workflow/worktree-setup.md`](../../../governance/development/workflow/worktree-setup.md).

Authoring this plan is happening inside the existing `ose-public/.claude/worktrees/shimmering-moseying-porcupine/` worktree (current session), which is already a Scope A worktree. Plan **execution** SHOULD provision a fresh dedicated worktree, e.g. `ose-public/.claude/worktrees/governance-vendor-independence/`, to keep concurrent plans isolated.

## Plan Documents

| File                           | Owns                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| [README.md](./README.md)       | This overview, scope, navigation                                |
| [brd.md](./brd.md)             | Business rationale, affected roles, success outcomes            |
| [prd.md](./prd.md)             | Product requirements, user stories, Gherkin acceptance criteria |
| [tech-docs.md](./tech-docs.md) | Architecture, vocabulary map, file-by-file refactor mechanics   |
| [delivery.md](./delivery.md)   | Phased TDD-shaped step-by-step checklist with `- [ ]` items     |

## Quick Links

- Foundational standard: [`AGENTS.md`](https://agents.md/) (Agentic AI Foundation, Linux Foundation, Dec 2025)
- Cross-vendor MCP status: [Anthropic donation announcement](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
- Existing dual-mode pattern: [ose-public CLAUDE.md "Dual-Mode Configuration" section](../../../CLAUDE.md)
- Plans convention: [governance/conventions/structure/plans.md](../../../governance/conventions/structure/plans.md)
- Worktree toolchain setup: [`governance/development/workflow/worktree-setup.md`](../../../governance/development/workflow/worktree-setup.md). Subrepo Worktree Workflow Convention (Standard 11, scope rules, direct-to-main publish) lives at the parent `ose-projects/governance/` tree.

## Hard Dependencies

None. This plan can start immediately. It does NOT block or get blocked by either active OrganicLever DDD plan; they touch disjoint trees.

## Soft Coupling

Once this plan lands, `ose-primer-sync` classifier may grow an entry for the new convention so the upstream template adopts the same vendor-neutrality rules. That is a follow-on plan, not a blocker for this one.
