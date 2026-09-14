# The Refutation-Clause Escape Ledger, Part 2

Entries 8 onward, continuing [part 1](./refutation-clause-escape-ledger.md). These were closed by an
invariant that already covered them, or by deleting a component that could not satisfy one.

<!-- markdownlint-disable MD029 -->

8. A batched `cat <path>...` passed a check written in the singular: one tracked path produced one
   line of output, and an untracked path beside it contributed none. Closed by one check per path.
9. `git log --oneline` printed commit subjects from a path's entire history, which a check on that
   path never examined. Closed by removing the shape.
10. `<pattern>` admitted backreferences, which `grep` matches by backtracking: a six-group pattern
    took 44 seconds against a 12-byte file. Closed by banning them, which closed too little — see 12.
11. A clause's own output carried attacker-authored file content back into the fixer's context,
    where nothing classified it as untrusted.
12. Nested bounded intervals — `\(a\{1,n\}\)\{1,n\}b`, ordinary BRE carrying no backreference and
    needing no `-P` — reached 19 seconds against a 500-byte file, growing roughly cubically. It
    walked straight through entry 10's ban. Closed by removing `grep` — insufficiently; see 14.
13. `git show HEAD:<path>` read the committed tree while rule 3 checked the index and the disk. A
    secret redacted in the working tree was still returned from `HEAD`. Closed by removing the
    shape — `HEAD` is not the current state once the fixer has staged an edit, which is exactly
    when clauses run.
14. `rg` was not bounded either. Entry 12 assumed a finite-automata engine bounds its own cost;
    measured, the same construct costs 28.7s at n=1000 and over 60s at n=1200, and `rg` only
    refuses to compile at n=1500. Closed by mandating `-F`, which removes the regex engine rather
    than trusting it.
15. `cat <a> <b>` printed both files with no delimiter, so a file with no trailing newline fused
    its last line onto the next file's first. Closed by allowing exactly one path per invocation.
16. Terminal control bytes in a tracked file passed through every read shape unaltered. Not closed
    by a rule — bounded instead by invariant 3, which keeps clause content out of anything posted.

17. The `sed -n '<N>,<M>p'` shape could not produce a clause that survived its own fix. It
    addresses by absolute line number in the file the fix edits, so a correct fix moved the
    region and the clause read lines that no longer held what it checked. Not a safety escape but
    a usefulness one — the first entry closed by removing a shape that never leaked anything.

Entries 12 and 14 are one escape twice: the first fix swapped the component and kept the assumption;
only the second removed what was being assumed about. That is the argument for keeping the
invariants short and the allowlist shorter.

<!-- markdownlint-enable MD029 -->
