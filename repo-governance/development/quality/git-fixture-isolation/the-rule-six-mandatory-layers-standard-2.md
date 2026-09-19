---
description: "Standard 2: no ambient discovery (explicit GIT_DIR)."
when_to_use: "Use when implementing explicit GIT_DIR targeting in a fixture."
---

# The Rule: Six Mandatory Layers (Standard 2)

## Standard 2: No Ambient Discovery (explicit `GIT_DIR`)

Set explicit `GIT_DIR=<tempdir>/.git` (or the language equivalent) so `git` performs **zero**
upward discovery. Never rely on the process CWD (`Command::current_dir`, `exec.Cmd.Dir`, `cwd:` in
`child_process`, `cwd=` in `subprocess`, `ProcessStartInfo.WorkingDirectory`) to select the
repository.

```rust
cmd.env("GIT_DIR", tempdir.path().join(".git"));
```

**Why**: This is the layer that most directly closes the CWD-race vector from the motivating
incident. When `GIT_DIR` is set, `git` does not consult the current working directory to decide
which repository to operate on at all -- discovery is bypassed entirely, in favor of the explicit
path given. A concurrent `set_current_dir` call racing against this command has no effect on which
repository it targets, because the command never looks at CWD to begin with. This is also the layer
that keeps a plain `git config user.name` (a **local**-scoped write by default) confined to the
fixture's own `.git/config` -- with `GIT_DIR` correct, there is no other local config file for that
write to land in.

**On `GIT_WORK_TREE`**: pinning `GIT_WORK_TREE=<tempdir>` is **optional** and, for two common cases,
must be **omitted**:

- **`git worktree add`** derives the linked worktree's location from its explicit path argument; a
  set `GIT_WORK_TREE` misdirects it, so leave it unset for that subcommand (explicit `GIT_DIR` alone
  still isolates the write).
- **The Standard 4 escape guard** relies on `git rev-parse --show-toplevel` genuinely resolving the
  work tree from `GIT_DIR`. A set `GIT_WORK_TREE` makes `--show-toplevel` merely echo that variable,
  rendering the guard tautological and useless.

For plain write sequences (`init`/`add`/`commit`/`config`) with the fixture's CWD already at the
tempdir root, explicit `GIT_DIR` is sufficient; `GIT_WORK_TREE` adds nothing there either. The
the retired in-tree reference fixtures therefore set `GIT_DIR` but not `GIT_WORK_TREE`.
