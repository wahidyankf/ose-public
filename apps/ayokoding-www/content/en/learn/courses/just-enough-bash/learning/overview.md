---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: Just Enough Nvim -- this primer builds on comfort with a terminal and editor
  from earlier topics in this journey, since every example here is a `.sh` file you open, edit, and
  save before running it.
- **Tools & environment**: a macOS/Linux terminal with **Bash** installed (verify with
  `bash --version`); the **`shellcheck`** and **`shfmt`** CLIs installed for static analysis and
  formatting; the standard Unix text tools (`grep`/`sed`/`awk`/`find`) that ship with any Unix-like
  system. Windows readers use WSL2. Bash, `shellcheck`, and `shfmt` are all Tier-1 OSS licenses
  (GPLv3+, GPLv3, and BSD-3-Clause respectively) -- free to teach and free to use.
- **Assumed knowledge**: basic terminal navigation (changing directories, listing files). No prior
  shell scripting experience is required.

## Why this exists -- the big idea

Every later topic in this journey drives builds, tests, and tooling from the terminal -- that is a
deliberate, repo-wide stance (DD-17), not an incidental detail. Without shell fluency, you cannot
glue those tools together, automate a repeated chore, or read what a build script is actually doing
when it fails. This primer exists to remove that blocker before it becomes one.

The one idea worth keeping if you forget everything else: small, single-purpose tools piped together
beat one big program. Each command does one thing -- `grep` finds lines, `sort` orders them, `awk`
extracts fields -- and the pipe (`|`) composes them into something bigger than any one tool alone.

**Cross-cutting big idea**: `coupling-vs-cohesion` -- the Unix pipeline is this idea in miniature.
`grep`, `sort`, and `awk` are each highly cohesive: every one does exactly one job, and does it well.
They are also loosely coupled: the only contract between them is a stream of plain text on stdin and
stdout, so you can insert, remove, or swap any single tool in a pipeline without touching the others.
A `cat file | grep pattern | sort` pipeline has no shared state, no shared types, and no compiled
interface binding its three stages together -- just text flowing through. That is the same trade-off
every larger software system makes between well-defined, focused units and the connections between
them, visible here at the smallest possible scale, one pipe character at a time.

## Install and run your first script

Confirm Bash is installed and check its version:

```text
$ bash --version
GNU bash, version 5.3.15(1)-release (aarch64-apple-darwin24.6.0)
Copyright (C) 2025 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

Bash's current stable line is **5.3** (first released 2025-07-30); the exact patch level
(`5.3.15` above) advances over time as Chet Ramey ships bug-fix releases, but the `5.3`
language-and-behavior surface this primer teaches stays the same across those patches. macOS ships
an old `bash` (3.2, frozen for licensing reasons) at `/bin/bash` by default -- install a current
Bash via your package manager (`brew install bash` on macOS, or your distribution's `bash` package
on Linux) if `bash --version` reports 3.x.

Every example in this primer is a complete, self-contained `.sh` file colocated under
`learning/code/`. The command you will run for every Beginner-tier example is exactly this:

```text
bash example.sh
```

## Interactive shells vs. scripts

_co-02 &middot; interactive-vs-script_

The same `bash` binary serves two different jobs, and this primer focuses on only one of them. Type
`bash` alone, or open a terminal, and you get an **interactive** shell: it prints a prompt, waits for
you to type a command, runs it, and prompts again. Run `bash file.sh` (or execute a file with its
shebang and execute bit, Example 1 and Example 2), and you get **script execution**: Bash reads the
whole file and runs it start to finish, with no prompting and no waiting for you between commands.
A script inherits the calling shell's exported environment variables (anything set with
`export NAME=value`) but does **not** inherit its unexported shell variables, functions, or aliases
-- a script starts from a clean slate except for what was explicitly exported into its environment.
This primer lives entirely in the script context, because that is the context every later topic's
build, test, and tooling automation runs in.

## How this primer is organized

- **Beginner** (Examples 1-28) -- the shebang line and making a script executable, strict mode
  (`set -euo pipefail`), the Bash-vs-POSIX distinction, variables and expansion, quoting, command
  substitution, arithmetic expansion, exit codes, conditionals (`if`/`elif`/`else` with string,
  numeric, and file tests), loops (`for`/`while`/`until` with `break`/`continue`), I/O redirection
  (`>`, `>>`, `2>`), and the basic pipe.
- **Intermediate** (Examples 29-60) -- `case` statements, functions with `local` scoping and return
  status, positional parameters (`$1`, `$@`, `$#`, `shift`), reading input (`read`, here-docs,
  here-strings), the classic text-pipeline tools (`grep`, `sed`, `awk`, `cut`, `sort`, `uniq`, `tr`,
  `find`, `xargs`), basic `getopts` option parsing, and `pipefail`.
- **Advanced** (Examples 61-83) -- `trap` and `mktemp` for cleanup and scratch files, regular
  expressions (BRE/ERE via `grep -E`/`sed -E`), arrays, parameter-expansion guards
  (`${v:?msg}`, `${p##*/}`), `shellcheck`/`shfmt` as static-analysis and formatting gates, robust
  `getopts`-based argument parsing, atomic temp-file-then-move patterns, a POSIX-portable script, and
  process substitution (`<(cmd)`).

## Scope: just enough, not comprehensive

This is a **Primer**, not a comprehensive Bash reference: it covers exactly the shell surface every
later topic in this journey needs to drive builds, tests, and tooling from the terminal. PowerShell
is deliberately out of scope here -- it is folded into a later Windows-OS topic -- and this primer is
Bash-only, not a guide to authoring in zsh, fish, or dash. It deliberately excludes shell job control
internals (`fg`/`bg`/`jobs` get only a passing mention, if any), `coproc`, advanced
parameter-expansion trivia beyond what is taught, `printf` format-string mastery beyond what
`echo`/`printf` already need, associative arrays (`declare -A`) beyond the array concept this primer
does teach, full `awk`/`sed` language mastery (only the slice needed for the text-pipeline examples),
and shell profile/rc-file configuration. If a Bash feature is not exercised by a later topic in this
journey, it is out of scope here on purpose, not by oversight.

Every claim about Bash, `shellcheck`, and `shfmt` versions in this primer traces to a primary
source, such as the tool's own documentation.

---

Next: [Beginner Examples](./beginner.md) →
