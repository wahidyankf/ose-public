# In-Progress Plans

Active project plans currently being worked on.

## Active Plans

- [2026-05-02 — OrganicLever DDD Adoption](./2026-05-02__organiclever-adopt-ddd/README.md) — restructure `apps/organiclever-web` and `specs/apps/organiclever` around explicit bounded contexts and ubiquitous language.
- [2026-05-02 — OrganicLever rhino-cli DDD Enforcement + Skill Extension](./2026-05-02__organiclever-rhino-cli-ddd-enforcement/README.md) — add `rhino-cli bc validate` and `rhino-cli ul validate` subcommands as the mechanical drift gate, plus extend the `apps-organiclever-web-developing-content` skill with a Domain-Driven Design section. **Hard serial dependency**: the OrganicLever DDD Adoption plan above MUST be fully complete and archived to `done/` before this plan starts.
- [2026-05-02 — Governance Vendor-Independence Refactor](./2026-05-02__governance-vendor-independence/README.md) — neutralize `governance/` vocabulary so it is usable by any AI coding agent (Claude Code, OpenCode, Cursor, Codex CLI, Gemini CLI, Copilot, Aider) and human contributors; introduce `AGENTS.md` as canonical root instruction file; push vendor-specific bindings out to `.claude/`, `.opencode/`, and `docs/reference/platform-bindings.md`; add a `rhino-cli governance vendor-audit` validator.

## Instructions

**Quick Idea Capture**: For 1-3 liner ideas not ready for formal planning, use `../ideas.md`.

When starting work on a plan:

1. Move the plan folder from `backlog/` to `in-progress/`
2. Update the plan's README.md status to "In Progress"
3. Add the plan to this list

When completing a plan:

1. Move the plan folder from `in-progress/` to `done/`
2. Update this list
