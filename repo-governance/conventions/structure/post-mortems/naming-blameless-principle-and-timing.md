---
description: Filename and location rules for post-mortem documents, the blameless-culture standard for writing them, and the timing expectation for authoring one
when_to_use: Read this when naming a new post-mortem file, applying the blameless-culture standard while writing one, or deciding how quickly to write it after an incident.
---

# Location, Naming, Blameless Principle, and Timing

## Location and Naming

Post-mortems live in the **Diátaxis "explanation" tier** because they build conceptual
understanding of how a system behaved under stress.

**Location**: `docs/explanation/post-mortems/`

**Filename pattern**: `YYYY-MM-DD-<system>-<short-failure>.md`

Where:

- `YYYY-MM-DD` is the **incident date** (not the writing date)
- `<system>` is the affected system or service (kebab-case)
- `<short-failure>` is a brief kebab-case description of what failed

**Rules**:

- Flat directory — no subdirectories inside `docs/explanation/post-mortems/`
- All components lowercase kebab-case
- Index maintained in `docs/explanation/post-mortems/README.md`

**Examples**:

| PASS: Correct                                       | FAIL: Incorrect                           | Why                                                            |
| --------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `2026-06-05-github-actions-nx-affected-stall.md`    | `post-mortem-2026-06-05.md`               | Missing system and failure                                     |
| `2025-11-01-organiclever-www-vercel-outage.md`      | `2025-11-01__organiclever-www__vercel.md` | Double underscore is plans-folder style, not post-mortem style |
| `2025-09-14-Rhino-coverage-threshold-regression.md` | `2025-09-14-Rhino.md`                     | Uppercase not allowed                                          |

## Blameless Principle

Post-mortems examine **systems and processes**, not individuals.

**Apply the "second story" (Allspaw / Dekker)**: Ask "how did this sequence of events make sense
to the people involved at the time?" rather than "who made a mistake?" The first story is the
incident timeline; the second story is the context, pressures, and system state that made each
decision reasonable.

**Practical rules**:

- Avoid "human error" as a root cause. Human error is a symptom; the question is what system
  condition made that error likely or consequential.
- Never name individuals in a blame context. Roles and team descriptions are fine
  ("the on-call engineer", "the deployment pipeline", "the CI job"); attributing fault to a
  person is not.
- Avoid hindsight bias: document what was known at each decision point, not what you know now.
- Avoid "blameless buck-passing": shifting blame from a person to a team, a vendor, or a tool is
  still blame. Contributing factors name conditions, not culprits.

**Sources**: Google SRE "Postmortem Culture: Learning from Failure"; Allspaw, J. (2012)
"Blameless PostMortems and a Just Culture."

## Timing

Write the post-mortem **promptly while details are fresh**. Industry norm: within a few days of
the incident. Delay degrades timeline accuracy and action-item momentum. The `doc_status` field
starts as `draft` until a review pass confirms factual accuracy.
