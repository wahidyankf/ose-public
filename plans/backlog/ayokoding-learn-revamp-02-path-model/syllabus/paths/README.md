# Paths — Target Manifest Specifications

Each file below specifies one manifest. For the 4 career paths it gives the description, goals,
`assumes`, every phase with position numbers and outcomes, and the exact JSON body Phase 3 writes.
For the 4 skills paths it gives the mechanical body Phase 3 writes and, separately, the drafted
restructure that plans 06 and 07 receive as input. Course membership is the same as before for every
path.

| Path ID                                           | File                                                                                                                         | Courses | Core            | Extension      | Plan 02 applies                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- | --------------- | -------------- | ----------------------------------- |
| `careers/interview-ready/software-engineer`       | [manifest-careers-interview-ready-software-engineer.md](./manifest-careers-interview-ready-software-engineer.md)             | 116     | 13              | 103            | full phases                         |
| `careers/immediately-effective/software-engineer` | [manifest-careers-immediately-effective-software-engineer.md](./manifest-careers-immediately-effective-software-engineer.md) | 114     | 13              | 101            | full phases                         |
| `careers/fundamentally-strong/software-engineer`  | [manifest-careers-fundamentally-strong-software-engineer.md](./manifest-careers-fundamentally-strong-software-engineer.md)   | 121     | 24              | 97             | full phases                         |
| `careers/immediately-effective/ai-engineer`       | [manifest-careers-immediately-effective-ai-engineer.md](./manifest-careers-immediately-effective-ai-engineer.md)             | 26      | 25              | 1              | full phases                         |
| `skills/conventional-accounting`                  | [manifest-skills-conventional-accounting.md](./manifest-skills-conventional-accounting.md)                                   | 19      | — (drafted: 19) | — (drafted: 0) | mechanical shape + `plan-06` marker |
| `skills/sharia-accounting`                        | [manifest-skills-sharia-accounting.md](./manifest-skills-sharia-accounting.md)                                               | 24      | — (drafted: 24) | — (drafted: 0) | mechanical shape + `plan-06` marker |
| `skills/conventional-erp`                         | [manifest-skills-conventional-erp.md](./manifest-skills-conventional-erp.md)                                                 | 27      | — (drafted: 27) | — (drafted: 0) | mechanical shape + `plan-07` marker |
| `skills/sharia-erp`                               | [manifest-skills-sharia-erp.md](./manifest-skills-sharia-erp.md)                                                             | 30      | — (drafted: 30) | — (drafted: 0) | mechanical shape + `plan-07` marker |

## Skills Paths: Input for Plans 06 and 07

Decision 39 (the user's answer to `UD-02-01`, 2026-10-09) keeps the four skills paths unchanged for
readers until plan 06 (accounting) and plan 07 (ERP) write their courses. Each skills file below
therefore has two parts:

- **What Plan 02 Writes:** one `all-courses` phase with today's title, description, and course order,
  `assumes: []`, no goals, no outcome, and `restructurePendingIn`. This is the only skills content
  Phase 3 writes.
- **Drafted phases and JSON:** the phases, outcomes, `assumes`, and description the authoring session
  drafted before decision 39. They are **not applied by plan 02**. Plans 06 and 07 take them as a
  starting point and may change them once the courses exist.

The drafted order inside the phases equals today's order for all four paths, so applying the draft
later moves no course.

## E2E Fixture Manifests

The six fixture manifests under `apps/ayokoding-www-fe-e2e/fixtures/manifests/` migrate to the same
shape. They are test data, not published paths, so the real-manifest integrity tests do not load
them. Five fixtures keep their current course membership and order, so existing E2E assertions stay
valid — for example, "Course 2 of 3" with Backend Essentials between Just Enough Bash and SQL
Essentials in `immediately-effective/backend-track`. `generalist-track` keeps its two courses in the
same order and gains one course, `capstone-secure-service`, as an extension phase. It is the only
fixture written to pass every closure rule, because it is the fixture for the new behaviour.

| Fixture path ID                                 | Target phases                                                                                                                                                                 | `assumes`                                                                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `careers/interview-ready/backend-track`         | core `fixture-core` "Fixture core": `just-enough-python`, `data-structures-and-algorithms-essentials`                                                                         | none                                                                                                                            |
| `careers/immediately-effective/frontend-track`  | core `fixture-core`: `just-enough-python`, `frontend-essentials`                                                                                                              | `just-enough-typescript`                                                                                                        |
| `careers/immediately-effective/backend-track`   | core `fixture-core`: `just-enough-bash`, `backend-essentials`, `sql-essentials` (order unchanged)                                                                             | `just-enough-python`                                                                                                            |
| `careers/fundamentally-strong/generalist-track` | core `fixture-core`: `computer-science-foundations`, `software-engineering-practices`; extension `fixture-extension` "Fixture extension": `capstone-secure-service` (outline) | `just-enough-python`, `data-structures-and-algorithms-essentials`, `just-enough-bash`, `software-testing`, `backend-essentials` |
| `skills/e2e-fixture-alpha`                      | core `fixture-core`: `just-enough-bash`, `version-control-and-git`                                                                                                            | `just-enough-python`                                                                                                            |
| `skills/e2e-fixture-beta`                       | core `fixture-core`: `sql-essentials`, `backend-essentials`                                                                                                                   | `just-enough-python`                                                                                                            |

Every fixture core phase carries the outcome `{"can": "complete this fixture path"}`. The
`generalist-track` fixture is the one E2E target for phase headings, the extension heading, the
Outline badge, the "Before you start" note, and Next crossing into the extension. No existing E2E step
asserts its course count. The `assumes` lists of the other five fixtures follow the closure rule
for documentation value only; nothing validates them.
