---
description: The concrete, per-harness file names and binding-tier assignments that instantiate the Multi-Harness Binding Convention's rules — vendor-specific content, exempt from the vendor-audit scanner under this heading.
when_to_use: Read this when you need the actual file names that shadow AGENTS.md, or the current per-harness Tier-1/Tier-2 assignment for a specific coding-agent harness.
---

# Platform Binding Examples

The content below this heading is intentionally vendor-specific. The vendor-audit scanner skips
every line under this heading until the next same-level heading or end of file. Part of the
[Multi-Harness Binding Convention](../multi-harness-binding.md).

## Files that trigger the No-Shadowing Rule (Rule 3)

The following file name is known to be ranked above `AGENTS.md` by a supported harness as of
2026-08-19. It must not be committed with content that diverges from `AGENTS.md`.

- `AGENTS.override.md` — OpenAI Codex CLI ranks this above `AGENTS.md` when present.

## Source tier — the one hand-authored origin

- **Claude Code** — reads `CLAUDE.md` as its primary instruction file. The repo provides `CLAUDE.md`
  as a one-line `@AGENTS.md` import shim (hand-authored pure pointer; exempt from the generator
  requirement because the `@`-import directive is the full content and cannot drift). The
  `.agents/agents/` and `.agents/skills/` trees are the single hand-authored origin every generated
  binding derives from; `.claude/agents/` holds one generated route per canonical agent.

## Generated tier — mirrors derived from the source tier

- **OpenCode** — reads `AGENTS.md` natively. Agent routes for the agents its profile selects are
  generated from `.agents/agents/` into `.opencode/agents/` by `./rhino harness adapters generate`; agent skill
  files are read natively from `.agents/skills/`.
- **OpenAI Codex CLI** — reads `AGENTS.md` natively since April 2025. Agent routes for the agents its
  profile selects are generated at `.codex/agents/` from `.agents/agents/`, and non-vendored skills are mirrored under
  `.agents/skills/`, both by `./rhino harness adapters generate`. Registry-declared plugin
  subtrees under the same skills root are vendored and preserved in place.

There is no `native` tier and no `source-config` tier: a harness is either the single source tier or
a generated tier. That harness-level tier does not replace path-level ownership; generated-tier
roots may contain vendored paths. The authoritative list of supported harnesses, tiers, and path
ownership is the `harness:` registry in `repo-config.yml` — this document describes the model, the
registry decides the membership.
