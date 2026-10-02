---
description: >-
  Fixes a quality gate's three inputs, the criticality-by-confidence scoring and modes that decide which findings block,
  and the deterministic boundary that keeps tooling out of a gate's findings.
when_to_use: >-
  Use when declaring a gate's inputs, rating or classifying its findings, or deciding whether a property belongs to a
  gate or to deterministic tooling.
---

# Inputs, Scoring, and the Deterministic Boundary

## Inputs

| Input        | Type    | Values                                       | Default  |
| ------------ | ------- | -------------------------------------------- | -------- |
| `subject`    | string  | The family's subject: paths, a pull request  | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`             | `normal` |
| `max-cycles` | integer | 1, 2, or 3; any other value refuses to start | 3        |

No other input bounds a run. A gate declares no iteration count under another name, no minimum number of cycles, no
audit count, and no early-warning cycle. A ceiling above 3 is never valid, whoever sets it.

A repository may lower its default `max-cycles` in `repo-config.yml`, but never raise it above 3. A caller may pass a
lower value for one run.

## Scoring

Each finding carries two independent ratings, per
[Finding Criticality and Confidence](../../quality/criticality-levels.md) and the
`repo-assessing-criticality-confidence` skill:

- **Criticality**, rated by the checker: `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`.
- **Confidence**, rated by the writer when it re-validates the row against the current state: `HIGH`, `MEDIUM`, or
  `FALSE_POSITIVE`.

## Modes

The mode sets the blocking threshold.

| Mode     | Blocks                |
| -------- | --------------------- |
| `lax`    | `CRITICAL`            |
| `normal` | `CRITICAL` and `HIGH` |
| `strict` | adds `MEDIUM`         |
| `all`    | adds `LOW`            |

A row is _blocking_ when its criticality meets the threshold. A non-blocking row is recorded in the ledger and never
repaired, and it never opens another cycle. In the default mode, `MEDIUM` and `LOW` findings are therefore recorded, not
fixed.

Confidence decides what happens to a blocking row once the writer has it:

| Confidence       | Outcome                                                                    |
| ---------------- | -------------------------------------------------------------------------- |
| `HIGH`           | repaired, then verified                                                    |
| `MEDIUM`         | recorded `needs-decision`; no edit, because the repair is a judgement call |
| `FALSE_POSITIVE` | recorded `not-applicable` with the disproof                                |

A `needs-decision` row stays open, and an open one at the end of the run makes the verdict `FAIL`.

## The Deterministic Boundary

A gate judges only non-deterministic properties: clarity, completeness, fitness, coherence, risk. A property that a
deterministic tool or a test already proves is never reported as a finding, however the gate notices it. Each gate file
lists those properties in its `## Deterministic Boundary` table, with the tool or test that owns each, per
[Deterministic and Judgement Validation](../../../conventions/structure/deterministic-vs-ai-validation-split.md).

Tooling plays two other parts instead:

- **Entry check.** Before the first audit, the repository's declared deterministic gate for the subject runs once. The
  command comes from `repo-config.yml`, never from the gate file.
- **Exit check.** After the final repair at the ceiling, the same command runs once more as the last safety net.

Tooling is never a source of findings, and only tooling can refuse a commit, a merge, or a push.

## Red Entry: The Root-Cause Pre-Step

A red entry run starts a separate pre-step before cycle 1, outside the cycle budget. It diagnoses the failure, repairs
its cause, and runs the entry check again, for at most 3 attempts. It follows
[Preexisting Error Resolution](../../practice/proactive-preexisting-error-resolution.md) for a failure that predates the
run, and [Upstream Tool Defects](../upstream-tool-defects.md) for a defect in a pinned tool.

Silencing the check, skipping it, or narrowing its scope is not a repair. Still red after the third attempt, the run
ends `BLOCKED` (tooling) with the diagnosis, and no audit starts.
