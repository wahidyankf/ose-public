# AyoKoding Web — `content/en/learn/` Reorganization

**Status**: in-progress
**Scope**: `apps/ayokoding-web/` (single-subrepo, ose-public only)
**Worktree**: `worktrees/ayokoding-web-learn-reorg/` (per [Worktree Path](../../../repo-governance/conventions/structure/worktree-path.md))

## Problem in One Sentence

`apps/ayokoding-web/content/en/learn/` has grown to 1117 markdown files across 6 top-level domains with inconsistent vocabulary (`by-concept` vs `concepts/explanation` vs `foundations`), fake-namespacing folder names (`platform-linux` instead of `platforms/linux`), and overlapping areas (`software-architecture` vs `system-design`), confusing both readers and the maker/checker/fixer agent family.

## Goal in One Sentence

Lock a single canonical three-track structure (`overview.md` + `by-concept/` + `by-example/` + `in-the-field/`) at every leaf topic, normalize folder names to real hierarchy, and ship a redirect map so no inbound link breaks.

## Documents

- [`brd.md`](./brd.md) — Business rationale: why now, what success looks like, what we lose if we skip
- [`prd.md`](./prd.md) — Product requirements + Gherkin acceptance criteria
- [`tech-docs.md`](./tech-docs.md) — How: path-migration map, scripts, redirect strategy, link-validation gates
- [`delivery.md`](./delivery.md) — Step-by-step TDD-shaped checklist (the executor's working file)

## Quick Numbers

| Domain                     | Files | Top issue                                                                          |
| -------------------------- | ----: | ---------------------------------------------------------------------------------- |
| `software-engineering/`    |   954 | `platform-*` prefix namespacing, `software-architecture` ↔ `system-design` overlap |
| `artificial-intelligence/` |    55 | clean; just-refactored, used as the reference shape                                |
| `human/`                   |    50 | domain name vague, single area (`tools/cliftonstrengths`)                          |
| `information-security/`    |    45 | uses `concepts/explanation/` + `foundations/`, not the three-track vocab           |
| `it-governance/`           |     9 | thin but coherent                                                                  |
| `business/`                |     4 | placeholder; reorg in scope but not the focus                                      |

Total: ~1117 markdown files. Estimated file moves: ~80-120 directories renamed/relocated. Redirects required: ~150-250 URL entries (the figure is bounded above by directory-rename count × average topic depth, not by file count, because most renames are folder-level).

## Out of Scope

- Indonesian (`content/id/`) — separate plan if needed; English-first per `apps-ayokoding-web-developing-content` skill
- New content authoring — this plan only restructures existing content
- Hugo-era residual cleanup — already done in commits `2cd845b05` and `9035b41d9` (2026-05-22)
- `ose-web`, `wahidyankf-web`, `organiclever-web` — different sites, different content trees

## Success Definition

1. Every leaf topic under `learn/` matches the canonical shape: `<topic>/overview.md` + one or more of `{by-concept,by-example,in-the-field}/`.
2. No `concepts/explanation/`, `foundations/`, `cases/` folders remain (their contents folded into the three-track folders).
3. No `platform-<name>/` folders remain; `platforms/<name>/` is the shape.
4. `ayokoding-cli links check` reports zero broken links.
5. `generate-indexes.ts --validate` reports zero stale `_index.md` files.
6. A redirect table covers every renamed URL; Next.js serves redirects in production.
7. `nx run ayokoding-web:test:quick` passes (current threshold: 82% line coverage).

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
