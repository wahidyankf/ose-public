---
description: >-
  Sets the bounded sequence every quality gate runs, from freezing the subject to the exit check, and the termination
  table that maps each ending to exactly one verdict.
when_to_use: >-
  Use when running a quality gate, when deciding whether another cycle may start, or when a run has to end.
---

# Sequence and Termination

## Sequence

One cycle is one full audit followed by one repair. Every arrow back to an earlier step is bounded by the cycle counter
`k`.

```mermaid
flowchart TD
    accTitle: Quality gate cycle
    accDescr {
        A run freezes the subject and passes the entry check before its first audit.
        Each blocking row goes to a propagation step that repairs only the frozen ledger rows.
        The cycle counter k bounds every return to the audit, and the exit check ends the run.
        The blocking count must fall between audits, or the run fails for lack of progress.
    }
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef fail fill:#DE8F05,stroke:#000000,color:#000000
    freeze["Freeze subject<br/>commit and scope"]
    entry["Entry tooling run"]
    root["Root-cause pre-step<br/>up to 3 attempts<br/>outside cycle budget"]
    k1["k = 1"]
    audit["Full audit by<br/>&lt;family&gt;-checker"]
    pass["PASS or<br/>PASS_WITH_FINDINGS"]
    ledger["Freeze ledger L_k"]
    prop["&lt;family&gt;-propagation<br/>repairs L_k rows<br/>verifies each row"]
    progress{"Blocking count<br/>did not fall?"}
    stop1["FAIL<br/>no progress"]
    cap{"k = max-cycles?"}
    next["k = k + 1"]
    exit["Exit tooling run<br/>per-row verification"]
    done["PASS /<br/>PASS_WITH_FINDINGS<br/>all rows closed"]
    stop2["FAIL"]
    blocked["BLOCKED (tooling)"]
    freeze --> entry
    entry -->|green| k1
    entry -->|red| root
    root -->|green| k1
    root -->|still red| blocked
    k1 --> audit
    audit -->|no blocking row| pass
    audit -->|blocking rows| ledger
    ledger --> prop
    prop --> progress
    progress -->|yes| stop1
    progress -->|no| cap
    cap -->|no| next
    next --> audit
    cap -->|yes| exit
    exit -->|all rows closed| done
    exit -->|otherwise| stop2
    class stop1,stop2,blocked fail
```

1. **Freeze the subject.** Record the commit and the exact scope. A subject changed during the run by anything other
   than this run's own writer ends it `BLOCKED` (input-changed), and the ledger is kept.
2. **Run the entry check.** Green continues. Red starts the root-cause pre-step in
   [Inputs, Scoring, and the Deterministic Boundary](001-inputs-scoring-and-boundary.md).
3. **Audit.** The checker audits the whole frozen scope in its current state, rates each finding's criticality, and
   reports nothing the Deterministic Boundary table excludes.
4. **Classify.** Each row is blocking or not under the mode threshold.
5. **Terminate early** when no blocking row is open: `PASS` if the ledger holds no open row at all, otherwise
   `PASS_WITH_FINDINGS`.
6. **Hand off.** Freeze the open blocking rows as ledger `L_k` and run `<family>-propagation`. It re-validates and rates
   each row, repairs only rows of `L_k`, verifies each, and records its status with evidence, per
   [Sole-Writer Propagation](../sole-writer-propagation.md).
7. **Require progress.** From the second audit on, the open blocking count must be strictly lower than at the previous
   audit. Otherwise the run ends `FAIL` (no progress).
8. **Stop at the ceiling.** When `k` equals `max-cycles`, no further audit runs; a fourth audit is never reached. The
   exit check runs once. The writer reverts a repair that turned it red and marks that row `not-resolved`. The run ends
   `PASS` or `PASS_WITH_FINDINGS` when every blocking row is `resolved` with evidence and the exit check is green, and
   `FAIL` otherwise.

At the ceiling, verified repairs stay. Nothing asks a person mid-run whether to continue, and nothing adds a cycle.

## Termination

| Condition                                                              | Verdict                        |
| ---------------------------------------------------------------------- | ------------------------------ |
| An audit has no open row                                               | `PASS`                         |
| An audit has open rows but none blocking                               | `PASS_WITH_FINDINGS`           |
| After the final repair: every blocking row resolved, exit run green    | `PASS` or `PASS_WITH_FINDINGS` |
| Blocking rows remain at the ceiling, or a `needs-decision` row is open | `FAIL`                         |
| The open blocking count did not fall between two audits                | `FAIL`                         |
| Entry tooling still red after 3 root-cause attempts                    | `BLOCKED` (tooling)            |
| The subject changed during the run                                     | `BLOCKED` (input-changed)      |
| The checker or the propagation could not run                           | `BLOCKED` (unavailable)        |
| `max-cycles` is outside 1–3, or `subject` is missing                   | Refuses to start               |

Every run reaches exactly one row of this table. A gate file copies the table unchanged into its `## Termination`
section or links it, and adds no row of its own.
