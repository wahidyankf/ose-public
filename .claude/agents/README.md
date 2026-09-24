---
title: "Agents"
description: "Grouped catalog of the AI agents that help maintain Open Sharia Enterprise, organized by role subfolder."
---

# Agents

This is the retained native Claude-agent catalog. The stable v0.4 canonical definitions are under
`.agents/agents/`; generated plan-agent routes are the only declared adapter family here. Agents
are grouped into role subfolders below; open a group's own `README.md` for its member agents.
Start with [AGENTS.md](../../AGENTS.md) for repository rules and
[the canonical skills catalog](../../.agents/skills/README.md) for reusable guidance — agents
execute work, skills provide the focused knowledge they use.

- [AyoKoding-Web Content](./apps-ayokoding-www/README.md) — Agents that create, validate, and fix ayokoding-web tutorial and content surfaces (By Example, Primer, Annotated-concept, In-the-Field, facts, links, deploy).
- [App Deployers](./apps-deployers/README.md) — Deployer agents that push each app to its staging or production environment branch after validation.
- [OSE-Web Content](./apps-ose-www-content/README.md) — Agents that create, check, and fix ose-web Next.js content-layer content.
- [Docs](./docs/README.md) — Agents that create, check, fix, and manage docs/ documentation, tutorials, and file organization.
- [General](./general/README.md) — Cross-cutting agents scoped to no single app or domain: agent scaffolding, API exploratory testing, CI standards, and social posts.
- [PDF to Markdown](./pdf-to-md/README.md) — Agents that convert PDF sources to verbatim Markdown and validate or fix the conversion.
- [Plan](../../.agents/agents/README.md) — Canonical agents that create, check, and validate execution of project plans.
- [PR Review](./pr-review/README.md) — The PR-review pipeline: risk-tier scout, nine discipline specialists, a synthesis coordinator, and a fixer.
- [README Tooling](./readme-agents/README.md) — Agents that create, check, and fix README.md content quality.
- [Repo Governance](./repo/README.md) — Repository-wide agents: rules and workflow governance, harness-compatibility parity, and plan Phase-0 setup.
- [Specs](./specs/README.md) — Agents that create and validate specs/ Gherkin feature areas and structure.
- [SWE Language Dev](./swe/README.md) — Language-specific development agents plus UI and code-quality checkers and fixers.
- [Web](./web/README.md) — Live-site testers (design, exploratory, usability) and the web-researcher fact-finding agent.

## How the roles fit together

Most delivery work follows a maker → checker → fixer loop: a `*-maker` produces an artifact, the
matching `*-checker` audits it and writes a report, and the matching `*-fixer` applies validated
fixes from that report before re-checking. Not every group has all three roles — some (deployers,
PR review) are single-purpose pipelines instead.

## Naming and definition format

Every agent file's `name:` frontmatter is its identity — Claude Code discovers agents recursively
by that field, not by file path, so grouping into subfolders does not break discovery. `name`
must stay globally unique across the whole tree. OpenCode has no subfolder discovery, so
`./rhino harness adapters generate` emits flat agent files into `.opencode/agents/` for the
canonical agents in `.agents/agents/`; the same run emits Codex agent files under `.codex/agents/`,
the Claude routes under `.claude/agents/plan/`, and one pointer per canonical skill under
`.claude/skills/`. Generated filenames derive from `name`.

## Source and generated bindings

`.claude/agents/` is the source of truth. Mirrors are generated, never hand-edited — see
[Generated bindings](../../docs/reference/platform-bindings.md#generated-bindings) for the sync
workflow and [Translation Artifacts](../../docs/reference/platform-bindings.md#translation-artifacts)
for the format differences.
