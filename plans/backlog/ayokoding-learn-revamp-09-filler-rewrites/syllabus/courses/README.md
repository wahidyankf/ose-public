# Course Briefs — Filler Course Rewrites

**Custodian**: ayokoding-learn-revamp-09-filler-rewrites

One brief per course. The course maker receives its brief as the whole assignment and writes the course from it.
Every brief follows the same template, so a reader who knows one knows where to look in the rest.

## Index

| Brief                                                                                   | Mode       | Examples (levels) | `[D]` | Concepts | Katas | Toolchains                    | Wave | Phase |
| --------------------------------------------------------------------------------------- | ---------- | ----------------- | ----- | -------- | ----- | ----------------------------- | ---- | ----- |
| [build-your-own-git](./build-your-own-git.md)                                           | By Example | 78 (26 / 26 / 26) | 32    | 32       | 8     | `python`, `shell`             | 1    | 3     |
| [just-enough-fsharp](./just-enough-fsharp.md)                                           | Primer     | 78 (26 / 26 / 26) | 32    | 30       | 8     | `dotnet`                      | 1    | 3     |
| [defensive-security](./defensive-security.md)                                           | By Example | 78 (26 / 26 / 26) | 36    | 34       | 8     | `python` (PyYAML lock)        | 1    | 3     |
| [type-systems](./type-systems.md)                                                       | By Example | 78 (26 / 26 / 26) | 36    | 30       | 8     | `typescript`, `ocaml`, `rust` | 2    | 4     |
| [lisp](./lisp.md)                                                                       | By Example | 78 (26 / 26 / 26) | 34    | 30       | 8     | `racket`, `clojure` (new)     | 2    | 4     |
| [enterprise-java-and-the-jvm](./enterprise-java-and-the-jvm.md)                         | By Example | 78 (26 / 26 / 26) | 41    | 30       | 8     | `java` (jar recipe, new)      | 2    | 4     |
| [compilers-parsers-and-transpilers](./compilers-parsers-and-transpilers.md)             | By Example | 78 (26 / 26 / 26) | 32    | 30       | 8     | `dotnet`                      | 3    | 5     |
| [vulnerability-management-and-assessment](./vulnerability-management-and-assessment.md) | By Example | 80 (28 / 28 / 24) | 36    | 34       | 8     | `python` (mypy lock)          | 3    | 5     |

The waves follow the prerequisite edges: `compilers-parsers-and-transpilers` needs `just-enough-fsharp` and
`type-systems`; `vulnerability-management-and-assessment` needs `defensive-security`
([tech-docs/006](../../tech-docs/006-execution-model.md)). Every count above is a floor, never a cap (the mode's
ceiling is 85 examples). The `[D]` column counts examples that carry a Mermaid diagram; the mode band is 30 to 50.
`just-enough-fsharp` is the only Primer. `lisp` has one example marked `[I]` (an illustration of Common Lisp,
which has no toolchain here) and `build-your-own-git` has six marked `[S]` (shell units that ask real Git for the
answer).

## Prerequisites After This Plan

| Course                                    | Prerequisites after this plan                                                                    | Change                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| `build-your-own-git`                      | `just-enough-python`, `version-control-and-git`                                                  | unchanged                 |
| `compilers-parsers-and-transpilers`       | `just-enough-fsharp`, `type-systems`, `computer-science-foundations`                             | unchanged                 |
| `type-systems`                            | `functional-programming`, `programming-paradigms`, `just-enough-typescript`, `just-enough-rust`  | adds `just-enough-rust`   |
| `just-enough-fsharp`                      | `functional-programming`, `object-oriented-programming-essentials`                               | unchanged                 |
| `lisp`                                    | `functional-programming`, `programming-paradigms`                                                | unchanged                 |
| `enterprise-java-and-the-jvm`             | `just-enough-java`, `software-architecture`                                                      | unchanged                 |
| `defensive-security`                      | `offensive-security`, `it-and-application-security`, `just-enough-bash`, `just-enough-python`    | adds `just-enough-python` |
| `vulnerability-management-and-assessment` | `security-essentials`, `it-and-application-security`, `defensive-security`, `just-enough-python` | adds `just-enough-python` |

The three added edges are checked against plan 02's path integrity rules in Phase 0; an edge that fails is
dropped ([tech-docs/001](../../tech-docs/001-current-state.md#prerequisite-changes)).

## The Brief Template

Each brief has these sections, in this order.

| Section                        | What it holds                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Course ID, format, scope note  | What the course covers and what it leaves out, with the course that covers the rest                          |
| Short summary                  | One paragraph for the course overview                                                                        |
| Why this exists · the big idea | The problem before the solution, and what to keep if you forget everything else                              |
| Learning objectives            | What a reader can do afterwards, as verbs                                                                    |
| Prerequisites                  | Courses and assumed knowledge                                                                                |
| Mode and targets               | The mode with its reason, the example, word, and diagram floors, and the metadata block                      |
| Defects found 2026-10-09       | What is wrong with the course today, measured                                                                |
| Accuracy notes                 | Facts the maker must re-verify, with sources and dates (rule A3)                                             |
| Concepts                       | The `co-NN` list. Every concept is used by at least one example                                              |
| Worked examples                | The numbered list by level: slug, what it shows, how to verify it, concept, and `[D]`, `[S]`, or `[I]` marks |
| Drilling                       | Floors and the eight named katas                                                                             |
| Capstone spec                  | What the capstone program does                                                                               |
| Code and harness               | Toolchains, locks, determinism, and where a unit's expected output comes from                                |
| Lineage                        | What the course replaces and which earlier plan the topic came from                                          |
| In which paths                 | Where the course sits today (no manifest changes)                                                            |

Security briefs add a table of capstone-handoff examples that must not move.

## How the Counts Were Checked

When the briefs were written, a throwaway script counted, in each brief, the examples per level, the examples
marked `[D]`, `[S]`, and `[I]`, whether the numbering runs 1 to the last without a gap, the katas, and the
concepts. The numbers in the table above are its output. The script is not part of the plan and is not linked. A
maker who adds, drops, or moves an example keeps the three level pages at the counts the brief states, and says in
the ledger why it differs when it does.

## Using a Brief

- The example list is the floor. A maker writes every listed example, may add more, and keeps the examples in
  [../README.md](../README.md#how-executors-use-this-corpus) numbered in order.
- Where a brief says "verify", the unit prints that result and the expected file holds it. A claim of the form
  "the compiler rejects this" is a recorded diagnostic from the pinned compiler.
- An example the toolchain cannot build is replaced by a nearby example that can, in the same branch, and the
  brief is edited to say so. The ledger records the change.
