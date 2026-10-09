# 005 — AI Path Goal and Closure

Plan 02 left the Immediately Effective AI Engineer path without goals, because its natural goal, the
coding-agent capstone, was an outline and a core course may not be an outline (series decision 6). This
plan fills that capstone, so the path gets its goal. This page says exactly what changes in the
manifest, proves the new core is the goal's prerequisite closure, and lists the tests that change.

The exact manifest is in
[../syllabus/paths/manifest-careers-immediately-effective-ai-engineer.md](../syllabus/paths/manifest-careers-immediately-effective-ai-engineer.md);
this page explains it.

## What Changes

| Aspect        | After plan 02 (draft)                               | After this plan                                                                     |
| ------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `goals`       | none                                                | `capstone-build-your-own-coding-agent`                                              |
| Core          | 25 courses in six phases, curated                   | 12 courses in four phases: exactly the goal and its prerequisite closure            |
| Extension     | 1 course (the outline capstone)                     | 16 courses in five named phases                                                     |
| Total courses | 26                                                  | 28 (adds `async-python-and-fastapi-services` and `software-engineering-practices`)  |
| `assumes`     | 11 courses                                          | 4: `api-design`, `backend-essentials`, `just-enough-bash`, `sql-essentials`         |
| Description   | "…build, evaluate, deploy, and operate AI systems." | "…build an AI coding agent, then go deeper on evaluation, serving, and operations." |
| Capstone      | last phase of the extension, an outline             | last phase of the core, filled                                                      |

## Why the Core Is the Closure

The three rules that decide it were resolved by the user on 2026-10-09 and are restated here:

- **Decision 6.** An outline course is never in a core. Once the capstone is filled, it may be.
- **Decision 7.** A career arc's core is its goal course(s) plus every transitive prerequisite, stopping at
  the courses the path assumes. The three software-engineer paths already work this way (cores of 13, 13,
  and 24).
- **Decision 9.** Tests fail when a core course has a prerequisite that is neither earlier in the path nor
  assumed.

With a goal declared, plan 02's rule R6 requires the core to equal `computeCore(goals,
prerequisitesByCourse, assumes)`. A curated core of 25 would fail R6. So the path either keeps a goal and
accepts the closure as its core, or declares more goals to keep the old core. The decision record
D4 in [008](./008-decision-records.md#d4--the-ai-core-is-the-closure-of-one-goal) compares them.
The selection is one goal, and the core is the closure: the path then reads as "what you need to build
this agent", and everything else is a named, optional extension.

**Product-shape change to flag to the user.** The core shrinks from 25 to 12 courses. Nothing is
deleted: all 26 courses of the draft remain on the path, 16 of them as extension. The change is visible
on the path page (a shorter core, five extension phases) and in the roadmap that plan 04 builds from the
manifest.

## Closure Proof

Core = the goal plus every transitive prerequisite, stopping at `assumes`. The input is plan 02's
**complete** revised graph (kept and added edges) with this plan's one edge change for the capstone
(`just-enough-python` added).

| Pos | Core course                                       | Prerequisites (complete graph)                                      | Where each prerequisite sits |
| --- | ------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------- |
| 1   | `just-enough-python`                              | none                                                                | —                            |
| 2   | `async-python-and-fastapi-services`               | `just-enough-python`, `backend-essentials`, `sql-essentials`        | 1; assumed; assumed          |
| 3   | `software-testing`                                | `just-enough-python`                                                | 1                            |
| 4   | `software-engineering-practices`                  | `just-enough-bash`, `software-testing`, `backend-essentials`        | assumed; 3; assumed          |
| 5   | `creating-ai-powered-apps`                        | `backend-essentials`, `api-design`                                  | assumed; assumed             |
| 6   | `agentic-ai`                                      | `creating-ai-powered-apps`                                          | 5                            |
| 7   | `the-agent-loop`                                  | `agentic-ai`                                                        | 6                            |
| 8   | `agent-tools-and-mcp`                             | `the-agent-loop`                                                    | 7                            |
| 9   | `agent-context-and-memory`                        | `the-agent-loop`                                                    | 7                            |
| 10  | `agent-permissions-and-sandboxing`                | `the-agent-loop`                                                    | 7                            |
| 11  | `agent-orchestration-subagents-and-observability` | `agent-tools-and-mcp`, `agent-context-and-memory`                   | 8; 9                         |
| 12  | `capstone-build-your-own-coding-agent` (goal)     | 1, 2, 4, 7, 8, 9, 10, 11 (the eight courses in its `prerequisites`) | all earlier                  |

Checks, all satisfied by the manifest:

- **R4 closure.** No core course has a prerequisite that is outside the core and not assumed.
- **R5.** No core course is an outline (the capstone is filled by this plan; the others were always
  filled).
- **R6.** The core set equals `computeCore`: 12 courses.
- **R7 exact `assumes`.** The courses outside the core that core courses require are exactly the four
  assumed courses, and each is used: `sql-essentials` (position 2), `backend-essentials` (positions 2, 4,
  5), `api-design` (position 5), `just-enough-bash` (position 4).
- **R10 ordering.** In the flattened order, every in-path prerequisite precedes its course, in the core
  and in the extension (checked for all 28 courses).

**Trap to avoid.** Reading only the "kept edges" column of plan 02's evidence table gives a core of 11
courses, which is wrong: that table has three columns (kept, removed, added), and
`software-engineering-practices` gains `just-enough-bash`, `software-testing`, and `backend-essentials`
as added edges. The proof above uses all three columns, and the executor never trusts a document for the
closure: the RED step in [How the Closure Is Recomputed](#how-the-closure-is-recomputed) prints the
expected core from the merged `prerequisites` frontmatter.

### Why `just-enough-bash` is assumed and `software-testing` is core

The path is "for developers who already code" (decision 10), and plan 02's draft already assumed
`just-enough-bash`. `software-testing` was core in the draft, and the capstone's test-first fix in
theme E reaches it through `software-engineering-practices`. Keeping each where plan 02 put it changes
the least. Assuming `software-testing` instead would give a core of 11; Phase 0 reads the merged plan 02
output and keeps this choice unless the merged draft says otherwise.

## How the Closure Is Recomputed

The recomputation is a unit test, not a script (series decision 37). The path phase is test-first:

1. **RED.** Add the new assertions to `careers-ai-manifest.unit.test.ts` and set only `goals` in the
   manifest. Plan 02's integrity test now fails rule R6 and prints the expected core from `computeCore`
   for the **merged** graph. The executor compares that printed set with the table above.
2. **Reconcile.** If the sets are equal, continue. If they differ (for example because plan 02's table
   was revised), the executor edits this page and the manifest spec in the same branch, records the
   cause in the ledger, and continues; an unexplained difference stops the path phase.
3. **GREEN.** Write the phases, `assumes`, description, and page copy. Run the integrity, membership,
   and AI manifest tests; all pass.

## Membership Test

Plan 02 freezes each path's course set in
`apps/ayokoding-www/tests/unit/features/course-paths/manifests/legacy-membership.ts` and asserts, in
`manifest-membership.unit.test.ts`, that each real manifest's sorted course set equals its frozen set.
That guard exists to catch an accidental addition or loss of courses during plan 02's rewrite. Plan 08
changes the AI path's membership on purpose: it adds two courses.

The edit, in this plan:

1. Add `async-python-and-fastapi-services` and `software-engineering-practices` to the AI path's frozen
   array, keeping the array sorted. The expected length goes from 26 to 28.
2. Write the reason in a comment next to the array: "Plan 08: the coding-agent capstone becomes the
   path's goal, and its prerequisites async-python-and-fastapi-services and
   software-engineering-practices join the path."
3. Run `manifest-membership.unit.test.ts`; it passes only if the manifest and the array agree.

The other path arrays do not change. Any later change to a path's membership needs the same treatment,
which keeps the test useful. It is the one exception to "frozen" that this plan makes.

## Test Changes

All paths are relative to `apps/ayokoding-www/`.

| File                                                                                        | Change                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/unit/features/course-paths/manifests/careers/careers-ai-manifest.unit.test.ts`       | Keep the existing assertions (resolve, ordering, evaluation before delivery). Add: `goals` equals `["capstone-build-your-own-coding-agent"]`; the core has 12 courses and its last course is the goal; `assumes` equals the four courses; the core phases are `python-services-and-practice`, `building-with-models`, `agents`, `capstone` |
| `tests/unit/features/course-paths/manifests/legacy-membership.ts`                           | AI array gains two IDs (see above)                                                                                                                                                                                                                                                                                                         |
| `tests/unit/features/course-paths/manifests/careers/career-goals.unit.test.ts` (new)        | Test-only check: every career manifest declares at least one goal, so no career core is a hand-curated list                                                                                                                                                                                                                                |
| `tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts` (plan 02)    | No edit. It must pass for the real AI manifest with a goal: R4, R5, R6, R7, R10                                                                                                                                                                                                                                                            |
| `tests/unit/features/course-paths/content/path-copy.unit.test.ts` (plan 02)                 | No edit. Its scope already covers `content/en/learn/paths/careers/**`; it must pass for the new AI body and description                                                                                                                                                                                                                    |
| Tests that assert the AI path's old core size or phase names (found by a search in Phase 0) | Updated to the new values                                                                                                                                                                                                                                                                                                                  |

The two new scenarios in [006](./006-e2e-rebinding-and-testing-strategy.md) (every career path declares a
goal; the AI path ends in its goal) are bound to these unit tests.

## Content Changes

- `apps/ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json`:
  the JSON in the manifest spec.
- `apps/ayokoding-www/content/en/learn/paths/careers/immediately-effective/ai-engineer/_index.md`: the
  `description` frontmatter value (equal to the manifest's) and the body in the manifest spec. Its other
  keys do not change. `content/id/**` is untouched.
- Any other place that states the AI path's size or phases (a spec, a doc, an E2E fixture) is found by
  searching for `ai-engineer`, `AI Engineer`, and `25 courses` in `specs/`, `docs/`, and
  `apps/ayokoding-www-fe-e2e/`, and updated if it makes a claim the new manifest breaks.

## Order Inside the Plan

The path phase needs only the coding-agent capstone (its goal). It runs after all eight courses are
finished, so a single end-to-end verification covers everything, and it is **skipped** if the coding
agent is BLOCKED: with an outline goal, R5 would fail. In that case the AI path stays as plan 02 left
it, the plan cannot meet the end-state gate, and the executor reports to the user. A BLOCKED course never
causes a half-edited manifest to be committed.

## Rollback

Revert the manifest, `legacy-membership.ts`, the page copy, and the test edits as one revert. The
capstone content can stay. Partial rollback (only the manifest) makes the integrity and membership tests
fail, as plan 02 notes for its own migration.
