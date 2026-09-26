---
description: Why governance prose must be vendor-neutral, and exactly which files (repo-governance/, AGENTS.md, CLAUDE.md) this convention governs vs. exempts.
when_to_use: Use when checking whether a file or line falls inside the vendor-independence convention's scope.
---

# Purpose and Scope

## Purpose

`repo-governance/` contains the rules every contributor follows regardless of toolchain. When vendor, product, or model names appear in governance prose, they:

- Exclude contributors using any coding agent other than the one a rule's author happened to have open.
- Couple governance correctness to a specific vendor's product lifecycle.
- Create maintenance debt when vendor names or APIs change.

This convention separates **vendor-neutral governance** (the rules) from **platform bindings** (the vendor-specific wiring that executes the rules) by pushing all binding details out of `repo-governance/` and into the appropriate platform-binding directory.

## Scope

**Applies to**: every file under `repo-governance/`, **plus the canonical root instruction surfaces** — the `roots` of `policies.governance.vendor` in `repo-config.yml`:

- `AGENTS.md` — canonical root instruction file (read natively by OpenCode, OpenAI Codex CLI, and other AGENTS.md-aware coding agents). Vendor-neutrality here is the load-bearing surface for cross-vendor behavioural parity.
- `CLAUDE.md` — Claude Code shim. While CLAUDE.md is itself a Claude-Code platform binding artifact (its filename names the vendor by design), its **prose body** must be vendor-neutral by the same standard as `repo-governance/`. CLAUDE.md holds only the `@AGENTS.md` import directive, which names no vendor. Its vendor-specific clarifications live in the [Platform Bindings Catalog](../../../../docs/reference/platform-bindings.md), never in the shim.

**Binding directory paths are not in scope as terms.** Any governed file may name `.agents/`,
`.claude/`, `.codex/`, `.opencode/`, or another binding path; only vendor, product, and model names
are forbidden.

**Out of scope** (vendor terms are intentionally present here):

- `.claude/`, `.opencode/`, `.codex/`, `.agents/` — platform-binding roots with path-level
  `source`, `generated`, or `vendored` ownership declared by `repo-config.yml`; vendor terms are
  expected throughout these roots regardless of ownership class.
- `docs/reference/platform-bindings.md` — catalog of all platform bindings; references them by necessity.
- `plans/` — planning documents; may reference vendor specifics when discussing implementation details.
