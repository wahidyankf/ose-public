@governance-readme-index
Feature: README sibling index

  As an AI coding agent or a contributor
  I want every governance directory's README.md to link every file beside it
  So that splitting a large file never creates an orphaned child

  Scenario: A complete index passes
    Given directory "repo-governance/conventions/formatting/" contains "README.md", "linking.md", "emoji.md"
    And "README.md" links "./linking.md" and "./emoji.md"
    When the developer runs governance readme-index validate
    Then the command exits successfully

  Scenario: A missing sibling link fails
    Given directory "repo-governance/conventions/formatting/" contains "README.md", "linking.md", "emoji.md"
    And "README.md" links "./linking.md" only
    When the developer runs governance readme-index validate
    Then the command exits with a failure code
    And the finding names "emoji.md" as unindexed

  Scenario: A missing subdirectory README link fails
    Given directory "repo-governance/conventions/" contains "README.md"
    And it contains subdirectory "structure/" containing "README.md"
    And "conventions/README.md" does not link "./structure/README.md"
    When the developer runs governance readme-index validate
    Then the command exits with a failure code
    And the finding names "structure/README.md" as unindexed

  Scenario: The rule does not reach grandchildren
    Given "repo-governance/README.md" links "./conventions/README.md"
    And it does not link "./conventions/structure/plans.md"
    When the developer runs governance readme-index validate
    Then the command exits successfully

  Scenario: A split directory whose parent omits a child fails
    Given file "repo-governance/development/agents/ai-agents.md" exists
    And directory "repo-governance/development/agents/ai-agents/" contains "01-catalog.md" and "02-naming.md"
    And "ai-agents.md" links "./ai-agents/01-catalog.md" only
    When the developer runs governance readme-index validate
    Then the command exits with a failure code
    And the finding names "02-naming.md" as unindexed

  Scenario Outline: An uncovered tree is not scanned
    Given directory "<dir>" contains "<file>" and no "README.md"
    When the developer runs governance readme-index validate
    Then the command exits successfully

    Examples:
      | dir                                | file          |
      | apps/ayokoding-www/content/en/     | lesson-01.md  |
      | plans/backlog/some-plan/           | brd.md        |
      | plans/done/2026-01-01__a-plan/     | delivery.md   |

  Scenario: A generated mirror directory is not scanned
    Given directory ".opencode/agents/" contains 95 agent files
    And it contains no "README.md"
    When the developer runs governance readme-index validate
    Then the command exits successfully

  Scenario: The Phase 1 rename introduces no enforcement gap for orphan or ghost
    Given gate id "md-readme-index" is armed at "scope: all-file-type" before Phase 1
    When Phase 1's rename lands and gate id "governance-readme-index" replaces it
    Then "governance-readme-index" is armed at "scope: all-file-type" immediately, not deferred
    And the published gate list command completed successfully
    And that output never shows both gate ids at once

  Scenario: The unannotated finding kind is dark-launched, not enforced, before Phase 9
    Given "repo-governance/conventions/README.md" links "./linking.md" with no annotation text
    And Phase 9 has not yet armed "governance-readme-completeness"
    When the developer runs governance readme-index validate
    Then the command exits successfully
    And no finding of kind "unannotated" causes a failure

  Scenario: The unannotated finding kind fails once armed and in scope
    Given "repo-governance/conventions/README.md" links "./linking.md" with no annotation text
    And Phase 9 has armed "governance-readme-completeness" at "scope: path-gated"
    And the changed paths include "repo-governance/conventions/README.md"
    When the developer runs gate run with surface pre-push
    Then the command exits with a failure code
    And the finding names "linking.md" as unannotated

  Scenario: The --paths flag overrides the default scan scope
    Given the developer invokes governance readme-index validate with "--paths repo-governance/"
    When the command runs
    Then it scans only "repo-governance/", not the unmodified DEFAULT_PATHS list
    And running it again with no "--paths" flag scans the unmodified DEFAULT_PATHS list

  Scenario: The --fail-kinds flag restricts which findings contribute to the exit code
    Given a scanned directory has one "orphan" finding and one "ghost" finding
    When the developer runs governance readme-index validate with "--fail-kinds orphan"
    Then the exit code reflects only the "orphan" finding
    And the "ghost" finding is still printed in the output

  Scenario: generate writes a conforming annotated index for a directory needing one
    Given a covered directory contains a markdown file with description and when_to_use frontmatter, and no "README.md"
    When the developer runs governance readme-index generate
    Then a "README.md" is written linking that file with a derived annotation

  Scenario: generate is idempotent
    Given a covered directory already has a conforming "README.md"
    When the developer runs governance readme-index generate twice
    Then the second run writes byte-identical content to the first

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
