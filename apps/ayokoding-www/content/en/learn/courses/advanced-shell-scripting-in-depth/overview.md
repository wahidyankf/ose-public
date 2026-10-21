---
title: "Overview"
date: 2026-10-21T00:00:00+07:00
draft: false
weight: 1
---

A shell script that silently ignores its own errors is a shell script waiting to corrupt production. This course teaches the opposite discipline across seventy-eight small, independently runnable Bash scripts: strict error handling that fails loudly, option parsing that validates, child-process control with traps and signal handlers, portable idioms that behave identically on the pinned Debian toolchain, and fixture-based tests that pin every behaviour to a golden file.

## Why this exists -- the big idea

**The problem before the solution**: the primer course teaches pipes, redirection, and variables, and the text-processing course teaches awk, sed, and jq. Nobody teaches the engineering around them: robust option parsing, strict error handling, process control, and portable scripting idioms at production depth. Scripts grow from five lines to five hundred without ever gaining a header, a trap, or a test, and then they fail at 3am in ways that take hours to untangle.

**Keep this if you forget everything else**: `set -euo pipefail` is the default, not an afterthought. Every script in this course starts from that line, and every idiom in this course assumes it.

## What you will be able to do

After this course you can write scripts with strict error handling and explain what each flag changes; parse command-line options and arguments robustly, including long options and defaults; control child processes with job control, signal handling, and cleanup traps; write portable scripts that behave the same across the pinned shell toolchain's tools; and debug a failing script systematically with traces and fixture-based tests instead of stray echo statements.

## How this course is organized

[Learning](/en/learn/courses/advanced-shell-scripting-in-depth/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1-25) sets the strict header, parses options, and masters quoting; Intermediate (Examples 26-53) traps cleanup, wields arrays, and feeds loops by redirection; Advanced (Examples 54-78) controls jobs and signals, writes portably, and tests everything against fixtures. The [capstone](/en/learn/courses/advanced-shell-scripting-in-depth/learning/capstone/overview) builds a deployment-helper CLI that combines parsing, traps, signal handling, and a verified transcript, and [drilling](/en/learn/courses/advanced-shell-scripting-in-depth/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-bash](/en/learn/courses/just-enough-bash/learning/overview) for pipes, redirection, variables, and strict mode basics. Assumed knowledge: running commands in a shell, sending output through pipes, redirecting to files, and quoting arguments with spaces. Every example here is a Bash script, so the primer earns its place from the first page.

## About the examples

Every example is a real Bash script executed by the course harness against the pinned Debian shell toolchain with no network. Demos that need arguments install fixed demo argv with `set --` so the recorded output is byte-stable; nothing reads the live system — fixtures ship beside each script and temporary files live under /tmp behind EXIT traps. Self-signals stand in for keyboards and orchestrators deterministically. Outputs are recorded golden files; the lesson embeds every file byte-identically.

## References

- GNU Bash manual (command execution, expansion, job control, signal handling). Accessed 2026-10-21. [Bash manual](https://www.gnu.org/software/bash/manual/)
- POSIX shell command language (portable syntax, test utility, getopts). Accessed 2026-10-21. [POSIX sh](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html)
- ShellCheck wiki (quoting, conditionals, common mistakes SC2086 and related). Accessed 2026-10-21. [ShellCheck](https://www.shellcheck.net/)
- The pinned Debian shell toolchain (bash, coreutils, git, jq, sqlite3) is the source of truth for any tool-specific behaviour.
