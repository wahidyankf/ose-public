# PRD — OrganicLever rhino-cli DDD Enforcement + Skill Extension

## Product overview

Add two new `rhino-cli` subcommands and one skill extension that together enforce DDD invariants for `organiclever-web` mechanically (commit-time gate) and prevent drift at authoring time (skill knowledge layer). No behavior change to `organiclever-web`. New code lives in `apps/rhino-cli/`, `specs/apps/organiclever/bounded-contexts.yaml`, and `.claude/skills/apps-organiclever-web-developing-content/SKILL.md`.

## Personas

- **rhino-cli developer (solo maintainer)** — Adds `bc validate` and `ul validate` subcommands to `apps/rhino-cli/`. Follows existing rhino-cli patterns: Cobra command structure, golang-commons utilities, godog scenarios at unit and integration levels per the [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md). Maintains ≥90% coverage.
- **organiclever-web feature developer (any agent or human)** — Reads the `apps-organiclever-web-developing-content` skill DDD section before adding new code. Uses the BC registry to place files, layer rules to decide between `domain/` / `application/` / `infrastructure/` / `presentation/`, the xstate placement rule for new machines, and the glossary authoring rules for new terms.
- **plan-executor** — Consumes `delivery.md` phase-by-phase checklist and the Gherkin acceptance criteria in this file as the completion contract.
- **plan-execution-checker** — Verifies each Gherkin scenario passes after execution and reports any gap between the delivered state and the acceptance criteria.
- **DDD plan executor** — When working the sibling DDD adoption plan, this plan's deliverables (registry YAML, subcommands, skill section) become the safety net that catches drift introduced during migration phases.

## In scope

- `specs/apps/organiclever/bounded-contexts.yaml` — new registry file.
- `apps/rhino-cli/cmd/bc.go`, `apps/rhino-cli/cmd/bc_validate.go` (and friends) — new `bc validate` subcommand.
- `apps/rhino-cli/cmd/ul.go`, `apps/rhino-cli/cmd/ul_validate.go` (and friends) — new `ul validate` subcommand.
- `apps/rhino-cli/internal/{bcregistry,glossary}/` — new packages for registry loading and glossary parsing.
- `apps/rhino-cli/README.md` — new "DDD enforcement" subsection.
- `specs/apps/rhino/cli/gherkin/` — new Gherkin features for both subcommands.
- `.claude/skills/apps-organiclever-web-developing-content/SKILL.md` — append Domain-Driven Design section.
- `apps/organiclever-web/project.json` — extend `test:quick` to call both subcommands.

## Out of scope

- Migration of `organiclever-web` source code into bounded contexts (sibling DDD adoption plan).
- ESLint boundaries config (sibling DDD plan).
- Glossary _content_ — schema enforced here, content authored in DDD plan.
- Polyglot import-graph subcommand.
- New agent definitions (no `swe-organiclever-dev`, no `apps-organiclever-ddd-checker`).
- F#/Giraffe `organiclever-be` adoption.
- Other apps' DDD adoption.

## User stories

- As the solo maintainer, I want a single registry YAML file to be the canonical source for the OrganicLever bounded-context map, so that any consumer (subcommand, agent, future BE plan) reads from one place instead of re-deriving the map from prose docs.
- As the solo maintainer, I want `rhino-cli bc validate` to fail on any structural drift between the registry, code folders, glossary files, and Gherkin folders, so that drift is caught at commit time rather than during a future archaeology session.
- As the solo maintainer, I want `rhino-cli ul validate` to fail on glossary frontmatter, table-schema, code-identifier-existence, and cross-context term-collision violations, so that the ubiquitous language stays in lockstep with the code without requiring manual review.
- As the rhino-cli developer, I want both subcommands to default to error severity from the start, with a local `--severity=warn` escape hatch available for temporary false-positive handling, so that drift is caught immediately once the DDD migration is complete.
- As an agent working on `organiclever-web` (developer agent, plan-executor, future BE swe agent), I want the `apps-organiclever-web-developing-content` skill to auto-load DDD knowledge (BC list, layer rules, xstate placement, cross-context calls, glossary authoring), so that I can place new code correctly without re-reading authoritative tech docs every session.
- As the solo maintainer, I want a local `ORGANICLEVER_RHINO_DDD_SEVERITY=warn` escape hatch, so that I can temporarily downgrade a false-positive finding post-merge without a code change while I prepare the fix.
- As the plan-execution-checker, I want each Gherkin acceptance criterion to map to a verifiable, observable output (a file path, a subcommand exit code, a section in a markdown file), so that I can confirm the plan is complete without manual interpretation.

## Functional requirements

### FR-1 — Bounded-context registry

`specs/apps/organiclever/bounded-contexts.yaml` MUST exist as a sibling of `ubiquitous-language/`, `be/`, `fe/`, `c4/`, `contracts/`, and MUST be the single source of truth for the BC map. Every other artifact (code folder, glossary file, Gherkin folder) MUST be derivable from this registry.

The registry MUST list every bounded context with at minimum:

- `name` — kebab-case identifier matching the BC folder name.
- `summary` — one-line description.
- `layers` — array of declared layer subfolders (subset of `[domain, application, infrastructure, presentation]`).
- `code` — relative path to the BC's code folder (e.g. `apps/organiclever-web/src/contexts/journal`).
- `glossary` — relative path to the BC's glossary file (e.g. `specs/apps/organiclever/ubiquitous-language/journal.md`).
- `gherkin` — relative path to the BC's Gherkin folder (e.g. `specs/apps/organiclever/fe/gherkin/journal`).
- `relationships` — optional array. Each entry: `to`, `kind` (`customer-supplier` / `conformist` / `shared-kernel` / `anticorruption-layer` / `partnership` / `independent`), `role` (when applicable: `supplier` / `customer` / `upstream` / `downstream`).

The registry MUST be loaded by both `rhino-cli bc validate` (FR-2) and `rhino-cli ul validate` (FR-3).

### FR-2 — `rhino-cli bc validate` subcommand

A new subcommand `rhino-cli bc validate <app>` MUST exist under `apps/rhino-cli/`. The subcommand:

- Loads `specs/apps/<app>/bounded-contexts.yaml` (FR-1).
- Verifies, for each registered context:
  - The `code` path exists and contains exactly the layer subfolders listed in `layers` (no missing, no extra).
  - The `glossary` file exists.
  - The `gherkin` folder exists and contains at least one `.feature` file.
- Detects orphans:
  - A folder under the code root not registered in any context's `code` path.
  - A glossary file under `ubiquitous-language/` not registered in any context's `glossary`.
  - A Gherkin folder under `fe/gherkin/` not registered in any context's `gherkin`.
- Verifies relationship symmetry: if context A declares `relationships: [{ to: B, kind: customer-supplier, role: supplier }]`, context B MUST declare a reciprocal entry (`role: customer`); single-sided kinds (`independent`) are exempt.
- Supports `--severity=warn|error` flag (default `error`).
- Exits zero if all checks pass; non-zero with file/line findings on violation.
- Has Godog scenarios for the registry-parity, orphan-detection, and relationship-symmetry rules at both unit and integration levels per the [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md) (mocked filesystem at unit, real filesystem at integration).

### FR-3 — `rhino-cli ul validate` subcommand

A new subcommand `rhino-cli ul validate <app>` MUST exist under `apps/rhino-cli/`. The subcommand:

- Reads the registry (FR-1) to find every glossary file.
- For each glossary file, validates:
  - Frontmatter contains `Bounded context`, `Maintainer`, `Last reviewed` keys.
  - The Terms table is well-formed: header columns are exactly `Term | Definition | Code identifier(s) | Used in features`.
  - Each row's `Code identifier(s)` value (one or more comma-separated identifiers in backticks) corresponds to at least one symbol present in the BC's `code` path. Stale identifier → finding.
  - Each row's `Used in features` references resolve to a `.feature` file under the BC's `gherkin` path. Missing reference → finding.
- Cross-context checks:
  - Same `Term` declared in two different glossaries without one of them listing the other in `Forbidden synonyms` → error.
  - Term listed in `Forbidden synonyms` of context A but used in context A's code or specs → finding.
- Supports `--severity=warn|error` flag (default `error`).
- Exits zero if all checks pass; non-zero with file/line findings on violation.
- Has Godog scenarios per the Three-Level Testing Standard (unit + integration with the same Gherkin specs, mocked vs real filesystem).

### FR-4 — Wire into `test:quick`

`apps/organiclever-web/project.json` MUST extend its `test:quick` target so that:

- `rhino-cli bc validate organiclever` runs as part of the target.
- `rhino-cli ul validate organiclever` runs as part of the target.
- Severity is controlled by an environment variable `ORGANICLEVER_RHINO_DDD_SEVERITY` (default `error`) so the warning→error flip is a config change, not a code change.
- `nx run organiclever-web:test:quick` MUST exit non-zero if either subcommand reports a finding at the configured severity.

### FR-5 — Skill DDD section

`.claude/skills/apps-organiclever-web-developing-content/SKILL.md` MUST be extended with a "Domain-Driven Design" section that includes:

- Pointer to `specs/apps/organiclever/bounded-contexts.yaml` as the canonical BC list.
- Layer rules table (concise — full rules in DDD plan `tech-docs.md`).
- xstate machine placement rule (pointer to DDD plan `tech-docs.md` § "xstate machine placement").
- Cross-context call rule: only via target BC's `application/index.ts`; never raw machine handles or foreign internals.
- Glossary authoring rule: new term → glossary entry in same commit as the code/feature; `Code identifier(s)` matches a real symbol; `Used in features` references a real `.feature` file.
- Pre-commit checklist: `nx run organiclever-web:test:quick` (which includes both subcommands); confirm zero new findings before committing.
- Pointers to: bounded-context map ADR, DDD plan README, BC registry YAML, glossary folder.

The skill update MUST keep the existing "developing content" sections intact; the DDD section is additive. The skill description MAY be reworded to reflect the broader scope, but the skill name MUST stay the same to preserve auto-load triggers in agents that already reference it.

The DDD section MUST be concise — pointing to canonical sources rather than duplicating authoritative content. Any rule that lives in DDD plan `tech-docs.md` is referenced by link, not copied. This prevents the skill from drifting against the canonical source.

### FR-6 — README documentation

`apps/rhino-cli/README.md` MUST gain a "DDD enforcement" subsection that documents:

- `rhino-cli bc validate <app>` — purpose, what it checks, exit codes, `--severity` flag, example invocation.
- `rhino-cli ul validate <app>` — same shape.
- Link to the OrganicLever DDD adoption plan and this enforcement plan as motivation.

### FR-7 — No regression

All of the following MUST remain green:

- `nx run rhino-cli:test:quick` (≥90% line coverage maintained).
- `nx run rhino-cli:test:integration`.
- `nx run organiclever-web:test:quick` (with the new subcommand calls included).
- `nx run organiclever-web:typecheck`.
- `nx run organiclever-web:lint`.
- `nx run organiclever-web:spec-coverage`.
- `nx run organiclever-web-e2e:test:e2e`.

## Non-functional requirements

| #     | Requirement                                                                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-1 | Each phase ends with all gates green; commits independently; conventional-commits style.                                                                                                                                                                                                         |
| NFR-2 | TDD discipline: every subcommand feature written test-first (godog scenario → implementation → green).                                                                                                                                                                                           |
| NFR-3 | rhino-cli ≥90% line coverage maintained throughout.                                                                                                                                                                                                                                              |
| NFR-4 | Subcommand wall-clock time for `bc validate` and `ul validate` combined SHOULD be <2 seconds against the current 9-context registry; MUST be <5 seconds. Subcommand additions to `test:quick` SHOULD NOT regress total wall-clock by more than 5 seconds.                                        |
| NFR-5 | All new markdown follows [Content Quality](../../../governance/conventions/writing/quality.md) and [Markdown Standards](../../../governance/development/quality/markdown.md).                                                                                                                    |
| NFR-6 | All file names follow the [File Naming Convention](../../../governance/conventions/structure/file-naming.md) (lowercase kebab-case).                                                                                                                                                             |
| NFR-7 | Subcommand UX consistent with existing rhino-cli subcommands (`docs validate-links`, `mermaid validate`, `spec-coverage`, `test-coverage validate`): same flag conventions, same exit-code conventions, same finding-line format (`<file>:<line>:<col> <severity>: <message>` where applicable). |

## Acceptance criteria (Gherkin)

```gherkin
Feature: rhino-cli DDD enforcement acceptance

  Background:
    Given the plan "2026-05-02__organiclever-rhino-cli-ddd-enforcement" has been executed
    And the working tree is clean
    And the sibling plan "2026-05-02__organiclever-adopt-ddd" is fully complete and archived to "plans/done/"

  Scenario: Bounded-context registry exists and is the single source of truth
    When I read "specs/apps/organiclever/bounded-contexts.yaml"
    Then it lists every bounded context in the OrganicLever map
    And each entry contains "name", "summary", "layers", "code", "glossary", and "gherkin" fields
    And every "code" path resolves to an existing folder
    And every "glossary" path resolves to an existing file
    And every "gherkin" path resolves to an existing folder

  Scenario: rhino-cli bc validate exits zero on clean state
    When I run "rhino-cli bc validate organiclever"
    Then the command exits zero
    And no findings are printed

  Scenario: rhino-cli bc validate catches orphan code folder
    Given the registry does not list a context "phantom"
    When I create "apps/organiclever-web/src/contexts/phantom/domain/"
    And I run "rhino-cli bc validate organiclever"
    Then the command exits non-zero
    And the error mentions "orphan" and "phantom"

  Scenario: rhino-cli bc validate catches missing glossary file
    Given the registry lists context "journal" with glossary "specs/apps/organiclever/ubiquitous-language/journal.md"
    When I delete "specs/apps/organiclever/ubiquitous-language/journal.md"
    And I run "rhino-cli bc validate organiclever"
    Then the command exits non-zero
    And the error mentions "missing glossary" and "journal"

  Scenario: rhino-cli bc validate catches missing layer subfolder
    Given the registry lists context "journal" with layers "[domain, application, infrastructure, presentation]"
    When I delete "apps/organiclever-web/src/contexts/journal/infrastructure/"
    And I run "rhino-cli bc validate organiclever"
    Then the command exits non-zero
    And the error mentions "missing layer" and "infrastructure"

  Scenario: rhino-cli bc validate catches relationship asymmetry
    Given context "workout-session" declares "relationships: [{ to: journal, kind: customer-supplier, role: customer }]"
    And context "journal" declares no reciprocal relationship
    When I run "rhino-cli bc validate organiclever"
    Then the command exits non-zero
    And the error mentions "asymmetry" and "journal"

  Scenario: rhino-cli ul validate exits zero on clean state
    When I run "rhino-cli ul validate organiclever"
    Then the command exits zero

  Scenario: rhino-cli ul validate catches missing frontmatter
    Given glossary "journal.md" lacks a "Maintainer" frontmatter key
    When I run "rhino-cli ul validate organiclever"
    Then the command exits non-zero
    And the error mentions "Maintainer"

  Scenario: rhino-cli ul validate catches malformed terms table
    Given glossary "journal.md" has a Terms table whose header columns are not exactly "Term | Definition | Code identifier(s) | Used in features"
    When I run "rhino-cli ul validate organiclever"
    Then the command exits non-zero
    And the error mentions "table" and the bad column

  Scenario: rhino-cli ul validate catches stale code identifier
    Given glossary "journal.md" lists a term whose "Code identifier(s)" is "FooBar"
    And no symbol "FooBar" exists in "apps/organiclever-web/src/contexts/journal/"
    When I run "rhino-cli ul validate organiclever"
    Then the command exits non-zero
    And the error mentions "stale identifier" and "FooBar"

  Scenario: rhino-cli ul validate catches cross-context term collision
    Given glossary "journal.md" defines term "Bump"
    And glossary "stats.md" also defines term "Bump"
    And neither lists the other under "Forbidden synonyms"
    When I run "rhino-cli ul validate organiclever"
    Then the command exits non-zero
    And the error mentions "term collision" and "Bump"

  Scenario: rhino-cli ul validate catches forbidden-synonym misuse
    Given glossary "journal.md" lists "Session" under "Forbidden synonyms"
    And the file "apps/organiclever-web/src/contexts/journal/domain/journal-event.ts" contains the symbol "Session"
    When I run "rhino-cli ul validate organiclever"
    Then the command exits non-zero
    And the error mentions "forbidden synonym" and "Session"

  Scenario: Severity flag honored
    Given the registry contains an orphan glossary file
    When I run "rhino-cli bc validate organiclever --severity=warn"
    Then the command exits zero
    And the finding is printed with severity "warning"

  Scenario: rhino-cli bc validate and ul validate run in test:quick
    When I run "nx run organiclever-web:test:quick"
    Then "rhino-cli bc validate organiclever" runs as part of the target
    And "rhino-cli ul validate organiclever" runs as part of the target
    And both exit zero before the target succeeds

  Scenario: Skill includes a Domain-Driven Design section
    When I read ".claude/skills/apps-organiclever-web-developing-content/SKILL.md"
    Then it contains a section titled "Domain-Driven Design" or "DDD"
    And the section points to "specs/apps/organiclever/bounded-contexts.yaml"
    And the section documents the layer rules
    And the section documents the xstate placement rule
    And the section documents the cross-context call rule
    And the section documents the glossary authoring rule
    And the section documents the pre-commit checklist
    And the existing "developing content" sections remain present

  Scenario: rhino-cli README documents both subcommands
    When I read "apps/rhino-cli/README.md"
    Then it contains a "DDD enforcement" subsection
    And the subsection documents "rhino-cli bc validate <app>"
    And the subsection documents "rhino-cli ul validate <app>"
    And the subsection links to the OrganicLever DDD adoption plan

  Scenario: rhino-cli coverage threshold maintained
    When I run "nx run rhino-cli:test:quick"
    Then line coverage for "apps/rhino-cli" is at least 90%

  Scenario: Subcommand performance budget
    When I run "rhino-cli bc validate organiclever" and "rhino-cli ul validate organiclever"
    Then the combined wall-clock time is less than 5 seconds

  Scenario: Default error severity blocks commit on drift
    Given the env var "ORGANICLEVER_RHINO_DDD_SEVERITY" is "error" or unset
    And the registry contains a deliberate test orphan glossary
    When I run "nx run organiclever-web:test:quick"
    Then the target exits non-zero
    And the error is printed in the output

  Scenario: Local override to warning severity (escape hatch only)
    Given the env var "ORGANICLEVER_RHINO_DDD_SEVERITY" is "warn"
    And the registry contains a deliberate test orphan glossary
    When I run "nx run organiclever-web:test:quick"
    Then the target exits zero
    And the warning is printed in the output
    And this override is documented as a local escape hatch only, not a production setting

  Scenario: No regression in other rhino-cli subcommands
    When I run "nx run rhino-cli:test:quick"
    And I run "nx run rhino-cli:test:integration"
    Then both exit zero
```

## Product risks

| #    | Risk                                                                                                       | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR-1 | Subcommand heuristics produce false positives that block legitimate commits.                               | Medium     | Medium | Phase 6 quality-gate requires one full clean `test:quick` run before merging the wiring. Default severity is `error`; `--severity` flag and env var `ORGANICLEVER_RHINO_DDD_SEVERITY=warn` provide a local escape hatch if a false positive surfaces post-merge. False-positive findings tracked in a known-false-positives list rather than via blanket disabling. |
| PR-2 | Strict serial dependency on DDD adoption plan delays this plan if DDD plan stalls.                         | Low        | Medium | Accepted trade-off — validating against a half-migrated codebase produces unreliable results (transient violations during migration commits, or subcommands passing against a temporarily-wrong state). This plan stays in `in-progress/` and starts only after DDD plan archives to `done/`.                                                                       |
| PR-3 | Glossary parser is brittle against Prettier/markdownlint reformatting of tables.                           | Low        | Medium | Parser is whitespace-tolerant per existing rhino-cli docs-validate parser style. Integration godog scenarios include "table re-formatted by Prettier" cases. Fixable with a parser tweak if surfaces, not via convention change.                                                                                                                                    |
| PR-4 | Skill DDD section drifts from DDD plan `tech-docs.md` over time.                                           | Medium     | Low    | Skill section is intentionally concise and points to canonical sources. PRs that change layer rules in `tech-docs.md` MUST update the skill section in the same commit (enforced by repo-rules-quality-gate). Phase 6 of this plan adds a finding to the workflow if drift surfaces.                                                                                |
| PR-5 | Registry YAML duplicates information already in DDD plan `tech-docs.md`.                                   | High       | Low    | The registry is machine-readable single source of truth; `tech-docs.md` describes design intent. Cross-link both ways. Update both in same commit when BC list changes.                                                                                                                                                                                             |
| PR-6 | Subcommand wall-clock time regresses `test:quick` beyond acceptable budget.                                | Low        | Low    | NFR-4 sets a budget (<5s combined). Both subcommands operate on tens of files (registry + glossary + Gherkin), no heavy parsing. Profile in Phase 4 (wire-into-test:quick) before merging.                                                                                                                                                                          |
| PR-7 | `bounded-contexts.yaml` and ESLint boundaries config drift (registry says one thing, ESLint says another). | Low        | Medium | Both reference the same nine contexts. ESLint config in DDD plan `tech-docs.md` is path-glob-based, registry is name-based; they are orthogonal but related. Phase 1 adds a sanity check that every name in the registry corresponds to a path that ESLint considers a `domain`/`application`/`infrastructure`/`presentation` element.                              |

## Dependencies

- [OrganicLever DDD Adoption Plan (sibling, hard dependency)](../2026-05-02__organiclever-adopt-ddd/README.md)
- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [Test-Driven Development Convention](../../../governance/development/workflow/test-driven-development.md)
- [Trunk Based Development Convention](../../../governance/development/workflow/trunk-based-development.md)
- [File Naming Convention](../../../governance/conventions/structure/file-naming.md)
- [Markdown Standards](../../../governance/development/quality/markdown.md)
- [Content Quality](../../../governance/conventions/writing/quality.md)
- [rhino-cli README](../../../apps/rhino-cli/README.md)
- [apps-organiclever-web-developing-content skill](../../../.claude/skills/apps-organiclever-web-developing-content/SKILL.md)
