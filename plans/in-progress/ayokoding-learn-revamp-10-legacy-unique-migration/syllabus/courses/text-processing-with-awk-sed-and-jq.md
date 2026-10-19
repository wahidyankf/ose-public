# Text Processing with awk, sed, and jq (Annotated-Concept)

**Course ID**: `text-processing-with-awk-sed-and-jq` · **Format**: Annotated-Concept.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/automation-tools/awk` (7 files, 20,972 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/automation-tools/sed` (7 files, 16,970 words)
- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/automation-tools/jq` (7 files, 16,513 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches the three tools as a single toolbox for line-oriented and JSON text processing. It excludes general shell scripting, covered by `just-enough-bash` and `advanced-shell-scripting-in-depth`.

**Short summary**: One line of awk, sed, or jq often replaces ten lines of a general-purpose script; this course teaches which tool fits which shape of text.

## Why this exists · the big idea

- **The problem before the solution**: `just-enough-bash` mentions awk, sed, and jq only in passing (fewer than five uses of each); nobody teaches their own pattern languages (awk's fields and actions, sed's addressing, jq's filter pipeline) as a dedicated subject.
- **Keep-this-if-you-forget-everything**: awk thinks in fields and records, sed thinks in addresses and substitutions, jq thinks in a filter pipeline over JSON.

## Learning objectives

After this course you can:

1. write awk programs that select, transform, and summarize field-oriented text.
2. write sed scripts that address specific lines and substitute text safely, including with capture groups.
3. write jq filters that navigate, transform, and reshape JSON.
4. combine the three tools in a pipeline with other shell commands.
5. choose the right tool (or a general-purpose language) for a given text-processing task and justify the choice.

## Prerequisites

- **Prior courses**: `just-enough-bash`.
- **Assumed knowledge**: Basic shell pipes and redirection.
- **Language medium (prerequisite rubric rule L1)**: every example is a shell script invoking awk, sed, or jq, so `just-enough-bash` is listed as the only prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-bash`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- The POSIX awk and sed specifications and the jq manual, read and dated at writing time, for syntax that is stable across versions.
- The pinned GNU awk, GNU sed, and jq versions in the shell toolchain are the source of truth for any version-specific flag.

## Concepts

- **co-01 · field-and-record** — awk's default split of a line into fields.
- **co-02 · pattern-action** — an awk rule: a condition and what to do when it matches.
- **co-03 · builtin-variable** — awk's NR, NF, FS, and OFS.
- **co-04 · awk-function** — a user-defined or built-in awk function.
- **co-05 · address** — a sed line number, range, or pattern that selects lines.
- **co-06 · substitution** — sed's `s///` command and its flags.
- **co-07 · capture-group** — a parenthesized sed or regex group reused in a replacement.
- **co-08 · hold-space** — sed's secondary buffer for multi-line edits.
- **co-09 · jq-filter** — a jq expression that selects or transforms a JSON value.
- **co-10 · jq-pipe** — chaining jq filters left to right.
- **co-11 · jq-object-construction** — building a new JSON object from parts.
- **co-12 · jq-reduce-and-map** — aggregating or transforming a JSON array.
- **co-13 · streaming-vs-whole-file** — processing line by line versus loading everything.
- **co-14 · idempotent-edit** — a sed or awk edit safe to run twice.
- **co-15 · tool-choice** — deciding between awk, sed, jq, and a general-purpose script.
- **co-16 · pipeline-composition** — combining the three tools and `grep`/`cut`/`sort` in one pipeline.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Three small, related tool languages each need their own themed walkthrough with diagrams of field/address/filter models, which Annotated-Concept supports better than one undifferentiated example list.

| Target                         | Value                                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Worked examples                | 48 in 9 themes (5 / 5 / 5, 6 / 6 / 6, 5 / 5 / 5; floor 45, band 45 to 60)                                                                                                            |
| Pages                          | `learning/overview.md` and nine theme pages `theme-a-<slug>.md` to `theme-i-<slug>.md`; `### Worked Example N: Title` headings                                                       |
| Code-bearing runnable examples | at least 32 of 48, each with a `run.yaml`; at most 16 may be diagram- or table-only                                                                                                  |
| Diagrams                       | at least 10, at least one per theme (the adapter sets no band for this mode)                                                                                                         |
| Annotation density             | 1.0 to 2.25 on code-bearing examples                                                                                                                                                 |
| Course words                   | at least 22,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                      |
| Capstone                       | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                               |
| Metadata                       | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: programming-languages`, no `status: outline` |

Anchor runtimes: Shell (Debian, bash and coreutils) with GNU awk, GNU sed, and jq pinned, no network, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: awk fields and records** (page `learning/theme-a-awk-fields-and-records.md`; ex-01 to ex-05, 5 examples).
- **Theme B: awk patterns and functions** (page `learning/theme-b-awk-patterns-and-functions.md`; ex-06 to ex-10, 5 examples).
- **Theme C: sed addressing** (page `learning/theme-c-sed-addressing.md`; ex-11 to ex-15, 5 examples).

### Themes 4 to 6 (18 examples)

- **Theme D: sed substitution and hold space** (page `learning/theme-d-sed-substitution-and-hold-space.md`; ex-16 to ex-21, 6 examples).
- **Theme E: jq filters and the pipe** (page `learning/theme-e-jq-filters-and-the-pipe.md`; ex-22 to ex-27, 6 examples).
- **Theme F: jq object and array construction** (page `learning/theme-f-jq-object-and-array-construction.md`; ex-28 to ex-33, 6 examples).

### Themes 7 to 9 (15 examples)

- **Theme G: combined pipelines** (page `learning/theme-g-combined-pipelines.md`; ex-34 to ex-38, 5 examples).
- **Theme H: idempotence and safety** (page `learning/theme-h-idempotence-and-safety.md`; ex-39 to ex-43, 5 examples).
- **Theme I: choosing the right tool** (page `learning/theme-i-choosing-the-right-tool.md`; ex-44 to ex-48, 5 examples).

## Capstone spec

Build a log- and JSON-report pipeline: parse a fixed-width log with awk, redact sensitive fields with sed, and reshape a JSON API fixture with jq into a summary report, all chained in one script with a golden expected output. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: pick awk, sed, or jq for five ambiguous tasks and justify each; find the idempotence bug in a sed script; fix a jq filter that drops nulls incorrectly.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: convert a cut/grep chain into one awk program; make a sed substitution idempotent; flatten a nested JSON array with jq.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every example's input and expected output are committed fixtures; no example reads from or writes to a path outside the course's own fixture directory.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
