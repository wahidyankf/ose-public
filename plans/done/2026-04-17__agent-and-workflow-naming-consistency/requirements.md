# Requirements

## Acceptance Criteria

### AC1: Rename `docs-link-general-checker` → `docs-link-checker`

```gherkin
Feature: docs-link-checker agent exists under new name
  Scenario: Agent file renamed in both harnesses
    Given the repository contains agent sources
    When I list .claude/agents/ and .opencode/agent/
    Then "docs-link-checker.md" exists in both
    And "docs-link-general-checker.md" does not exist in either

  Scenario: Frontmatter name field updated
    Given the agent file ".claude/agents/docs-link-checker.md"
    When I read its YAML frontmatter
    Then the "name" field equals "docs-link-checker"

  Scenario: No live references to old name
    Given all markdown files outside plans/done/, generated-reports/,
      AND plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/
    When I search for the string "docs-link-general-checker"
    Then zero matches are returned
```

### AC2: Rename `swe-e2e-test-dev` → `swe-e2e-dev`

```gherkin
Feature: swe-e2e-dev agent exists under new name
  Scenario: Agent file renamed in both harnesses
    Given the repository contains agent sources
    When I list .claude/agents/ and .opencode/agent/
    Then "swe-e2e-dev.md" exists in both
    And "swe-e2e-test-dev.md" does not exist in either

  Scenario: Frontmatter name field updated
    Given the agent file ".claude/agents/swe-e2e-dev.md"
    When I read its YAML frontmatter
    Then the "name" field equals "swe-e2e-dev"

  Scenario: No live references to old name
    Given all markdown files outside plans/done/, generated-reports/,
      AND plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/
    When I search for the string "swe-e2e-test-dev"
    Then zero matches are returned
```

### AC3: Rename `web-researcher` → `web-research-maker`

```gherkin
Feature: web-research-maker agent exists under new name
  Scenario: Agent file renamed in both harnesses
    Given the repository contains agent sources
    When I list .claude/agents/ and .opencode/agent/
    Then "web-research-maker.md" exists in both
    And "web-researcher.md" does not exist in either

  Scenario: Frontmatter name field updated
    Given the agent file ".claude/agents/web-research-maker.md"
    When I read its YAML frontmatter
    Then the "name" field equals "web-research-maker"

  Scenario: No live references to old name
    Given all markdown files outside plans/done/, generated-reports/,
      AND plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/
    When I search for the string "web-researcher"
    Then zero matches are returned
```

### AC4: Rename `repo-governance-*` triad → `repo-rules-*`

```gherkin
Feature: repo-rules-maker/checker/fixer agents exist under new names
  Scenario: All three files renamed in both harnesses
    Given the repository contains agent sources
    When I list .claude/agents/ and .opencode/agent/
    Then each of "repo-rules-maker.md", "repo-rules-checker.md", "repo-rules-fixer.md" exists in both
    And none of "repo-governance-maker.md", "repo-governance-checker.md", "repo-governance-fixer.md" exist in either

  Scenario: Frontmatter name fields updated
    Given the renamed agent files
    When I read each file's YAML frontmatter
    Then the "name" field matches its filename (without .md)
      | file                   | name               |
      | repo-rules-maker.md    | repo-rules-maker   |
      | repo-rules-checker.md  | repo-rules-checker |
      | repo-rules-fixer.md    | repo-rules-fixer   |

  Scenario: No live references to old names
    Given all markdown files outside plans/done/, generated-reports/,
      AND plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/
    When I search for the strings "repo-governance-maker", "repo-governance-checker", "repo-governance-fixer", and "repo-governance-" (catches any remaining repo-governance- prefix, regardless of suffix)
    Then zero matches are returned for each

  Scenario: Cross-references updated in governance conventions
    Given the agent-naming and workflow-naming conventions exist
    When I read them
    Then every mention of the checker references "repo-rules-checker" (not "repo-governance-checker")
    And every mention of the maker references "repo-rules-maker"
```

### AC5: Role Vocabulary published

```gherkin
Feature: Agent naming rule and role vocabulary are documented
  Scenario: README defines unified rule
    Given ".claude/agents/README.md"
    When I read the file
    Then it contains a section titled "Naming Rule" or equivalent
    And it states the pattern "<scope>(-<qualifier>)*-<role>"

  Scenario: README enumerates all seven roles with semantics
    Given ".claude/agents/README.md"
    When I read the "Role Vocabulary" section
    Then it defines each of: maker, checker, fixer, dev, deployer, executor, manager
    And each role has a one-line semantic definition
    And each role has at least one example agent from the repo

  Scenario: No agent violates the rule
    Given every file in .claude/agents/ matching "*.md" except README.md
    When I parse the filename as "<scope>(-<qualifier>)*-<role>"
    Then the trailing role segment is one of the seven defined roles
    And no filename contains a role suffix outside the vocabulary
```

### AC6: Sync integrity

```gherkin
Feature: .opencode mirror matches .claude source
  Scenario: Sync script produces clean diff
    Given renames applied to .claude/
    When I run "npm run sync:claude-to-opencode"
    Then .opencode/agent/ mirrors .claude/agents/ filename-for-filename
    And git status shows no unexpected .opencode drift
```

### AC7: Agent-naming governance convention codified

```gherkin
Feature: Agent naming rule lives in governance/ as an enforceable convention
  Scenario: Convention file exists with required content
    Given the governance tree
    When I read "governance/conventions/structure/agent-naming.md"
    Then it exists with YAML frontmatter (title, description, category, tags, created, updated)
    And it states the rule "<scope>(-<qualifier>)*-<role>"
    And it enumerates all seven roles (maker, checker, fixer, dev, deployer, executor, manager) with semantics and examples
    And it describes the scope vocabulary (apps, docs, plan, repo, swe, ci, readme, specs, social, web, agent)
    And it states "zero exceptions" explicitly

  Scenario: Convention index links to new doc
    Given "governance/conventions/structure/README.md"
    When I read the file
    Then it lists "agent-naming.md" with a one-line description

  Scenario: Cross-references wired up
    Given the convention file exists
    When I read ".claude/agents/README.md"
    Then it links to "governance/conventions/structure/agent-naming.md" as the normative source
    And "CLAUDE.md" (root) references the convention in the AI Agents section

  Scenario: repo-rules-checker recognises the convention
    Given the convention file exists
    When "repo-rules-checker" runs (post-AC4 rename)
    Then its audit enumerates agent filename compliance against the seven-role vocabulary
    And reports zero violations for the current agent set
```

### AC8: Rename `docs/quality-gate.md` → `docs/docs-quality-gate.md`

```gherkin
Feature: docs-quality-gate workflow file aligns with its name field
  Scenario: File exists under new path
    Given the repository contains workflow sources
    When I list governance/workflows/docs/
    Then "docs-quality-gate.md" exists
    And "quality-gate.md" does not exist in that directory

  Scenario: Frontmatter name field matches filename
    Given the workflow file "governance/workflows/docs/docs-quality-gate.md"
    When I read its YAML frontmatter
    Then the "name" field equals "docs-quality-gate"

  Scenario: No live references to old path
    Given all markdown files outside plans/done/, generated-reports/,
      AND plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/
    When I search for "governance/workflows/docs/quality-gate.md"
    Then zero matches are returned
```

### AC9: Rename `workflows/repository/` → `workflows/repo/` and `repository-rules-validation` → `repo-rules-quality-gate`

```gherkin
Feature: repo-rules-quality-gate exists under new directory and name
  Scenario: Directory renamed
    Given governance/workflows/
    When I list its child directories
    Then "repo" exists
    And "repository" does not exist

  Scenario: Workflow file at new path with new name
    Given governance/workflows/repo/
    When I list it
    Then "repo-rules-quality-gate.md" exists
    And no file named "repository-rules-validation.md" or "repository-rules-quality-gate.md" exists anywhere under governance/workflows/

  Scenario: Frontmatter name field updated
    Given the workflow file "governance/workflows/repo/repo-rules-quality-gate.md"
    When I read its YAML frontmatter
    Then the "name" field equals "repo-rules-quality-gate"

  Scenario: No live references to old name or path
    Given all markdown files outside plans/done/, generated-reports/,
      AND plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/
    When I search for the strings "repository-rules-validation", "repository-rules-quality-gate", and "workflows/repository/"
    Then zero matches are returned for each

  Scenario: Scope vocabulary aligned with agent scope vocabulary
    Given the workflow-naming convention and agent-naming convention both enumerate scope vocabularies
    When I compare the two
    Then both use "repo" (not "repository") as the scope token for repository-wide concerns
```

### AC10: Rename `specs-validation` → `specs-quality-gate`

```gherkin
Feature: specs-quality-gate exists under new name
  Scenario: File renamed
    Given governance/workflows/specs/
    When I list it
    Then "specs-quality-gate.md" exists
    And "specs-validation.md" does not exist

  Scenario: Frontmatter name field updated
    Given the workflow file "governance/workflows/specs/specs-quality-gate.md"
    When I read its YAML frontmatter
    Then the "name" field equals "specs-quality-gate"

  Scenario: No live references to old name
    Given all markdown files outside plans/done/, generated-reports/,
      AND plans/in-progress/2026-04-17__agent-and-workflow-naming-consistency/
    When I search for the string "specs-validation"
    Then zero matches are returned
```

### AC11: Workflow Type Vocabulary published

```gherkin
Feature: Workflow naming rule and type vocabulary are documented
  Scenario: README defines unified rule
    Given "governance/workflows/README.md"
    When I read the file
    Then it contains a section titled "Naming Rule" or equivalent
    And it states the pattern "<scope>(-<qualifier>)*-<type>"

  Scenario: README enumerates all three types with semantics
    Given "governance/workflows/README.md"
    When I read the "Type Vocabulary" section
    Then it defines each of: quality-gate, execution, setup
    And each type has a one-line semantic definition
    And each type has at least one example workflow from the repo

  Scenario: README documents meta/ reference exception
    Given "governance/workflows/README.md"
    When I read the "Type Vocabulary" section
    Then it explicitly notes that files under "governance/workflows/meta/" are reference documentation about the workflow system, not workflows, and are exempt from the type suffix rule

  Scenario: No workflow violates the rule
    Given every file under governance/workflows/ matching "*.md" except README.md and files under meta/
    When I parse the filename as "<scope>(-<qualifier>)*-<type>"
    Then the trailing type segment is one of the three defined types
    And no filename contains a type suffix outside the vocabulary
```

### AC12: Workflow-naming governance convention codified

```gherkin
Feature: Workflow naming rule lives in governance/ as an enforceable convention
  Scenario: Convention file exists with required content
    Given the governance tree
    When I read "governance/conventions/structure/workflow-naming.md"
    Then it exists with YAML frontmatter (title, description, category, tags, created, updated)
    And it states the rule "<scope>(-<qualifier>)*-<type>"
    And it enumerates all three types (quality-gate, execution, setup) with semantics and examples
    And it enumerates the scope vocabulary (ayokoding-web, ci, docs, infra, plan, repo, specs, ui) using "repo" (not "repository")
    And it documents the meta/ reference exception
    And it states "zero exceptions" for non-meta workflow files

  Scenario: Convention indices updated
    Given the convention file exists
    When I read "governance/conventions/structure/README.md" and "governance/conventions/README.md"
    Then both index it with a one-line description

  Scenario: Cross-references wired up
    Given the convention file exists
    When I read "governance/workflows/README.md"
    Then it links to "governance/conventions/structure/workflow-naming.md" as the normative source
    And "CLAUDE.md" (root) references the convention

  Scenario: repo-rules-checker recognises the convention
    Given the convention file exists
    When "repo-rules-checker" runs (post-AC4 rename)
    Then its audit enumerates workflow filename compliance against the three-type vocabulary
    And reports zero violations for the current workflow set
```

### AC13: rhino-cli naming validators implemented

```gherkin
Feature: rhino-cli enforces naming rules mechanically
  Scenario: agents validate-naming command exists and works
    Given rhino-cli is built
    When I run "rhino-cli agents validate-naming" from the repo root
    Then the command exits with code 0
    And stdout reports the number of files checked for both .claude/agents/ and .opencode/agent/

  Scenario: agents validate-naming catches role-suffix violations
    Given a test fixture with a file named "broken-role-thing.md" under a temp .claude/agents/
    When I run "rhino-cli agents validate-naming" with that fixture as input
    Then the command exits with a non-zero code
    And stderr names "broken-role-thing.md" and explains which rule segment failed (role not in vocabulary)

  Scenario: agents validate-naming catches frontmatter mismatch
    Given a test fixture where ".claude/agents/foo-checker.md" has frontmatter "name: foo-maker"
    When I run "rhino-cli agents validate-naming"
    Then the command exits non-zero
    And stderr reports the filename-vs-name mismatch

  Scenario: agents validate-naming catches .opencode mirror drift
    Given ".claude/agents/foo-checker.md" exists
    And ".opencode/agent/foo-checker.md" does not exist
    When I run "rhino-cli agents validate-naming"
    Then the command exits non-zero
    And stderr reports the missing mirror file

  Scenario: workflows validate-naming command exists and works
    Given rhino-cli is built
    When I run "rhino-cli workflows validate-naming" from the repo root
    Then the command exits with code 0
    And stdout reports the number of workflow files checked (excluding README.md and meta/)

  Scenario: workflows validate-naming catches type-suffix violations
    Given a test fixture with a file named "governance/workflows/specs/specs-thing.md"
    When I run "rhino-cli workflows validate-naming"
    Then the command exits non-zero
    And stderr names the file and the invalid type suffix

  Scenario: workflows validate-naming exempts meta/ files
    Given "governance/workflows/meta/execution-modes.md" exists (no type suffix)
    When I run "rhino-cli workflows validate-naming"
    Then the command exits 0 and does not flag the meta/ file

  Scenario: Gherkin specs drive the validators
    Given specs directory for rhino-cli
    When I read "specs/apps/rhino/cli/gherkin/"
    Then feature files "agents-validate-naming.feature" and "workflows-validate-naming.feature" exist
    And godog-based unit tests consume those specs

  Scenario: Coverage threshold holds
    Given the rhino-cli project
    When I run "nx run rhino-cli:test:quick"
    Then the command exits 0 and coverage stays ≥ 90%
```

### AC14: Enforcement wired into pre-push and CI

```gherkin
Feature: Naming validators run automatically at push and PR time
  Scenario: pre-push hook runs validators when agents staged
    Given a commit touching ".claude/agents/some-agent.md"
    When I run "git push" (triggering Husky pre-push)
    Then "rhino-cli agents validate-naming" is invoked
    And any violation aborts the push with a clear error

  Scenario: pre-push hook runs validators when workflows staged
    Given a commit touching "governance/workflows/repo/repo-rules-quality-gate.md"
    When I run "git push"
    Then "rhino-cli workflows validate-naming" is invoked
    And any violation aborts the push

  Scenario: pre-push skips validators when irrelevant paths touched
    Given a commit touching only "docs/tutorials/foo.md"
    When I run "git push"
    Then neither validator runs (scope gate matches)

  Scenario: CI runs validators on every PR
    Given a pull request against main
    When the CI quality gate executes
    Then both validators run unconditionally
    And any violation blocks merge

  Scenario: validators are idempotent and cacheable
    Given no agents or workflows have changed
    When the validators are run twice in succession
    Then the second run completes without re-scanning (Nx cache hit) and exits 0
```

### AC15: Quality gates pass

```gherkin
Feature: Repo quality gates hold after renames
  Scenario: Markdown lint passes
    Given renames and reference updates are applied
    When I run "npm run lint:md"
    Then the command exits zero

  Scenario: Link validation passes for touched docs
    Given renames and reference updates are applied
    When pre-commit link validation runs on staged files
    Then no broken internal links are reported
```

## Out of Scope

- Renaming `docs-link-checker` further to reflect broader-than-docs scope.
- Adding new agents, workflows, or deleting existing ones.
- Touching agent or workflow bodies beyond frontmatter `name` and self-references.
- Renaming `governance/workflows/meta/*.md` (reference docs, not workflows).
- Collapsing workflow directory structure (e.g., moving files between `ci/`, `docs/`, etc.).
