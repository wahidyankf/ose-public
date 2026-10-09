# Paths — Target Manifest Specification

This plan changes one manifest: the AI Engineer career path. The other three career manifests already
declare goals (plan 02) and do not change; their only link to this plan is that eight capstone
courses inside them stop being outlines. The four skills manifests belong to plans 06 and 07.

| Path ID                                     | File                                                                                                             | Courses | Core | Extension | This plan applies                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------- | ---- | --------- | --------------------------------------------------------- |
| `careers/immediately-effective/ai-engineer` | [manifest-careers-immediately-effective-ai-engineer.md](./manifest-careers-immediately-effective-ai-engineer.md) | 28      | 12   | 16        | goal, `assumes`, phases, outcomes, description, page body |

## What Changes and Why

- **Goal.** Plan 02 left the AI path without goals because its natural goal,
  `capstone-build-your-own-coding-agent`, was an outline and a core course may not be an outline
  (series decision 6). Once this plan fills the capstone, the path declares it as its goal, as the three
  software-engineer paths declare theirs (series decision 7).
- **Core becomes the closure.** With a goal, the core must equal the goal plus every transitive
  prerequisite, stopping at `assumes` (rule R6). That core is 12 courses, not the 25 that plan 02
  curated, so 16 courses move to named extension phases and two courses the capstone requires join
  the core. The same computation gives 13, 13, and 24 for the other three paths.
- **Fewer assumed courses.** The path assumes four courses (`api-design`, `backend-essentials`,
  `just-enough-bash`, and `sql-essentials`), all of which plan 02 already assumed. Seven of plan 02's
  eleven assumed courses now matter only as outside prerequisites of extension courses, which each course
  page already links.
- **Membership.** The path gains `async-python-and-fastapi-services` and
  `software-engineering-practices`, which the capstone's own `prerequisites` list. The frozen membership
  test from plan 02 is edited for this one path, with the reason written next to the change
  ([tech-docs/005](../../tech-docs/005-ai-path-goal-and-closure.md#membership-test)).
- **Decision record.** The alternatives (extra goals that keep the old core, or assuming the Python
  service course) are recorded in
  [tech-docs/008](../../tech-docs/008-decision-records.md#d4--the-ai-core-is-the-closure-of-one-goal).

## Rules This Manifest Must Pass

R1 to R10 from plan 02, checked by `path-model-integrity.unit.test.ts` over the real manifest: every ID
resolves; no duplicates; unique non-empty phases with core before extension; closure; no outline in
the core; goals inside the core and core equal to `computeCore`; exact `assumes`; and the ordering
rule. R8 (skills shape) and R9 (marker) do not apply. This plan adds one test-only check: every career
manifest declares at least one goal.

## How the Numbers Were Computed

The closure was computed from plan 02's complete revised graph, which has three columns (kept, removed,
added) in `tech-docs/003-prerequisite-rubric-and-evidence.md` of plan 02. Reading only the "kept" column
omits added edges such as `software-engineering-practices` → `just-enough-bash`, `software-testing`,
`backend-essentials`, and gives a wrong core. Phase 0 recomputes the closure from the **merged** graph
on `origin/main` before the manifest is written; the numbers here are the expected result, and a
difference stops the path phase until the table is corrected.
