---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Just Enough Bash primer: five fixed drills that
force active recall instead of passive re-reading. Work through them in order -- short-answer
recall first, then scenario judgment, then hands-on repetition, then a checklist to confirm real
automaticity, and finally why/why-not prompts that test whether you can explain the reasoning, not
just execute the syntax. Every answer is hidden in a `<details>` block; try each item yourself
before opening it.

## Recall Q&A

Twenty-six short-answer questions, one per concept (`co-01` through `co-26`). Answer from memory,
then check.

**Q1 (co-01 -- shebang-and-execution).** What two things make a `.sh` file a directly runnable
program, and what's the alternative if you skip both?

<details>
<summary>Answer</summary>

A `#!/usr/bin/env bash` shebang line as the file's first line, plus `chmod +x file.sh` to set the
executable bit -- together these let you run `./file.sh` directly. Skip either one and you can
still run the script by handing it to an interpreter explicitly: `bash file.sh`.

</details>

**Q2 (co-02 -- interactive-vs-script).** What's the key behavioral difference between Bash running
interactively at a prompt and Bash running a script non-interactively?

<details>
<summary>Answer</summary>

The same `bash` binary serves both, but a non-interactive script runs start-to-finish without
prompting for input at each command, and it inherits the calling shell's exported environment
variables -- not its unexported shell variables, aliases, or shell functions (unless those are
also exported).

</details>

**Q3 (co-03 -- strict-mode).** What does each of the three flags in `set -euo pipefail` do on its
own?

<details>
<summary>Answer</summary>

`-e` aborts the script the moment any command exits non-zero (outside a conditional context);
`-u` treats a reference to an unset variable as an error instead of silently expanding to an empty
string; `-o pipefail` makes a pipeline's exit status the first non-zero status among all its
stages, not just the last one.

</details>

**Q4 (co-04 -- bash-vs-posix).** Name three syntax features Bash adds on top of portable POSIX
`sh`.

<details>
<summary>Answer</summary>

`[[ ]]` (the extended conditional), arrays (`arr=(a b c)`), and `<<<` here-strings are all Bash
extensions absent from the POSIX Shell Command Language standard -- a script that needs to run
under `dash`/`sh` on a minimal system cannot use any of them.

</details>

**Q5 (co-05 -- variables-and-expansion).** What does `${v:-default}` do differently from plain
`$v` when `v` is unset?

<details>
<summary>Answer</summary>

`$v` alone expands to an empty string when `v` is unset (or errors under `set -u`); `${v:-default}`
expands to `default` instead, without changing `v` itself -- a one-line way to supply a fallback
value at the point of use.

</details>

**Q6 (co-06 -- quoting).** What's the practical difference between single quotes, double quotes,
and no quotes around `$var` in Bash?

<details>
<summary>Answer</summary>

Single quotes are fully literal -- `$var` inside them never expands. Double quotes expand `$var`
but preserve it as one word, spaces and all. No quotes at all expands `$var` and then subjects the
result to word-splitting and glob-expansion -- the single most common source of real Bash bugs.

</details>

**Q7 (co-07 -- command-substitution).** What does `$(...)` capture, and what's the older,
now-discouraged syntax for the same thing?

<details>
<summary>Answer</summary>

`$(...)` runs the enclosed command and substitutes its standard output (trailing newlines
stripped) into the surrounding context, e.g. `year="$(date +%Y)"`. The older syntax is backticks,
`` `...` ``, which nests awkwardly and is generally avoided in new code in favor of `$(...)`.

</details>

**Q8 (co-08 -- arithmetic-expansion).** What does `$(( ))` let you avoid calling?

<details>
<summary>Answer</summary>

`$(( 6 * 7 ))` evaluates integer arithmetic and comparisons directly in the shell, avoiding a call
out to the external `expr` command -- faster, and without `expr`'s fragile word-splitting-prone
argument syntax.

</details>

**Q9 (co-09 -- exit-codes).** What does exit code `0` mean, and how does a script set its own final
exit code?

<details>
<summary>Answer</summary>

`0` means success; any non-zero value (1-255) means some kind of failure, readable immediately
afterward via `$?`. A script sets its own final status either implicitly (the exit status of its
last command) or explicitly with `exit N`.

</details>

**Q10 (co-10 -- conditionals).** Name the three families of `if` test Bash supports and what each
tests.

<details>
<summary>Answer</summary>

String tests (`"$a" == "$b"`), numeric tests (`$n -gt 10`), and file tests (`-f path`, `-d path`)
can all appear inside `test`, `[ ]` (the same command, different invocation syntax), or `[[ ]]`
(the Bash-only extended form) -- `if` branches on whichever test's own exit status.

</details>

**Q11 (co-11 -- case-statement).** When is `case ... esac` a better choice than a chain of
`if`/`elif`?

<details>
<summary>Answer</summary>

When dispatching on one value against several glob-pattern alternatives (like a `start`/`stop`/`*`
command-line action) -- `case` reads as a flat, ordered list of patterns rather than a nested chain
of string comparisons, and each branch is visually self-contained.

</details>

**Q12 (co-12 -- loops).** Name Bash's three loop forms and what `break`/`continue` do inside any of
them.

<details>
<summary>Answer</summary>

`for` iterates over a list or range, `while` repeats as long as a condition stays true, `until`
repeats until a condition becomes true. `break` exits the loop immediately; `continue` skips the
rest of the current iteration's body and jumps to the next one.

</details>

**Q13 (co-13 -- functions).** What does `local` do inside a Bash function, and what happens if you
forget it?

<details>
<summary>Answer</summary>

`local varname=value` scopes a variable to the function it's declared in, restoring any same-named
outer variable once the function returns. Forget `local` and the assignment silently overwrites
(or creates) a global variable instead -- a real, easy-to-miss source of action-at-a-distance bugs.

</details>

**Q14 (co-14 -- io-redirection).** What's the difference between `>` and `>>`, and what does `2>&1`
do?

<details>
<summary>Answer</summary>

`>` truncates the target file and writes fresh content; `>>` appends to whatever is already there.
`2>&1` redirects file descriptor 2 (stderr) to wherever file descriptor 1 (stdout) currently
points -- order matters: it must come after any `>`/`>` redirection of stdout itself to merge
correctly into the same destination.

</details>

**Q15 (co-15 -- pipes).** What exactly does `|` connect between two commands?

<details>
<summary>Answer</summary>

`cmd1 | cmd2` connects `cmd1`'s standard output directly to `cmd2`'s standard input, running both
commands concurrently rather than staging `cmd1`'s full output through a temp file first -- this is
the composition mechanism the whole Unix-pipeline philosophy is built on.

</details>

**Q16 (co-16 -- here-docs-and-strings).** What's the difference between `<<EOF` and `<<'EOF'`, and
what does `<<<` do?

<details>
<summary>Answer</summary>

`<<EOF` (unquoted delimiter) expands variables and command substitutions inside the block; `<<'EOF'`
(quoted delimiter) treats the whole block as literal text, no expansion at all. `<<<"$text"` is a
here-string -- it feeds a single value as stdin to a command in one line, without a multi-line
block.

</details>

**Q17 (co-17 -- read-input).** What does the `-r` flag to `read` protect against?

<details>
<summary>Answer</summary>

Without `-r`, `read` treats a backslash in the input as a line-continuation/escape character and
silently mangles it; `read -r` reads the line completely raw, backslashes and all -- the
correct default for almost every real use of `read`.

</details>

**Q18 (co-18 -- text-pipeline-tools).** Name at least five of the single-purpose text tools this
primer chains together in pipelines, and what each one does in one phrase.

<details>
<summary>Answer</summary>

`grep` (filter lines matching a pattern), `sed` (stream-edit: substitute/delete lines), `awk`
(field-based text processing), `cut` (extract columns/fields), `sort` (order lines), `uniq`
(collapse/count adjacent duplicate lines), `tr` (translate/delete characters), `find` (locate
files), `xargs` (turn stdin lines into command arguments) -- nine tools, each doing one job well.

</details>

**Q19 (co-19 -- positional-parameters).** What's the difference between `"$@"` and `"$*"` when a
script has an argument containing a space, and what does `shift` do?

<details>
<summary>Answer</summary>

`"$@"` expands to each positional parameter as its OWN separate word, preserving internal spaces
inside any single argument; `"$*"` joins all of them into one single word separated by the first
character of `$IFS`. `shift` discards `$1` and renumbers every remaining parameter down by one,
the standard way to walk arguments in a loop.

</details>

**Q20 (co-20 -- getopts).** What does the leading `:` in an option string like `":i:o:h"` change
about `getopts`'s own error reporting?

<details>
<summary>Answer</summary>

Without the leading `:`, `getopts` prints its own "illegal option"/"option requires an argument"
messages and sets `opt` to `?`. With the leading `:` (silent mode), `getopts` stays quiet and
instead sets `opt` to `?` (unknown option, with the bad flag in `$OPTARG`) or `:` (known option
missing its required argument, with the flag name in `$OPTARG`) -- letting the script print its
own consistent usage message instead.

</details>

**Q21 (co-21 -- trap-and-cleanup).** What are the three signal/event names this primer's `trap`
examples register handlers for, and what does each cover?

<details>
<summary>Answer</summary>

`EXIT` fires on any script termination, normal or abnormal -- the standard place to register
cleanup. `INT` fires on `Ctrl-C`/`SIGINT`, letting a script react to an interrupt instead of dying
silently. `ERR` fires whenever a command fails under `set -e`, useful for printing exactly where a
failure happened (e.g. via `$LINENO`) before the script exits.

</details>

**Q22 (co-22 -- mktemp).** Why use `mktemp` instead of hand-writing a temp filename like
`/tmp/scratch.txt`?

<details>
<summary>Answer</summary>

`mktemp` (or `mktemp -d` for a directory) atomically creates a file with a guaranteed-unique,
randomized name and hands you the real path -- a hand-written fixed name collides the moment two
instances of the same script run concurrently, or risks overwriting another process's file.

</details>

**Q23 (co-23 -- globbing).** What does an unquoted `*.txt` glob expand to when NO file matches it,
and why does that matter in a loop?

<details>
<summary>Answer</summary>

With no match, Bash's default behavior leaves the glob pattern completely unexpanded -- the literal
string `*.txt` is passed through as-is. A `for f in *.txt; do ...; done` loop with no guard then
runs its body exactly once with `f` bound to the literal text `*.txt`, not zero times as you'd
expect -- the reason every glob loop in this primer starts with `[[ -e "$f" ]] || continue`.

</details>

**Q24 (co-24 -- regular-expressions).** What's the difference between `grep 'ERROR'` and
`grep -E '^ERROR'`?

<details>
<summary>Answer</summary>

`grep 'ERROR'` matches "ERROR" appearing ANYWHERE in a line, including mid-word or mid-line.
`grep -E '^ERROR'` adds the `^` anchor (extended regex mode via `-E`) so it only matches lines that
actually START WITH "ERROR" -- a small difference that changes which lines get counted.

</details>

**Q25 (co-25 -- shellcheck-and-shfmt).** What does `shellcheck` check for that `shfmt` does not,
and vice versa?

<details>
<summary>Answer</summary>

`shellcheck` statically analyzes a script for real correctness bugs -- unquoted variables that will
word-split, references to variables that are never assigned, and dozens of other known shell
footguns (each with its own `SCxxxx` code). `shfmt` only reformats whitespace/indentation/style; it
never changes a script's behavior and catches zero logic bugs.

</details>

**Q26 (co-26 -- process-substitution).** What does `<(cmd)` let you pass to a command that normally
expects a filename argument?

<details>
<summary>Answer</summary>

`<(cmd)` runs `cmd`, exposes its stdout as a special filename (`/dev/fd/N` on most systems), and
substitutes that filename in place -- letting a tool like `diff`, which expects two file paths, read
directly from two live command pipelines (e.g. `diff <(sort a.txt) <(sort b.txt)`) with no manual
temp-file staging. It's a Bash extension, not available in POSIX `sh`.

</details>

## Applied problems

Thirteen scenarios. Each describes a task without naming the construct -- decide which Bash feature
or tool solves it, then check.

**AP1.** A deploy script must abort immediately the moment ANY step fails, rather than plowing
ahead and leaving the system half-configured, and it should also catch typos in variable names
instead of silently treating them as empty strings.

<details>
<summary>Answer</summary>

`set -euo pipefail` at the top of the script. `-e` aborts on the first failing command, `-u` turns
a reference to an undefined variable (a likely typo) into a hard error instead of a silent empty
string, and `pipefail` makes sure a failure inside a pipeline isn't masked by a later stage's
success.

</details>

**AP2.** A backup script builds a destination path from a variable that might contain a space (a
real folder named `"Q1 Reports"`), and a teammate's `cp $src $dest` keeps failing with confusing
"too many arguments" errors whenever that folder is involved.

<details>
<summary>Answer</summary>

Quote both: `cp "$src" "$dest"`. Unquoted `$src`/`$dest` are word-split on the embedded space,
so `cp` sees four arguments (`Q1`, `Reports`, plus whatever `$dest` split into) instead of two --
exactly the unquoted-expansion bug `shellcheck`'s SC2086 exists to catch.

</details>

**AP3.** A script needs to know today's four-digit year to name a log file, without hardcoding a
value that will be wrong next year.

<details>
<summary>Answer</summary>

Command substitution: `year="$(date +%Y)"`. `$(...)` captures the `date` command's real stdout at
run time and assigns it to the variable.

</details>

**AP4.** A CI script runs a linter across 200 files and needs to know, at the very end, whether ANY
single file failed -- even though the loop itself always reaches its final line and the script's
own last command (printing a summary) always succeeds.

<details>
<summary>Answer</summary>

Track a separate exit-status variable across the loop (e.g. `overall=0; ... [ "$rc" -ne 0 ] &&
overall=1 ... exit "$overall"`), rather than relying on `$?` after the loop -- `$?` after a loop
only ever reflects the LAST iteration's status, not whether any earlier iteration failed, and the
final summary-printing command would reset `$?` again regardless.

</details>

**AP5.** A script accepts an optional `-o <output>` flag; when the user doesn't pass `-o` at all,
it should quietly fall back to `./out.txt` rather than requiring the flag every time.

<details>
<summary>Answer</summary>

Parameter-expansion default: `output="${output:-./out.txt}"`, set once after the `getopts` loop
finishes (so an explicitly-passed `-o` value is never overwritten, since `${v:-default}` only
substitutes when `v` is unset or empty).

</details>

**AP6.** A monitoring script polls a health-check URL every few seconds; a teammate wants to add
`Ctrl-C` handling so that interrupting the script prints a friendly "stopped by user" message
instead of the terminal's raw "^C" and an abrupt kill.

<details>
<summary>Answer</summary>

`trap 'echo "stopped by user"; exit 0' INT` near the top of the script, before entering the polling
loop -- `SIGINT` (what `Ctrl-C` sends) then runs the handler instead of the shell's default
kill-the-process behavior.

</details>

**AP7.** A script generates a large report by writing directly to its `-o` output path as it goes;
a teammate wants to guarantee that if the script crashes halfway through, readers never see a
truncated, half-written report sitting at that path.

<details>
<summary>Answer</summary>

Write to a `mktemp` scratch file first, and only `mv` it to the real `-o` path as the LAST step, on
success. A `trap ... EXIT` cleans up the scratch file on any failure path, so a crash leaves either
the complete OLD report (if one existed) or nothing at that path -- never a partial NEW one, since
`mv` on the same filesystem is atomic.

</details>

**AP8.** A script needs to process every `*.log` file in a directory, but that directory is
sometimes genuinely empty of `.log` files, and the script must handle that case cleanly rather than
trying to process a nonexistent file named literally `*.log`.

<details>
<summary>Answer</summary>

Guard every iteration with `[[ -e "$f" ]] || continue` right after `for f in *.log; do`. When the
glob matches nothing, Bash leaves it as the unexpanded literal pattern; the existence check skips
that one bogus iteration cleanly instead of trying to `wc`/`cat`/`grep` a file that was never real.

</details>

**AP9.** A validation script wants to count how many lines in a log genuinely START with the word
`ERROR` (a real error entry), without also matching an unrelated debug line like
`last_ERROR_count=0` that merely contains the same word mid-line.

<details>
<summary>Answer</summary>

Anchor the pattern: `grep -Ec '^ERROR' file`. The `^` anchor restricts matches to the very start of
a line; a bare `grep -c 'ERROR'` matches "ERROR" anywhere at all, overcounting.

</details>

**AP10.** A script needs to compare the sorted contents of two files to see if they contain the
same set of lines, without leaving any temp files behind afterward and without a separate
`sort a > /tmp/a.sorted; sort b > /tmp/b.sorted; diff ...; rm /tmp/a.sorted /tmp/b.sorted` dance.

<details>
<summary>Answer</summary>

Process substitution: `diff <(sort a.txt) <(sort b.txt)`. Each `<(...)` runs its command and
exposes its live output as a filename `diff` can read directly -- no intermediate file is ever
written to disk or needs cleaning up.

</details>

**AP11.** A code-review checklist item flags a script for review because it hardcodes
`/tmp/myapp-scratch.txt` as its working file, and two people running the deploy script at the same
time on the same shared build server would stomp on each other's scratch data.

<details>
<summary>Answer</summary>

Replace the hardcoded path with `scratch="$(mktemp)"`. `mktemp` guarantees a unique, randomized
filename per invocation, so two concurrent runs of the same script never collide on the same
scratch path.

</details>

**AP12.** A script parses `-i <input>` and `-o <output>` with `getopts`, and correctly prints a
usage message when it sees an option it doesn't recognize -- but running it with ZERO options at
all (neither `-i` nor `-o`) still limps forward and fails later with a confusing, unrelated file-not-
found error instead of a clear "missing required option" message.

<details>
<summary>Answer</summary>

`getopts` only validates the options it SEES -- it has no concept of "required." The fix is an
explicit check after the parsing loop: `if [ -z "$input" ] || [ -z "$output" ]; then echo "..." >&2;
exit 1; fi`, run before the script ever touches either variable.

</details>

**AP13.** A script that runs fine on the author's Ubuntu laptop needs to also run, unmodified, in a
minimal Alpine container whose `/bin/sh` is `dash`, not Bash -- and the author needs to know which
of their script's constructs will simply not work there.

<details>
<summary>Answer</summary>

Anything from the Bash-vs-POSIX list: `[[ ]]` (use `[ ]` instead), arrays (avoid them or restructure
without them), `<<<` here-strings (use a here-doc or `printf | cmd` instead), and process
substitution `<(...)` (stage to a real temp file instead) -- all four are Bash extensions with no
POSIX `sh` equivalent syntax.

</details>

## Code katas

Eight hands-on repetition drills. Each is a before/after `.sh` file pair colocated under
`drilling/code/`. Every "before" script is a real, runnable Bash program that misapplies the
concept being drilled -- run it yourself, diagnose the bug from the observed behavior, fix it from
memory, then compare your fix against the "after" script and the real output shown.

### Kata 1 -- unquoted word splitting

**Task.** A script checks whether a file named `"my notes.txt"` exists using `[ -f $file ]` (no
quotes around `$file`). Run it and diagnose why it reports "not found" for a file that was just
created moments earlier in the very same script.

**Before** (`drilling/code/kata-01-unquoted-word-splitting/before/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
file="my notes.txt"
touch "$file"
if [ -f $file ]; then
  echo "found: $file"
else
  echo "not found (word-split bug)"
fi
rm -f "$file"
```

**Observed (buggy) output** (captured by actually running the script above):

```text
kata.sh: line 5: [: my: binary operator expected
not found (word-split bug)
```

**After** (`drilling/code/kata-01-unquoted-word-splitting/after/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
file="my notes.txt"
touch "$file"
if [ -f "$file" ]; then
  echo "found: $file"
else
  echo "not found (word-split bug)"
fi
rm -f "$file"
```

**Fixed output**:

```text
found: my notes.txt
```

**Why it happens**: unquoted `$file` word-splits on the space, so `[ -f $file ]` actually runs as
`[ -f my notes.txt ]` -- three arguments where `test -f` expects exactly one, which is a genuine
`test` syntax error ("binary operator expected"), not a clean pass/fail. `shellcheck` catches this
exact pattern as SC2086 ("Double quote to prevent globbing and word splitting").

### Kata 2 -- missing pipefail

**Task.** A script reads a (missing) file through a pipeline, `cat missing.txt | wc -l`, under
`set -eu` but WITHOUT `pipefail`. Diagnose why the script keeps running past the `cat` failure
instead of stopping.

**Before** (`drilling/code/kata-02-missing-pipefail/before/kata.sh`)

```bash
#!/usr/bin/env bash
set -eu
# Kata 2 (BUGGY): cat on a missing file fails, but without 'pipefail' the
# pipeline's exit status comes from the LAST command (wc -l), which still
# succeeds on empty input -- masking the real cat failure completely.
cat /tmp/kata2-does-not-exist.txt | wc -l
echo "pipeline reported success (exit 0) even though cat genuinely failed above"
```

**Observed (buggy) output** (captured by actually running the script above):

```text
cat: /tmp/kata2-does-not-exist.txt: No such file or directory
       0
pipeline reported success (exit 0) even though cat genuinely failed above
```

**After** (`drilling/code/kata-02-missing-pipefail/after/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Kata 2 (FIXED): 'pipefail' makes the pipeline's exit status the FIRST
# non-zero status among all stages, so cat's real failure propagates and
# 'set -e' now correctly aborts the script instead of silently continuing.
cat /tmp/kata2-does-not-exist.txt | wc -l
echo "this line never runs -- the script already aborted above"
```

**Fixed run** (script now aborts before the final `echo`):

```text
cat: /tmp/kata2-does-not-exist.txt: No such file or directory
       0
$ echo $?
1
```

**Why it happens**: in a pipeline, `$?` (and what `set -e` checks) reflects only the LAST command's
exit status by default -- `wc -l` always succeeds, even reading zero lines from `cat`'s empty
output, so `cat`'s real failure never reaches `set -e` at all without `pipefail`.

### Kata 3 -- off-by-one loop range

**Task.** A retry loop is meant to attempt a task 3 times (attempts 1, 2, 3) but its `while`
condition uses `-lt` instead of `-le`. Run it and count how many attempts actually happen.

**Before** (`drilling/code/kata-03-off-by-one-range/before/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Kata 3 (BUGGY): meant to attempt a task up to 3 times (attempts 1, 2, 3),
# but the loop guard uses -lt instead of -le, so it only runs twice.
max_attempts=3
attempt=1
while [ "$attempt" -lt "$max_attempts" ]; do
  echo "attempt $attempt of $max_attempts"
  attempt=$((attempt + 1))
done
echo "loop ran $((attempt - 1)) time(s), expected $max_attempts"
```

**Observed (buggy) output**:

```text
attempt 1 of 3
attempt 2 of 3
loop ran 2 time(s), expected 3
```

**After** (`drilling/code/kata-03-off-by-one-range/after/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Kata 3 (FIXED): -le (less-than-or-equal) makes the loop run exactly
# max_attempts times, attempts 1 through 3 inclusive.
max_attempts=3
attempt=1
while [ "$attempt" -le "$max_attempts" ]; do
  echo "attempt $attempt of $max_attempts"
  attempt=$((attempt + 1))
done
echo "loop ran $((attempt - 1)) time(s), expected $max_attempts"
```

**Fixed output**:

```text
attempt 1 of 3
attempt 2 of 3
attempt 3 of 3
loop ran 3 time(s), expected 3
```

**Why it happens**: `-lt` (less-than) stops the loop the moment `attempt` reaches `max_attempts`,
one iteration short of running with `attempt == max_attempts` itself; `-le` (less-than-or-equal)
includes that final boundary value. `shellcheck` cannot catch this one -- it's a logic error, not a
syntax pattern, so it takes reading the loop guard carefully.

### Kata 4 -- getopts without a required-option check

**Task.** A script parses `-i <input>` with `getopts` and correctly rejects unknown flags, but
never checks that `-i` was actually supplied. Run it with no options at all and diagnose the
resulting error.

**Before** (`drilling/code/kata-04-getopts-missing-required/before/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Kata 4 (BUGGY): parses -i but never checks it was actually supplied,
# so running the script with no options at all silently proceeds with an
# empty $input and fails later with a confusing, unrelated error.
input=""
while getopts ":i:" opt; do
  case "$opt" in
  i) input="$OPTARG" ;;
  *)
    echo "usage: kata.sh -i <input>" >&2
    exit 1
    ;;
  esac
done

echo "reading from: '$input'"
wc -l <"$input"
```

**Observed (buggy) output** (running `kata.sh` with zero arguments):

```text
reading from: ''
kata.sh: line 18: : No such file or directory
```

**After** (`drilling/code/kata-04-getopts-missing-required/after/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Kata 4 (FIXED): explicitly validates that -i was supplied, with a clear
# usage message, before ever touching $input.
input=""
while getopts ":i:" opt; do
  case "$opt" in
  i) input="$OPTARG" ;;
  *)
    echo "usage: kata.sh -i <input>" >&2
    exit 1
    ;;
  esac
done

if [ -z "$input" ]; then
  echo "kata.sh: -i <input> is required" >&2
  exit 1
fi

echo "reading from: '$input'"
wc -l <"$input"
```

**Fixed output** (running with zero arguments):

```text
kata.sh: -i <input> is required
```

**Why it happens**: `getopts` only validates the options it actually sees in `$@` -- it has no
built-in concept of "this flag is mandatory." Skipping the flag entirely just means the loop body
never runs for `i`, leaving `input` at its empty default, and the real failure only surfaces two
lines later as a confusing, unrelated `No such file or directory`.

### Kata 5 -- missing trap cleanup

**Task.** A script creates a `mktemp` scratch file, then hits a simulated failure (`false`) before
finishing. Run it, check whether the scratch file survives the failure, then fix it.

**Before** (`drilling/code/kata-05-trap-cleanup-missing/before/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Kata 5 (BUGGY): creates a scratch file but never registers a trap to
# clean it up, so a mid-script failure leaves it behind forever.
scratch="$(mktemp /tmp/kata5-scratch.XXXXXX)"
echo "working in $scratch"
echo "partial output" >"$scratch"

# Simulate a real failure partway through the script.
false
echo "this line never runs"
```

**Observed (buggy) run** (the scratch file is LEAKED -- still present after the script exits
non-zero):

```text
$ bash kata.sh; echo "exit: $?"
working in /tmp/kata5-scratch.Xjfahe
exit: 1
$ ls /tmp/kata5-scratch.*
/tmp/kata5-scratch.Xjfahe
```

**After** (`drilling/code/kata-05-trap-cleanup-missing/after/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Kata 5 (FIXED): trap 'rm -f "$scratch"' EXIT runs on ANY exit path --
# normal completion, explicit exit, or an uncaught failure -- so the
# scratch file is guaranteed to be cleaned up.
scratch="$(mktemp /tmp/kata5-scratch.XXXXXX)"
trap 'rm -f "$scratch"' EXIT
echo "working in $scratch"
echo "partial output" >"$scratch"

# Simulate the same real failure partway through the script.
false
echo "this line never runs"
```

**Fixed run** (the scratch file is cleaned up even though the script still fails):

```text
$ bash kata.sh; echo "exit: $?"
working in /tmp/kata5-scratch.kI5Los
exit: 1
$ ls /tmp/kata5-scratch.*
zsh: no matches found: /tmp/kata5-scratch.*
```

**Why it happens**: without a registered `trap`, nothing ever runs `rm` on the scratch file when
the script exits early via `set -e` -- `trap '...' EXIT` is the only mechanism that guarantees
cleanup code runs on EVERY exit path, success or failure, so it must be registered immediately
after the file is created, before any code that could fail.

### Kata 6 -- glob with no no-match guard

**Task.** A script loops `for f in *.txt` in a directory that has zero `.txt` files. Run it and
diagnose the confusing error about a file that was never actually created.

**Before** (`drilling/code/kata-06-glob-no-match-guard/before/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
scratch_dir="$(mktemp -d)"
cd "$scratch_dir"
# Kata 6 (BUGGY): no .txt files exist in this empty scratch dir, but
# without a no-match guard the loop still "processes" the literal,
# unexpanded glob pattern itself as if it were a real filename.
for f in *.txt; do
  echo "processing: $f"
  wc -l "$f"
done
cd /
rm -rf "$scratch_dir"
```

**Observed (buggy) output**:

```text
processing: *.txt
wc: *.txt: open: No such file or directory
```

**After** (`drilling/code/kata-06-glob-no-match-guard/after/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
scratch_dir="$(mktemp -d)"
cd "$scratch_dir"
# Kata 6 (FIXED): [[ -e "$f" ]] || continue skips the loop body when the
# glob matched nothing and bash left it as the literal, unexpanded pattern.
for f in *.txt; do
  [[ -e "$f" ]] || continue
  echo "processing: $f"
  wc -l "$f"
done
echo "no .txt files found -- loop body never ran, no error"
cd /
rm -rf "$scratch_dir"
```

**Fixed output**:

```text
no .txt files found -- loop body never ran, no error
```

**Why it happens**: Bash's default globbing behavior leaves an unmatched pattern completely
unexpanded rather than producing zero words, so the loop still runs exactly once with `f` bound to
the literal four-character string `*.txt` -- a real file path is then handed to `wc -l`, which
correctly reports it doesn't exist.

### Kata 7 -- unanchored regex mid-line false match

**Task.** A log-scanning script counts lines matching `ERROR` to report an error count, but its
pattern has no anchor. Given a log with one harmless debug line containing "ERROR" mid-word, run it
and check whether the count is inflated.

**Before** (`drilling/code/kata-07-regex-anchor-mistake/before/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Kata 7 (BUGGY): meant to count lines that START WITH "ERROR", but the
# pattern has no anchor, so it also matches ERROR appearing MID-LINE
# (like the harmless "last_ERROR_count=0" debug line below). The log is
# written here so the kata is self-contained and runnable with no
# pre-existing fixture.
log="kata7-log.txt"
cat >"$log" <<'EOF'
INFO service started
ERROR disk full
DEBUG last_ERROR_count=0
INFO all clear
ERROR connection refused
EOF
matches="$(grep -c 'ERROR' "$log")"
echo "lines counted as errors: $matches"
rm -f "$log"
```

**Observed (buggy) output** (running `bash kata.sh` directly, no setup needed):

```text
lines counted as errors: 3
```

**After** (`drilling/code/kata-07-regex-anchor-mistake/after/kata.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
# Kata 7 (FIXED): the ^ anchor (via grep -E, though -E is not even
# required for a plain ^ anchor -- kept for consistency with this
# primer's other -E examples) restricts matches to lines that actually
# START WITH "ERROR", excluding ERROR appearing mid-line. The log is
# written here so the kata is self-contained and runnable with no
# pre-existing fixture.
log="kata7-log.txt"
cat >"$log" <<'EOF'
INFO service started
ERROR disk full
DEBUG last_ERROR_count=0
INFO all clear
ERROR connection refused
EOF
matches="$(grep -Ec '^ERROR' "$log")"
echo "lines counted as errors: $matches"
rm -f "$log"
```

**Fixed output** (running `bash kata.sh` directly, same log content):

```text
lines counted as errors: 2
```

**Why it happens**: `grep 'ERROR'` (no anchor) matches "ERROR" appearing anywhere in a line,
including the harmless `DEBUG last_ERROR_count=0` line, which is not a real error entry at all.
`^ERROR` restricts the match to lines that genuinely start with "ERROR" -- the two real error log
lines, correctly excluding the debug line.

### Kata 8 -- unquoted array expansion

**Task.** A script loops `for f in ${files[@]}` (unquoted) over an array holding a filename with an
embedded space. Run it and count how many loop iterations happen versus how many elements the
array actually holds.

**Before** (`drilling/code/kata-08-array-unquoted-expansion/before/kata.sh`)

```bash
#!/usr/bin/env bash
set -uo pipefail
# Kata 8 (BUGGY): unquoted ${files[@]} word-splits each element on
# whitespace, so "report one.txt" becomes TWO loop iterations instead
# of one.
files=("report one.txt" "report-two.txt")
count=0
# Intentionally unquoted: this IS the kata's bug under test.
# shellcheck disable=SC2068
for f in ${files[@]}; do
  count=$((count + 1))
  echo "element $count: '$f'"
done
echo "total elements seen: $count (array actually holds ${#files[@]})"
```

**Observed (buggy) output**:

```text
element 1: 'report'
element 2: 'one.txt'
element 3: 'report-two.txt'
total elements seen: 3 (array actually holds 2)
```

**After** (`drilling/code/kata-08-array-unquoted-expansion/after/kata.sh`)

```bash
#!/usr/bin/env bash
set -uo pipefail
# Kata 8 (FIXED): "${files[@]}" quoted preserves each array element as
# ONE word regardless of embedded spaces, matching the array's real length.
files=("report one.txt" "report-two.txt")
count=0
for f in "${files[@]}"; do
  count=$((count + 1))
  echo "element $count: '$f'"
done
echo "total elements seen: $count (array actually holds ${#files[@]})"
```

**Fixed output**:

```text
element 1: 'report one.txt'
element 2: 'report-two.txt'
total elements seen: 2 (array actually holds 2)
```

**Why it happens**: unquoted `${files[@]}` expands each array element and then word-splits the
whole result on whitespace, exactly like unquoted `$var` does -- `"report one.txt"` becomes two
separate loop iterations instead of one. `"${files[@]}"` (quoted) is the one array-expansion form
that preserves each element as exactly one word regardless of embedded spaces; `shellcheck` flags
the unquoted form as SC2068.

## Self-check checklist

Confirm each item without checking the manual first. If you hesitate, that concept needs another
pass.

- [ ] I can name the two things (shebang + executable bit) that make a script directly runnable,
      and the fallback command if I skip them. (co-01)
- [ ] I can explain what a non-interactive script inherits from the calling shell versus what it
      does not. (co-02)
- [ ] I can state what each of `-e`, `-u`, and `pipefail` does on its own, from memory. (co-03)
- [ ] I can name at least three Bash-only syntax features that will not run under POSIX `sh`.
      (co-04)
- [ ] I can write `${v:-default}` and `${v:?message}` correctly and explain when each fires.
      (co-05)
- [ ] I can predict the outcome of single-quoted, double-quoted, and unquoted `$var` without
      running the code. (co-06)
- [ ] I can capture a command's output into a variable with `$(...)` without hesitation. (co-07)
- [ ] I can evaluate integer arithmetic with `$(( ))` instead of reaching for `expr`. (co-08)
- [ ] I can read `$?` immediately after a command and explain what `exit N` sets it to. (co-09)
- [ ] I can write a string test, a numeric test, and a file test inside `[[ ]]` without looking up
      the operators. (co-10)
- [ ] I can write a `case ... esac` that dispatches on glob patterns instead of a chained
      `if`/`elif`. (co-11)
- [ ] I can write all three loop forms (`for`/`while`/`until`) and use `break`/`continue` correctly
      inside any of them. (co-12)
- [ ] I can define a function that uses `local` to avoid leaking a variable into the global scope.
      (co-13)
- [ ] I can redirect stdout, append to a file, redirect stderr separately, and merge stderr into
      stdout with `2>&1`. (co-14)
- [ ] I can chain three or more commands with `|` and explain that they run concurrently, not
      staged through a temp file. (co-15)
- [ ] I can choose correctly between `<<EOF`, `<<'EOF'`, and `<<<` for a given need. (co-16)
- [ ] I can use `read -r` and explain why the `-r` flag matters. (co-17)
- [ ] I can name at least five of `grep`/`sed`/`awk`/`cut`/`sort`/`uniq`/`tr`/`find`/`xargs` and
      what each does in one phrase. (co-18)
- [ ] I can write a script that reads `$1`, `"$@"`, and `$#`, and uses `shift` to walk its
      arguments. (co-19)
- [ ] I can write a `getopts` loop with a leading `:` for silent error handling and explain what
      `?` versus `:` means in the case branch. (co-20)
- [ ] I can register `trap` handlers for `EXIT`, `INT`, and `ERR` and explain what each one is for.
      (co-21)
- [ ] I can explain why `mktemp` is safer than a hand-written temp filename. (co-22)
- [ ] I can predict what an unquoted glob expands to when it matches nothing, and write the
      no-match guard that handles it. (co-23)
- [ ] I can write a `grep -E`/`sed -E` pattern using an anchor, a character class, and a
      quantifier without looking up the syntax. (co-24)
- [ ] I can explain the division of labor between `shellcheck` (correctness) and `shfmt`
      (formatting only). (co-25)
- [ ] I can write `diff <(cmd1) <(cmd2)` from memory and explain what `<(...)` actually is under
      the hood. (co-26)
- [ ] I can explain, in one sentence, why the Unix pipeline is `coupling-vs-cohesion` in
      miniature -- small, highly cohesive tools, loosely coupled through plain text streams.
      (`coupling-vs-cohesion`)

## Elaborative interrogation & self-explanation

Six why/why-not prompts. Answer each in your own words before opening the model explanation.

**E1.** Why does the Unix pipeline philosophy favor many small, single-purpose tools (`grep`,
`sort`, `awk`, `uniq`) chained with `|`, rather than one large tool that does filtering, sorting,
and aggregation all at once? Tie your answer to `coupling-vs-cohesion`.

<details>
<summary>Model explanation</summary>

Each tool in the pipeline is highly cohesive -- `grep` does exactly one job (pattern matching) and
does it well -- and the tools are only loosely coupled to each other, through plain text streams
rather than a shared internal data structure or API. That is `coupling-vs-cohesion` directly: because
the coupling is just "lines of text in, lines of text out," you can swap `sort` for `sort -r`, or
insert a new `sed` stage in the middle, without touching anything else in the pipeline or
recompiling a monolithic tool. A single do-everything tool would need to anticipate every
combination of filtering/sorting/aggregating in advance; the pipeline instead composes exactly the
combination you need, on demand, from parts that were never designed to know about each other.

</details>

**E2.** `set -e` aborts a script the instant any command fails -- except inside an `if` condition,
a `while`/`until` condition, or the left side of `&&`/`||`, where a failing command is expected and
does NOT trigger the abort. Why does this carve-out exist instead of `-e` firing everywhere,
unconditionally?

<details>
<summary>Model explanation</summary>

A conditional's entire purpose is to ask "did this command succeed or fail?" and branch on the
answer -- `if grep -q pattern file; then ...` is not an error state when `grep` finds nothing, it is
the normal, expected "false" branch of the condition. If `-e` aborted on every failing command with
no exceptions, you could never write a conditional at all: the very act of testing whether something
failed would itself be treated as a fatal script error. The carve-out exists because `-e`'s job is
to catch UNEXPECTED failures (a command that was assumed to succeed but didn't), not failures a
script is deliberately checking for.

</details>

**E3.** Why does `getopts`'s leading-colon "silent mode" (`":i:o:h"`) exist as an option at all,
rather than `getopts` always just printing its own built-in error messages for bad options?

<details>
<summary>Model explanation</summary>

`getopts`'s own default error messages are generic and don't know anything about the specific
script's usage contract -- they can't mention the script's actual flag names, what each flag means,
or point the user at a `-h` help option. Silent mode hands that responsibility to the script itself:
by checking `opt` for `?` (unknown flag) or `:` (missing required argument) and printing a tailored
usage message, a script can give the user something genuinely actionable, consistent with whatever
custom `-h`/usage text the rest of the script already shows -- exactly the pattern this primer's
`getopts` examples and its own intra-topic capstone use throughout.

</details>

**E4.** Why does `trap 'cleanup' EXIT` need to be registered immediately after a resource (like a
`mktemp` file) is created, rather than at the very end of the script, right before it would
naturally finish?

<details>
<summary>Model explanation</summary>

A `trap` registered at the very end of the script only runs if execution actually REACHES that
point -- but the entire reason to register a cleanup trap is to handle the case where it doesn't,
because an earlier command failed and `set -e` aborted the script early. Registering the trap
immediately after the resource is created closes that gap completely: from that line onward, EVERY
possible exit path (normal completion, an explicit `exit`, or an uncaught failure under `set -e`)
is guaranteed to run the cleanup, because the trap doesn't care how or where the script ends, only
that it does.

</details>

**E5.** Why does an unmatched glob like `*.txt` expand to the LITERAL, unexpanded pattern string by
default, rather than to nothing (zero words) the way a reader might intuitively expect?

<details>
<summary>Model explanation</summary>

This is a historical Bourne-shell compatibility default that Bash inherited rather than a design a
modern shell would choose from scratch (Bash does offer `shopt -s nullglob` to opt into the
"expand to nothing" behavior instead, but it's off by default). Leaving the pattern unexpanded means
a command that receives it downstream, like `ls *.txt` in an empty directory, gets a literal
argument it can meaningfully report an error about (`ls: *.txt: No such file or directory`) rather than silently
receiving zero arguments and doing something unintended (like `rm *.txt` with `nullglob` accidentally
expanding to a bare `rm` with no arguments, or worse, unexpectedly matching something else entirely
if not carefully guarded). The `[[ -e "$f" ]] || continue` guard this primer uses handles the
default behavior explicitly, rather than depending on a shell option a reader's environment might
not have set.

</details>

**E6.** `shellcheck` and `shfmt` are two entirely separate tools with non-overlapping jobs, run
back-to-back in this repo's pre-commit hook. Why not have a single tool do both linting and
formatting, the way some other language ecosystems bundle both into one command?

<details>
<summary>Model explanation</summary>

Correctness analysis (`shellcheck`: is this script's LOGIC right -- are variables quoted, are exit
codes checked, are common footguns avoided) and formatting (`shfmt`: is this script's WHITESPACE
consistent) are genuinely different concerns with different failure modes: a perfectly-formatted
script can still have a real SC2086 word-splitting bug, and a script with zero logic bugs can still
have inconsistent indentation. Splitting them into two focused tools mirrors the very
`coupling-vs-cohesion` idea this primer's big idea opener names -- each tool is highly cohesive
(one job, done well) and only loosely coupled to the other (both just operate on the same `.sh`
file, in sequence, with no shared internal state) -- exactly the same design principle the Unix
pipeline itself follows.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) · Next:
[Version Control & Git](../../version-control-and-git/learning/overview.md) →
