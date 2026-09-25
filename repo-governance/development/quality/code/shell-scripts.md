---
description: >-
  Requires repository shell scripts to run under one declared interpreter in strict mode, to be committed as executable,
  to explain themselves in comments, and to check JSON with a real parser before relying on it.
when_to_use: >-
  Use when writing, reviewing, or adding a shell script, including a hook script or a script a pipeline calls.
---

# Shell Scripts

A shell script in a repository runs in hooks, in pipelines, and on contributors' machines, usually with nobody reading
its output. The shell's defaults suit an interactive prompt, where a person sees each failure as it happens. In a script
they let one failed command pass unnoticed while everything after it runs on a broken state.

This standard implements Fail Closed,
[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md), and
[Reproducibility](../../../principles/software-engineering/reproducibility.md). The severity at which a shell linter fails is owned by
[Lint Strictness](../cross-language-lint-strictness.md).

## One Declared Interpreter

Every script runs under the one interpreter the repository declares, and says so on its first line. Shells differ in
arrays, test syntax, and quoting, and a script written for one dialect often runs under another with no error while
doing something different. Declaring a single interpreter removes that whole class of difference.

Which interpreter is an adopter decision:

| Option                                                      | Gains                                                                        | Costs                                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Bash, with `set -euo pipefail` (default)                    | a widely installed shell with arrays and a flag that fails a broken pipeline | missing from some minimal images and systems, where it has to be installed first                        |
| another declared interpreter, with its strict-mode settings | fits a platform where Bash is unavailable or unwanted                        | contributors learn a second dialect's failure rules, and the strict-mode table needs its own equivalent |

## Strict Mode

Every script runs in strict mode. Under the default interpreter that is:

```bash
set -euo pipefail
```

| Option        | Effect                                                           |
| ------------- | ---------------------------------------------------------------- |
| `-e`          | a command that fails stops the script                            |
| `-u`          | expanding a variable that was never set is an error, not empty   |
| `-o pipefail` | a pipeline fails when any command in it fails, not only the last |

Without these, a mistyped variable name becomes an empty path, and a failed download piped into a parser reports
success. With them, the script stops at the first thing that went wrong, which is where diagnosis has to start.

## Committed as Executable

The file mode is part of what version control records, so the executable bit is committed with the script. A missing bit
otherwise shows up as a permission failure on the next machine or pipeline that runs the script, far from the change
that dropped it.

## Comments Say What and Why

Each script carries descriptive comments: what it is for, and why a step whose reason is not evident from the code is
shaped the way it is.

Comments do not narrate each line. They hold what the code cannot show.

## JSON Is Parsed, Not Matched

A script that reads or writes JSON checks it with a real parser, such as `jq`, and stops when the document is invalid or
lacks the field it relies on. Treating JSON as text to search breaks on whitespace, key order, and escaping, and it
fails by quietly extracting the wrong value rather than by stopping.

## Output Inspection Must Not Interrupt Mutation

A state-changing command must finish independently of any reader allowed to stop before consuming all output. Capture
the command's output, wait for its exit, then inspect the captured result. Piping a mutation directly into `head`,
`grep -m`, or another early-exiting reader can close the pipe and interrupt a partly completed change. Review enforces
this rule; no portable linter can identify every state-changing producer.

## Enforcement

Review applies these rules. An adopter enforces the mechanical parts in its own hook or pipeline: the interpreter line,
the strict-mode setting, the committed file mode, and a shell linter at the threshold
[Lint Strictness](../cross-language-lint-strictness.md) sets.
