# Product Requirements

## Product Overview

This plan relicenses the entire `ose-public` repository from a split FSL-1.1-MIT/MIT model to
uniform MIT by replacing all FSL LICENSE files, updating configuration metadata, and removing
FSL references from documentation. The outcome is a repository where every file is MIT-licensed,
the GitHub license indicator shows "MIT," and no documentation misleads contributors about the
license terms.

## Personas

- **Maintainer-as-developer**: Executes git operations, edits files, runs quality gates, pushes
  the branch, and opens the draft PR.
- **plan-executor agent**: Runs the delivery checklist step-by-step on behalf of the maintainer.
- **plan-execution-checker agent**: Verifies after execution that all acceptance criteria are met.

## User Stories

- As a contributor, I want all code in `ose-public` to be MIT-licensed so that I can use, fork,
  and distribute any part of the repository without competing-use restrictions.
- As a downstream user, I want to integrate `ose-public` code into my own product so that I can
  build on the platform without legal friction.
- As the maintainer, I want the GitHub license indicator to show "MIT" so that the repository's
  license is immediately clear to visitors.
- As an AI agent building on top of the platform, I want to consume MIT-licensed code so that the
  tooling and composition pipelines are not restricted by FSL competing-use clauses.

## Product Scope

### In Scope

- All `LICENSE` files previously containing FSL-1.1-MIT text (9 files: root + 7 app directories +
  `specs/`)
- `package.json` and `package-lock.json` license field
- `LICENSING-NOTICE.md`, `CLAUDE.md`, `README.md`
- Governance documentation referencing FSL as current license
- Developer documentation referencing FSL
- Content platform documentation referencing FSL as current license
- New explanation document: `docs/explanation/software-engineering/licensing/mit-license-rationale.md`

### Out of Scope

- `ose-primer` (already MIT throughout — no change needed)
- `ose-infra` (separate repository)
- `archived/ayokoding-web-hugo/LICENSE` (third-party MIT, must remain unchanged)
- `plans/done/` historical records (frozen; FSL references preserved as historical context)
- Revenue model, deployment model, or product roadmap changes

## Product Risks

- **Missed LICENSE file**: A file that should be replaced remains FSL. Mitigated by Phase 6 grep
  validation.
- **Documentation drift**: An FSL reference overlooked in a governance or docs file. Mitigated by
  Phase 6 grep validation covering all `*.md` files.
- **Markdown lint breakage**: Changes to documentation introduce markdownlint violations. Mitigated
  by running `npm run lint:md` in Phase 6.
- **Inadvertent third-party LICENSE modification**: `archived/ayokoding-web-hugo/LICENSE` changed
  by mistake. Mitigated by explicit verification step in Phase 1.
- **package-lock.json inconsistency**: `package-lock.json` not updated to match `package.json`.
  Mitigated by explicit Phase 2 checklist item.

## Acceptance Criteria

```gherkin
Feature: Uniform MIT license across ose-public

  Scenario: All LICENSE files contain MIT text
    Given the repository root and every app/specs subdirectory
    When I read any LICENSE file that was previously FSL-1.1-MIT
    Then it contains the standard MIT License text
    And it does NOT contain "Functional Source License" or "FSL"

  Scenario: package.json reflects MIT
    Given the root package.json
    When I read the "license" field
    Then it equals "MIT"

  Scenario: package-lock.json reflects MIT
    Given the root package-lock.json
    When I read the "license" field for the root package entry
    Then it equals "MIT"

  Scenario: LICENSING-NOTICE.md describes MIT
    Given the LICENSING-NOTICE.md file
    When I read it
    Then it describes a uniform MIT license
    And it does NOT reference FSL-1.1-MIT as the current license

  Scenario: CLAUDE.md reflects MIT
    Given the CLAUDE.md file
    When I read the License line in the Project Overview
    Then it states MIT (not FSL-1.1-MIT)

  Scenario: README.md license section is updated
    Given the README.md file
    When I read the License section
    Then it describes MIT only
    And it does NOT describe FSL competing-use restrictions

  Scenario: Governance and docs contain no stale FSL references
    Given all .md files under governance/, docs/, and apps/oseplatform-web/content/
    When I search for "FSL" or "Functional Source License"
    Then no results reference this repository's own license as FSL
    And only historical plan files (plans/done/) may retain FSL references

  Scenario: Third-party LICENSE files are untouched
    Given archived/ayokoding-web-hugo/LICENSE
    When I read it
    Then it still contains the original MIT text attributed to "Xin (2023)"
```
