---
description: "Shared rules; disciplines Architecture-Performance."
when_to_use: "Use to find a finding's owning specialist."
---

# The Nine Reviewer Disciplines (table part 1: Architecture - Performance)

Every specialist inherits the monolith's hard rules verbatim — numeric confidence 0-100
with findings below 80 hard-dropped, **a refutation clause naming the specific evidence that would
prove the finding wrong**, CRITICAL/HIGH/MEDIUM/LOW severity, every finding
line-anchored with `file:line` plus a link to the specific `repo-governance/` rule it cites,
anti-sycophantic framing, legibility to a junior engineer (see
[Review as Teaching](./review-as-teaching.md)), the
[Scope Guard](../../../workflows/pr/pr-review-cycle/scope-guard-no-scope-creep.md), and
untrusted-input filtering of PR body/comment/linked-issue text. What differs per specialist is its
**owned discipline** and the **scope it explicitly routes elsewhere** rather than raising itself:

| Discipline                     | Specialist agent               | Owns (in-charter)                                                                                                                                            | NOT its job (routes to)                                                                                                                                                 |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture                   | `pr-review-architecture-maker` | New tradeoffs, module boundaries, reversibility, blast radius, quality-attribute effects, novel dependencies                                                 | Existing-rule layering violations → governance; domain-scenario gaps → logic                                                                                            |
| Business-logic / correctness   | `pr-review-logic-maker`        | Behaviour vs. domain intent + Gherkin acceptance-criteria conformance across edge/error cases                                                                | Error-handling _shape_ rules → governance; should-this-boundary-exist → architecture                                                                                    |
| Governance / rules-conformance | `pr-review-governance-maker`   | Mechanical conformance to already-documented `repo-governance/` conventions, naming/structure, ADRs, spec-file presence, PR-body required sections _present_ | Whether a new rule should exist → architecture; scenario completeness → logic; instruction-decay → instruction; whether the body _accurately describes_ the diff → docs |
| Security                       | `pr-review-security-maker`     | Secrets in diffs, injection, untrusted-input handling, git-fixture isolation, unsafe git/FS operations                                                       | Non-security convention text → governance                                                                                                                               |
| CI-gaming / test-integrity     | `pr-review-integrity-maker`    | CI-gaming (weakened/skipped/narrowed tests, coverage-gaming), missing regression tests (regression-test-mandate)                                             | Whether the behaviour is correct → logic                                                                                                                                |

**Why a refutation clause, alongside the confidence score.** Across the 94 findings posted on
PRs #225/#226/#227/#232, stated confidence did not predict survival: mean 91.5 on findings the
fixer accepted versus 93.0 on those it rejected or deferred — flat, and slightly inverted. A self-scored number is not
checkable by anyone. What the finding claims would disprove it **is** checkable, by the fixer and by
a human. The 80-floor stays: no finding in that sample was posted below it, so it may be exactly
what keeps weak findings out, and this data cannot show otherwise.

**Continued in** [Nine Reviewer Disciplines: Table (2)](./the-nine-reviewer-disciplines-table-documentation-to-type-soundness.md) — Performance through Type-soundness, plus the scout/synthesis roles.
