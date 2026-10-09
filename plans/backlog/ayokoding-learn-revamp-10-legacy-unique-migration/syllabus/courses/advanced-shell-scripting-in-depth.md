# Advanced Shell Scripting In Depth (By Example)

**Course ID**: `advanced-shell-scripting-in-depth` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/platforms/linux/tools/shell` (11 files, 75,817 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches robust, production-grade Bash: option parsing, error handling, process control, and safe scripting idioms. It excludes `just-enough-bash`'s primer-level pipes-and-redirection introduction and the dedicated `text-processing-with-awk-sed-and-jq` course.

**Short summary**: A shell script that silently ignores its own errors is a shell script waiting to corrupt production; this course teaches scripts that fail loudly and on purpose.

## Why this exists · the big idea

- **The problem before the solution**: `just-enough-bash` is an explicit primer (4 estimated hours); nobody teaches robust option parsing, strict error handling, process control, and portable scripting idioms at the depth this legacy corpus already reaches.
- **Keep-this-if-you-forget-everything**: `set -euo pipefail` is the default, not an afterthought.

## Learning objectives

After this course you can:

1. write scripts with strict error handling (`set -euo pipefail`) and explain what each flag changes.
2. parse command-line options and arguments robustly, including long options and defaults.
3. control child processes: job control, signal handling, and cleanup with traps.
4. write portable scripts that behave the same across the pinned Debian shell environment's tools.
5. debug a failing script systematically instead of adding stray `echo` statements.

## Prerequisites

- **Prior courses**: `just-enough-bash`.
- **Assumed knowledge**: Basic shell pipes, redirection, and variables from just-enough-bash.
- **Language medium (prerequisite rubric rule L1)**: every example is a Bash script, so `just-enough-bash` is listed as the only prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-bash`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- The POSIX shell specification and the Bash manual, read and dated at writing time, for behaviour that is stable across versions.
- The pinned Debian shell toolchain (bash, coreutils, git, jq, sqlite3) is the source of truth for any tool-specific behaviour.

## Concepts

- **co-01 · strict-mode** — `set -e`, `-u`, `-o pipefail`, and what each catches.
- **co-02 · option-parsing** — reading short and long flags and positional arguments.
- **co-03 · trap-and-cleanup** — running cleanup code on exit, error, or signal.
- **co-04 · subshell-vs-current-shell** — where a variable assignment or `cd` takes effect.
- **co-05 · process-substitution** — treating a command's output as a file.
- **co-06 · job-control** — backgrounding, foregrounding, and waiting on child processes.
- **co-07 · signal-handling** — responding to SIGINT, SIGTERM, and friends.
- **co-08 · quoting-discipline** — when and why to quote a variable expansion.
- **co-09 · array-and-associative-array** — Bash's indexed and keyed collections.
- **co-10 · here-document-and-here-string** — embedding multi-line or inline input.
- **co-11 · exit-code-discipline** — propagating and checking meaningful exit codes.
- **co-12 · idempotent-script** — a script safe to run twice.
- **co-13 · logging-and-verbosity** — a consistent way to report progress and errors.
- **co-14 · portability-check** — avoiding a bashism the pinned toolchain does not actually need, or confirming it when it does.
- **co-15 · shellcheck-style-review** — systematically finding common scripting mistakes.
- **co-16 · testing-a-script** — verifying a script's behaviour with a fixture and an expected output.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Robust scripting idioms are best taught as many small, independently runnable scripts (a trap, an option parser, a signal handler), which is exactly what By Example provides.

| Target             | Value                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                         |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                    |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                             |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                           |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                        |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                      |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                               |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: programming-languages`, no `status: outline` |

Anchor runtimes: Shell (Debian, bash and coreutils pinned), no network, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Strict mode and exit codes** (ex-01 to ex-08, 8 examples).
- **Cluster: Option and argument parsing** (ex-09 to ex-17, 9 examples).
- **Cluster: Quoting discipline** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: Traps and cleanup** (ex-26 to ex-34, 9 examples).
- **Cluster: Arrays and associative arrays** (ex-35 to ex-44, 10 examples).
- **Cluster: Process substitution and here-documents** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Job control and signals** (ex-54 to ex-61, 8 examples).
- **Cluster: Portability and review** (ex-62 to ex-70, 9 examples).
- **Cluster: Testing a script against a fixture** (ex-71 to ex-78, 8 examples).

## Capstone spec

Build a small deployment-helper CLI script with option parsing, strict error handling, a trap-based cleanup, signal handling for a long-running step, and a fixture-based test suite, with a golden expected transcript. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: find the missing quote that breaks a script on a filename with spaces; add a trap that cleans up a temp directory on any exit path; design an option parser for a script with five flags.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: convert a script to strict mode and fix what it reveals; add signal handling to a long-running loop; write a fixture-based test for an existing script.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every script's test fixture is committed; no example reads real system state outside its own fixture directory.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
