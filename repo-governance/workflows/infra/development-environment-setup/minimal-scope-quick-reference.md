---
description: "Table mapping scope=minimal to the specific phases/steps and tools it installs (core TypeScript development only)."
when_to_use: "Use when you only need a minimal environment for TypeScript work, not the full polyglot toolchain."
---

# Minimal Scope Quick Reference

For `scope: minimal` (core development only — TypeScript projects, git hooks, unit tests):

| Phase | Steps     | Tools Installed                  |
| ----- | --------- | -------------------------------- |
| 1     | 1.1-1.2   | Homebrew                         |
| 2     | 2.1-2.3   | Git, Docker, jq                  |
| 3     | 3.1-3.2   | Volta, Node.js 24, npm           |
| 11    | 11.1-11.4 | npm deps, env restore, git hooks |
| 12    | 12.1      | Playwright browsers              |
| 13    | 13.1-13.2 | Verification                     |

This covers: pre-commit hooks, pre-push hooks, TypeScript unit tests, and basic E2E tests.

Phase 4 (Go/Lua), Phase 6 (Python), and Phase 8 (Elixir/Erlang) are **not** in minimal scope —
Phases 4 and 8 exist only to format the AyoKoding course corpora, and Phase 6 also provisions the
Python toolchain the FERRET projects need. Add them if you edit course code (or, for Phase 6, FERRET),
or the matching `format-*` gate will fail at pre-commit on a machine that lacks the formatter.
