---
description: Three Gherkin scenarios covering the no-manifest-touch guarantee, functional-hold surfacing, and checkpoint decline.
when_to_use: Use when verifying or testing this workflow's observable behaviour against its acceptance criteria.
---

# Gherkin Success Criteria

```gherkin
Feature: repository dependency bump planning

Scenario: Planning sweep produces a backlog plan without touching manifests
  Given the ose-public working tree is clean
  When the workflow runs to completion
  Then a clearance report appears under local-tmp/dependency-bump-planning/dependency-bump-planning__*__report.md
  And a plan exists at plans/backlog/dependency-bump/
  And the backlog plan receives a PASS verdict from plan-quality-gate
  And no package.json, Cargo.toml, rust-toolchain.toml, go.mod, *.fsproj, Dockerfile, docker-compose*.yml, .github/ action.yml/workflow, or lockfile is modified

Scenario: Functional-hold is surfaced before authoring
  Given a candidate version is yanked or carries an open release-blocker
  When the workflow classifies that package
  Then the clearance report records it as FUNCTIONAL-HOLD with the skipped and chosen versions
  And the human checkpoint presents the FUNCTIONAL-HOLD before plan authoring

Scenario: User declines at the checkpoint
  Given the proposed bump table is presented
  When the user does not approve
  Then no plan is authored
  And the workflow terminates with the clearance report written
```
