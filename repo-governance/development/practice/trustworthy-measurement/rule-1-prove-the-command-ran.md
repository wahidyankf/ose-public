---
description: A timing harness reports elapsed time whether or not the measured command executed - assert exit code and output, not just duration, and watch for shell builtin-transform traps
when_to_use: Use before trusting any timing number from a benchmark harness or shell loop.
---

# Rule 1: Prove the Command Ran

## 1. Prove the command ran before trusting its timing

A timing harness reports elapsed time whether or not the thing being timed executed. Assert the
**exit code and output** of the measured command, not just its duration.

The failure is silent and reads as success. A `zsh` loop of the form

```bash
for c in "md internal-link validate" "md mermaid validate"; do "$BIN" $c; done
```

does **not** word-split `$c` under `zsh` — the whole string arrives as one argument, every
invocation exits immediately with `unrecognized subcommand`, and the harness reports ~3 ms per
command. That is not a fast run; it is no run at all.

This is the same family as the other builtin-transform traps recorded in this repo — `grep -L`
exiting 0 on files-without-match, `ls` being `eza`-aliased and emitting OSC-8 hyperlinks into
`xargs`, RTK rewriting `git diff` output. In each, a shell builtin quietly transforms the thing
being measured and a false zero reads as a pass.

`${PIPESTATUS[0]}` is the same trap in the tool that reads the result. It is a `bash` array; under
`zsh` the equivalent is `$pipestatus`, and the `bash` form expands to the **empty string** rather
than erroring. A line like `echo "EXIT=${PIPESTATUS[0]}"` after a piped command therefore prints
`EXIT=` under `zsh` — no exit code, no warning, and a reader who skims sees a label where a number
should be. Capture the status without a pipe, or set `pipefail` and read `$?`.

The same trap exists in tool syntax, not only shell syntax. A git pathspec glob does not cross `/`,
so `git diff --name-only origin/main -- 'apps/*/content'` matches nothing and reads as "no content
file changed" — the true answer on the branch that produced this example was one file. Prefer a
form whose empty result can only mean empty: take the full diff and filter it.

A cache hit is the same false zero one layer up. `nx run <project>:<target>` exits 0 while
printing `read the output from the cache`, which proves a previous run was green, not that
anything ran against the file you just changed — and it will do that whenever the target's
declared `inputs` omit that file. So an acceptance phrased as "run `<nx target>`; it exits 0"
is satisfiable without executing anything. When the run is the evidence, pass `--skipNxCache`
or assert no cache-hit line appears; when it is merely convenient, the cache is fine.

**Do**: measure under `bash` with an explicit array or a `case`; loop N times and divide; assert
`$?` is 0 and the output is non-empty before recording any duration.

**Do not**: use `python3` (or any interpreter with a ~700 ms cold start) for timestamps around a
sub-second command — the instrumentation swamps the subject.
