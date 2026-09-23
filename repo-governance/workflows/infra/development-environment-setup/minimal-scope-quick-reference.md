---
description: "Table mapping scope=minimal to the specific phases/steps and tools it installs (core TypeScript development only), and what doctor reports afterwards."
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

`npm run doctor` has no minimal mode. It probes every toolchain declared in `repo-config.yml`, so
after a minimal setup it reports the language toolchains this scope skips (Go, .NET, Java, and the
formatters in Phases 2.4 and 4 through 10). Treat those findings as expected, not as setup failure.

The skipped formatters matter only when you stage a file they own: `scripts/format-staged` fails
pre-commit on a machine that lacks the formatter for a staged file's extension. Add the matching
phase if you edit course code, or Phase 6 for FERRET.
