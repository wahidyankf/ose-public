# The Refutation-Clause Escape Ledger

Each entry is a hole found in the refutation-clause rule by a PR review, and what closed it. It is
kept apart from [the invariants](./refutation-clause-invariants.md) because it grows and they do
not: a new escape appends here without touching the reasoning it exists to test.

1. A verb allowlist accepted `git --output=`, which writes. Closed by matching whole shapes **and**
   forbidding a placeholder value beginning with `-` — shape-matching alone leaves `--output=`
   arriving as the `<path>`, and the shape still matches.
2. `sed -n '1e cmd'` ran a shell under the very flag that was supposed to make it read-only —
   confirmed by running it, not reasoned about: `sed -n '1e echo INJECTED' <file>` prints
   `INJECTED`. GNU `sed` also executes through `s///e`, and both work under `-n`.
3. A placeholder value beginning with `-` arrived as a flag. Closed by forbidding a leading dash.
4. A directory pathspec passed the tracked-path check while `grep -r` walked gitignored files.
5. A tracked symlink passed the same check and resolved outside the repository.
6. `<ref>` was free, so `git show HEAD~1:<path>` read a secret the working tree no longer held.
7. `<M>` was never constrained, and `<pattern>` was never quoted.

Entries 1-7 were each closed by naming the thing just abused — the era before the invariants
existed. [Entries 8 onward](./refutation-clause-escape-ledger-invariant-closures.md) were closed differently,
and that difference is the point of keeping the record.
