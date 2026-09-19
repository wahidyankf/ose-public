---
description: How the canonical spec tree varies by surface profile (full-stack/web-only/CLI/library), the rules for creating new corpora, and the five-folder-to-corpus migration path.
when_to_use: Use when determining which corpora a given app profile needs, or migrating a five-folder spec tree to the logical owner corpus.
---

# Standard 4 — Spec Tree Shape: Per-Surface Variants, Creation Rules, and Migration

## Per-surface variant table

| Surface profile | Owners                                           | `contracts/`                  |
| --------------- | ------------------------------------------------ | ----------------------------- |
| Full-stack      | one per client, one per service                  | in the service that serves it |
| Web-only        | one per deployed site                            | absent                        |
| CLI-only        | one per binary                                   | absent                        |
| Library         | none — the three entries sit at the library root | absent                        |

One owner per **deployed** surface. Two perspectives on one process — a site's pages and the API
running inside it — are one owner whose `behaviours/` nests them as `frontend/` and `backend/`.

## Creation rules

- An owner exists only once something deploys it. Do not pre-create a corpus for a planned surface.
- Every corpus carries all three entries. A `behaviours/` with no feature file is an owner that
  declares no behaviour, which is an owner nothing can prove.
- Every directory holding children carries a `README.md` indexing them.
- An owner MAY carry more than the three required entries — an API reference, a routes inventory —
  when that document says something `architecture.md` does not.

## Standard 4.5 — Migration path (five-folder to logical owner corpus)

Full procedure and path mapping:
[Migration Path](../specs-directory-structure/migration-path.md). In outline:

1. Decide the owners first, from what deploys rather than from what the old `behaviour/` folders
   were called.
2. In one atomic commit: move each `gherkin/` tree to its owner's `behaviours/`, move any
   `containers/contracts/` into the owner that serves it, write each `README.md` and
   `architecture.md`, delete the retired folders, and update every path reference.
3. Verify with `the declared spec-tree check` and
   `the declared spec-count check`.

The commit MUST be atomic. A retired folder surviving beside a corpus is itself a HIGH finding, so
a half-finished move cannot sit unnoticed.
