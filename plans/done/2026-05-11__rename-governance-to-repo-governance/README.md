# Rename `governance/` → `repo-governance/`

## Status

Completed 2026-05-11

## Context

The `repo-governance/` directory name is ambiguous: in enterprise contexts, "governance" is a core GRC
(Governance, Risk & Compliance) discipline with its own tooling, frameworks, and teams. Contributors
or tooling searching for GRC artifacts may mistake this directory for that. Renaming to
`repo-governance/` makes the scope unambiguous — this directory governs the **repository**, not a
business compliance program.

## Scope

| Area             | Detail                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **In scope**     | Rename `governance/` → `repo-governance/` in `ose-public`; update all path references                                                                            |
| **In scope**     | Update `~/ose-projects/CLAUDE.md` (parent repo, 1 ref — the `ose-public/repo-governance/` occurrence; the parent's own `./repo-governance/` refs are unaffected) |
| **Out of scope** | Any content changes inside governance files                                                                                                                      |
| **Out of scope** | `ose-infra`, `ose-primer` repos (separate governance trees)                                                                                                      |

## Approach Summary

1. `git mv governance repo-governance` in `ose-public`
2. Mass `sed` replace `governance/` → `repo-governance/` across all text files (excluding
   `.git/`, `node_modules/`, `.nx/workspace-data/`, `worktrees/`, `*.out`)
3. Update parent `CLAUDE.md` separately
4. Verify functional files (`.husky/pre-push`, shell scripts, Go source, `project.json`)
5. Run quality gates, push, verify CI

## Documents

- [brd.md](./brd.md) — Business rationale
- [prd.md](./prd.md) — Requirements and acceptance criteria
- [tech-docs.md](./tech-docs.md) — Technical design and file impact
- [delivery.md](./delivery.md) — Step-by-step execution checklist
