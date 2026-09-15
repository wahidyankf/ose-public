# 📦 Product Requirements: Repo Rules Sweep

> **Workstream scope** — the requirements below cover **WS-A (ordinal filename prefixes)** only. WS-B
> adds its own stories and acceptance criteria here before it becomes executable.

## Product Overview

Four things, delivered as one sweep per repository:

1. **The Ordinal Filename Prefix Convention** — a prose rule stating when a governed markdown file
   may carry a leading `NN-`, and what carries order when it may not.
2. **Rules-machinery coverage** — the rule becomes an AI-only validation category in
   `repo-rules-checker`, a fix recipe in `repo-rules-fixer`, and an authoring rule in the makers,
   with the `repo-rules-quality-gate` workflow updated to match.
3. **Order-preserving index tooling** — `rhino-cli governance readme-index` stops rewriting the order
   of an existing index and gains a rename-aware `rewrite-paths` mode.
4. **The sweep itself** — every non-qualifying file renamed, continuation-shard boundaries reworked
   into self-standing topics, and anything that busts the word budget re-split on a topic seam.

## Personas

- **Governance author** (maintainer, or `repo-rules-maker` / `repo-workflow-maker`) — names new
  governance files and decides where a split falls.
- **Navigator** (any human or agent) — arrives at a governance directory and needs to read it in
  order.
- **Rules-gate operator** (maintainer, or the `repo-rules-quality-gate` workflow) — expects naming
  drift to be reported by the same machinery as every other repo rule.
- **Release operator** (maintainer) — lands the identical sweep and tooling in the private sibling.

## User Stories

### US-1 — Decide whether a new file gets a number

**As a** governance author, **I want** one stated test for whether a filename may carry a leading
`NN-`, **so that** I do not infer the rule from what the surrounding directory happens to do.

### US-2 — Split a document without inventing an insert escape

**As a** governance author, **I want** the convention to say that word-budget shards are not ordered
files, **so that** I name each for what it contains and never need an `01b-` escape.

### US-3 — Keep reading order through the rename

**As a** navigator, **I want** every index to keep its existing entry order and annotations across
the sweep, **so that** removing prefixes does not silently reorder navigation into alphabetical.

### US-4 — Land on a file and know what it is

**As a** navigator, **I want** each governance file to be a self-standing topic with a name that
describes it, **so that** arriving mid-tree does not require reconstructing a dissolved parent
document.

### US-5 — Have the rules machinery carry the rule

**As a** rules-gate operator, **I want** `repo-rules-checker` to judge ordinal-prefix violations and
`repo-rules-fixer` to repair them, **so that** the rule does not decay the way `file-naming.md` did.

### US-6 — Keep both repositories saying one thing

**As a** release operator, **I want** the convention, the machinery updates, and the sweep applied
identically in the private sibling with the `rhino-cli` change byte-identical, **so that** cross-repo rule
work needs no per-repo naming translation.

### US-7 — Name a new kind of agent without amending a vocabulary

**As an** agent author, **I want** to commit `.claude/agents/repo/repo-rules-frobnicator.md` without
rebuilding `rhino-cli`, **so that** naming a document never requires a code change.

### US-8 — Read a budget rule that matches what the budget measures

**As a** plan author, **I want** the word-budget convention to publish the trees it excludes, **so
that** I stop trimming plan READMEs against a threshold nothing measures.

## Acceptance Criteria

### Feature: The ordinal filename prefix rule

```gherkin
Background:
  Given the Ordinal Filename Prefix Convention is published under repo-governance/conventions/structure/
  And the File Naming Convention cross-links it as the authority on numeric prefixes

Scenario: A real step in a sequence keeps its number
  Given a directory whose children are the numbered steps of one procedure
  When the author names a file for the step it documents
  Then the filename's leading ordinal equals that step's own number
  And the basename carries no second numbering token

Scenario: A word-budget shard carries no ordinal prefix
  Given a governance document split into shards to satisfy the word-budget gate
  When the author names each resulting shard
  Then the filename is lowercase kebab-case with no leading ordinal
  And the parent index carries the reading order instead

Scenario: The file-naming convention no longer contradicts the tree it governs
  Given repo-governance/conventions/structure/file-naming.md states its Simplicity Over Complexity rationale
  When a reader checks that rationale against the ordinal-prefix rule
  Then the two documents state one reconciled rule
  But neither asserts a prohibition the other permits
```

### Feature: Order-preserving index tooling

```gherkin
Background:
  Given rhino-cli governance readme-index manages annotated indexes under repo-governance/ and .claude/

Scenario: Generate no longer rewrites an existing index's order
  Given a directory already has a README.md index with hand-authored entry order
  When the maintainer runs rhino-cli governance readme-index generate on that directory
  Then the existing entries keep their order and annotations
  And only genuinely missing entries are appended

Scenario: Generate still scaffolds a directory with no index
  Given a directory has no README.md index
  When the maintainer runs rhino-cli governance readme-index generate on that directory
  Then a complete annotated index is written
  And every sibling file and subdirectory appears exactly once

Scenario: Rewrite-paths updates link targets without touching order
  Given a rename map of old and new paths for a directory's children
  When the maintainer runs rhino-cli governance readme-index rewrite-paths with that map
  Then every index link target is updated to its new path
  And entry order, annotation text, and surrounding prose are unchanged
```

### Feature: Rules machinery carries the rule

```gherkin
Scenario: The checker judges ordinal-prefix violations
  Given repo-rules-checker runs its Core Repository Validation step
  When it encounters a governed file whose leading ordinal is not a real step number
  Then it reports an ordinal-prefix finding with a criticality and confidence label
  And the finding names which part of the rule the file failed

Scenario: The fixer refuses a rename it must not make
  Given an ordinal-prefix finding names a file inside a generated harness mirror
  When repo-rules-fixer processes that finding
  Then it declines to rename the mirrored file directly
  And it reports the source path under .claude/ as the correct edit target

Scenario: Every surface stating a filename rule agrees with the convention
  Given a discovery sweep lists every governance, agent, and skill file stating a filename-naming rule
  When the maintainer records a verdict for each listed file
  Then every file classified as stating the rule has a disposition of updated or no-change-needed
  And no listed file is left without a recorded verdict
```

### Feature: The sweep

```gherkin
Background:
  Given the order-preserving index tooling has landed

Scenario: A continuation-shard run becomes self-standing topics
  Given a directory contains shards whose titles continue one another by rule or section number
  When the maintainer reworks that boundary
  Then each resulting file is a whole topic with a name describing its own content
  But no file is renamed into another numbered continuation

Scenario: A merged file that busts the word budget is re-split on a topic seam
  Given merging a continuation run produces a file over the governance word-budget fail threshold
  When the maintainer resolves the collision
  Then the file is split again on a topic boundary yielding self-standing names
  And rhino-cli governance word-budget validate exits 0 for every resulting file

Scenario: No index loses a child across the sweep
  Given every renamed file has an entry in its parent index before the sweep
  When the sweep completes and the indexes are rewritten by path
  Then rhino-cli governance readme-index validate reports no missing, orphan, or ghost finding
  And every entry keeps its pre-sweep annotation text

Scenario: No letter-suffix insert escapes remain
  Given the repository previously contained filenames matching a two-digit ordinal followed by a letter
  When the maintainer searches the tracked markdown corpus for that pattern
  Then the search returns zero matches
  And every former escape file is reachable from its parent index

Scenario: Both repositories end on the same rule
  Given ose-public and private-sibling have both been swept
  When the maintainer compares the ordinal-prefix convention and the rhino-cli index tooling across them
  Then the convention states the same rule in both
  And the parity-manifest gate exits 0 in both
```

### Feature: Withdrawing rules that obstruct

```gherkin
Feature: Withdrawing rules that obstruct

  Scenario: A new kind of agent needs no vocabulary amendment
    Given an agent file whose basename ends in a word outside the former role vocabulary
    When the maintainer runs the pre-push gate surface
    Then the gate exits zero

  Scenario: A new kind of workflow needs no vocabulary amendment
    Given a governance workflow file whose basename ends in a word outside the former type vocabulary
    When the maintainer runs the pre-push gate surface
    Then the gate exits zero

  Scenario: The mirror-drift duty survives the deletion
    Given the harness naming validator has been deleted and a mirror file is missing
    When the maintainer runs the harness bindings gate
    Then the gate exits non-zero naming the missing mirror

  Scenario: The kebab-case rule is untouched
    Given a markdown file named with an uppercase letter under repo-governance
    When the maintainer runs the md naming gate
    Then the gate exits non-zero

  Scenario: The word-budget convention publishes the trees it excludes
    Given a plan README far longer than the published README threshold
    When the maintainer runs the governance word-budget validator
    Then it exits zero and the convention document names plans as an excluded prefix
```

## Product Scope

**In scope**

- The convention document, and the `file-naming.md` / `governance-word-budget-remediation.md` /
  `workflow-naming.md` reconciliations.
- The `readme-index` order-preserving `generate` and the new `rewrite-paths` mode, with specs.
- The machinery sweep: `repo-rules-quality-gate` workflow shards, the `repo-rules-*` triad, and every
  skill stating a filename-naming rule — discovered by command, not by hand-picked list.
- The full rename sweep of `repo-governance/` and `.claude/` in both repositories, including
  continuation-shard boundary rework and word-budget re-splits.
- Regeneration of `.opencode/`, `.cursor/`, `.amazonq/` from `.claude/`.
- Withdrawal of the agent-role and workflow-type suffix rules: both convention trees, both
  `rhino-cli` commands, their shared `naming` modules, specs, golden-master fixtures, and gate
  entries — in both repositories.
- Verification that the already-declared `harness-bindings` gate keeps the mirror-drift duty covered
  after `harness naming validate` is deleted. No new gate is added.
- Publishing the word-budget exclude list in `governance-word-budget.md`.

**Out of scope**

- Any gate, detector, audit category, or exit code enforcing the rule.
- `docs/`, `specs/`, `apps/`, `plans/done/`.
- Changing word-budget thresholds, surfaces, or the exclude list itself — WS-C documents the
  exclusion, it does not alter it.
- Renaming existing agents or workflows to match or unmatch the withdrawn rules.
- Withdrawing `md naming validate`; lowercase-kebab-case stays gated.
- WS-B, the File Naming Convention rework.

## Product-Level Risks

| Risk                                                                                       | Effect                                                             | Mitigation                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundary rework changes meaning while claiming to be a rename.                             | Governance rules silently altered.                                 | Rework only merges or re-splits existing text on topic seams; a file whose content would change meaning stays split and is merely renamed, with the decision recorded per directory.                                                                                                                                                            |
| A rename map entry is wrong and a link silently resolves to the wrong file.                | Broken navigation that no gate catches, because the target exists. | The rename map is generated once and applied by `rewrite-paths`; `md links validate` plus `readme-index validate` run over both repositories after application.                                                                                                                                                                                 |
| Authors read the rule as "numbers are banned" and de-number a genuinely ordered procedure. | Semantic order lost.                                               | The rule is stated with worked examples on **both** sides — three **Fails** cases and a real **Passes** case (`04-step-4-fixer.md` → `04-fixer.md`, from `repo-governance/workflows/**/*-quality-gate/`, where the ordinal already equals the step's own number). A rule with only failing examples reads as a ban, which is exactly this risk. |
| The prose-only rule decays without a gate.                                                 | The `file-naming.md` failure repeats.                              | `repo-rules-checker` carries it as an AI-only category; `repo-rules-fixer` carries the fix recipe.                                                                                                                                                                                                                                              |
