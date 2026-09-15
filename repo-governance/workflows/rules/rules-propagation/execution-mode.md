---
description: How the propagation run is driven — agent delegation, the N+1 concurrency model, dry-run behaviour, and invocation.
when_to_use: Use when starting a propagation run and deciding how to delegate its steps.
---

# Execution Mode

**Preferred**: Agent Delegation. The main thread owns Steps 0 through 5 — intake, classification,
conflict scan, placement, and eviction — because every one of them is a judgement call that must
survive review. Steps 6 through 8 delegate to the rules agent family.

**Fallback**: Manual Orchestration. The main thread performs every step directly. Slower, and the
only mode available when the agent family is unavailable.

## Delegation Map

| Step  | Owner                                                     |
| ----- | --------------------------------------------------------- |
| 0 – 5 | Main thread                                               |
| 6     | `rules-maker`                                             |
| 7     | Main thread, with `repo-config.yml` reads                 |
| 8     | none — propagation performs its own semantic closure read |
| 9     | Main thread                                               |

## Concurrency

`max-concurrency` caps background agents — the N in the N+1 model, one main thread plus N
background agents. The step DAG governs actual fan-out; N only caps it, and is never
self-promoted beyond the declared value.

Steps 0 through 6 are strictly sequential: each one's output is the next one's input, and a
placement decision made before the conflict scan completes is a placement decision made blind.
Fan-out is available only inside Step 3, where independent subject areas may be scanned
concurrently. Step 8 runs deterministic gates and a subject-local closure read; it never nests the
independent rules quality gate.

## Dry Run

`dry-run: true` executes Steps 0 through 5 and Step 7's disposition analysis, emits the placement
manifest, and writes nothing else. No worktree is created, no file is edited, no PR is opened. Use
it to see where a rule would land and what it would displace before committing to the run.

## Automatic Entry

This workflow is entered **automatically**, not only on request. Two mechanisms carry that, and
neither suffices alone:

- **The agent skill** fires on phrasing — named requests ("add rule") and unnamed standing
  obligations ("from now on…") alike. It reaches every supported harness.
- **The pre-write reminder** fires on target: any write to a repo-rules surface, whatever the
  request said. Warn-only by design, so it cannot deadlock this workflow's own Step 6 writes and
  never grants a permission the tool would otherwise have prompted for.

Phrase matching misses rule work phrased as something else; target matching misses nothing that
reaches a rule surface but fires only once an edit is attempted. Together they cover both routes.

## Invocation

Hand the workflow the rule as prose. It does not require a pre-structured input, a chosen layer, or
a nominated file — determining those is Step 2's job, and a caller-supplied guess at them is
treated as a hint, never as a decision.

## Related Documents

- [Step 0: Intake](./step-0-intake-and-normalization.md) — what the run starts from.
- [Example Usage](./example-usage.md) — worked invocations.
