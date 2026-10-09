# 008 — Testing Strategy

## Layer summary and scenario-to-test map

| Gherkin scenario                                                                    | Layer                                                                            | Test                                                                                                                                                                       |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every legacy file is matched by exactly one mapping row                             | Unit                                                                             | A new `tests/unit/be-steps/legacy-mapping.steps.ts` step that walks the real legacy tree and the mapping table and asserts a 1:1 match                                     |
| Every mapping row's target resolves to a real course or a dash                      | Unit                                                                             | Same file: asserts every `covered`/`new` Target slug has a matching directory under `learn/courses/`                                                                       |
| learn/legacy is untouched by this plan                                              | Unit                                                                             | A diff-based check in the same file (or a dedicated CI step) comparing this branch's tree against the commit where plan 09 merged, filtered to the legacy path             |
| No migrated course is an outline                                                    | Unit                                                                             | Extends the existing content-shape test (`course-metadata.steps.ts`'s `checkCourseCorpus`) to the 48 new slugs                                                             |
| Every migrated course reaches its mode's word floor and has a capstone and drilling | Unit                                                                             | Same extension: word counts, capstone presence, drilling section presence, per course's assigned mode                                                                      |
| Every code-bearing example is a harness unit                                        | Unit (integration-exempt, e2e-exempt per the pattern plans 06 to 09 already use) | `ayokoding-www:examples:check` plus a structural check that every `learning/code/`, `drilling/code/`, and `learning/capstone/code/` directory has a `run.yaml`             |
| AI coding-agent courses date every version-specific claim                           | Unit                                                                             | A new step that parses each of the 4 courses' References sections for a date and checks it is within 30 days of the course's last content commit                           |
| The total course count and every per-category count match the real corpus           | Unit                                                                             | Extends the existing catalog corpus test (plan 03) with the new totals from [tech-docs/004](./004-catalog-metadata-and-path-membership.md#category-totals-after-this-plan) |

Every scenario above is `@integration-exempt` and `@e2e-exempt` with the same reasoning plans 06 to 09
already used: the property under test (a file's content, a mapping row, a frontmatter field, a harness
unit's presence) is observable by reading committed files, with no separate local-resource or
browser/HTTP boundary to cross; the alternative proof is named as the Unit scenario in each exemption
comment, per the BDD contract.

## Quick vs full suite

- `ayokoding-www:test:quick` runs the extended content-shape and metadata tests on every PR (these are
  fast, file-reading checks).
- `ayokoding-www:examples:check` (the harness) runs on the affected courses per PR and in full monthly or
  on a toolchain bump (plan 05's existing CI rule); because this plan adds the WebAssembly toolchain and
  extends the `clojure` and `kotlin` entries (and the shared `JarFetch.java`), one full run is scheduled in
  Phase 1 before any course that needs a changed entry is marked done (see
  [tech-docs/003](./003-code-harness-determinism-and-toolchain-additions.md)).

## What is explicitly not re-tested

Plans 11 to 13's audit of the 111 pre-existing, `covered`-adjacent courses is out of this plan's scope;
this plan's tests check only the 48 new courses and the mapping artifact itself, never re-grading an
existing course's quality. A `covered` row's Evidence is a claim this plan's own PR reviewer checks by
reading it, not a new automated test, because automating "is this existing course's depth comparable"
would require the same judgement a human reviewer already applies when reading the Evidence column.
