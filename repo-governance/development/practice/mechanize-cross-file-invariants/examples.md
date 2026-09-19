---
description: A PASS example of mechanizing a newly-recognized duplicated rule, and a FAIL example of leaving the same rule restated as prose across files
when_to_use: Use when deciding whether to mechanize a duplicated rule or leave it as prose, and you want a concrete PASS/FAIL comparison.
---

# Examples

## PASS: Recognizing a new candidate and mechanizing it

```
Observation: A CI matrix's gate list is currently copy-pasted into both the workflow YAML
and a governance doc's example table. They already drifted once.

Action: Make the workflow YAML derive its matrix from `./rhino gate list
--format=json` (a single generator invocation) instead of a hand-maintained list; point the
governance doc's example at "run `gate list` for the current set" instead of embedding a table
that can go stale.
```

## FAIL: Restating the same rule in prose across files

```
Observation: A cross-cutting rule ("every gate command must appear in exactly one surface")
is written into three separate governance documents, each with its own wording.

Action: Leave all three as independent prose. The next time the rule changes, at most two of
the three get updated, and nothing catches the third falling out of sync.
```
