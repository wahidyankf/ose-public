# OpenClaw for Engineers (By Example)

**Course ID**: `openclaw-for-engineers` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/artificial-intelligence/tools/openclaw` (12 files, 56,171 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches OpenClaw as an engineer would actually drive it from a terminal: configuration, prompting discipline, tool/permission scoping, and failure recovery. It excludes the vendor's own onboarding tutorial and any content that only a live account can prove.

**Short summary**: OpenClaw is a terminal coding agent; this course covers its configuration, permission model, and failure recovery at the same depth as the other three.

## Why this exists · the big idea

- **The problem before the solution**: Without a dedicated course, OpenClaw's specific configuration surface and failure modes are undocumented for a learner comparing agent tools.
- **Keep-this-if-you-forget-everything**: Treat the agent's output as a draft from a fast junior, not as a fact; verify everything it claims before you act on it.

## Learning objectives

After this course you can:

1. configure OpenClaw for a real repository: its config file, its permission or sandbox model, and its session or context scope.
2. write prompts and task briefs for OpenClaw that state the done condition and the files it may touch.
3. read OpenClaw's own trace or log output and tell a correct step from a plausible-looking wrong one.
4. recover from a stuck or looping OpenClaw session without losing the work already done.
5. compare OpenClaw against at least one other agent tool in this plan on a shared, repeatable task.

## Prerequisites

- **Prior courses**: `agentic-coding`, `version-control-and-git`, `just-enough-bash`.
- **Assumed knowledge**: Comfort with a terminal, Git, and reading a diff.
- **Language medium (prerequisite rubric rule L1)**: every example drives OpenClaw from the command line and inspects its output and logs with Python 3.14, so `just-enough-python` is not required but `just-enough-bash` is listed because every example starts from a shell invocation. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `agentic-coding`, `version-control-and-git`, `just-enough-bash`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- OpenClaw's own current documentation and changelog, read and dated on the day the maker writes each lesson (fast-changing-tool policy, tech-docs/005): record the exact version string, the access date, and a direct link in `## References`.
- No fact about current pricing, current model routing, or current default behaviour is copied from this plan or from the legacy pages without a fresh, same-day check; the legacy pages predate this plan and may already be stale.
- Every runnable example drives a fixture shim, not the live product: no real network call, no real API key, and no real account. The shim's behaviour is documented as a simplification, not as the vendor's guaranteed behaviour.

## Concepts

- **co-01 · tool-invocation-model** — how OpenClaw calls out to an editor, a shell, or a file system.
- **co-02 · permission-scope** — what the agent may read, write, or execute without asking.
- **co-03 · session-and-context** — what the agent remembers within and across turns.
- **co-04 · task-brief** — a prompt that states scope, done condition, and guardrails.
- **co-05 · plan-then-act** — letting the agent propose a plan before it changes files.
- **co-06 · diff-review** — reading a proposed change before it is applied.
- **co-07 · tool-use-trace** — the agent's own record of which tool it called and why.
- **co-08 · failure-mode** — a stuck loop, a wrong assumption, or an unsafe action.
- **co-09 · recovery-step** — interrupting, correcting, or restarting a session safely.
- **co-10 · cost-and-budget** — turns, tokens, or time spent per task.
- **co-11 · multi-file-change** — a change that touches more than one file coherently.
- **co-12 · test-gate** — making the agent prove its own change with a run.
- **co-13 · config-file** — OpenClaw's own settings file and what each setting controls.
- **co-14 · extension-or-plugin** — adding a capability the base agent does not ship with.
- **co-15 · comparison-criteria** — a fair, repeatable way to compare two agent tools.
- **co-16 · human-in-the-loop** — the point where a person must approve before anything ships.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: OpenClaw is best taught as a long list of small, concrete invocations (a config, a prompt, a log line, a recovery) that each stand alone and build toward real workflows, which is exactly what By Example is for.

| Target             | Value                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                  |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                             |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                      |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                    |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                 |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                               |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                        |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: ai-engineering`, no `status: outline` |

Anchor runtimes: Python 3.14, standard library only, driving a deterministic fixture shim of OpenClaw's CLI and file-system effects (no real network, no real binary) in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Install, configure, and first task** (ex-01 to ex-08, 8 examples).
- **Cluster: Reading agent output** (ex-09 to ex-17, 9 examples).
- **Cluster: Permission and sandbox basics** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: Prompting discipline and task briefs** (ex-26 to ex-34, 9 examples).
- **Cluster: Multi-file changes and review** (ex-35 to ex-44, 10 examples).
- **Cluster: Logs, traces, and cost** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Failure modes and recovery** (ex-54 to ex-61, 8 examples).
- **Cluster: Extensions and configuration depth** (ex-62 to ex-70, 9 examples).
- **Cluster: Comparing agents on a shared task** (ex-71 to ex-78, 8 examples).

## Capstone spec

Drive the fixture shim of OpenClaw through a small, realistic multi-step repository task (add a feature, fix a bug, and update its test) end to end, recording the full trace, the diffs proposed, and a written judgement of what the maker had to correct. Lives in `learning/capstone/` with its own `run.yaml`, a golden expected trace, and an overview of at least 800 words.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: write a task brief with a clear done condition; spot an unsafe permission grant; diagnose a stuck-loop trace.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: write a scoped task brief; review a proposed multi-file diff; recover a stuck session without data loss.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every example's fixture shim is versioned against the OpenClaw release the maker verified on the day of writing; the `## References` date must be within 30 days of the course's last content commit, checked by the Content Quality Gate.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
