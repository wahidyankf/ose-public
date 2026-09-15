# Product Requirements Document: Optimize Governance Markdown

Four functional requirements. FR-1 and FR-2 ship together (one gate replaces another); FR-3
and FR-4 are independent gates that make FR-1's output usable.

## Product Overview

[Repo-grounded] This product is **one new** `rhino-cli` gate (`governance word-budget validate`)
plus a **rename-and-extend** of an existing gate (`governance readme-index validate`, split
across two `repo-config.yml` registrations — `governance-readme-index` for the
continuity-preserving `orphan`/`ghost` checks and the new, dark-launched
`governance-readme-completeness` for `missing`/`unannotated`) — plus the migration work needed to
bring both repos' governance Markdown into compliance with all three gate ids. It replaces the
existing byte-based `instruction-size` gate (FR-2) with a word-based ceiling that covers the
whole governance surface, not just the handful of files a harness auto-loads, and adds a
machine-checkable reachability guarantee (README indexing, FR-3) plus a retrieval-trigger
frontmatter key (`when_to_use`, FR-4). See `brd.md` §Business Goal for the "why"; this document
covers "what."

## Personas

[Judgment call — this is a solo-maintainer repo; personas are consumption modes, not
organizational roles]

- **The repo maintainer** — authors and reviews governance content, runs the gates locally
  before pushing, and is the sole human decision-maker for this plan.
- **The consuming AI coding agent** — reads governance Markdown at runtime (on demand via
  `Read`, or natively via a harness's `AGENTS.md`/`CLAUDE.md` resolution) to decide how to act.
  This is the primary beneficiary of the word ceiling and the `when_to_use` retrieval trigger —
  see `brd.md` §Business Impact "Pain point 1" and "Pain point 3."

## User Stories

[Repo-grounded — derived directly from the FR/NFR set below, not new scope]

- As an AI coding agent, I want every governance file under 500 words, so that I can hold the
  whole rule in context without silent truncation (FR-1).
- As an AI coding agent, I want a single word-based size gate instead of two overlapping gates
  in different units, so that I reason about size in the same unit I author in (FR-2).
- As an AI coding agent or a contributor, I want every governance directory's `README.md` to
  link every file beside it, so that splitting a large file never creates an orphaned child
  (FR-3).
- As an AI coding agent, I want every `repo-governance/**/*.md` file to declare `when_to_use`,
  so that I can decide whether a file applies to my current task without opening it (FR-4).
- As a repo maintainer, I want size and reachability enforced as two independent gates with
  their own triggers, so that a failure in one never masks a failure in the other (FR-5).

## Product Scope

**In scope**: the new `governance word-budget validate` gate command, the rename-and-extend of
`governance readme-index validate` (split across the `governance-readme-index` and
`governance-readme-completeness` registrations), and their `repo-config.yml` wiring (FR-1, FR-5);
removal of the byte-based `instruction-size` gate and porting of its resolved-tree check to words
(FR-2); the README sibling-index gate and generator (FR-3); the `when_to_use` frontmatter
requirement (FR-4); the content migration in both `ose-public` and the private sibling needed to make
all three gate ids pass at zero failures.

**Out of scope**: rewriting what any governance rule says (relocation and indexing only);
`ose-primer` (deferred — see `brd.md` §Out of Scope); `apps/`, `libs/`, and `plans/` content;
the root `README.md`/`CONTRIBUTING.md`/`LICENSING-NOTICE.md` files. See `brd.md` §Out of Scope
for the full business-level list; this section covers only the product-scope boundary that
follows from it.

## Product Risks

[Judgment call, cross-referenced against `brd.md` §Top Risks for the business framing]

- **A migrated agent silently loses a rule.** Moving content from an agent's body into
  `.claude/skills/<name>/reference/*.md` only helps if the agent actually reads those files at
  runtime. Mitigated by the mandatory read directive (`tech-docs.md` §3.3) and Phase 6's
  behavioural verification requirement.
- **`AGENTS.md` truncated to an index loses effectiveness for harnesses that do not eagerly
  follow links.** Accepted, not eliminated — see `brd.md` §Top Risks.
- **The README-index annotation drifts from the target's frontmatter** if the gate's
  `generate`/`validate` split ever diverges. Mitigated by FR-3.14 (drift fails the gate).

---

## FR-1 — Governance word budget

### Description

A new gate, `rhino-cli governance word-budget validate`, classifies every Markdown file in the
covered surfaces against a three-tier word threshold and fails the build on any file over the
hard ceiling.

### Requirements

| ID      | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1.1  | Word count is the **raw whole-file** count — YAML frontmatter, fenced code blocks, Mermaid blocks, tables, and link URLs all count                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| FR-1.2  | Classification is `≤ 400` OK (silent), `401–500` Warn (message, exit 0), `> 500` Fail (message, exit 1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| FR-1.3  | Covered surfaces are `repo-governance/**/*.md`, `.claude/**/*.md`, `.cursor/**/*.md`, `.codex/**/*.md`, `.opencode/**/*.md`, `.pi/**/*.md`, `.amazonq/**/*.md`, root `AGENTS.md`, root `CLAUDE.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| FR-1.4  | Generated mirrors (`.opencode/`, `.cursor/`, `.amazonq/`) are **gated**, not exempted, for every mirror this plan itself produces (e.g. `.claude/agents` → `.opencode/agents`) — see FR-1.16 for the one class of exception                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| FR-1.5  | There is **no** exemption list, allowlist, waiver key, or per-file override — the config schema must not admit one                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| FR-1.6  | Thresholds and surface globs live in `repo-config.yml`, not in Rust constants                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| FR-1.7  | A Fail message names the file, its word count, the ceiling, and links the remediation convention                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| FR-1.8  | The gate is enforced at **pre-push** and in the **PR quality gate (CI)**, both `scope: path-gated` — it runs only when a trigger path changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| FR-1.9  | Zero files in `ose-public` and the private sibling covered surfaces exceed 500 words when the plan closes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| FR-1.15 | The gate does **not** port `merged_budget_config`'s harness-registry `instruction:` merge — see "Registry-merge scope decision" below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| FR-1.16 | The `gates:` registration's `args.exclude` list (a mechanism `check_instruction_sizes` has always exposed, `repo-config.yml`) may exclude an entire generated-mirror **tree** that carries no `.claude/` source of truth this plan's own mirroring rule (FR-1.4) applies to — concretely, the Nx-vendored `.opencode/skills/` and `.opencode/commands/` trees added wholesale by an unrelated commit. This is a gate-registration-layer scope decision, one layer below the `governance-word-budget:` config block FR-1.5's `deny_unknown_fields` schema guards — it is not a per-file waiver on an in-scope surface: FR-1.5's no-exemption-schema guarantee is unchanged for every file `args.exclude` does not name, and FR-1.4 holds without exception for hand-authored `.claude/` sources and their generated mirrors |

### Registry-merge scope decision

[Repo-grounded — `apps/rhino-cli/src/application/repo_governance/instruction_size.rs::merged_budget_config`]
The byte gate has a second config source beyond the explicit `instruction-size:` YAML block: it
also folds in every `harness:` registry entry's `instruction:` glob list, applying default
byte thresholds (10,000/13,000/16,000 B) to any glob not already covered by an explicit surface.
The `harness.instruction` registry field this merge reads has **no other consumer** in the
codebase (verified via `grep`) — it exists solely to guarantee every harness-declared instruction
surface is size-gated even without an explicit entry. `merged_budget_config` itself **does** have
a second caller, though: `audit_orchestrator.rs::audit_instruction_size` calls it directly and
consumes its registry-merged output for the `repo-governance audit --category=instruction-size`
command's own results. Dropping the merge is still the right call (FR-1.3's explicit glob list
already supersedes every registry-declared `.md`-extension surface that resolves to an existing
file today — see below), but
`audit_orchestrator.rs` is a real, functionally-coupled call site this plan touches, not an
unaffected bystander — its rename is tracked explicitly in `tech-docs.md`'s File-Impact Analysis
tree.

**FR-1.15 drops this merge.** FR-1.3's explicit glob list is a superset of every harness
`instruction:` entry that resolves to an **existing** `.md` file in either repo today — verified
against the live `harness:` registry (`repo-config.yml` lines 32–62, all 11 harness entries). Six
registry-declared surfaces are **not** covered by FR-1.3 and would lose gating if ever created:
`.cursor/rules/*.mdc` (extension `.mdc`, not `.md` — outside a word-count gate's remit
regardless), `.windsurf/rules/*.md`, `.junie/guidelines.md`, `.github/copilot-instructions.md`,
`GEMINI.md` (the `antigravity` harness's second instruction surface), and `CONVENTIONS.md` (the
`aider` harness's second instruction surface). **All six are absent in both `ose-public` and
the private sibling as of 2026-08-13** (`/bin/ls` confirms), so this drop changes zero observable
behavior today. It is a scoped, accepted future gap, not a silent regression — introducing any
of the five `.md`-extension surfaces (`.windsurf/rules/*.md`, `.junie/guidelines.md`,
`.github/copilot-instructions.md`, `GEMINI.md`, `CONVENTIONS.md`) is new scope for whichever
future plan adds that harness's instruction file, the same way it would have been new scope to
add the `.md` glob explicitly.

### Enforcement: path-gated, not repo-wide (word budget and the new completeness gate only)

`governance-word-budget` and `governance-readme-completeness` are net-new enforcement — neither
has a pre-existing armed gate to preserve — so both are dark-launched and declare
`scope: path-gated` with an explicit `trigger:` list on **both** the `pre-push` and `ci`
surfaces. `governance-readme-index` (orphan/ghost — the rename-and-extend of the
already-armed `md-readme-index` gate, FR-3.19) is the one exception: it stays `scope:
all-file-type`, unchanged from its current live registration, with no dark-launch and no trigger
list — see the callout after FR-1.11 below.

**FR-1.10 — Word-budget triggers**:

```yaml
- id: governance-word-budget
  type: check
  command: governance word-budget validate
  kind: rhino-cli
  ci-group: governance
  surfaces:
    pre-push: &word-budget-triggers
      scope: path-gated
      trigger:
        - repo-governance/
        - .claude/
        - .cursor/
        - .codex/
        - .opencode/
        - .pi/
        - .amazonq/
        - AGENTS.md
        - CLAUDE.md
        - repo-config.yml
    ci: *word-budget-triggers
```

**FR-1.11 — README-completeness triggers** are narrower, matching FR-3.7's covered trees. Mirror
trees and `plans/` are absent from both the scope and the triggers. This trigger list belongs to
the **new** `governance-readme-completeness` gate id (FR-3.20 — `missing` + `unannotated`), not
to `governance-readme-index` (`orphan` + `ghost`). The two gate ids share one implementation
(FR-5.8) but scan and fail differently, and the difference is carried entirely by each
registration's `args:` block — the same mechanism `md-mermaid`'s `args: { exclude: [...] }}` and
`md-links`'s `args: { exclude: [...] }}` already use (`repo-config.yml:743`, `:914`), which
`fixed_arguments()` turns into repeated `--<key> <value>` flags
(`apps/rhino-cli/src/application/repo_config/mod.rs::fixed_arguments`). Two new repeatable flags
are added to `ReadmeIndexAuditArgs`:

- **`--paths <path>`** (repeatable) — overrides the module's `DEFAULT_PATHS` scan scope for this
  invocation. Omitted entirely on `governance-readme-index`, so it keeps scanning the original,
  unwidened 4-entry `DEFAULT_PATHS` with zero config change — the continuity guarantee (FR-3.19)
  falls out of "don't pass the flag," not a second constant to keep in sync. Set explicitly on
  `governance-readme-completeness` to FR-3.7's scope (the narrowed 4-entry list as of Phase 9/16).
- **`--fail-kinds <kind>`** (repeatable; values `orphan`/`ghost`/`missing`/`unannotated`) — the
  command still discovers and reports every finding kind on the scanned scope, but only a finding
  whose kind appears in `--fail-kinds` contributes to the nonzero exit code (mirroring FR-1.2's
  existing Warn-vs-Fail severity split, applied per finding-kind instead of per word-count band).
  `governance-readme-index` sets `--fail-kinds orphan --fail-kinds ghost` so a `missing`/
  `unannotated` finding inside its unchanged 4-entry scope (`repo-governance/` overlaps both
  scopes) is still detected and printed, but never fails the build — preserving FR-3.19's
  guarantee even though both gates scan overlapping directories. `governance-readme-completeness`
  sets `--fail-kinds missing --fail-kinds unannotated`.

```yaml
- id: governance-readme-completeness
  type: check
  command: governance readme-index validate
  kind: rhino-cli
  ci-group: governance
  args:
    paths:
      - repo-governance/
      - .claude/
      - .codex/
      - .pi/
    fail-kinds:
      - missing
      - unannotated
  surfaces:
    pre-push: &readme-completeness-triggers
      scope: path-gated
      trigger:
        - repo-governance/
        - .claude/
        - .codex/
        - .pi/
        - repo-config.yml
    ci: *readme-completeness-triggers
```

`docs/` and `specs/` were dropped from both `args.paths` and the trigger list at the Phase 9
(`ose-public`) / Phase 16 (the private sibling) arming step, per the user decision recorded in FR-3.7
and `delivery.md`'s Phase 9 execution log.

`governance-readme-index` (orphan/ghost) is registered separately and is **not**
path-gated:

```yaml
- id: governance-readme-index
  type: check
  command: governance readme-index validate
  kind: rhino-cli
  ci-group: governance
  args:
    fail-kinds:
      - orphan
      - ghost
  surfaces:
    pre-push: { scope: all-file-type }
    ci: { scope: all-file-type }
```

**FR-1.12 — Trigger gates execution; validation stays whole-tree.** A matched trigger runs the
command against the entire covered surface, not only the changed files. This is deliberate:
adding one file can invalidate its directory's index, and changing a threshold in
`repo-config.yml` invalidates every file. Per NFR-1 a full-tree run costs under 10 seconds, so
narrowing validation scope would buy nothing and would miss real violations.

**FR-1.13 — `repo-config.yml` is a trigger for `governance-word-budget` and
`governance-readme-completeness`**, so a threshold or scope edit re-validates everything even
when no Markdown changed. `governance-readme-index` needs no such trigger — it already runs
unconditionally on every push and PR.

**FR-1.14** — None of the three gates is declared on the `pre-commit` surface. Pre-push and CI
are the enforcement points; adding pre-commit would run a whole-tree scan on every commit for no
additional coverage.

**Known limitation, consistent with every existing path-gated gate**: on the `ci` surface,
changed paths come from `RHINO_GATE_CHANGED_BASE` when set, otherwise
`git merge-base origin/main HEAD`. On a direct push to `main` that merge base is `HEAD`, so the
diff is empty and path-gated gates skip. This is preexisting repo-wide behaviour, not a defect
introduced here; PR runs — the merge-blocking path — always have a real base.

### Acceptance Criteria

```gherkin
Feature: Governance word budget

  Background:
    Given repo-config.yml declares a governance-word-budget section
    And the section sets target 400, warn 500, fail 500

  Scenario: A file within target passes silently
    Given "repo-governance/conventions/formatting/linking.md" contains 380 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 0
    And the output contains no finding for that file

  Scenario: A file between target and fail warns without blocking
    Given "repo-governance/conventions/formatting/linking.md" contains 450 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 0
    And the output contains a "warn" finding naming that file

  Scenario: A file over the ceiling fails the gate
    Given "repo-governance/development/agents/ai-agents.md" contains 14720 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 1
    And the output contains a "fail" finding naming that file
    And the finding states the word count 14720 and the ceiling 500
    And the finding links the governance word budget convention

  Scenario Outline: Every covered surface is scanned
    Given a file "<path>" contains 900 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 1
    And the output contains a "fail" finding naming "<path>"

    Examples:
      | path                                     |
      | repo-governance/principles/example.md    |
      | .claude/agents/example.md                |
      | .claude/skills/example/SKILL.md          |
      | .opencode/agents/example.md              |
      | .cursor/agents/example.md                |
      | .amazonq/rules/example.md                |
      | AGENTS.md                                |
      | CLAUDE.md                                |

  Scenario: A README.md file under the specific-surface target produces zero findings
    Given "repo-governance/development/quality/README.md" contains 670 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 0
    And the output contains no finding naming that file
    And this holds even though 670 words exceeds the general surface's 500-word fail ceiling,
      because the winning README-specific surface classifies 670 words as "ok" against its own
      700-word target

  Scenario: A README.md file uses the wider README-specific glob threshold
    Given "repo-governance/development/quality/README.md" contains 850 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 0
    And the output contains a "warn" finding naming that file, not a "fail" finding

  Scenario: A README.md file over the wider ceiling still fails
    Given "repo-governance/development/quality/README.md" contains 950 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 1
    And the output contains a "fail" finding naming that file

  Scenario: Non-prose content counts toward the budget
    Given "repo-governance/conventions/formatting/diagrams.md" contains 200 prose words
    And it contains a Mermaid block of 400 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 1
    And the reported word count is 600

  Scenario: An out-of-scope file is never scanned
    Given "apps/ayokoding-www/content/lesson.md" contains 5000 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 0
    And the output contains no finding for that file

  Scenario: The config schema rejects an exemption key
    Given repo-config.yml adds "exempt: [AGENTS.md]" under governance-word-budget
    When I run "rhino-cli repo-config schema validate"
    Then the exit code is 1
```

---

## FR-2 — Byte budget replaced; resolved tree ported to words

### Description

The `instruction-size` byte gate is removed in its entirety and superseded by FR-1. Its one
irreplaceable capability — the aggregate size of the resolved `CLAUDE.md` `@`-import tree — is
re-expressed in words and carried forward into the new gate.

### Requirements

| ID     | Requirement                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| FR-2.1 | `rhino-cli harness instruction-size validate` no longer exists                                                                           |
| FR-2.2 | The `instruction-size:` block is removed from `repo-config.yml` in both repos                                                            |
| FR-2.3 | The `instruction-size` entry is removed from the `gates:` registry and replaced by `governance-word-budget`                              |
| FR-2.4 | `repo-governance/conventions/structure/instruction-file-size-budget.md` is `git mv`-renamed to `governance-word-budget.md` and rewritten |
| FR-2.5 | Every inbound link to the old convention path is rewritten in the same commit                                                            |
| FR-2.6 | The resolved-tree check survives, measured in **words**, rooted at `CLAUDE.md`, depth ≤ 4, cycle-guarded                                 |
| FR-2.7 | The resolved-tree budget is `1200` target / `1500` warn / `1500` fail words                                                              |
| FR-2.8 | Obsolete Gherkin features and golden-master fixtures for `instruction-size` are deleted, not left orphaned                               |
| FR-2.9 | No repository is left with two per-file size gates at any commit                                                                         |

### Acceptance Criteria

```gherkin
Feature: Byte budget replacement

  Scenario: The old command is gone
    When I run "rhino-cli harness instruction-size validate"
    Then the exit code is non-zero
    And the output reports an unknown subcommand

  Scenario: The old config block is gone
    When I read repo-config.yml
    Then it contains no "instruction-size:" section
    And it contains a "governance-word-budget:" section

  Scenario: The old gate id is gone from the registry
    When I run "rhino-cli gate list --surface=pre-push --format=text"
    Then the output contains no gate id "instruction-size"
    And the output contains gate id "governance-word-budget"

  Scenario: The resolved tree is measured in words
    Given "CLAUDE.md" contains 480 words
    And "CLAUDE.md" imports "AGENTS.md" via an @-directive
    And "AGENTS.md" contains 490 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 0
    And the reported resolved-tree word count is 970

  Scenario: An oversized resolved tree fails
    Given the resolved CLAUDE.md tree totals 1600 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 1
    And the output contains a "fail" finding for the resolved tree

  Scenario: Import cycles terminate
    Given "CLAUDE.md" imports "AGENTS.md"
    And "AGENTS.md" imports "CLAUDE.md"
    When I run "rhino-cli governance word-budget validate"
    Then the command terminates
    And each file is counted at most once

  Scenario: No inbound link to the renamed convention is left broken
    When I run "rhino-cli md links validate"
    Then the exit code is 0
```

---

## FR-3 — README sibling index

### Description

`rhino-cli governance readme-index validate` asserts that each covered directory's `README.md`
links every Markdown file beside it and every immediate subdirectory's `README.md`. **This is
not a new gate.** It is a rename-and-extend of the already-existing, already-armed
`rhino-cli md readme-index validate` command (`repo-config.yml` gate id `md-readme-index`,
implementation `apps/rhino-cli/src/application/repo_governance/readme_index_audit.rs` +
`apps/rhino-cli/src/commands/md_validate_readme_index.rs`), which today already detects `orphan`
(unlinked sibling) and `ghost` (broken link) findings, unconditionally, on every `pre-push` and
`ci` run. See "Repurpose, do not rebuild" below for the full decision record — the same pattern
FR-1 applies to `instruction_size.rs`.

### Repurpose, do not rebuild

[Repo-grounded, verified 2026-08-13] `readme_index_audit.rs::audit_readme_index` already
implements the exact walk-and-audit mechanic FR-3.1–FR-3.4 describe: it walks each covered
directory, computes the sibling `.md` files and subdirectory `README.md`s, and reports orphan
(unlinked) and ghost (broken-link) findings. `md_validate_readme_index.rs` wires it to the CLI
as `md readme-index validate` and defaults to scanning `repo-governance/`, `.claude/agents/`,
`.claude/skills/`, and `docs/explanation/software-engineering/` when no path argument is given.
This command is registered in `repo-config.yml` as gate id `md-readme-index`, armed at
`surfaces: { pre-push: { scope: all-file-type }, ci: { scope: all-file-type } }` — it already
runs on every push and every PR touching any tracked Markdown file, today, with zero findings.

The rename-and-extend is:

1. `git mv apps/rhino-cli/src/application/repo_governance/readme_index_audit.rs` →
   `apps/rhino-cli/src/application/governance/readme_index.rs` (mirrors FR-1's
   `instruction_size.rs` → `governance/word_budget.rs` destination pattern).
2. `git mv apps/rhino-cli/src/commands/md_validate_readme_index.rs` →
   `apps/rhino-cli/src/commands/governance_validate_readme_index.rs`; the CLI command moves from
   the `md` top-level group (`md readme-index validate`) to the new `governance` top-level group
   (`governance readme-index validate`), mirroring FR-1's `harness`/`convention` → `governance`
   move.
3. `repo-config.yml` gate id `md-readme-index` is **renamed in place** to `governance-readme-index`
   — never removed and re-added, because that would leave a window with no README-index
   enforcement at all. See FR-3.19 below for the continuity guarantee this implies.
4. `DEFAULT_PATHS` itself stays **unwidened** (FR-3.19's continuity guarantee — verified against
   `readme_index.rs::DEFAULT_PATHS`). The wider scope is carried entirely by the new
   `governance-readme-completeness` gate's own explicit `--paths` flag (FR-3.7), never by changing
   the constant `governance-readme-index` still reads when no `--paths` is given.
5. Two genuinely new capabilities are added to the same module: a `missing` finding kind
   (FR-3.1's "must contain a README.md" — the existing implementation only audits READMEs that
   already exist, so it cannot today catch a directory that lacks one entirely) and an
   `unannotated` finding kind (FR-3.10/FR-3.11/FR-3.14's annotation-derivation requirement — the
   existing implementation accepts a bare `[Name](target.md)` link with no annotation text). A
   `generate` subcommand is added per FR-3.12 — `md readme-index` has no generator today.

What is **not** re-implemented: the orphan/ghost walk-and-audit core, the split-directory
exemption's file-discovery mechanics, and the Markdown-link-extraction regex — all carried
forward unchanged from `readme_index_audit.rs`.

### Requirements

| ID      | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-3.1  | A covered directory containing at least one `*.md` besides `README.md`, or at least one subdirectory containing a `README.md`, **must** contain a `README.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| FR-3.2  | That `README.md` must contain a Markdown link to every `*.md` directly in the same directory, excluding itself                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| FR-3.3  | That `README.md` must contain a Markdown link to every immediate subdirectory's `README.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| FR-3.4  | The rule is **not** recursive — a README never indexes a grandchild                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| FR-3.5  | A directory `X/` whose **sibling file `X.md` exists** is a _split directory_ and is exempt from FR-3.1–FR-3.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| FR-3.6  | For a split directory, the parent `X.md` is the index and must link every `*.md` inside `X/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| FR-3.7  | Covered trees for `governance-readme-completeness` (`missing`/`unannotated`): `repo-governance/`, `.claude/`, `.codex/`, `.pi/`. Originally scoped wider, also adding `docs/` and `specs/`; narrowed to this 4-entry list at the Phase 9 (`ose-public`) / Phase 16 (the private sibling) arming step by user decision — word/readme-budget gates exist to optimize agent context, not to police human-facing documentation (`delivery.md`'s Phase 9 execution log)                                                                                                                                                                                                                                                                         |
| FR-3.8  | **Not** covered: `plans/`, `apps/`, `libs/`, the repository root, and the generated mirror trees (FR-3.17)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| FR-3.9  | Link targets are validated for existence by the existing `md links validate` gate, not re-implemented here                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| FR-3.10 | Every entry is **annotated**, in the form `- [<title>](<path>) — <description> <when_to_use>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| FR-3.11 | The annotation is **derived from the target file's frontmatter**; the gate asserts the entry matches the target's `description` and `when_to_use`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| FR-3.12 | `rhino-cli governance readme-index generate` writes conforming indexes; `validate` verifies them. Indexes are generated, not hand-authored                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| FR-3.13 | For targets outside `repo-governance/` — which do not carry `when_to_use` under FR-4.6 — only the `— <description>` half is required                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| FR-3.14 | An index whose annotation text has drifted from the target's frontmatter **fails**, and the finding names both texts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| FR-3.19 | **Continuity guarantee**: the `orphan` and `ghost` finding kinds stay registered at `governance-readme-index`, `scope: all-file-type`, its current `DEFAULT_PATHS` (unwidened), on both `pre-push` and `ci`, throughout Phase 1 — the rename introduces **no enforcement gap**, unlike the word budget's accepted Phase 1–9 gap (`tech-docs.md` §6.2), because this gate is already armed today and the rename must not silently disarm it                                                                                                                                                                                                                                                                                                 |
| FR-3.20 | The `missing` and `unannotated` finding kinds are **not** covered by FR-3.19's continuity guarantee — both are new, and unconditionally arming either against a repo not yet compliant (721 directories lack a `README.md`; zero files carry `when_to_use`) would break CI on day one. Both are dark-launched (registered but excluded from enforcement, Phase 1) at FR-3.7's scope, then armed via a **second**, separately-registered gate id, `governance-readme-completeness`, `scope: path-gated` with the FR-1.11 trigger list, armed at Phase 9 (`ose-public`) / Phase 16 (the private sibling) — FR-3.7's scope is the narrowed 4-entry list as of the Phase 9/16 arming step; see FR-3.7's own note for the pre-narrowing history |

### Index size versus the word budget

[Repo-grounded, verified 2026-08-13] An annotated entry costs ~25–35 words. After excluding
`plans/` (FR-3.8) and the generated mirror trees (FR-3.17), only two covered directories exceed
the 500-word ceiling on their index alone. Entry counts are the indexable `*.md` files, excluding
each directory's own `README.md`:

| Directory                              | Entries | Estimated index | Status                   |
| -------------------------------------- | ------- | --------------- | ------------------------ |
| `.claude/agents/`                      | 94      | ~2,650 words    | covered — needs grouping |
| `repo-governance/development/quality/` | 23      | ~670 words      | covered — glob threshold |
| `.opencode/agents/`                    | 94      | ~2,650 words    | excluded (mirror)        |
| `.cursor/agents/`                      | 94      | ~2,650 words    | excluded (mirror)        |
| `plans/done/`                          | 185     | ~5,200 words    | excluded (`plans/`)      |

**FR-3.15** — This collision is resolved by **both** mechanisms, and neither is an exemption:

1. A dedicated `**/README.md` glob threshold, declared after the general glob (700 target / 900
   fail), backed by new **select-then-classify** precedence logic in the ported
   `word_budget.rs`: the last-declared matching surface is chosen for a path _before_
   classification, and `classify()` runs exactly once against only that surface's thresholds —
   so an earlier, less-specific surface never contributes a finding, even when the winning
   surface's own verdict is `Ok`. Full mechanism and rationale: `tech-docs.md` §1.1/§1.3; RED/
   GREEN steps: `delivery.md` Phase 1a/1b. Every README stays gated; none is waived.
2. **Grouping for directories that still overflow.** A directory whose annotated index exceeds
   900 words is reorganized into subfolders, each with its own index, and the parent annotates
   the group READMEs instead of the leaves.

**FR-3.16** — Grouping may only be applied to a harness-scanned directory once recursive
subdirectory discovery is **confirmed** for every harness that reads it.

- **Claude Code — CONFIRMED**: "Claude Code scans `.claude/agents/` and `~/.claude/agents/`
  recursively, so you can organize definitions into subfolders... The subdirectory path doesn't
  affect how a subagent is identified or invoked, because identity comes only from the `name`
  frontmatter field." Constraint: `name` values must stay unique across the whole tree — already
  true in both repos.
- **OpenCode — CONFIRMED UNSUPPORTED**. The maintainers closed
  [sst/opencode#6635 "support subdirectories in agent folder"](https://github.com/anomalyco/opencode/issues/6635)
  as **not planned**; [the docs](https://opencode.ai/docs/agents/) describe only flat placement
  in `.opencode/agents/`. Mirroring a grouped source 1:1 would **silently orphan 94 agents**
  [Repo-grounded — the current indexable count, excluding `README.md`].
- **Cursor — UNDOCUMENTED**. [cursor.com/docs/subagents](https://cursor.com/docs/subagents)
  documents `.cursor/agents/` but is silent on subdirectory recursion, and no issue settles it.
  Treated as unsupported; Phase 0 delegates a documentation/changelog/issue-tracker research
  refresh (not a live IDE test — no CLI/API exists for an agent to observe Cursor GUI behavior) to
  confirm this stays current before the plan proceeds with flat mirrors. (Note: `.cursor/rules/*.mdc`
  _is_ documented as nestable — a different mechanism, not in this plan's scope.)
- **Amazon Q — NOT APPLICABLE**. Its surface is a generated JSON bridge
  (`.amazonq/cli-agents/ose-default.json`) referencing `AGENTS.md` and
  `.amazonq/rules/**/*.md`; it never mirrors `.claude/agents/*.md`. Recursion there is explicit
  via the `**` glob already in use.
- **Codex — NOT APPLICABLE**. Its agents live in `.codex/config.toml` sub-tables. Separately
  confirmed [Repo-grounded — carried forward from
  `repo-governance/conventions/structure/instruction-file-size-budget.md`, the convention this
  plan replaces (FR-2.4)]: `AGENTS.md` has a **32 KiB combined-size cap**
  (`project_doc_max_bytes`) with root-to-cwd concatenation — which the ported resolved-tree word
  budget (FR-2.6) keeps far inside.

**FR-3.17 — Generated mirror directories are excluded from FR-3.** `.opencode/`, `.cursor/`,
and `.amazonq/` trees are machine-consumed; no human navigates them by README. They remain
**fully in scope for the word budget** (FR-1.4). If the generator emits a mirror `README.md`,
it must be a **pointer** to the `.claude/` source index, not an enumeration of 94 siblings —
which could not fit any sane ceiling.

**FR-3.18 — The bindings generator must flatten grouped sources.** When `.claude/agents/` is
grouped into subfolders, `rhino-cli harness bindings generate` must continue emitting
`.opencode/agents/<name>.md` and `.cursor/agents/<name>.md` as **flat files**, deriving the
filename from the agent's `name` frontmatter. This is a rhino-cli behaviour change and
therefore lands in **Phase 1 (PR1, executable)** — before Phase 6 groups the source. Shipping
the grouping first would break OpenCode discovery between merges.

### Acceptance Criteria

```gherkin
Feature: README sibling index

  Scenario: A complete index passes
    Given directory "repo-governance/conventions/formatting/" contains "README.md", "linking.md", "emoji.md"
    And "README.md" links "./linking.md" and "./emoji.md"
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 0

  Scenario: A missing sibling link fails
    Given directory "repo-governance/conventions/formatting/" contains "README.md", "linking.md", "emoji.md"
    And "README.md" links "./linking.md" only
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 1
    And the finding names "emoji.md" as unindexed

  Scenario: A missing subdirectory README link fails
    Given directory "repo-governance/conventions/" contains "README.md"
    And it contains subdirectory "structure/" containing "README.md"
    And "conventions/README.md" does not link "./structure/README.md"
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 1
    And the finding names "structure/README.md" as unindexed

  Scenario: A missing README fails when siblings exist
    Given directory ".claude/skills/grill-me/reference/" contains "01-options.md"
    And it contains no "README.md"
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 1
    And the finding reports a missing index for that directory

  Scenario: The rule does not reach grandchildren
    Given "repo-governance/README.md" links "./conventions/README.md"
    And it does not link "./conventions/structure/plans.md"
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 0

  Scenario: A split directory is exempt and its parent indexes it
    Given file "repo-governance/development/agents/ai-agents.md" exists
    And directory "repo-governance/development/agents/ai-agents/" contains "01-catalog.md" and "02-naming.md"
    And "ai-agents/" contains no "README.md"
    And "ai-agents.md" links "./ai-agents/01-catalog.md" and "./ai-agents/02-naming.md"
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 0

  Scenario: A split directory whose parent omits a child fails
    Given file "repo-governance/development/agents/ai-agents.md" exists
    And directory "repo-governance/development/agents/ai-agents/" contains "01-catalog.md" and "02-naming.md"
    And "ai-agents.md" links "./ai-agents/01-catalog.md" only
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 1
    And the finding names "02-naming.md" as unindexed

  Scenario Outline: An uncovered tree is not scanned
    Given directory "<dir>" contains "<file>" and no "README.md"
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 0

    Examples:
      | dir                                | file          |
      | apps/ayokoding-www/content/en/     | lesson-01.md  |
      | plans/backlog/some-plan/           | brd.md        |
      | plans/done/2026-01-01__a-plan/     | delivery.md   |

  Scenario: A generated mirror directory is not scanned
    Given directory ".opencode/agents/" contains 95 agent files
    And it contains no "README.md"
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 0

  Scenario: A generated mirror is still subject to the word budget
    Given ".opencode/agents/plan-checker.md" contains 900 words
    When I run "rhino-cli governance word-budget validate"
    Then the exit code is 1
    And the finding names ".opencode/agents/plan-checker.md"

  Scenario: The Phase 1 rename introduces no enforcement gap for orphan or ghost
    Given gate id "md-readme-index" is armed at "scope: all-file-type" before Phase 1
    When Phase 1's rename lands and gate id "governance-readme-index" replaces it
    Then "governance-readme-index" is armed at "scope: all-file-type" immediately, not deferred
    And "rhino-cli gate list --surface=pre-push --format=text" never shows both ids at once

  Scenario: The unannotated finding kind is dark-launched, not enforced, before Phase 9
    Given "repo-governance/conventions/README.md" links "./linking.md" with no annotation text
    And Phase 9 has not yet armed "governance-readme-completeness"
    When I run "rhino-cli governance readme-index validate"
    Then the exit code is 0
    And no finding of kind "unannotated" causes a failure

  Scenario: The unannotated finding kind fails once armed and in scope
    Given "repo-governance/conventions/README.md" links "./linking.md" with no annotation text
    And Phase 9 has armed "governance-readme-completeness" at "scope: path-gated"
    And the changed paths include "repo-governance/conventions/README.md"
    When I run "rhino-cli gate run --surface=pre-push"
    Then the exit code is 1
    And the finding names "linking.md" as unannotated

  Scenario: The --paths flag overrides the default scan scope
    Given "rhino-cli governance readme-index validate" is invoked with "--paths repo-governance/"
    When the command runs
    Then it scans only "repo-governance/", not the unmodified DEFAULT_PATHS list
    And running it again with no "--paths" flag scans the unmodified DEFAULT_PATHS list

  Scenario: The --fail-kinds flag restricts which findings contribute to the exit code
    Given a scanned directory has one "orphan" finding and one "missing" finding
    When I run "rhino-cli governance readme-index validate --fail-kinds orphan"
    Then the exit code reflects only the "orphan" finding
    And the "missing" finding is still printed in the output
```

---

## FR-4 — `when_to_use` frontmatter

### Description

`repo-governance/**/*.md` gains a required `when_to_use:` frontmatter key — the retrieval
trigger. The existing `rhino-cli md frontmatter validate` gate is extended rather than
duplicated.

### Requirements

| ID     | Requirement                                                                                                                                                                                                                                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-4.1 | `when_to_use` is a **required (FAIL-severity once armed)**, non-empty string on every `repo-governance/**/*.md` — lands at WARN in Phase 1 (dark-launched), armed to FAIL at Phase 9/16; see "Dark-launch sequencing" below                                                                                           |
| FR-4.2 | `description` is **upgraded from its current WARN severity to required (FAIL)**, scoped to governance docs only; it is the tldr. **No `tldr:` key is introduced**. The flip is deferred to Phase 9/16 ("Dark-launch sequencing" below) — **not** implemented in Phase 1 — see "Description severity correction" below |
| FR-4.3 | The 27 `repo-governance` files currently missing `description` are backfilled                                                                                                                                                                                                                                         |
| FR-4.4 | `when_to_use` states a trigger condition, not a restatement of the title                                                                                                                                                                                                                                              |
| FR-4.5 | Enforcement extends `rhino-cli md frontmatter validate` (gate `md-frontmatter`); no new gate id                                                                                                                                                                                                                       |
| FR-4.6 | The requirement applies to `repo-governance/**/*.md` only — `docs/`, `.claude/`, and `apps/` unaffected                                                                                                                                                                                                               |
| FR-4.7 | Frontmatter words count toward the FR-1 budget; no carve-out                                                                                                                                                                                                                                                          |
| FR-4.8 | `title` stays FAIL-severity (unchanged) for governance docs; only `description`'s severity changes                                                                                                                                                                                                                    |

### Description severity correction

[Repo-grounded — `apps/rhino-cli/src/application/docs/frontmatter.rs::validate_governance_schema`,
verified 2026-08-13] The governance frontmatter schema today enforces `title` at FAIL and
`description` only at **WARN** ("recommended field"). An earlier draft of this plan stated
"`description` remains required," which was inaccurate — it has never been FAIL-severity for
governance docs.

**FR-4.2 corrects this going forward**, not just backfilling the 27 files. Adding `when_to_use`
at FAIL while leaving `description` at WARN would enforce the _trigger_ harder than the field
describing _what the file is_ — an inconsistent gate. Both are upgraded to FAIL, scoped to
`GOVERNANCE_DOC_PREFIXES` only (`repo-governance/{conventions,principles,development,workflows}/`);
the software-engineering schema (`docs/explanation/software-engineering/`) is untouched.

### Dark-launch sequencing (register-then-arm)

[Repo-grounded — `repo-config.yml:774-781` scopes `md-frontmatter`'s `ci` surface as
`{ scope: all-file-type }`, resolved by `ScopeKind::AllFileType => CandidateScope::TrackedFiles`
in `apps/rhino-cli/src/commands/gate/run.rs:441`] Unlike FR-1/FR-3's two brand-new gate ids —
which Phase 1 can register in `gates:` without arming, because an unregistered gate id runs
nowhere — `md-frontmatter` is an **already-armed, whole-tree-scanning gate that runs on every
CI run today**. Landing FR-4.1/FR-4.2 as FAIL-severity in the same PR that adds them would fail
the `markdown` CI job for every contributor, in either repo, from the moment Phase 1's PR merges
until the content-backfill phases finish (0/214 `repo-governance/**/*.md` files currently carry
`when_to_use`; 27/214 are missing `description`).

FR-4 therefore follows the same register-then-arm shape as FR-1/FR-3, adapted to an
already-active gate rather than a new one:

- **Phase 1 (register, `ose-public`)**: `KIND_MISSING_WHEN_TO_USE` lands using the same
  `SEVERITY_WARN` construction `description` already uses — the check exists and is tested, but
  does not fail the gate. `description`'s construction is left unchanged (already
  `SEVERITY_WARN`); FR-4.2's `mk_fail()` upgrade is **not** implemented in Phase 1.
- **Phase 9 (arm, `ose-public`)**: after `rhino-cli md frontmatter validate` confirms zero
  `repo-governance/**/*.md` files are missing `when_to_use` or `description` (true only once
  Phases 2–5 have merged), both findings' construction in `validate_governance_schema` switches
  to `mk_fail()`, scoped to `GOVERNANCE_DOC_PREFIXES`, in the same commit that arms
  `governance-word-budget`/`governance-readme-index`.
- **Phase 10 (register, the private sibling) / Phase 16 (arm, the private sibling)**: identical sequencing,
  gated on Phases 11–13 instead of 2–5.

This keeps NFR-5 ("No commit in the plan leaves `main` with a red gate in either repo")
satisfied for `md-frontmatter` the same way Phase 1's "register, but do not arm" step already
satisfies it for the two brand-new gates. The Gherkin scenarios below describe FR-4's **armed
end-state** (post-Phase-9/16) — Phase 1 only needs to satisfy the WARN-severity interim behavior
described above.

### Acceptance Criteria

```gherkin
Feature: when_to_use frontmatter

  Scenario: A compliant governance file passes
    Given "repo-governance/conventions/formatting/linking.md" frontmatter has a non-empty "description"
    And it has a non-empty "when_to_use"
    When I run "rhino-cli md frontmatter validate"
    Then the exit code is 0

  Scenario: A missing when_to_use fails
    Given "repo-governance/conventions/formatting/linking.md" frontmatter has no "when_to_use"
    When I run "rhino-cli md frontmatter validate"
    Then the exit code is 1
    And the finding kind is "missing-when-to-use"

  Scenario: An empty when_to_use fails
    Given "repo-governance/conventions/formatting/linking.md" has "when_to_use: \"\""
    When I run "rhino-cli md frontmatter validate"
    Then the exit code is 1

  Scenario: A missing description now fails, not warns
    Given "repo-governance/principles/content/progressive-disclosure.md" has no "description"
    When I run "rhino-cli md frontmatter validate"
    Then the exit code is 1
    And the finding kind is "missing-description"
    And the finding severity is "fail"

  Scenario: The software-engineering schema is unaffected — it was already fail-severity
    Given "docs/explanation/software-engineering/programming-languages/typescript/index.md" has no "description"
    When I run "rhino-cli md frontmatter validate"
    Then the exit code is 1
    And the finding severity is "fail"
    # unchanged by this plan — validate_software_schema has always used mk_fail for description

  Scenario: A tldr key is not required anywhere
    Given no repo-governance file declares "tldr"
    When I run "rhino-cli md frontmatter validate"
    Then the exit code is 0

  Scenario: Files outside repo-governance are not required to declare when_to_use
    Given "docs/reference/monorepo-structure.md" has no "when_to_use"
    When I run "rhino-cli md frontmatter validate"
    Then the exit code is 0

  Scenario: A missing when_to_use warns during Phase 1's dark-launch, before enforcement is armed
    Given "repo-governance/conventions/formatting/linking.md" frontmatter has no "when_to_use"
    And Phase 1 has registered the check but not yet armed it to FAIL severity
    When I run "rhino-cli md frontmatter validate"
    Then the exit code is 0
    And the output contains a "when_to_use" finding at "warn" severity
```

---

## FR-5 — Two separate concerns, never combined into one checker

### Description

Size and reachability are distinct concerns with distinct trigger sets, distinct failure modes,
and distinct remediations. They ship as two commands, never as one combined checker.
Reachability (`governance readme-index validate`) is itself split across **two** `gates:`
registrations — `governance-readme-index` (orphan/ghost, continuously armed, FR-3.19)
and `governance-readme-completeness` (the new `missing` + `unannotated` checks, dark-launched
then armed, FR-3.20) — because one is a continuity-preserving rename of an already-armed gate and the
other is genuinely new, path-gated work; folding them into a single registration would either
reintroduce the enforcement gap FR-3.19 forbids, or path-gate (and thus temporarily weaken)
orphan/ghost detection that is armed unconditionally today. Size (`governance word-budget
validate`) remains a single gate id, `governance-word-budget`, since it has no pre-existing
armed gate to preserve.

### Requirements

| ID     | Requirement                                                                                                                                                                                                                                                                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-5.1 | `rhino-cli governance word-budget validate` and `rhino-cli governance readme-index validate` are separate leaf commands                                                                                                                                                                                                                                                             |
| FR-5.2 | Gate ids `governance-word-budget`, `governance-readme-index`, and `governance-readme-completeness` are registered independently in `gates:`                                                                                                                                                                                                                                         |
| FR-5.3 | `governance-word-budget` and `governance-readme-index` each have their own Nx target: `rhino-cli:governance-word-budget:validation`, `rhino-cli:governance-readme-index:validation` (FR-3.20)                                                                                                                                                                                       |
| FR-5.4 | `governance-word-budget` and `governance-readme-completeness` each declare their **own** `trigger:` list (FR-1.10, FR-1.11); `governance-readme-index` declares none — it is `scope: all-file-type`                                                                                                                                                                                 |
| FR-5.5 | Any gate may fail without the others running; none short-circuits another                                                                                                                                                                                                                                                                                                           |
| FR-5.6 | `readme-index` additionally exposes a `generate` subcommand; `word-budget` has no generator — an oversized file needs a human-authored split, not codegen                                                                                                                                                                                                                           |
| FR-5.7 | Only `governance-word-budget` is registered as a `repo-governance audit` category                                                                                                                                                                                                                                                                                                   |
| FR-5.8 | `governance-readme-index` and `governance-readme-completeness` invoke the **same** underlying `governance readme-index validate` binary; each `repo-config.yml` registration passes its own `args:` block — `--paths` selects the scan scope and `--fail-kinds` selects which finding kinds cause a nonzero exit — per the mechanism in FR-1.10/FR-1.11 below and `tech-docs.md` §4 |

### Acceptance Criteria

```gherkin
Feature: Gate separation and path-gated execution

  Scenario: Both gates are registered independently
    When I run "rhino-cli gate list --surface=pre-push --format=text"
    Then the output contains gate id "governance-word-budget"
    And the output contains gate id "governance-readme-index"

  Scenario: A governance Markdown change triggers both gates
    Given the changed paths include "repo-governance/conventions/formatting/linking.md"
    When I run "rhino-cli gate run --surface=pre-push"
    Then "governance-word-budget" executes
    And "governance-readme-index" executes

  Scenario: An application change triggers neither gate
    Given the changed paths include only "apps/ayokoding-www/content/en/lesson-01.md"
    When I run "rhino-cli gate run --surface=pre-push"
    Then "governance-word-budget" is skipped
    And "governance-readme-index" is skipped

  Scenario: A mirror-only change triggers the word budget but not the index gate
    Given the changed paths include only ".opencode/agents/plan-checker.md"
    When I run "rhino-cli gate run --surface=pre-push"
    Then "governance-word-budget" executes
    And "governance-readme-index" is skipped

  Scenario: A config change re-validates everything
    Given the changed paths include only "repo-config.yml"
    When I run "rhino-cli gate run --surface=pre-push"
    Then "governance-word-budget" executes
    And "governance-readme-index" executes

  Scenario: A plans-only change triggers neither gate
    Given the changed paths include only "plans/in-progress/some-plan/delivery.md"
    When I run "rhino-cli gate run --surface=pre-push"
    Then "governance-word-budget" is skipped
    And "governance-readme-index" is skipped

  Scenario: The same triggers apply on the CI surface
    Given the changed paths include "AGENTS.md"
    When I run "rhino-cli gate run --surface=ci"
    Then "governance-word-budget" executes

  Scenario: A triggered gate validates the whole covered tree, not just changed files
    Given the changed paths include only "repo-governance/conventions/formatting/linking.md"
    And "repo-governance/development/agents/ai-agents.md" contains 900 words
    When I run "rhino-cli gate run --surface=pre-push"
    Then the exit code is 1
    And the finding names "repo-governance/development/agents/ai-agents.md"

  Scenario: One gate failing does not suppress the other
    Given "governance-word-budget" fails
    When I run "rhino-cli gate run --surface=ci --group=governance"
    Then "governance-readme-index" still executes
    And both outcomes appear in the group summary
```

---

## Non-Functional Requirements

| ID    | Requirement                                                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-1 | Both new gates complete in under 10 seconds on a warm checkout of either repo                                                                            |
| NFR-2 | Every gate finding is deterministic and order-stable, so golden-master fixtures do not flake                                                             |
| NFR-3 | `apps/rhino-cli` changes land byte-identically in `ose-public` and the private sibling; the parity manifest is regenerated and staged in the same commit |
| NFR-4 | Every rhino-cli behaviour change lands with companion Gherkin under `specs/apps/rhino/behavior/rhino-cli/gherkin/` in the same PR                        |
| NFR-5 | No commit in the plan leaves `main` with a red gate in either repo                                                                                       |
| NFR-6 | Generated bindings are regenerated and committed **with** their `.claude/` source, never in a follow-up commit                                           |
