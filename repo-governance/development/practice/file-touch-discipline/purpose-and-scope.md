---
description: The three observed failure modes that motivate File-Touch Discipline, and exactly what mutating operations and repositories this practice covers
when_to_use: Use when you need to understand why File-Touch Discipline exists, or to check whether a specific kind of work (read-only, delegated, generated) is covered by it.
---

# Purpose and Scope

Three failure modes, each observed in this repository family rather than hypothesized.

1. **Compaction amnesia.** An agent edits eleven files, its context is compacted, and the summary
   preserves the _conclusions_ while dropping the _inventory_. The agent resumes, runs
   `git status`, sees fourteen modified files, and reasonably infers all fourteen are its own. Three
   belonged to a human who had a branch open in another worktree. This is the failure this practice
   exists for: the record is precisely the kind of detail summarization discards, because it reads
   like bookkeeping rather than substance.

2. **Misattributed dirty state.** `git status` reports the **union of every actor's work** in that
   tree. It is not, and has never been, a report of what you did. Treating it as one is the single
   most common route into the failure — and it feels like verification, which is what makes it
   dangerous.

3. **Tidying.** An agent notices a file that looks stray, unrelated, or half-finished and "cleans it
   up" — reverts it, deletes it, stashes it, or reformats it in passing. It was another actor's
   in-flight work. Uncommitted changes have no undo history; git cannot recover what was never
   committed.

## Scope

### What This Practice Covers

- **Every session, in every OSE repository** — `ose-public`, the private sibling — and in
  every location within them: worktrees, feature branches, and local `main`.
- **Every mutating operation**, not only git verbs: `Write`, `Edit`, file creation, `rm`, `mv`,
  formatter and codemod runs, generator output, and every git command that alters the working tree,
  the index, or the stash.
- **Delegated work.** A subagent's mutations belong on a ledger too — see Standards 7-8.

### What This Practice Does NOT Cover

- Read-only work. Reading, grepping, and browsing touch nothing and need no ledger.

Generated files are **not** exempt. A file a tool regenerates on your behalf is a file you touched,
one level removed — see Standard 9.
