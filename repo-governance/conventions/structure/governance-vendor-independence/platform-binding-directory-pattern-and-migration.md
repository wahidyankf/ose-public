---
description: The catalog of per-platform binding directories and root instruction files, plus the step-by-step process for refactoring an existing governance file to be vendor-neutral.
when_to_use: Use when you need the catalog of platform-binding directories, or the step-by-step process for scrubbing vendor terms from an existing governance file.
---

# Platform Binding Directory Pattern, and Migration Guidance

## Platform Binding Directory Pattern

Each AI coding platform that integrates with this repository has a dedicated binding directory at the repo root:

| Platform         | Binding paths                                                          | Root instruction file            | Harness tier |
| ---------------- | ---------------------------------------------------------------------- | -------------------------------- | ------------ |
| Claude Code      | `.claude/`                                                             | `CLAUDE.md` (shim → `AGENTS.md`) | source       |
| OpenCode         | `.opencode/agents/`; vendored config                                   | `AGENTS.md` (read natively)      | generated    |
| OpenAI Codex CLI | `.codex/agents/`; generated and vendored paths under `.agents/skills/` | `AGENTS.md` (read natively)      | generated    |

The `harness:` registry in `repo-config.yml` is authoritative for this table's membership and for
path-level `source`, `generated`, or `vendored` ownership. Harness tier does not make every path in
its binding root generated. A platform absent from that registry is not supported, whatever a
binding directory's presence on some other machine might suggest.

Governance prose may name these binding directories directly — a path is not a vendor term. It must
not name the vendor product behind a directory; use "the platform binding" or the Vocabulary Map.

See [`docs/reference/platform-bindings.md`](../../../../docs/reference/platform-bindings.md) for the full catalog.

## Migration Guidance

To refactor an existing governance file:

1. **Scan**: run `./rhino governance vendor validate`. It lists every file and term it finds; there is
   no ad-hoc regex to maintain.
2. **Classify each match**:
   - Load-bearing prose → rewrite using the [Vocabulary Map](./vocabulary-map.md).
   - Cross-reference link → rewrite anchor text and link target to the neutral equivalent.
   - Illustrative example → make it neutral, or move it to a Platform Binding Examples page.
   - A Platform Binding Examples page or section that must name the vendor → add a per-file
     vocabulary exception for each term it names (see [Allowlist Mechanism](./allowlist-mechanism.md)).
   - Binding directory path → leave it; paths are allowed.
3. **Verify**: re-run the validator; expect exit code 0.
4. **Lint**: `npm run lint:md:fix` then `npm run lint:md`.
5. **Commit**: one commit per file (or per logical group within a phase).
