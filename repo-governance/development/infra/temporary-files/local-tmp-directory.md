---
description: What local-tmp/ is for, its per-family layout, and the predicates for reclaiming anything inside it.
when_to_use: Use when deciding if a file belongs in local-tmp/.
---

# `local-tmp/`

**Use for**: everything an agent produces for itself or for another agent — anything that fails the
two-question test in [The Rule](./overview-and-the-rule.md).

**Examples**:

- Checker audit reports, fixer reports, and execution verification reports — the reader is the next
  agent, not a human
- Draft files before finalizing, and scratch notes or calculations
- Temporary data processing files and intermediate build artifacts

## Layout: `local-tmp/<agent-family>/`

Agent artifacts go under a per-family directory: `local-tmp/<agent-family>/`.

**The family token is declared, never derived.** Each agent states its own `<agent-family>` in its
Markdown body. The token is never inferred from a report filename, from a folder name, or from the
agent's own name. Where a historical report-filename prefix disagrees with an agent's declared
family, **the declaration wins** — the filenames record what an older convention spelled, not what
the family is. A declaration's scope is one repository: the same collision may legitimately
resolve to different tokens in `ose-public` and the private sibling, and neither reads the other's.

**Agents create their own directory.** The tracked `.gitkeep` guarantees only that `local-tmp/`
itself exists. It does not create family subdirectories, so an agent runs
`mkdir -p local-tmp/<agent-family>/` before its first write rather than assuming the path is there.

**Cross-family state stays at the root.** State that belongs to no single family is not filed under
one, because the other families would not find it. Two instances:
`local-tmp/.known-false-positives.md`, the shared suppression ledger, and
`local-tmp/.execution-chain-{scope}`, whose parent-child chain spans families by construction.

**Naming pattern**: report files keep the existing 4-part pattern and their UUID chains; see
[Report File Naming Standard](./report-file-naming-standard.md). Only the parent directory changed.
Other scratch files need no strict pattern — use descriptive names.

**The directory always exists.** A tracked `local-tmp/.gitkeep` guarantees it in every clone and
worktree, so a tool that writes here never has to create it first and never fails on a missing path.
`.gitignore` ignores `local-tmp/*` and re-includes only the `.gitkeep` — everything else you put
here stays untracked. Do not delete the `.gitkeep`, and do not commit anything else in this
directory.

**Example files**:

```
local-tmp/.known-false-positives.md
local-tmp/repo-rules/repo-rules__a1b2c3__2026-09-04--16-27__audit.md
local-tmp/docs/docs__d4e5f6__2026-09-04--16-31__fix.md
local-tmp/draft-convention.md
local-tmp/scratch-notes.txt
```

**Retention**: entries are reclaimable **after 7 days without modification**, and reclaiming them is
a deliberate act — never automatic. The
[build-artifact sweeper](../build-artifact-sweeper.md) does **not** touch `local-tmp/` and must not
be extended to; the directory exists precisely to hold things no ambient process is allowed to
remove.

Before deleting anything here, confirm every one of the following. Each is machine-checkable, and a
path failing any single one stays:

1. It is regenerable build output — a directory named `.next`, `dist`, `out`, `build`, `target`, or
   `node_modules` (for `.next`, it also contains a `BUILD_ID`).
2. A specific command regenerates it, and that command is recorded alongside the path.
3. Its mtime is older than 7 days.
4. It neither sits under nor contains `generated-reports/`, any `.env*` file, any git-tracked file,
   any path inside a `git worktree list` entry, or any `.git` directory.
5. No git-tracked file in either OSE repo references its path.

**Renamed captures are not artifacts.** A build directory that was renamed to record _what it
demonstrates_ — `plan04-next-webpack-failed`, `plan04-next-overlap-failure` — is evidence, and
predicate 2 is what excludes it: no command regenerates a particular past failure state. Rename
deliberately when you want output preserved, and it will fail predicate 1 on name and predicate 2 on
substance.

Reclaim by **moving** to a dated quarantine (`local-tmp/.reclaim-quarantine-YYYY-MM-DD/`) first,
then proving nothing load-bearing moved (`npm run doctor -- --fix`,
`./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run rhino-cli:test:quick`, and
`./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- affected -t build` all exit 0), and
only then deleting. Until that proof passes, the whole operation is one `mv` from undone.
