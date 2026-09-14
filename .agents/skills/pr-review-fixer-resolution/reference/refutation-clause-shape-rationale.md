# Why the Refutation-Clause Shapes Are That Narrow

The [allowed invocation shapes](./refutation-clause-execution.md) look over-restrictive until you
see what the wider form of each command does. Read this before widening any of them.

## An Allowlist of Verbs Is the Wrong Unit

The first word of a command tells you almost nothing. Real commands carry flags and, in `sed`'s
case, an embedded mini-language, and that is where the execution and write primitives live. Every
example below starts with a verb a reasonable person would call read-only.

## `sed` Was on the List and Is Not

Two independent reasons, both in the escape ledger: its script parser executes a shell under `-n`
([entry 2](./refutation-clause-escape-ledger.md)), and a line range addresses by absolute position
in the file the fix edits, so the clause cannot survive its own fix
([entry 17](./refutation-clause-escape-ledger-invariant-closures.md)). `rg -nF` addresses by content and `cat`
returns the whole file, covering every claim a range could express — see
[writing a clause that survives its own fix](../../pr-review-specialist-protocol/reference/refutation-clause-authoring.md).

## `rg -F`, and Why Not `grep`

`rg` replaced `grep` because GNU `grep` backtracks: `\(a\{1,n\}\)\{1,n\}b` — ordinary BRE, no
backreference, no `-P` — took 19 seconds at n=500. True, and not enough. On ripgrep 15.2.0 the same
construct costs 3.1s at n=500, 13.0s at n=800, 28.7s at n=1000 and over 60s at n=1200; only at
n=1500 does `rg` refuse to compile it. **Faster is not bounded**, and the size limit arrives long
after the cost does.

So the guarantee cannot come from the engine either. `-F` is mandatory, which removes the regex
engine from the clause path: a literal search has no pattern cost to bound. That is a component
choice rather than a threshold, and a threshold is an enumeration wearing a number — see the
[escape ledger](./refutation-clause-escape-ledger.md).

`-f <file>` reads patterns from a path, turning a search into a file read the clause never named.
`-P` enables PCRE backtracking, the behaviour `rg` was chosen to avoid. Neither is on the list, and
neither is `-A`/`-B`/`-C`: context lines answer no question a refutation clause asks, and every one
returns more attacker-authored text into the fixer.

## No Placeholder Begins With `-`

A value beginning with `-` arrives as a flag, and the flag surface is where the primitives live:
`--output=` on a git command created or overwrote an arbitrary path, and `-f` on a search command
redirects it to read a file nobody named. The rule is general because the surface is.

`-r` is off the list for a different reason: it changes what a path _means_. Given a directory it
walks every file underneath, so a check that passed on the directory never saw what was read — and
the two tools disagree about which files, since `rg` skips gitignored ones. A safety rule whose
effect depends on which binary is installed is not a rule.

Neither `cat` nor `rg` writes, and neither consults git either — see [why the path rule is that shape](./refutation-clause-path-rule.md).
