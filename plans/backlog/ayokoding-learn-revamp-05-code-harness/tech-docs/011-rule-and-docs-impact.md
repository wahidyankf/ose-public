# Rule Impact and Docs Propagation

This plan creates rules that content authors and plans 06–13 must follow, and it changes what the
quality gates may judge. Phase 7 of [delivery.md](../delivery.md) runs the
[Rules Propagation](../../../../repo-governance/workflows/quality/rules-propagation.md) workflow over
the inventory below, then the Rules Quality Gate (at most 2 cycles).

## Rule Inventory

| ID  | Rule (one obligation each)                                                                                                                                                                                                                                                              | Scope                                            | Intended enforcement                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| HC1 | A course with any `run.yaml` is opted in. From then on every unit is covered, there is no layout or sync finding, and `ayokoding-cli examples check --course <slug>` exits 0.                                                                                                           | `apps/ayokoding-www/content/en/learn/courses/**` | Gated: `ayokoding-www:examples:check` in the PR gate for affected opted-in courses; monthly full run |
| HC2 | Course code lives only in canonical units: `learning/code/ex-NN-<slug>/`, `drilling/code/kata-NN-<slug>/`, `learning/capstone/code/`.                                                                                                                                                   | Same                                             | Gated: `examples validate` (`ayokoding.layout.*`) for opted-in courses                               |
| HC3 | In an opted-in course, every code fence is anchored and byte-identical to its target, or marked `<!-- harness: illustration -->`; every `**Output**` block is anchored to an expected-output file.                                                                                      | Same                                             | Gated: `examples sync` (`ayokoding.sync.*`)                                                          |
| HC4 | `<!-- harness: illustration -->` marks only code that is not meant to run as shown: a fragment, pseudo-code, a deliberately broken snippet, or a tool-install or launch command.                                                                                                        | Same                                             | Judged by the tutorial and content gates; the coverage report counts markers per course              |
| HC5 | Every run is deterministic: no network, no wall-clock reads that reach output or control flow, explicit seeds, and no output that depends on thread order.                                                                                                                              | Same                                             | Partly gated (no network, fixed environment, double run); the rest judged by the gates               |
| HC6 | Examples whose behaviour depends on time, delivery, failure, or interleaving follow the simulation convention S1–S9.                                                                                                                                                                    | Same                                             | S6–S7 gated (summary line, at least 32 seeds); S1–S5, S8, S9 judged                                  |
| HC7 | `mode: static` is used only with a reason from `cloud`, `cluster`, `ios`, `android`, `windows`, and a note saying what the static run proves.                                                                                                                                           | Same                                             | Gated: `examples validate` (`ayokoding.runspec.*`)                                                   |
| HC8 | A course is complete only when it is opted in and `examples check --course <slug>` exits 0 (decision 27). A whole-course gate run records that exit status as an exit criterion; a page-level run on a course that has not opted in notes the course's harness status without blocking. | AyoKoding gate adapter                           | Gated for opted-in courses; the gate adapter states the exit criterion                               |

## Placement

| Rule    | Canonical home                                                                                                                                                    | Reach                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| HC1–HC7 | New module `.agents/skills/apps-ayokoding-www-developing-content/reference/code-example-harness.md`, linked from the skill's `SKILL.md` and `reference/README.md` | Every AyoKoding content maker and fixer loads the skill; plans 06–13 cite the module |
| HC8     | New section "Example Harness" in `repo-governance/development/quality/gate-adapters/ayokoding-www.md`, plus an edit to its "Deterministic Boundary Here" section  | Every content and tutorial gate run on AyoKoding pages                               |
| —       | The four tutorial gates, `repo-governance/workflows/quality/tutorial-{by-example,primer,annotated-concept,in-the-field}-quality-gate.md`                          | Generic wording that defers to a product adapter's declared harness                  |

The skill module also carries the author workflow (format, then `examples sync --write`, then
commit) and a short worked example. It links to nothing under `plans/`, because plans are archived
and the rule must outlive them.

## Exact Text Changes

### Tutorial Gates (Four Files, Same Edit)

Each file has this sentence today:

> A property no tool of its own owns leaves the table and becomes judgeable. No declared gate
> compiles or runs tutorial code here, so whether an example runs is judgeable, as are links and
> front matter in the content trees.

Replace its second sentence with:

> Where the product's gate adapter declares an example harness, that harness owns whether an
> opted-in example runs and whether its lesson block matches its file, and the checker reports
> neither; for any other page, whether an example runs is judgeable. Links and front matter in the
> content trees stay judgeable.

Then add this row to each file's ownership table:

```text
| Example execution and lesson-to-file match | the product's example harness, where its adapter declares one | `ayokoding-www:examples:check` (AyoKoding) |
```

### AyoKoding Gate Adapter

- **Deterministic Boundary Here:** add one sentence. `ayokoding-www:examples:check` (built on
  `ayokoding-cli`) reaches every opted-in course in the PR gate and the monthly full run, so the
  following are never findings for opted-in courses:
  - whether an example runs and prints its expected output;
  - whether a lesson block equals its file;
  - unit layout;
  - `run.yaml` validity.
- **New section "Example Harness":**
  - HC8;
  - a pointer to the skill module for HC1–HC7;
  - the judged parts that remain: HC4, the unenforced half of HC5, and S1–S5, S8, and S9 of HC6.

### CLI Tier Record (`009-tiers-here.md`)

The table row becomes `` `ferret-cli`, `crane-cli`, `ayokoding-cli` | Full bar | ... ``, with a
sentence saying that `ayokoding-cli` starts `docker` and `git` and therefore owes the supervisor
statuses. The stale `ose-cli` entry is removed in the same narrow edit, because `ose-cli` was
retired in commit `d41ea40c4` (PR #226, 2026-08-18), the same commit that retired the Rust
`ayokoding-cli`.

### Other Governance Edits

| File                                                                                                  | Edit                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo-governance/development/infra/nx-targets/domain-work-naming-for-governance-targets.md`           | Row: `examples:check` — "AyoKoding course examples against their `run.yaml` and lesson blocks, through `ayokoding-cli`; runs in the PR gate and monthly"                               |
| `repo-governance/development/infra/nx-targets/execution-model.md`                                     | One sentence: the PR gate also runs `ayokoding-www:examples:check`, a content validation target that executes course examples, not a project test layer                                |
| `repo-governance/development/infra/nx-targets/tag-convention-current-tags-and-examples.md`            | `ayokoding-cli` with `type:app`, `platform:cli`, `lang:go`, `domain:ayokoding`                                                                                                         |
| `repo-governance/development/infra/github-actions-workflow-naming/filename-grammar-and-vocabulary.md` | New verb `examples-check`; amended `quality-gate` meaning                                                                                                                              |
| `repo-governance/development/quality/stacks/repository-adapter/adopter-decisions.md`                  | Go "assertions": `the testing package only` for roots-be and ayokoding-cli. Go "integration selection": `a separate test directory` for ayokoding-cli; roots-be stays "not applicable" |
| `repo-governance/development/quality/stacks/repository-adapter/project-applicability.md`              | Link to `apps/ayokoding-cli/README.md`                                                                                                                                                 |
| `repo-config.yml`                                                                                     | `extensions.software-development.projects.ayokoding-cli: {path: apps/ayokoding-cli, kind: app, stacks: [golang]}`; heading-surface glob for `apps/ayokoding-cli/README.md`             |

## Enforcement Proof (Both Ways)

Phase 7 proves each gated rule fails and then passes, using a fixture course copied to a scratch
content root (never the real content tree):

| Rule | Break                                               | Command                                    | Expected  |
| ---- | --------------------------------------------------- | ------------------------------------------ | --------- |
| HC2  | Move a unit to `learning/extra/code/`               | `examples validate --content <scratch>`    | 1, then 0 |
| HC3  | Change one character in an anchored fence           | `examples sync --content <scratch>`        | 1, then 0 |
| HC5  | Print `time.Now()` in a run                         | `examples run --content <scratch> --all`   | 1, then 0 |
| HC6  | Remove the summary line from a simulation           | Same                                       | 1, then 0 |
| HC7  | Remove `static.note`                                | `examples validate --content <scratch>`    | 1, then 0 |
| HC1  | Delete one `run.yaml` in an opted-in fixture course | `examples check --content <scratch> --all` | 1, then 0 |

HC4 and HC8's judged half are `unenforced by decision`. They need human or agent judgement, and the
gate adapter states this.

## Docs Propagation

| File                                                 | Change                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `apps/README.md`                                     | Tools table row for `ayokoding-cli`                                                                        |
| `apps/ayokoding-www/README.md`                       | The `examples:check` target, its `full` configuration, and the harness contract link                       |
| `apps/ayokoding-cli/README.md`, `CONTRIBUTING.md`    | Usage, exit statuses, local prerequisites (Go, Docker), code map, BDD layers, omitted targets with reasons |
| `specs/apps/ayokoding/README.md`                     | Two logical owners now: `www` and `cli`                                                                    |
| `docs/reference/monorepo-structure.md`               | `apps/ayokoding-cli` entry                                                                                 |
| `docs/reference/system-architecture/applications.md` | `ayokoding-cli` entry                                                                                      |
| `docs/reference/system-architecture/ci-cd.md`        | Examples check in the PR gate; monthly full run; cadence rule                                              |
| `docs/reference/code-coverage.md`                    | `ayokoding-cli` 99% deterministic-core floor                                                               |
| `docs/reference/project-dependency-graph.md`         | `ayokoding-cli` node; the `dependsOn`-only relation to `ayokoding-www`                                     |
| `.github/workflows/README.md`                        | The two new workflows                                                                                      |

## Out-of-Scope Follow-Ups (Reported, Not Done)

- Nothing else found stale. If Phase 7's search finds another stale `ayokoding-cli` or `ose-cli`
  mention outside historical posts and update logs, it is fixed only when it is normative text. A
  historical record stays as written.
