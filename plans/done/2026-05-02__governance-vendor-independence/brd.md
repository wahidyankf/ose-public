---
title: "BRD — Governance Vendor-Independence Refactor"
description: Business rationale for separating ose-public/governance/ from any single AI coding agent vendor.
created: 2026-05-02
---

# Business Requirements — Governance Vendor-Independence

## Problem Statement

`ose-public/governance/` is the authoritative repository policy layer (Vision → Principles → Conventions → Development → AI Agents → Workflows). It defines how all software, documentation, and process are produced in the repo. Today, 65 of its 157 markdown files (~41%) reference vendor-specific concepts:

- "Claude Code" by name (31 occurrences across files)
- "OpenCode" by name (38 occurrences)
- Anthropic model tier names: "Sonnet" (19), "Opus" (20), "Haiku" (16)
- Concrete platform paths: `.claude/agents/` (63), `.claude/skills/` (55), `.opencode/agents/` (38)
- Capitalized "Skills" used as a proper noun branded to one vendor's term (146 occurrences)

This couples the repository's foundational rules to one vendor stack. The Layer 0 vision ("democratize Sharia-compliant enterprise — accessible to everyone") is undermined when the means of contribution privileges one specific commercial AI tool.

## Affected Roles

| Role                                                                 | Interest                                                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Human contributors reading governance directly                       | Need vendor-neutral, plain-prose rules they can apply manually                                      |
| Contributors using Claude Code                                       | Already served — keep working unchanged                                                             |
| Contributors using OpenCode                                          | Already served — keep working unchanged                                                             |
| Contributors using Cursor / Codex CLI / Gemini CLI / Copilot / Aider | Currently second-class; need parity                                                                 |
| Future-agent contributors (tools not yet released)                   | Need governance written so a new tool can read it without rewrites                                  |
| Repository maintainers                                               | Need a clear separation rule preventing vendor terms from drifting back into governance             |
| `ose-primer` template adopters                                       | Inherit the governance scaffolding — the more vendor-neutral upstream, the more reusable downstream |

## Strategic Context

In December 2025, the `AGENTS.md` standard was donated to the **Agentic AI Foundation (AAIF)** under the Linux Foundation, co-founded by Anthropic, OpenAI, and Block
([Linux Foundation announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation), accessed 2026-05-02).
Adoption rose from 20,000 public repos in August 2025
([InfoQ, August 2025](https://www.infoq.com/news/2025/08/agents-md/): "over 20,000 public GitHub repositories now include an AGENTS.md file", accessed 2026-05-02)
to 60,000+ by early 2026
([agents.md homepage](https://agents.md/): "60,000+ repos use AGENTS.md", accessed 2026-05-02).
The Model Context Protocol (MCP) was donated to AAIF in the same wave and is now adopted by OpenAI (March 2025), Google Gemini API (March 2026), Cursor, Windsurf, JetBrains, and Vercel
([Wikipedia — Model Context Protocol](https://en.wikipedia.org/wiki/Model_Context_Protocol), accessed 2026-05-02).

The industry has converged on:

- `AGENTS.md` as the vendor-neutral root instruction file.
- Per-tool dotdirs (`.claude/`, `.opencode/`, `.cursor/`, `.github/`) for vendor-specific bindings.
- "Agent Skills" as the cross-vendor term for the SKILL.md primitive.
- MCP as the vendor-neutral context protocol.
- Capability-tier descriptions (e.g., "planning-grade model") rather than concrete model names in agent-agnostic docs.

This plan brings `ose-public` in line with that convergence. Doing nothing means the repo's policy layer increasingly diverges from the open standard everyone else is adopting.

## Goals

1. **Vendor neutrality of governance prose**: Any reader (human or agent, regardless of tool) can read `governance/` and apply the rules without translating from Claude/OpenCode jargon.
2. **Bindings live OUTSIDE governance**: All `.claude/...` / `.opencode/...` paths, vendor names, and vendor-specific model tiers are pushed out to platform-binding files.
3. **AGENTS.md becomes the canonical root instruction file** for the repo, with `CLAUDE.md` reduced to a Claude-Code-specific binding (or symlink target) per current AAIF practitioner consensus.
4. **A new convention** codifies the separation rule going forward and is enforced by automated check.
5. **No regression in Claude Code or OpenCode user experience**. Existing agents and skills must continue to work unchanged.
6. **Explicit guidance for adding new platform bindings** (Cursor, Copilot, Codex CLI, Gemini CLI, Aider, etc.) so future contributors know where they go.

## Non-Goals

- Not adopting Cursor / Copilot / Codex bindings in this plan (separate follow-on work).
- Not rewriting agent definitions inside `.claude/agents/`. Their content can remain Claude-specific because they ARE the Claude binding.
- Not changing the six-layer architecture (Vision → Principles → Conventions → Development → AI Agents → Workflows). The architecture stays; the prose gets neutralized.
- Not removing OpenCode dual-mode infrastructure. OpenCode remains a first-class binding alongside Claude Code.
- Not touching parent `ose-projects/governance/`. Future companion plan, same logic, different worktree scope.
- Not touching `ose-primer/` directly. Propagation handled separately by `repo-ose-primer-propagation-maker` once this plan archives.

## Success Outcomes

- A new contributor using Cursor (or any non-Claude tool) can clone `ose-public`, read `AGENTS.md` + `governance/`, and produce a compliant change without ever opening `.claude/`.
- A reader scanning governance documents encounters no load-bearing vendor-specific terms
  outside designated platform-binding example sections — tool names, model names, and
  vendor dotdir paths appear only where explicitly labelled as binding examples, not
  woven into the explanatory prose.
- The `repo-rules-checker` (or a new linter) flags vendor-term reintroduction in `governance/` as a CRITICAL/HIGH governance finding.
- All four prod sites still build green; all subagent workflows still execute green; pre-push hook still passes.

## Constraints

- **Trunk Based Development**: All work flows through `main` via the worktree's branch and direct-to-main publish per Standard 14. No long-lived feature branches.
- **No time estimates**: Per the project's "No Time Estimates" principle, this BRD names outcomes only, not durations.
- **Documentation First**: The new convention MUST land before the bulk vocabulary refactor begins, so the rule and the migration are reviewed together.
- **Root-cause orientation**: The refactor MUST add a regression-prevention mechanism (validation tooling), not just a one-off cleanup.
- **Backwards compatibility for Claude Code / OpenCode**: `CLAUDE.md` continues to be discoverable by Claude Code; `AGENTS.md` becomes discoverable by everyone else; no contributor has their workflow broken.

## Risks and Mitigations

| Risk                                                                                                                         | Mitigation                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mass refactor breaks intra-doc links (relative links `../../../.claude/agents/` from inside `governance/`)                   | Use `docs-link-checker` after each phase; inventory link targets before any rename                                                                          |
| AGENTS.md content collision with existing CLAUDE.md content (duplication, drift)                                             | `CLAUDE.md` becomes a symlink to `AGENTS.md`, OR a thin Claude-specific shim that imports `AGENTS.md` via `@AGENTS.md`. Pick one and document.              |
| Hidden vendor terms remaining (e.g., in YAML frontmatter, code blocks, mermaid diagrams)                                     | Validation tooling scans frontmatter, code blocks, and headings. Allowlist for explicit binding-examples sections.                                          |
| Regression in dual-mode sync (`.claude/` → `.opencode/`)                                                                     | Run `npm run sync:claude-to-opencode` and validate after the AGENTS.md introduction; existing sync logic does not depend on governance prose so risk is low |
| `ose-primer` propagation classifier becomes inaccurate                                                                       | Update classifier in a follow-on plan; do not block this plan on classifier work                                                                            |
| Agent prompts under `.claude/agents/` hardcode references to vendor terms in governance/ that no longer exist after refactor | Pre-flight scan: agent prompts that grep into governance/ for vendor terms. Update them in the same phase that updates the corresponding governance file.   |

## Authoring Standards

This plan follows:

- [governance/conventions/structure/plans.md](../../../governance/conventions/structure/plans.md) — multi-file structure, content-placement rules.
- [governance/conventions/structure/file-naming.md](../../../governance/conventions/structure/file-naming.md) — kebab-case file names.
- [governance/development/workflow/test-driven-development.md](../../../governance/development/workflow/test-driven-development.md) — delivery items expressed as TDD-shaped steps where applicable.
- [governance/conventions/writing/web-research-delegation.md](../../../governance/conventions/writing/web-research-delegation.md) — public-web research delegated to `web-research-maker` (already done; numeric/date claims cited inline in this BRD's Strategic Context section, vocabulary findings cited in tech-docs.md).
